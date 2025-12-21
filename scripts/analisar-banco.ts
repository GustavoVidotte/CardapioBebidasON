import { createClient } from "@supabase/supabase-js"

// Suas credenciais
const supabaseUrl = "https://qcaoaciohcqcwulsrtzu.supabase.co"
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjYW9hY2lvaGNxY3d1bHNydHp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NjU1MTgsImV4cCI6MjA3MDM0MTUxOH0.WV10l7nJMDsr84otsWCsRDGDjjrm5TX5a8yRLg2gpgk"

const supabase = createClient(supabaseUrl, supabaseKey)

async function analisarBancoDeDados() {
  console.log("🔍 ANALISANDO BANCO DE DADOS...\n")

  try {
    // 1. ANALISAR CATEGORIAS
    console.log("📂 CATEGORIAS:")
    const { data: categorias, error: erroCat } = await supabase.from("categorias").select("*")

    if (erroCat) {
      console.error("❌ Erro ao buscar categorias:", erroCat)
    } else {
      console.log(`   Total: ${categorias?.length || 0}`)

      if (categorias && categorias.length > 0) {
        // Analisar tamanho das URLs
        const comImagem = categorias.filter((c) => c.imagem && c.imagem.length > 0)
        const urlsLongas = categorias.filter((c) => c.imagem && c.imagem.length > 200)

        console.log(`   Com imagem: ${comImagem.length}`)
        console.log(`   URLs longas (>200 chars): ${urlsLongas.length}`)

        if (urlsLongas.length > 0) {
          console.log("\n   🔗 Exemplos de URLs longas:")
          urlsLongas.slice(0, 3).forEach((c) => {
            console.log(`      - ${c.nome}: ${c.imagem.substring(0, 100)}... (${c.imagem.length} chars)`)
          })
        }
      }
    }

    // 2. ANALISAR BEBIDAS
    console.log("\n🍻 BEBIDAS:")
    const { data: bebidas, error: erroBeb } = await supabase.from("bebidas").select("*")

    if (erroBeb) {
      console.error("❌ Erro ao buscar bebidas:", erroBeb)
    } else {
      console.log(`   Total: ${bebidas?.length || 0}`)

      if (bebidas && bebidas.length > 0) {
        // Analisar tamanho das URLs
        const comImagem = bebidas.filter((b) => b.imagem && b.imagem.length > 0)
        const urlsLongas = bebidas.filter((b) => b.imagem && b.imagem.length > 200)
        const urlsGigantes = bebidas.filter((b) => b.imagem && b.imagem.length > 1000)

        console.log(`   Com imagem: ${comImagem.length}`)
        console.log(`   URLs longas (>200 chars): ${urlsLongas.length}`)
        console.log(`   URLs GIGANTES (>1000 chars): ${urlsGigantes.length}`)

        // Calcular tamanho médio
        const tamanhoTotal = bebidas.reduce((acc, b) => acc + (b.imagem?.length || 0), 0)
        const tamanhoMedio = Math.round(tamanhoTotal / bebidas.length)

        console.log(`   Tamanho médio URL: ${tamanhoMedio} chars`)
        console.log(`   Tamanho total URLs: ${(tamanhoTotal / 1024).toFixed(2)} KB`)

        if (urlsGigantes.length > 0) {
          console.log("\n   🔗 Exemplos de URLs GIGANTES:")
          urlsGigantes.slice(0, 3).forEach((b) => {
            console.log(`      - ${b.nome}: ${b.imagem.substring(0, 100)}... (${b.imagem.length} chars)`)
          })
        }
      }
    }

    // 3. ANALISAR PEDIDOS
    console.log("\n📋 PEDIDOS:")
    const { data: pedidos, error: erroPed } = await supabase
      .from("pedidos")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100)

    if (erroPed) {
      console.error("❌ Erro ao buscar pedidos:", erroPed)
    } else {
      console.log(`   Total (últimos 100): ${pedidos?.length || 0}`)

      if (pedidos && pedidos.length > 0) {
        const tamanhoTotal = JSON.stringify(pedidos).length
        console.log(`   Tamanho total: ${(tamanhoTotal / 1024).toFixed(2)} KB`)
      }
    }

    // 4. CALCULAR ECONOMIA POTENCIAL
    console.log("\n💡 ECONOMIA POTENCIAL:")

    const tamanhoCategorias = JSON.stringify(categorias || []).length
    const tamanhoBebidas = JSON.stringify(bebidas || []).length
    const tamanhoTotal = tamanhoCategorias + tamanhoBebidas

    console.log(`   Tamanho atual total: ${(tamanhoTotal / 1024).toFixed(2)} KB`)

    // Estimar tamanho após compactação (substituindo URLs longas)
    const categoriasCompactadas = (categorias || []).map((c) => ({
      ...c,
      imagem: c.imagem && c.imagem.length > 100 ? `/placeholder.svg?text=${c.nome}` : c.imagem,
    }))

    const bebidasCompactadas = (bebidas || []).map((b) => ({
      ...b,
      imagem: b.imagem && b.imagem.length > 100 ? `/placeholder.svg?text=${b.nome}` : b.imagem,
    }))

    const tamanhoCompactado = JSON.stringify(categoriasCompactadas).length + JSON.stringify(bebidasCompactadas).length

    const economia = ((1 - tamanhoCompactado / tamanhoTotal) * 100).toFixed(1)

    console.log(`   Tamanho após compactar: ${(tamanhoCompactado / 1024).toFixed(2)} KB`)
    console.log(`   📊 ECONOMIA: ${economia}%`)

    console.log("\n✅ ANÁLISE CONCLUÍDA!")
  } catch (error) {
    console.error("❌ ERRO CRÍTICO:", error)
  }
}

// EXECUTAR ANÁLISE
analisarBancoDeDados()
