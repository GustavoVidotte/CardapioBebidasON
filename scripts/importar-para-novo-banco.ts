import { createClient } from "@supabase/supabase-js"
import * as fs from "fs"
import * as path from "path"

// CONFIGURAÇÃO DO NOVO BANCO
// ⚠️ SUBSTITUA COM AS CREDENCIAIS DO SEU NOVO SUPABASE
const NOVO_SUPABASE_URL = "https://SEU-NOVO-PROJETO.supabase.co"
const NOVO_SUPABASE_KEY = "SUA-NOVA-CHAVE-AQUI"

const supabaseNovo = createClient(NOVO_SUPABASE_URL, NOVO_SUPABASE_KEY)

async function importarBackup(nomeArquivo: string) {
  console.log("📤 IMPORTANDO BACKUP...\n")

  try {
    // 1. LER ARQUIVO
    console.log(`📂 Lendo arquivo: ${nomeArquivo}`)
    const caminhoArquivo = path.join(process.cwd(), nomeArquivo)
    const conteudo = fs.readFileSync(caminhoArquivo, "utf-8")
    const backup = JSON.parse(conteudo)

    console.log("✅ Arquivo carregado com sucesso")
    console.log(`   Categorias: ${backup.categorias.length}`)
    console.log(`   Bebidas: ${backup.bebidas.length}`)
    console.log(`   Pedidos: ${backup.pedidos?.length || 0}`)

    // 2. IMPORTAR CATEGORIAS
    console.log("\n📂 Importando categorias...")
    const { error: erroCat } = await supabaseNovo.from("categorias").upsert(backup.categorias)

    if (erroCat) {
      console.error("❌ Erro ao importar categorias:", erroCat)
      throw erroCat
    }
    console.log("✅ Categorias importadas")

    // 3. IMPORTAR BEBIDAS EM LOTES
    console.log("\n🍻 Importando bebidas...")
    const TAMANHO_LOTE = 50

    for (let i = 0; i < backup.bebidas.length; i += TAMANHO_LOTE) {
      const lote = backup.bebidas.slice(i, i + TAMANHO_LOTE)

      const { error } = await supabaseNovo.from("bebidas").upsert(lote)

      if (error) {
        console.error(`❌ Erro no lote ${i}-${i + TAMANHO_LOTE}:`, error)
        continue
      }

      console.log(`   ✅ ${Math.min(i + TAMANHO_LOTE, backup.bebidas.length)}/${backup.bebidas.length}`)
    }

    // 4. IMPORTAR PEDIDOS (OPCIONAL)
    if (backup.pedidos && backup.pedidos.length > 0) {
      console.log("\n📋 Importando pedidos...")

      for (let i = 0; i < backup.pedidos.length; i += TAMANHO_LOTE) {
        const lote = backup.pedidos.slice(i, i + TAMANHO_LOTE)

        const { error } = await supabaseNovo.from("pedidos").upsert(lote)

        if (error) {
          console.error(`❌ Erro no lote de pedidos ${i}:`, error)
          continue
        }

        console.log(`   ✅ ${Math.min(i + TAMANHO_LOTE, backup.pedidos.length)}/${backup.pedidos.length}`)
      }
    }

    console.log("\n🎉 IMPORTAÇÃO CONCLUÍDA COM SUCESSO!")
  } catch (error) {
    console.error("\n❌ ERRO NA IMPORTAÇÃO:", error)
  }
}

// EXECUTAR IMPORTAÇÃO
// Substitua pelo nome do arquivo que você baixou
const nomeArquivo = "backup-compactado-2025-01-09.json"
importarBackup(nomeArquivo)
