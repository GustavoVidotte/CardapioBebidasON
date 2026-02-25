"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Package, Beer, Wine, Coffee, Sparkles } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"

export const dynamic = "force-dynamic"

interface Bebida {
  id: number
  nome: string
  descricao?: string
  preco: number
  imagem?: string
  estoque: number
  categoria_id: number
  categoria?: Categoria
}

interface Categoria {
  id: number
  nome: string
  icone: string
  cor: string
}

export default function DemoPage() {
  const [bebidas, setBebidas] = useState<Bebida[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [categoriaFiltro, setCategoriaFiltro] = useState<number | "todas">("todas")
  const [busca, setBusca] = useState("")
  const [carregando, setCarregando] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    try {
      // Carregar categorias
      const { data: categoriasData } = await supabase.from("categorias").select("*")
      if (categoriasData) {
        setCategorias(categoriasData)
      }

      // Carregar bebidas
      const { data: bebidasData } = await supabase
        .from("bebidas")
        .select("*")
        .order("nome", { ascending: true })
        .limit(100)

      if (bebidasData) {
        const bebidasComCategoria = bebidasData.map((bebida) => ({
          ...bebida,
          categoria: categoriasData?.find((cat) => cat.id === bebida.categoria_id),
        }))
        setBebidas(bebidasComCategoria)
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
    } finally {
      setCarregando(false)
    }
  }

  const getIconeCategoria = (icone: string) => {
    const icones: { [key: string]: any } = {
      beer: Beer,
      wine: Wine,
      coffee: Coffee,
      sparkles: Sparkles,
      package: Package,
    }
    return icones[icone] || Package
  }

  const getCorCategoria = (cor: string) => {
    const cores: { [key: string]: { classe: string; classeBg: string; classeTexto: string } } = {
      amber: { classe: "bg-amber-500", classeBg: "bg-amber-100", classeTexto: "text-amber-800" },
      red: { classe: "bg-red-500", classeBg: "bg-red-100", classeTexto: "text-red-800" },
      purple: { classe: "bg-purple-500", classeBg: "bg-purple-100", classeTexto: "text-purple-800" },
      blue: { classe: "bg-blue-500", classeBg: "bg-blue-100", classeTexto: "text-blue-800" },
      green: { classe: "bg-green-500", classeBg: "bg-green-100", classeTexto: "text-green-800" },
      orange: { classe: "bg-orange-500", classeBg: "bg-orange-100", classeTexto: "text-orange-800" },
    }
    return cores[cor] || cores.amber
  }

  const bebidasFiltradas = bebidas.filter((bebida) => {
    const matchCategoria = categoriaFiltro === "todas" || bebida.categoria_id === categoriaFiltro
    const matchBusca =
      bebida.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (bebida.descricao && bebida.descricao.toLowerCase().includes(busca.toLowerCase()))
    return matchCategoria && matchBusca
  })

  if (carregando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-4"></div>
          <p className="text-white text-xl font-semibold">Carregando cardápio...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600">
      {/* Banner Demo */}
      <div className="bg-yellow-400 border-b-4 border-yellow-600 py-3 px-4 text-center">
        <p className="text-black font-bold text-lg">
          🧪 MODO DEMONSTRAÇÃO - Esta é uma versão de visualização do cardápio
        </p>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-6 px-4 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-center space-x-4">
          <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-white/30">
            <Image
              src="/logo-bebidas-on.png"
              alt="Logo Bebidas ON"
              width={64}
              height={64}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold">Bebidas ON</h1>
            <p className="text-orange-100 text-sm">Cardápio Demonstração</p>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-6xl mx-auto p-4">
        {/* Barra de Busca */}
        <div className="mb-6">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Buscar bebidas..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10 py-3 rounded-xl border-orange-300 focus:border-orange-500 bg-white"
            />
          </div>
        </div>

        {/* Filtros de Categoria */}
        <div className="flex flex-wrap gap-3 mb-6 justify-center overflow-x-auto pb-2">
          <Button
            variant={categoriaFiltro === "todas" ? "default" : "outline"}
            onClick={() => setCategoriaFiltro("todas")}
            className="px-4 py-2 whitespace-nowrap bg-white hover:bg-gray-100 text-gray-800 border-2"
          >
            Todas
          </Button>
          {categorias.map((categoria) => {
            const IconeComponent = getIconeCategoria(categoria.icone)
            const corInfo = getCorCategoria(categoria.cor)

            return (
              <Button
                key={categoria.id}
                variant={categoriaFiltro === categoria.id ? "default" : "outline"}
                onClick={() => setCategoriaFiltro(categoria.id)}
                className={`px-4 py-2 whitespace-nowrap ${
                  categoriaFiltro === categoria.id
                    ? `${corInfo.classe} text-white`
                    : `bg-white border-2 ${corInfo.classeTexto} hover:${corInfo.classeBg}`
                }`}
              >
                <IconeComponent className="w-4 h-4 mr-2" />
                {categoria.nome}
              </Button>
            )
          })}
        </div>

        {/* Grid de Produtos */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {bebidasFiltradas.map((bebida) => {
            const IconeComponent = bebida.categoria ? getIconeCategoria(bebida.categoria.icone) : Package
            const corInfo = bebida.categoria ? getCorCategoria(bebida.categoria.cor) : getCorCategoria("amber")

            return (
              <Card key={bebida.id} className="shadow-lg border-0 bg-white hover:shadow-xl transition-all duration-300">
                <CardContent className="p-4">
                  <div className="relative mb-3">
                    <div className="w-full h-40 rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={bebida.imagem || "/placeholder.svg?height=200&width=300&text=Bebida"}
                        alt={bebida.nome}
                        width={300}
                        height={200}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {bebida.estoque === 0 && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-red-500 text-white">Esgotado</Badge>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-bold text-lg text-gray-800 leading-tight break-words">{bebida.nome}</h3>
                    {bebida.descricao && <p className="text-gray-600 text-sm line-clamp-2">{bebida.descricao}</p>}

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xl font-bold text-green-600">R$ {bebida.preco.toFixed(2)}</span>
                      {bebida.categoria && (
                        <Badge className={`${corInfo.classeBg} ${corInfo.classeTexto} flex items-center space-x-1`}>
                          <IconeComponent className="w-3 h-3" />
                          <span className="text-xs">{bebida.categoria.nome}</span>
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {bebidasFiltradas.length === 0 && (
          <div className="text-center py-12">
            <p className="text-white text-xl font-semibold">Nenhuma bebida encontrada</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white py-8 px-4 mt-12">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm text-gray-400">© 2025 Bebidas ON - Versão Demonstração</p>
          <p className="text-xs text-gray-500 mt-2">Esta é uma versão de teste. Pedidos não podem ser realizados.</p>
        </div>
      </div>
    </div>
  )
}
