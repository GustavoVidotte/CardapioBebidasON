import { createClient } from "@supabase/supabase-js"
import * as fs from "fs"
import * as path from "path"

// Suas credenciais
const supabaseUrl = "https://qcaoaciohcqcwulsrtzu.supabase.co"
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjYW9hY2lvaGNxY3d1bHNydHp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NjU1MTgsImV4cCI6MjA3MDM0MTUxOH0.WV10l7nJMDsr84otsWCsRDGDjjrm5TX5a8yRLg2gpgk"

const supabase = createClient(supabaseUrl, supabaseKey)

// Função para encurtar URLs
function encurtarURL(url: string | null, nome: string): string {
  if (!url) return `/placeholder.svg?height=200&width=300&text=${encodeURIComponent(nome)}`

  // Se for URL muito longa (Base64, Blob, etc)
  if (url.length > 200 || url.includes("data:image") || url.includes("blob.vercel")) {
    return `/placeholder.svg?height=200&width=300&text=${encodeURIComponent(nome)}`
  }

  // Se for URL normal mas ainda grande
  if (url.length > 100) {
    return `/placeholder.svg?height=200&width=300&text=${encodeURIComponent(nome)}`
  }

  return url
}

async function exportarDadosCompactados() {
  console.log("📥 EXPORTANDO DADOS COMPACTADOS...\n")

  try {
    // 1. BUSCAR CATEGORIAS
    console.log("📂 Buscando categorias...")
    const { data: categorias, error: erroCat } = await supabase.from("categorias").select("*")

    if (erroCat) throw erroCat
    console.log(`   ✅ ${categorias?.length || 0} categorias encontradas`)

    // 2. BUSCAR BEBIDAS
    console.log("\n🍻 Buscando bebidas...")
    const { data: bebidas, error: erroBeb } = await supabase.from("bebidas").select("*")

    if (erroBeb) throw erroBeb
    console.log(`   ✅ ${bebidas?.length || 0} bebidas encontradas`)

    // 3. BUSCAR PEDIDOS RECENTES
    console.log("\n📋 Buscando pedidos...")
    const { data: pedidos, error: erroPed } = await supabase
      .from("pedidos")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100)

    if (erroPed) throw erroPed
    console.log(`   ✅ ${pedidos?.length || 0} pedidos encontrados`)

    // 4. COMPACTAR DADOS
    console.log("\n🔧 Compactando URLs...")

    const categoriasCompactadas = (categorias || []).map((cat) => ({
      ...cat,
      imagem: encurtarURL(cat.imagem, cat.nome),
    }))

    const bebidasCompactadas = (bebidas || []).map((beb) => ({
      ...beb,
      imagem: encurtarURL(beb.imagem, beb.nome),
    }))

    // 5. CALCULAR ESTATÍSTICAS
    const tamanhoOriginal = JSON.stringify({ categorias, bebidas, pedidos }).length
    const tamanhoCompactado = JSON.stringify({
      categorias: categoriasCompactadas,
      bebidas: bebidasCompactadas,
      pedidos,
    }).length
    const economia = ((1 - tamanhoCompactado / tamanhoOriginal) * 100).toFixed(1)

    console.log("\n📊 ESTATÍSTICAS:")
    console.log(`   Tamanho original: ${(tamanhoOriginal / 1024).toFixed(2)} KB`)
    console.log(`   Tamanho compactado: ${(tamanhoCompactado / 1024).toFixed(2)} KB`)
    console.log(`   🎉 ECONOMIA: ${economia}%`)

    // 6. CRIAR ARQUIVO DE BACKUP
    const backup = {
      versao: "2.0-compactado",
      data_exportacao: new Date().toISOString(),
      origem: "qcaoaciohcqcwulsrtzu.supabase.co",
      categorias: categoriasCompactadas,
      bebidas: bebidasCompactadas,
      pedidos: pedidos,
      estatisticas: {
        total_categorias: categoriasCompactadas.length,
        total_bebidas: bebidasCompactadas.length,
        total_pedidos: pedidos?.length || 0,
        tamanho_original_kb: (tamanhoOriginal / 1024).toFixed(2),
        tamanho_compactado_kb: (tamanhoCompactado / 1024).toFixed(2),
        economia_percentual: economia,
      },
    }

    // 7. SALVAR ARQUIVO
    const nomeArquivo = `backup-compactado-${new Date().toISOString().split("T")[0]}.json`
    const caminhoArquivo = path.join(process.cwd(), nomeArquivo)

    fs.writeFileSync(caminhoArquivo, JSON.stringify(backup, null, 2))

    console.log(`\n✅ EXPORTAÇÃO CONCLUÍDA!`)
    console.log(`📁 Arquivo salvo: ${nomeArquivo}`)
    console.log(`📍 Localização: ${caminhoArquivo}`)

    // 8. CRIAR ARQUIVO SQL TAMBÉM
    const sqlFileName = `backup-sql-${new Date().toISOString().split("T")[0]}.sql`
    const sqlFilePath = path.join(process.cwd(), sqlFileName)

    let sqlContent = "-- BACKUP BEBIDAS ON\n"
    sqlContent += `-- Data: ${new Date().toISOString()}\n`
    sqlContent += `-- Origem: qcaoaciohcqcwulsrtzu.supabase.co\n\n`

    sqlContent += "-- CATEGORIAS\n"
    categoriasCompactadas.forEach((cat) => {
      sqlContent += `INSERT INTO categorias (id, nome, icone, cor, ativo) VALUES (${cat.id}, '${cat.nome}', '${cat.icone}', '${cat.cor}', ${cat.ativo});\n`
    })

    sqlContent += "\n-- BEBIDAS\n"
    bebidasCompactadas.forEach((beb) => {
      const nome = beb.nome.replace(/'/g, "''")
      const descricao = (beb.descricao || "").replace(/'/g, "''")
      const imagem = beb.imagem.replace(/'/g, "''")

      sqlContent += `INSERT INTO bebidas (id, nome, descricao, preco, categoria_id, imagem, estoque, ativo) VALUES (${beb.id}, '${nome}', '${descricao}', ${beb.preco}, ${beb.categoria_id}, '${imagem}', ${beb.estoque}, ${beb.ativo});\n`
    })

    fs.writeFileSync(sqlFilePath, sqlContent)
    console.log(`\n✅ ARQUIVO SQL CRIADO!`)
    console.log(`📁 Arquivo salvo: ${sqlFileName}`)
  } catch (error) {
    console.error("\n❌ ERRO:", error)
  }
}

// EXECUTAR EXPORTAÇÃO
exportarDadosCompactados()
