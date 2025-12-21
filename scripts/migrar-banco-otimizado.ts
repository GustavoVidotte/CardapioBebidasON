import { createClient } from "@supabase/supabase-js"

// BANCO ANTIGO
const supabaseAntigo = createClient("https://URL-ANTIGA.supabase.co", "CHAVE-ANTIGA")

// BANCO NOVO
const supabaseNovo = createClient("https://URL-NOVA.supabase.co", "CHAVE-NOVA")

// FUNÇÃO PARA ENCURTAR URL
function encurtarURL(url: string, nome: string): string {
  // Se for URL muito longa (Blob/Base64), usar placeholder
  if (url.length > 200 || url.includes("data:image") || url.includes("blob.vercel")) {
    return `/placeholder.svg?height=200&width=300&text=${encodeURIComponent(nome)}`
  }
  return url
}

async function migrarCategorias() {
  console.log("📂 Migrando categorias...")

  // 1. Buscar do banco antigo
  const { data: categorias, error } = await supabaseAntigo.from("categorias").select("*")

  if (error) throw error

  // 2. Compactar URLs
  const categoriasCompactadas = categorias.map((cat) => ({
    ...cat,
    imagem: cat.imagem ? encurtarURL(cat.imagem, cat.nome) : null,
  }))

  // 3. Inserir no banco novo
  const { error: erroInsert } = await supabaseNovo.from("categorias").insert(categoriasCompactadas)

  if (erroInsert) throw erroInsert

  console.log(`✅ ${categorias.length} categorias migradas`)
}

async function migrarBebidas() {
  console.log("🍻 Migrando bebidas...")

  // 1. Buscar do banco antigo
  const { data: bebidas, error } = await supabaseAntigo.from("bebidas").select("*")

  if (error) throw error

  // 2. Compactar URLs
  const bebidasCompactadas = bebidas.map((bebida) => ({
    ...bebida,
    imagem: encurtarURL(bebida.imagem, bebida.nome),
  }))

  // 3. Inserir no banco novo EM LOTES de 50
  const TAMANHO_LOTE = 50
  for (let i = 0; i < bebidasCompactadas.length; i += TAMANHO_LOTE) {
    const lote = bebidasCompactadas.slice(i, i + TAMANHO_LOTE)

    const { error: erroInsert } = await supabaseNovo.from("bebidas").insert(lote)

    if (erroInsert) {
      console.error(`❌ Erro no lote ${i}-${i + TAMANHO_LOTE}:`, erroInsert)
      continue
    }

    console.log(`✅ Lote ${i}-${i + TAMANHO_LOTE} migrado`)
  }

  console.log(`✅ ${bebidas.length} bebidas migradas`)
}

async function migrarPedidos() {
  console.log("📋 Migrando pedidos...")

  // 1. Buscar do banco antigo
  const { data: pedidos, error } = await supabaseAntigo
    .from("pedidos")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100) // Migrar apenas os últimos 100 pedidos

  if (error) throw error

  // 2. Inserir no banco novo
  const { error: erroInsert } = await supabaseNovo.from("pedidos").insert(pedidos)

  if (erroInsert) throw erroInsert

  console.log(`✅ ${pedidos.length} pedidos migrados`)
}

async function executarMigracao() {
  try {
    console.log("🚀 Iniciando migração otimizada...")

    await migrarCategorias()
    await migrarBebidas()
    await migrarPedidos()

    console.log("🎉 Migração concluída com sucesso!")
  } catch (error) {
    console.error("❌ Erro na migração:", error)
  }
}

// EXECUTAR
executarMigracao()
