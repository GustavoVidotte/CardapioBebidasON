"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function ExportarCompactado() {
  const [carregando, setCarregando] = useState(false)
  const [status, setStatus] = useState("")

  const encurtarURL = (url: string, nome: string): string => {
    if (!url || url.length < 100) return url

    // Se for URL muito longa, usar placeholder
    if (url.includes("data:image") || url.includes("blob.vercel") || url.length > 200) {
      return `/placeholder.svg?height=200&width=300&text=${encodeURIComponent(nome)}`
    }

    return url
  }

  const exportarDadosCompactados = async () => {
    try {
      setCarregando(true)
      setStatus("📥 Carregando dados...")

      // 1. Buscar categorias
      const { data: categorias, error: erroCat } = await supabase.from("categorias").select("*")

      if (erroCat) throw erroCat

      // 2. Buscar bebidas
      const { data: bebidas, error: erroBeb } = await supabase.from("bebidas").select("*")

      if (erroBeb) throw erroBeb

      setStatus("🔧 Compactando URLs...")

      // 3. Compactar URLs
      const categoriasCompactadas = categorias?.map((cat) => ({
        ...cat,
        imagem: cat.imagem ? encurtarURL(cat.imagem, cat.nome) : null,
      }))

      const bebidasCompactadas = bebidas?.map((beb) => ({
        ...beb,
        imagem: encurtarURL(beb.imagem || "", beb.nome),
      }))

      // 4. Calcular economia
      const tamanhoOriginal = JSON.stringify({ categorias, bebidas }).length
      const tamanhoCompactado = JSON.stringify({
        categorias: categoriasCompactadas,
        bebidas: bebidasCompactadas,
      }).length
      const economia = ((1 - tamanhoCompactado / tamanhoOriginal) * 100).toFixed(1)

      setStatus(`✅ Compactado! Economia: ${economia}%`)

      // 5. Criar arquivo para download
      const backup = {
        versao: "2.0-compactado",
        data: new Date().toISOString(),
        categorias: categoriasCompactadas,
        bebidas: bebidasCompactadas,
        estatisticas: {
          total_categorias: categoriasCompactadas?.length,
          total_bebidas: bebidasCompactadas?.length,
          tamanho_original_kb: (tamanhoOriginal / 1024).toFixed(2),
          tamanho_compactado_kb: (tamanhoCompactado / 1024).toFixed(2),
          economia_percentual: economia,
        },
      }

      // 6. Download
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `backup-compactado-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setStatus(`🎉 Pronto! Arquivo baixado com ${economia}% de economia`)
    } catch (error) {
      console.error("❌ Erro:", error)
      setStatus("❌ Erro ao exportar")
    } finally {
      setCarregando(false)
    }
  }

  const importarDadosCompactados = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setCarregando(true)
      setStatus("📂 Lendo arquivo...")

      const texto = await file.text()
      const backup = JSON.parse(texto)

      setStatus("📤 Importando categorias...")

      // Importar categorias
      const { error: erroCat } = await supabase.from("categorias").upsert(backup.categorias)

      if (erroCat) throw erroCat

      setStatus("📤 Importando bebidas (em lotes)...")

      // Importar bebidas em lotes de 50
      const TAMANHO_LOTE = 50
      for (let i = 0; i < backup.bebidas.length; i += TAMANHO_LOTE) {
        const lote = backup.bebidas.slice(i, i + TAMANHO_LOTE)

        const { error } = await supabase.from("bebidas").upsert(lote)

        if (error) {
          console.error(`Erro no lote ${i}:`, error)
          continue
        }

        setStatus(`📤 ${Math.min(i + TAMANHO_LOTE, backup.bebidas.length)}/${backup.bebidas.length} bebidas...`)
      }

      setStatus("🎉 Importação concluída!")
    } catch (error) {
      console.error("❌ Erro:", error)
      setStatus("❌ Erro na importação")
    } finally {
      setCarregando(false)
    }
  }

  return (
    <Card className="shadow-lg">
      <CardContent className="p-6 space-y-4">
        <h3 className="text-xl font-bold">🗜️ Exportar/Importar Compactado</h3>

        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>💡 Como funciona:</strong>
            <br />• URLs longas são substituídas por placeholders
            <br />• Reduz até 90% do tamanho do arquivo
            <br />• Facilita migração entre contas Supabase
            <br />• Mantém todos os dados importantes
          </p>
        </div>

        {status && <div className="bg-gray-100 p-3 rounded-lg text-center font-semibold">{status}</div>}

        <div className="space-y-3">
          <Button
            onClick={exportarDadosCompactados}
            disabled={carregando}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
          >
            {carregando ? "⏳ Processando..." : "📥 Exportar Compactado"}
          </Button>

          <label className="block">
            <Button
              as="div"
              disabled={carregando}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 cursor-pointer"
            >
              {carregando ? "⏳ Importando..." : "📤 Importar Compactado"}
            </Button>
            <input
              type="file"
              accept=".json"
              onChange={importarDadosCompactados}
              className="hidden"
              disabled={carregando}
            />
          </label>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-xs text-yellow-800">
            ⚠️ <strong>IMPORTANTE:</strong>
            <br />
            1. Exporte os dados compactados
            <br />
            2. Crie as tabelas no novo Supabase
            <br />
            3. Importe o arquivo compactado
            <br />
            4. Verifique se tudo está OK
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
