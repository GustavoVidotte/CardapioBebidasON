"use server"

import { NextRequest, NextResponse } from "next/server"
import pg from "pg"

const { Client } = pg

export const dynamic = "force-dynamic"
export const maxDuration = 300

async function conectarVPS(dbName?: string) {
  const client = new Client({
    host: process.env.VPS_PG_HOST,
    port: parseInt(process.env.VPS_PG_PORT || "5432"),
    user: process.env.VPS_PG_USER,
    password: process.env.VPS_PG_PASSWORD,
    database: dbName || "postgres",
    ssl: false,
    connectionTimeoutMillis: 15000,
    query_timeout: 120000,
  })
  await client.connect()
  return client
}

async function conectarSupabase(connectionString: string) {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
    query_timeout: 120000,
  })
  await client.connect()
  return client
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { action, supabaseUrl, nomeBanco } = body

  if (action === "testar-supabase") {
    let client: InstanceType<typeof Client> | null = null
    try {
      client = await conectarSupabase(supabaseUrl)

      const categoriasRes = await client.query("SELECT COUNT(*) as total FROM categorias")
      const bebidasRes = await client.query("SELECT COUNT(*) as total FROM bebidas")

      let pedidosTotal = 0
      try {
        const pedidosRes = await client.query("SELECT COUNT(*) as total FROM pedidos")
        pedidosTotal = parseInt(pedidosRes.rows[0].total)
      } catch {
        // tabela pedidos pode não existir
      }

      // Verificar tamanho das imagens base64
      let imagensBase64 = 0
      try {
        const imgRes = await client.query("SELECT COUNT(*) as total FROM bebidas WHERE imagem LIKE 'data:%'")
        imagensBase64 = parseInt(imgRes.rows[0].total)
      } catch {
        // ignore
      }

      return NextResponse.json({
        success: true,
        dados: {
          categorias: parseInt(categoriasRes.rows[0].total),
          bebidas: parseInt(bebidasRes.rows[0].total),
          pedidos: pedidosTotal,
          imagensBase64,
        },
      })
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    } finally {
      if (client) await client.end().catch(() => {})
    }
  }

  if (action === "testar-vps") {
    let client: InstanceType<typeof Client> | null = null
    try {
      client = await conectarVPS()
      const res = await client.query("SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY datname")
      const bancos = res.rows.map((r: any) => r.datname)
      return NextResponse.json({ success: true, bancos })
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    } finally {
      if (client) await client.end().catch(() => {})
    }
  }

  if (action === "migrar") {
    let supaClient: InstanceType<typeof Client> | null = null
    let vpsAdmin: InstanceType<typeof Client> | null = null
    let vpsClient: InstanceType<typeof Client> | null = null
    const logs: string[] = []

    try {
      // 1. Conectar ao Supabase e ler dados
      logs.push("Conectando ao Supabase do cliente...")
      supaClient = await conectarSupabase(supabaseUrl)
      logs.push("Conectado ao Supabase!")

      // Ler categorias
      logs.push("Lendo categorias...")
      const categoriasRes = await supaClient.query("SELECT * FROM categorias ORDER BY id")
      const categorias = categoriasRes.rows
      logs.push(`${categorias.length} categorias encontradas`)

      // Ler bebidas (incluindo imagens base64)
      logs.push("Lendo bebidas (incluindo imagens base64)...")
      const bebidasRes = await supaClient.query("SELECT * FROM bebidas ORDER BY id")
      const bebidas = bebidasRes.rows
      logs.push(`${bebidas.length} bebidas encontradas`)

      // Ler pedidos
      let pedidos: any[] = []
      try {
        logs.push("Lendo pedidos...")
        const pedidosRes = await supaClient.query("SELECT * FROM pedidos ORDER BY id")
        pedidos = pedidosRes.rows
        logs.push(`${pedidos.length} pedidos encontrados`)
      } catch {
        logs.push("Tabela pedidos nao encontrada, pulando...")
      }

      await supaClient.end()
      supaClient = null

      // 2. Criar banco na VPS
      const nomeDb = nomeBanco.toLowerCase().replace(/[^a-z0-9_]/g, "_")
      logs.push(`Criando banco "${nomeDb}" na VPS...`)

      vpsAdmin = await conectarVPS()

      // Verificar se banco já existe
      const existeRes = await vpsAdmin.query("SELECT 1 FROM pg_database WHERE datname = $1", [nomeDb])
      if (existeRes.rows.length > 0) {
        // Dropar conexoes ativas e recriar
        await vpsAdmin.query(`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()`, [nomeDb])
        await vpsAdmin.query(`DROP DATABASE "${nomeDb}"`)
        logs.push(`Banco existente "${nomeDb}" removido`)
      }

      await vpsAdmin.query(`CREATE DATABASE "${nomeDb}" ENCODING 'UTF8'`)
      logs.push(`Banco "${nomeDb}" criado!`)
      await vpsAdmin.end()
      vpsAdmin = null

      // 3. Criar tabelas no novo banco
      logs.push("Criando tabelas...")
      vpsClient = await conectarVPS(nomeDb)

      // Criar tabela categorias
      await vpsClient.query(`
        CREATE TABLE IF NOT EXISTS categorias (
          id SERIAL PRIMARY KEY,
          nome VARCHAR(255) NOT NULL,
          ordem INTEGER DEFAULT 0,
          ativa BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `)
      logs.push("Tabela categorias criada")

      // Criar tabela bebidas
      await vpsClient.query(`
        CREATE TABLE IF NOT EXISTS bebidas (
          id SERIAL PRIMARY KEY,
          nome VARCHAR(500) NOT NULL,
          descricao TEXT DEFAULT '',
          preco DECIMAL(10,2) DEFAULT 0,
          preco_promocional DECIMAL(10,2) DEFAULT NULL,
          categoria_id INTEGER REFERENCES categorias(id),
          imagem TEXT DEFAULT '',
          estoque INTEGER DEFAULT 0,
          ativo BOOLEAN DEFAULT true,
          destaque BOOLEAN DEFAULT false,
          ordem INTEGER DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `)
      logs.push("Tabela bebidas criada")

      // Criar tabela pedidos
      await vpsClient.query(`
        CREATE TABLE IF NOT EXISTS pedidos (
          id SERIAL PRIMARY KEY,
          cliente_nome VARCHAR(500) DEFAULT '',
          cliente_telefone VARCHAR(50) DEFAULT '',
          cliente_endereco TEXT DEFAULT '',
          itens JSONB DEFAULT '[]',
          total DECIMAL(10,2) DEFAULT 0,
          status VARCHAR(50) DEFAULT 'pendente',
          tipo_entrega VARCHAR(50) DEFAULT 'entrega',
          forma_pagamento VARCHAR(50) DEFAULT '',
          observacoes TEXT DEFAULT '',
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `)
      logs.push("Tabela pedidos criada")

      // 4. Inserir dados - categorias
      logs.push("Inserindo categorias...")
      for (const cat of categorias) {
        await vpsClient.query(
          `INSERT INTO categorias (id, nome, ordem, ativa, created_at) VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (id) DO UPDATE SET nome=$2, ordem=$3, ativa=$4`,
          [cat.id, cat.nome, cat.ordem || 0, cat.ativa !== false, cat.created_at || new Date()]
        )
      }
      // Reset sequence
      if (categorias.length > 0) {
        const maxCatId = Math.max(...categorias.map((c: any) => c.id))
        await vpsClient.query(`SELECT setval('categorias_id_seq', $1, true)`, [maxCatId])
      }
      logs.push(`${categorias.length} categorias inseridas`)

      // 5. Inserir dados - bebidas (com imagens base64)
      logs.push("Inserindo bebidas (com imagens base64, pode demorar)...")
      let bebidasInseridas = 0
      for (const beb of bebidas) {
        try {
          await vpsClient.query(
            `INSERT INTO bebidas (id, nome, descricao, preco, preco_promocional, categoria_id, imagem, estoque, ativo, destaque, ordem, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             ON CONFLICT (id) DO UPDATE SET nome=$2, descricao=$3, preco=$4, preco_promocional=$5, categoria_id=$6, imagem=$7, estoque=$8, ativo=$9, destaque=$10, ordem=$11`,
            [
              beb.id,
              beb.nome,
              beb.descricao || "",
              beb.preco || 0,
              beb.preco_promocional || null,
              beb.categoria_id,
              beb.imagem || "",
              beb.estoque || 0,
              beb.ativo !== false,
              beb.destaque || false,
              beb.ordem || 0,
              beb.created_at || new Date(),
            ]
          )
          bebidasInseridas++
        } catch (err: any) {
          logs.push(`AVISO: Erro ao inserir bebida "${beb.nome}": ${err.message}`)
        }
      }
      if (bebidas.length > 0) {
        const maxBebId = Math.max(...bebidas.map((b: any) => b.id))
        await vpsClient.query(`SELECT setval('bebidas_id_seq', $1, true)`, [maxBebId])
      }
      logs.push(`${bebidasInseridas}/${bebidas.length} bebidas inseridas`)

      // 6. Inserir pedidos
      if (pedidos.length > 0) {
        logs.push("Inserindo pedidos...")
        let pedidosInseridos = 0
        for (const ped of pedidos) {
          try {
            await vpsClient.query(
              `INSERT INTO pedidos (id, cliente_nome, cliente_telefone, cliente_endereco, itens, total, status, tipo_entrega, forma_pagamento, observacoes, created_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
               ON CONFLICT (id) DO NOTHING`,
              [
                ped.id,
                ped.cliente_nome || "",
                ped.cliente_telefone || "",
                ped.cliente_endereco || "",
                JSON.stringify(ped.itens || []),
                ped.total || 0,
                ped.status || "pendente",
                ped.tipo_entrega || "entrega",
                ped.forma_pagamento || "",
                ped.observacoes || "",
                ped.created_at || new Date(),
              ]
            )
            pedidosInseridos++
          } catch (err: any) {
            logs.push(`AVISO: Erro ao inserir pedido #${ped.id}: ${err.message}`)
          }
        }
        if (pedidos.length > 0) {
          const maxPedId = Math.max(...pedidos.map((p: any) => p.id))
          await vpsClient.query(`SELECT setval('pedidos_id_seq', $1, true)`, [maxPedId])
        }
        logs.push(`${pedidosInseridos}/${pedidos.length} pedidos inseridos`)
      }

      // 7. Criar indices
      logs.push("Criando indices...")
      await vpsClient.query("CREATE INDEX IF NOT EXISTS idx_bebidas_categoria ON bebidas(categoria_id)")
      await vpsClient.query("CREATE INDEX IF NOT EXISTS idx_bebidas_ativo ON bebidas(ativo)")
      await vpsClient.query("CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status)")
      await vpsClient.query("CREATE INDEX IF NOT EXISTS idx_pedidos_created ON pedidos(created_at DESC)")
      logs.push("Indices criados!")

      logs.push("--- MIGRACAO CONCLUIDA COM SUCESSO! ---")
      logs.push(`Banco: ${nomeDb}`)
      logs.push(`Host: ${process.env.VPS_PG_HOST}:${process.env.VPS_PG_PORT}`)
      logs.push(`Connection string: postgresql://${process.env.VPS_PG_USER}:${process.env.VPS_PG_PASSWORD}@${process.env.VPS_PG_HOST}:${process.env.VPS_PG_PORT}/${nomeDb}`)

      return NextResponse.json({ success: true, logs })
    } catch (error: any) {
      logs.push(`ERRO: ${error.message}`)
      return NextResponse.json({ success: false, error: error.message, logs }, { status: 500 })
    } finally {
      if (supaClient) await supaClient.end().catch(() => {})
      if (vpsAdmin) await vpsAdmin.end().catch(() => {})
      if (vpsClient) await vpsClient.end().catch(() => {})
    }
  }

  return NextResponse.json({ error: "Acao invalida" }, { status: 400 })
}
