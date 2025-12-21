import { createClient } from "@supabase/supabase-js"

// BANCO ANTIGO (suas credenciais originais)
const supabaseAntigo = createClient(
  "https://qcaoaciohcqcwulsrtzu.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjYW9hY2lvaGNxY3d1bHNydHp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NjU1MTgsImV4cCI6MjA3MDM0MTUxOH0.WV10l7nJMDsr84otsWCsRDGDjjrm5TX5a8yRLg2gpgk",
)

// BANCO NOVO (suas credenciais novas)
const supabaseNovo = createClient(
  "https://fuexhrnwrunsqkluormp.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1ZXhocm53cnVuc3FrbHVvcm1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MDE5MDUsImV4cCI6MjA3NjM3NzkwNX0.XfQeiho0RKzGOTnWWtY4cGhZnXnw8lUeZ2eP5Yiz0EQ",
)

async function migrarImagensDoBancoAntigo() {
  try {
    console.log("🔄 Iniciando migração de imagens do banco antigo...")

    // 1. Buscar todas as bebidas do banco ANTIGO
    console.log("📥 Buscando bebidas do banco antigo...")
    const { data: bebidasAntigas, error: erroAntigo } = await supabaseAntigo.from("bebidas").select("*")

    if (erroAntigo) {
      console.error("❌ Erro ao buscar do banco antigo:", erroAntigo)
      throw erroAntigo
    }

    console.log(`✅ ${bebidasAntigas?.length || 0} bebidas encontradas no banco antigo`)

    // 2. Buscar todas as bebidas do banco NOVO
    console.log("📥 Buscando bebidas do banco novo...")
    const { data: bebidasNovas, error: erroNovo } = await supabaseNovo.from("bebidas").select("*")

    if (erroNovo) {
      console.error("❌ Erro ao buscar do banco novo:", erroNovo)
      throw erroNovo
    }

    console.log(`✅ ${bebidasNovas?.length || 0} bebidas encontradas no banco novo`)

    // 3. Fazer o match e atualizar as imagens
    let atualizadas = 0
    let erros = 0

    for (const bebidaAntiga of bebidasAntigas || []) {
      // Procurar a bebida correspondente no banco novo (por nome)
      const bebidaNova = bebidasNovas?.find(
        (b) => b.nome.toLowerCase().trim() === bebidaAntiga.nome.toLowerCase().trim(),
      )

      if (bebidaNova) {
        // Verificar se a imagem do banco antigo não é placeholder
        if (
          bebidaAntiga.imagem &&
          !bebidaAntiga.imagem.includes("placeholder.svg") &&
          bebidaAntiga.imagem.length < 500
        ) {
          try {
            // Atualizar a imagem no banco novo
            const { error: erroUpdate } = await supabaseNovo
              .from("bebidas")
              .update({ imagem: bebidaAntiga.imagem })
              .eq("id", bebidaNova.id)

            if (erroUpdate) {
              console.error(`❌ Erro ao atualizar ${bebidaNova.nome}:`, erroUpdate)
              erros++
            } else {
              console.log(`✅ Imagem atualizada: ${bebidaNova.nome}`)
              atualizadas++
            }
          } catch (error) {
            console.error(`❌ Erro ao atualizar ${bebidaNova.nome}:`, error)
            erros++
          }
        } else {
          console.log(`⏭️ Pulando ${bebidaAntiga.nome} (imagem placeholder ou muito grande)`)
        }
      } else {
        console.log(`⚠️ Bebida não encontrada no banco novo: ${bebidaAntiga.nome}`)
      }
    }

    console.log(`
🎉 MIGRAÇÃO CONCLUÍDA!
✅ Imagens atualizadas: ${atualizadas}
❌ Erros: ${erros}
📊 Total processado: ${bebidasAntigas?.length || 0}
`)
  } catch (error) {
    console.error("❌ Erro crítico na migração:", error)
  }
}

// Executar a migração
migrarImagensDoBancoAntigo()
