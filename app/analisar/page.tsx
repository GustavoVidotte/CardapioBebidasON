"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createClient } from "@supabase/supabase-js"

// SUAS CREDENCIAIS
const supabase = createClient(
  "https://qcaoaciohcqcwulsrtzu.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjYW9hY2lvaGNxY3d1bHNydHp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NjU1MTgsImV4cCI6MjA3MDM0MTUxOH0.WV10l7nJMDsr84otsWCsRDGDjjrm5TX5a8yRLg2gpgk",
)

interface Analise {
  categorias: {
    total: number
    comImagem: number
    urlsLongas: number
    exemplos: Array<{ nome: string; tamanho: number; url: string }>
  }
  bebidas: {
    total: number
    comImagem: number
    urlsLongas: number
    urlsGigantes: number
    tamanhoMedio: number
    tamanhoTotal: number
    exemplos: Array<{ nome: string; tamanho: number; url: string }>
  }
  pedidos: {
    total: number
    tamanhoTotal: number
  }
  economia: {
    tamanhoOriginal: string
    tamanhoCompactado: string
    economiaPercentual: string
  }
}

export default function AnalisarDados() {
  const [analisando, setAnalisando] = useState(false)
  const [resultado, setResultado] = useState<Analise | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`])
  }

  const encurtarURL = (url: string | null, nome: string): string => {
    if (!url) return `/placeholder.svg?height=200&width=300&text=${encodeURIComponent(nome)}`
    if (url.length > 200 || url.includes("data:image") || url.includes("blob.vercel")) {
      return `/placeholder.svg?height=200&width=300&text=${encodeURIComponent(nome)}`
    }
    if (url.length > 100) {
      return `/placeholder.svg?height=200&width=300&text=${encodeURIComponent(nome)}`
    }
    return url
  }

  const analisarBanco = async () => {
    try {
      setAnalisando(true)
      setErro(null)
      setLogs([])
      addLog("🔍 Iniciando análise...")

      // ANALISAR CATEGORIAS
      addLog("📂 Buscando categorias...")
      const { data: categorias, error: erroCat } = await supabase.from("categorias").select("*")

      if (erroCat) throw erroCat
      addLog(`✅ ${categorias?.length || 0} categorias encontradas`)

      const comImagemCat = categorias?.filter((c) => c.imagem && c.imagem.length > 0) || []
      const urlsLongasCat = categorias?.filter((c) => c.imagem && c.imagem.length > 200) || []
      const exemplosCat = urlsLongasCat.slice(0, 3).map((c) => ({
        nome: c.nome,
        tamanho: c.imagem?.length || 0,
        url: c.imagem?.substring(0, 100) + "...",
      }))

      // ANALISAR BEBIDAS
      addLog("🍻 Buscando bebidas...")
      const { data: bebidas, error: erroBeb } = await supabase.from("bebidas").select("*")

      if (erroBeb) throw erroBeb
      addLog(`✅ ${bebidas?.length || 0} bebidas encontradas`)

      const comImagemBeb = bebidas?.filter((b) => b.imagem && b.imagem.length > 0) || []
      const urlsLongasBeb = bebidas?.filter((b) => b.imagem && b.imagem.length > 200) || []
      const urlsGigantesBeb = bebidas?.filter((b) => b.imagem && b.imagem.length > 1000) || []

      const tamanhoTotalBeb = bebidas?.reduce((acc, b) => acc + (b.imagem?.length || 0), 0) || 0
      const tamanhoMedioBeb = bebidas?.length ? Math.round(tamanhoTotalBeb / bebidas.length) : 0

      const exemplosBeb = urlsGigantesBeb.slice(0, 3).map((b) => ({
        nome: b.nome,
        tamanho: b.imagem?.length || 0,
        url: b.imagem?.substring(0, 100) + "...",
      }))

      // ANALISAR PEDIDOS
      addLog("📋 Buscando pedidos...")
      const { data: pedidos, error: erroPed } = await supabase
        .from("pedidos")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100)

      if (erroPed) throw erroPed
      addLog(`✅ ${pedidos?.length || 0} pedidos encontrados`)

      const tamanhoPedidos = JSON.stringify(pedidos || []).length

      // CALCULAR ECONOMIA
      addLog("💡 Calculando economia potencial...")
      const tamanhoOriginal = JSON.stringify({ categorias, bebidas, pedidos }).length
      const categoriasComp = categorias?.map((c) => ({ ...c, imagem: encurtarURL(c.imagem, c.nome) }))
      const bebidasComp = bebidas?.map((b) => ({ ...b, imagem: encurtarURL(b.imagem, b.nome) }))
      const tamanhoCompactado = JSON.stringify({ categorias: categoriasComp, bebidas: bebidasComp, pedidos }).length
      const economia = ((1 - tamanhoCompactado / tamanhoOriginal) * 100).toFixed(1)

      const analise: Analise = {
        categorias: {
          total: categorias?.length || 0,
          comImagem: comImagemCat.length,
          urlsLongas: urlsLongasCat.length,
          exemplos: exemplosCat,
        },
        bebidas: {
          total: bebidas?.length || 0,
          comImagem: comImagemBeb.length,
          urlsLongas: urlsLongasBeb.length,
          urlsGigantes: urlsGigantesBeb.length,
          tamanhoMedio: tamanhoMedioBeb,
          tamanhoTotal: tamanhoTotalBeb,
          exemplos: exemplosBeb,
        },
        pedidos: {
          total: pedidos?.length || 0,
          tamanhoTotal: tamanhoPedidos,
        },
        economia: {
          tamanhoOriginal: (tamanhoOriginal / 1024).toFixed(2) + " KB",
          tamanhoCompactado: (tamanhoCompactado / 1024).toFixed(2) + " KB",
          economiaPercentual: economia + "%",
        },
      }

      setResultado(analise)
      addLog("🎉 Análise concluída com sucesso!")
    } catch (error) {
      console.error("❌ Erro:", error)
      setErro(error instanceof Error ? error.message : "Erro desconhecido")
      addLog("❌ ERRO: " + (error instanceof Error ? error.message : "Erro desconhecido"))
    } finally {
      setAnalisando(false)
    }
  }

  const exportarCompactado = async () => {
    try {
      addLog("📥 Iniciando exportação...")

      const { data: categorias } = await supabase.from("categorias").select("*")
      const { data: bebidas } = await supabase.from("bebidas").select("*")
      const { data: pedidos } = await supabase
        .from("pedidos")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100)

      const categoriasComp = categorias?.map((c) => ({ ...c, imagem: encurtarURL(c.imagem, c.nome) }))
      const bebidasComp = bebidas?.map((b) => ({ ...b, imagem: encurtarURL(b.imagem, b.nome) }))

      const backup = {
        versao: "2.0-compactado",
        data_exportacao: new Date().toISOString(),
        origem: "qcaoaciohcqcwulsrtzu.supabase.co",
        categorias: categoriasComp,
        bebidas: bebidasComp,
        pedidos: pedidos,
      }

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `backup-compactado-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      addLog("✅ Backup exportado com sucesso!")
    } catch (error) {
      addLog("❌ Erro na exportação: " + (error instanceof Error ? error.message : "Erro desconhecido"))
    }
  }

  // Auto-executar ao carregar
  useEffect(() => {
    analisarBanco()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <h1 className="text-3xl font-bold mb-2 text-green-400">🔍 Análise do Banco de Dados</h1>
            <p className="text-gray-400 mb-4">Conectado em: qcaoaciohcqcwulsrtzu.supabase.co</p>

            <div className="flex gap-4">
              <Button onClick={analisarBanco} disabled={analisando} className="bg-blue-600 hover:bg-blue-700">
                {analisando ? "🔄 Analisando..." : "🔍 Analisar Novamente"}
              </Button>

              <Button
                onClick={exportarCompactado}
                disabled={analisando || !resultado}
                className="bg-green-600 hover:bg-green-700"
              >
                📥 Exportar Compactado
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* LOGS */}
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4 text-yellow-400">📝 Logs</h2>
            <div className="bg-black rounded-lg p-4 max-h-60 overflow-y-auto font-mono text-sm">
              {logs.map((log, i) => (
                <div key={i} className="text-green-400">
                  {log}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {erro && (
          <Card className="bg-red-900 border-red-700">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-2">❌ Erro</h2>
              <p className="text-red-200">{erro}</p>
            </CardContent>
          </Card>
        )}

        {resultado && (
          <>
            {/* CATEGORIAS */}
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-4 text-blue-400">📂 Categorias</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-3xl font-bold text-blue-400">{resultado.categorias.total}</div>
                    <div className="text-sm text-gray-400">Total</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-green-400">{resultado.categorias.comImagem}</div>
                    <div className="text-sm text-gray-400">Com Imagem</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-yellow-400">{resultado.categorias.urlsLongas}</div>
                    <div className="text-sm text-gray-400">URLs Longas</div>
                  </div>
                </div>

                {resultado.categorias.exemplos.length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-bold mb-2">Exemplos de URLs longas:</h3>
                    {resultado.categorias.exemplos.map((ex, i) => (
                      <div key={i} className="bg-gray-900 p-2 rounded mb-2 text-xs">
                        <div className="font-bold">{ex.nome}</div>
                        <div className="text-gray-400">Tamanho: {ex.tamanho} chars</div>
                        <div className="text-gray-500 truncate">{ex.url}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* BEBIDAS */}
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-4 text-purple-400">🍻 Bebidas</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center mb-4">
                  <div>
                    <div className="text-3xl font-bold text-purple-400">{resultado.bebidas.total}</div>
                    <div className="text-sm text-gray-400">Total</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-green-400">{resultado.bebidas.comImagem}</div>
                    <div className="text-sm text-gray-400">Com Imagem</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-yellow-400">{resultado.bebidas.urlsLongas}</div>
                    <div className="text-sm text-gray-400">URLs Longas</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-red-400">{resultado.bebidas.urlsGigantes}</div>
                    <div className="text-sm text-gray-400">URLs Gigantes</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-blue-400">{resultado.bebidas.tamanhoMedio}</div>
                    <div className="text-sm text-gray-400">Média chars</div>
                  </div>
                </div>

                <div className="bg-gray-900 p-4 rounded">
                  <div className="text-sm text-gray-400">Tamanho Total URLs:</div>
                  <div className="text-2xl font-bold text-yellow-400">
                    {(resultado.bebidas.tamanhoTotal / 1024).toFixed(2)} KB
                  </div>
                </div>

                {resultado.bebidas.exemplos.length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-bold mb-2">Exemplos de URLs GIGANTES:</h3>
                    {resultado.bebidas.exemplos.map((ex, i) => (
                      <div key={i} className="bg-gray-900 p-2 rounded mb-2 text-xs">
                        <div className="font-bold">{ex.nome}</div>
                        <div className="text-red-400">Tamanho: {ex.tamanho} chars</div>
                        <div className="text-gray-500 truncate">{ex.url}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ECONOMIA */}
            <Card className="bg-gradient-to-r from-green-900 to-blue-900 border-green-700">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-4 text-green-400">💰 Economia Potencial</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                  <div>
                    <div className="text-sm text-gray-300 mb-2">Tamanho Original</div>
                    <div className="text-3xl font-bold text-red-400">{resultado.economia.tamanhoOriginal}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-300 mb-2">Tamanho Compactado</div>
                    <div className="text-3xl font-bold text-blue-400">{resultado.economia.tamanhoCompactado}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-300 mb-2">Economia</div>
                    <div className="text-5xl font-bold text-green-400">{resultado.economia.economiaPercentual}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
