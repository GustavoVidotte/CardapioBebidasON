"use client"

export const dynamic = "force-dynamic"

import { useState } from "react"

interface DadosSupabase {
  categorias: number
  bebidas: number
  pedidos: number
  imagensBase64: number
}

export default function MigrarPage() {
  const [supabaseUrl, setSupabaseUrl] = useState("")
  const [nomeBanco, setNomeBanco] = useState("")
  const [etapa, setEtapa] = useState<"inicio" | "conectado" | "migrando" | "concluido" | "erro">("inicio")
  const [dados, setDados] = useState<DadosSupabase | null>(null)
  const [bancosVPS, setBancosVPS] = useState<string[]>([])
  const [logs, setLogs] = useState<string[]>([])
  const [erro, setErro] = useState("")
  const [vpsConectada, setVpsConectada] = useState(false)

  async function testarSupabase() {
    if (!supabaseUrl.trim()) {
      setErro("Cole a connection string do Supabase")
      return
    }
    setErro("")
    setEtapa("inicio")
    setLogs(["Testando conexao com Supabase..."])

    try {
      const res = await fetch("/api/migrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "testar-supabase", supabaseUrl }),
      })
      const data = await res.json()

      if (data.success) {
        setDados(data.dados)
        setLogs((prev) => [...prev, "Conexao com Supabase OK!"])
        setEtapa("conectado")
        testarVPS()
      } else {
        setErro(data.error)
        setLogs((prev) => [...prev, `ERRO: ${data.error}`])
      }
    } catch (err: any) {
      setErro(err.message)
    }
  }

  async function testarVPS() {
    setLogs((prev) => [...prev, "Testando conexao com VPS..."])
    try {
      const res = await fetch("/api/migrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "testar-vps" }),
      })
      const data = await res.json()

      if (data.success) {
        setBancosVPS(data.bancos)
        setVpsConectada(true)
        setLogs((prev) => [...prev, `VPS conectada! ${data.bancos.length} bancos encontrados`])
      } else {
        setLogs((prev) => [...prev, `AVISO: VPS nao conectou: ${data.error}`])
      }
    } catch (err: any) {
      setLogs((prev) => [...prev, `AVISO: VPS nao conectou: ${err.message}`])
    }
  }

  async function iniciarMigracao() {
    if (!nomeBanco.trim()) {
      setErro("Digite o nome do banco")
      return
    }
    setErro("")
    setEtapa("migrando")
    setLogs(["Iniciando migracao..."])

    try {
      const res = await fetch("/api/migrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "migrar", supabaseUrl, nomeBanco }),
      })
      const data = await res.json()

      if (data.success) {
        setLogs(data.logs || [])
        setEtapa("concluido")
      } else {
        setLogs(data.logs || [data.error])
        setErro(data.error)
        setEtapa("erro")
      }
    } catch (err: any) {
      setErro(err.message)
      setEtapa("erro")
    }
  }

  function resetar() {
    setSupabaseUrl("")
    setNomeBanco("")
    setEtapa("inicio")
    setDados(null)
    setLogs([])
    setErro("")
    setVpsConectada(false)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <a href="/admin" className="text-gray-400 hover:text-white text-sm mb-4 inline-block">
            &larr; Voltar ao Admin
          </a>
          <h1 className="text-2xl md:text-3xl font-bold">Migrar Supabase &rarr; VPS</h1>
          <p className="text-gray-400 mt-1">Migra o banco completo de um cliente (categorias, bebidas com imagens base64, pedidos)</p>
        </div>

        {/* Etapa 1: Connection string */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-4">
          <h2 className="text-lg font-semibold mb-4">1. Connection String do Supabase</h2>
          <input
            type="text"
            value={supabaseUrl}
            onChange={(e) => setSupabaseUrl(e.target.value)}
            placeholder="postgresql://postgres.xxxx:senha@aws-0-sa-east-1.pooler.supabase.com:6543/postgres"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none font-mono"
            disabled={etapa === "migrando"}
          />
          <button
            onClick={testarSupabase}
            disabled={etapa === "migrando" || !supabaseUrl.trim()}
            className="mt-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white px-6 py-2.5 rounded-lg font-medium text-sm transition-colors"
          >
            Testar Conexao
          </button>
        </div>

        {/* Dados encontrados */}
        {dados && (
          <div className="bg-gray-900 border border-green-800 rounded-xl p-6 mb-4">
            <h2 className="text-lg font-semibold mb-4 text-green-400">Dados Encontrados</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-400">{dados.categorias}</div>
                <div className="text-xs text-gray-400 mt-1">Categorias</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-400">{dados.bebidas}</div>
                <div className="text-xs text-gray-400 mt-1">Bebidas</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-400">{dados.pedidos}</div>
                <div className="text-xs text-gray-400 mt-1">Pedidos</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">{dados.imagensBase64}</div>
                <div className="text-xs text-gray-400 mt-1">Imagens Base64</div>
              </div>
            </div>

            {/* VPS status */}
            <div className="mt-4 flex items-center gap-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${vpsConectada ? "bg-green-400" : "bg-red-400"}`} />
              <span className={vpsConectada ? "text-green-400" : "text-red-400"}>
                VPS {vpsConectada ? "conectada" : "desconectada"}
              </span>
              {vpsConectada && (
                <span className="text-gray-500">({bancosVPS.length} bancos existentes)</span>
              )}
            </div>
          </div>
        )}

        {/* Etapa 2: Nome do banco */}
        {etapa !== "inicio" && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-4">
            <h2 className="text-lg font-semibold mb-4">2. Nome do Novo Banco na VPS</h2>
            <input
              type="text"
              value={nomeBanco}
              onChange={(e) => setNomeBanco(e.target.value)}
              placeholder="nome_do_cliente"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none font-mono"
              disabled={etapa === "migrando"}
            />
            <p className="text-xs text-gray-500 mt-2">
              Somente letras minusculas, numeros e underscore. Ex: bar_do_joao, loja_maria
            </p>

            {/* Bancos existentes na VPS */}
            {bancosVPS.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-1">Bancos existentes na VPS:</p>
                <div className="flex flex-wrap gap-1">
                  {bancosVPS.filter(b => !["postgres", "template0", "template1"].includes(b)).map((b) => (
                    <span key={b} className="bg-gray-800 text-gray-400 px-2 py-0.5 rounded text-xs font-mono">
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {etapa === "conectado" && (
              <button
                onClick={iniciarMigracao}
                disabled={!nomeBanco.trim() || !vpsConectada}
                className="mt-4 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-700 disabled:text-gray-500 text-white px-8 py-3 rounded-lg font-bold text-sm transition-colors w-full"
              >
                INICIAR MIGRACAO
              </button>
            )}
          </div>
        )}

        {/* Migrando */}
        {etapa === "migrando" && (
          <div className="bg-gray-900 border border-yellow-800 rounded-xl p-6 mb-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
              <h2 className="text-lg font-semibold text-yellow-400">Migrando...</h2>
            </div>
            <p className="text-sm text-gray-400">Isso pode demorar alguns minutos dependendo da quantidade de dados e imagens base64.</p>
          </div>
        )}

        {/* Concluido */}
        {etapa === "concluido" && (
          <div className="bg-gray-900 border border-green-800 rounded-xl p-6 mb-4">
            <h2 className="text-lg font-semibold text-green-400 mb-2">Migracao Concluida!</h2>
            <p className="text-sm text-gray-400 mb-4">O banco foi criado com sucesso na VPS.</p>
            <button
              onClick={resetar}
              className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg text-sm transition-colors"
            >
              Fazer Nova Migracao
            </button>
          </div>
        )}

        {/* Erro */}
        {erro && (
          <div className="bg-red-900/30 border border-red-800 rounded-xl p-4 mb-4">
            <p className="text-red-400 text-sm font-mono">{erro}</p>
          </div>
        )}

        {/* Logs */}
        {logs.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-gray-400 mb-3">LOG DA MIGRACAO</h2>
            <div className="bg-black rounded-lg p-4 max-h-96 overflow-y-auto font-mono text-xs space-y-1">
              {logs.map((log, i) => (
                <div
                  key={i}
                  className={
                    log.includes("ERRO") ? "text-red-400" :
                    log.includes("AVISO") ? "text-yellow-400" :
                    log.includes("CONCLUIDA") || log.includes("Connection string") ? "text-green-400" :
                    "text-gray-300"
                  }
                >
                  <span className="text-gray-600 mr-2">[{String(i + 1).padStart(2, "0")}]</span>
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
