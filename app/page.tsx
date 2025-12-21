"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import {
  ShoppingCart,
  Plus,
  Minus,
  Search,
  Package,
  Beer,
  Coffee,
  Zap,
  Wine,
  Droplets,
  Sparkles,
  CupSoda,
  Instagram,
  Lock,
  Key,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { createClient } from "@supabase/supabase-js"
import { ToastProvider, useToast } from "@/components/toast"
import Loading3D from "@/components/loading-3d"

// 🗄️ CONFIGURAÇÃO DO SUPABASE
const supabaseUrl = "https://qcaoaciohcqcwulsrtzu.supabase.co"
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjYW9hY2lvaGNxY3d1bHNydHp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NjU1MTgsImV4cCI6MjA3MDM0MTUxOH0.WV10l7nJMDsr84otsWCsRDGDjjrm5TX5a8yRLg2gpgk"

console.log("🔍 Conectando ao Supabase...")
console.log("📍 URL:", supabaseUrl)

const supabase = createClient(supabaseUrl, supabaseKey)

// 📱 TELEFONE
const CHAVE_PIX = "1799631-1727"
const NOME_PIX = "Nattieli De Carvalho"
const BANCO_PIX = "Banco Santander (Brasil) S.A."
const TELEFONE_WHATSAPP = "17996311727"
const TELEFONE_DISPLAY = "(17) 99631-1727"

interface Categoria {
  id: number
  nome: string
  icone: string
  cor: string
  ativo: boolean
  descricao?: string // Adicionado para compatibilidade com DADOS_EXEMPLO
  imagem?: string // Adicionado para compatibilidade com DADOS_EXEMPLO
  ordem?: number // Adicionado para ordenação
}

interface Bebida {
  id: number
  nome: string
  descricao: string
  preco: number
  categoria_id: number
  categoria?: Categoria
  imagem: string
  estoque: number
  ativo: boolean
}

interface ItemCarrinho {
  bebida: Bebida
  quantidade: number
}

interface Pedido {
  id: string
  data: string
  itens: ItemCarrinho[]
  total: number
  formaPagamento: "cartao" | "dinheiro" | "pix"
  valorPago?: number
  troco?: number
  cliente: string
  tipoEntrega: "entrega" | "retirada"
  enderecoEntrega?: string
  localizacao?: string
  status: "enviado" | "confirmado" | "entregue"
}

// Adicionar após as interfaces existentes, antes das constantes:

interface BackupData {
  categorias: Categoria[]
  bebidas: Bebida[]
  timestamp: string
  versao: string
}

// 🏪 SISTEMA DE STATUS DA LOJA - MELHORADO PARA SINCRONIZAÇÃO
const STORAGE_KEY_LOJA_STATUS = "bebidas_on_loja_aberta"
const STORAGE_KEY_ULTIMA_LIMPEZA = "bebidas_on_ultima_limpeza"

// 🆕 ADICIONANDO CHAVES DE CACHE
const STORAGE_KEY_BEBIDAS_CACHE = "bebidas_on_bebidas_cache"
const STORAGE_KEY_CATEGORIAS_CACHE = "bebidas_on_categorias_cache"
const CACHE_TIMEOUT = 5 * 60 * 1000 // 5 minutos

// ⚠️ IMPORTANTE: No Vercel, cada usuário terá seu próprio localStorage
// Para sincronizar entre todos os dispositivos, seria necessário usar o banco de dados
// Atualmente funciona apenas localmente em cada dispositivo

// Adicionar função para detectar iOS no início do componente, após as interfaces
const detectarIOS = () => {
  if (typeof window === "undefined") return false
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  )
}

const TAXA_ENTREGA = 2.0
const PEDIDO_MINIMO_ENTREGA = 20.0

// 🎨 CORES PARA CATEGORIAS
const CORES_CATEGORIAS = [
  { nome: "Âmbar", valor: "amber", classe: "bg-amber-500", classeTexto: "text-amber-700", classeBg: "bg-amber-50" },
  { nome: "Azul", valor: "blue", classe: "bg-blue-500", classeTexto: "text-blue-700", classeBg: "bg-blue-50" },
  { nome: "Verde", valor: "green", classe: "bg-green-500", classeTexto: "text-green-700", classeBg: "bg-green-50" },
  { nome: "Roxo", valor: "purple", classe: "bg-purple-500", classeTexto: "text-purple-700", classeBg: "bg-purple-50" },
  { nome: "Rosa", valor: "pink", classe: "bg-pink-500", classeTexto: "text-pink-700", classeBg: "bg-pink-50" },
  { nome: "Vermelho", valor: "red", classe: "bg-red-500", classeTexto: "text-red-700", classeBg: "bg-red-50" },
]

// 🎯 ÍCONES PARA CATEGORIAS
const ICONES_CATEGORIAS = [
  { nome: "Cerveja", valor: "beer", icone: Beer },
  { nome: "Refrigerante", valor: "cup-soda", icone: CupSoda },
  { nome: "Café", valor: "coffee", icone: Coffee },
  { nome: "Energético", valor: "zap", icone: Zap },
  { nome: "Vinho", valor: "wine", icone: Wine },
  { nome: "Água", valor: "droplets", icone: Droplets },
  { nome: "Especial", valor: "sparkles", icone: Sparkles },
  { nome: "Geral", valor: "package", icone: Package },
]

// Adicionar após as constantes CORES_CATEGORIAS e ICONES_CATEGORIAS:

// 💾 DADOS DE EXEMPLO PARA RESTAURAÇÃO RÁPIDA
const DADOS_EXEMPLO: BackupData = {
  categorias: [
    {
      id: 1,
      nome: "Cervejas",
      icone: "beer",
      cor: "amber",
      ativo: true,
      descricao: "Cervejas populares e artesanais.",
      ordem: 1,
    },
    {
      id: 2,
      nome: "Refrigerantes",
      icone: "cup-soda",
      cor: "blue",
      ativo: true,
      descricao: "Diversos sabores e marcas.",
      ordem: 2,
    },
    {
      id: 3,
      nome: "Águas",
      icone: "droplets",
      cor: "blue",
      ativo: true,
      descricao: "Água mineral sem e com gás.",
      ordem: 3,
    },
    {
      id: 4,
      nome: "Energéticos",
      icone: "zap",
      cor: "yellow",
      ativo: true,
      descricao: "Para dar aquele gás extra.",
      ordem: 4,
    },
    {
      id: 5,
      nome: "Sucos",
      icone: "cup-soda",
      cor: "green",
      ativo: true,
      descricao: "Sucos naturais e em pó.",
      ordem: 5,
    },
    {
      id: 6,
      nome: "Vinhos",
      icone: "wine",
      cor: "purple",
      ativo: true,
      descricao: "Seleção de vinhos tintos e brancos.",
      ordem: 6,
    },
  ],
  bebidas: [
    // Cervejas
    {
      id: 1,
      nome: "Skol Lata 350ml",
      descricao: "Cerveja leve e refrescante.",
      preco: 3.5,
      categoria_id: 1,
      imagem: "/placeholder.svg?height=200&width=300&text=Skol",
      estoque: 50,
      ativo: true,
    },
    {
      id: 2,
      nome: "Brahma Lata 350ml",
      descricao: "A cerveja que desce redondo.",
      preco: 3.5,
      categoria_id: 1,
      imagem: "/placeholder.svg?height=200&width=300&text=Brahma",
      estoque: 45,
      ativo: true,
    },
    {
      id: 3,
      nome: "Antarctica Lata 350ml",
      descricao: "A original, a de sempre.",
      preco: 3.5,
      categoria_id: 1,
      imagem: "/placeholder.svg?height=200&width=300&text=Antarctica",
      estoque: 40,
      ativo: true,
    },
    {
      id: 4,
      nome: "Heineken Lata 350ml",
      descricao: "Cerveja premium com sabor inconfundível.",
      preco: 5.5,
      categoria_id: 1,
      imagem: "/placeholder.svg?height=200&width=300&text=Heineken",
      estoque: 30,
      ativo: true,
    },
    {
      id: 5,
      nome: "Stella Artois Lata 350ml",
      descricao: "Elegância e sabor premium.",
      preco: 6.0,
      categoria_id: 1,
      imagem: "/placeholder.svg?height=200&width=300&text=Stella",
      estoque: 25,
      ativo: true,
    },

    // Refrigerantes
    {
      id: 6,
      nome: "Coca-Cola Lata 350ml",
      descricao: "O sabor que refresca e anima.",
      preco: 4.0,
      categoria_id: 2,
      imagem: "/placeholder.svg?height=200&width=300&text=Coca-Cola",
      estoque: 60,
      ativo: true,
    },
    {
      id: 7,
      nome: "Pepsi Lata 350ml",
      descricao: "O sabor que te surpreende.",
      preco: 3.5,
      categoria_id: 2,
      imagem: "/placeholder.svg?height=200&width=300&text=Pepsi",
      estoque: 40,
      ativo: true,
    },
    {
      id: 8,
      nome: "Guaraná Antarctica Lata 350ml",
      descricao: "O sabor do Brasil.",
      preco: 3.5,
      categoria_id: 2,
      imagem: "/placeholder.svg?height=200&width=300&text=Guarana",
      estoque: 50,
      ativo: true,
    },
    {
      id: 9,
      nome: "Fanta Laranja Lata 350ml",
      descricao: "O sabor divertido e cítrico.",
      preco: 3.5,
      categoria_id: 2,
      imagem: "/placeholder.svg?height=200&width=300&text=Fanta",
      estoque: 35,
      ativo: true,
    },
    {
      id: 10,
      nome: "Sprite Lata 350ml",
      descricao: "Limão e limão, o sabor que te liberta.",
      preco: 3.5,
      categoria_id: 2,
      imagem: "/placeholder.svg?height=200&width=300&text=Sprite",
      estoque: 30,
      ativo: true,
    },

    // Águas
    {
      id: 11,
      nome: "Água Crystal 500ml",
      descricao: "Hidratação pura e natural.",
      preco: 2.0,
      categoria_id: 3,
      imagem: "/placeholder.svg?height=200&width=300&text=Crystal",
      estoque: 80,
      ativo: true,
    },
    {
      id: 12,
      nome: "Água Bonafont 500ml",
      descricao: "Leveza e bem-estar a cada gole.",
      preco: 2.0,
      categoria_id: 3,
      imagem: "/placeholder.svg?height=200&width=300&text=Bonafont",
      estoque: 70,
      ativo: true,
    },
    {
      id: 13,
      nome: "Água com Gás Crystal 500ml",
      descricao: "Refrescância com um toque de efervescência.",
      preco: 2.5,
      categoria_id: 3,
      imagem: "/placeholder.svg?height=200&width=300&text=Crystal+Gas",
      estoque: 40,
      ativo: true,
    },

    // Energéticos
    {
      id: 14,
      nome: "Red Bull Lata 250ml",
      descricao: "Te dá asas!",
      preco: 8.0,
      categoria_id: 4,
      imagem: "/placeholder.svg?height=200&width=300&text=Red+Bull",
      estoque: 25,
      ativo: true,
    },
    {
      id: 15,
      nome: "Monster Energy 473ml",
      descricao: "A energia que você precisa para ir além.",
      preco: 9.0,
      categoria_id: 4,
      imagem: "/placeholder.svg?height=200&width=300&text=Monster",
      estoque: 20,
      ativo: true,
    },
    {
      id: 16,
      nome: "TNT Energy 350ml",
      descricao: "Energia explosiva para o seu dia.",
      preco: 6.0,
      categoria_id: 4,
      imagem: "/placeholder.svg?height=200&width=300&text=TNT",
      estoque: 30,
      ativo: true,
    },

    // Sucos
    {
      id: 17,
      nome: "Suco Del Valle Laranja 1L",
      descricao: "Sabor natural e refrescante.",
      preco: 5.5,
      categoria_id: 5,
      imagem: "/placeholder.svg?height=200&width=300&text=Del+Valle",
      estoque: 25,
      ativo: true,
    },
    {
      id: 18,
      nome: "Suco Maguary Uva 1L",
      descricao: "Doçura e o sabor autêntico da uva.",
      preco: 5.0,
      categoria_id: 5,
      imagem: "/placeholder.svg?height=200&width=300&text=Maguary",
      estoque: 20,
      ativo: true,
    },
    {
      id: 19,
      nome: "Suco Tang Laranja 25g",
      descricao: "Praticidade e sabor de fruta.",
      preco: 1.5,
      categoria_id: 5,
      imagem: "/placeholder.svg?height=200&width=300&text=Tang",
      estoque: 50,
      ativo: true,
    },

    // Vinhos
    {
      id: 20,
      nome: "Vinho Tinto Seco 750ml",
      descricao: "Corpo e sabor marcante.",
      preco: 15.0,
      categoria_id: 6,
      imagem: "/placeholder.svg?height=200&width=300&text=Vinho+Tinto",
      estoque: 15,
      ativo: true,
    },
    {
      id: 21,
      nome: "Vinho Branco Suave 750ml",
      descricao: "Leveza e doçura agradável.",
      preco: 12.0,
      categoria_id: 6,
      imagem: "/placeholder.svg?height=200&width=300&text=Vinho+Branco",
      estoque: 10,
      ativo: true,
    },
  ],
  timestamp: new Date().toISOString(),
  versao: "1.0",
}

// 🏷️ COMPONENTE RODAPÉ
const Rodape = () => {
  return (
    <footer className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-6 mt-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <div className="text-center md:text-left">
            <p className="text-lg font-bold text-yellow-400 mb-1">© 2022 Bebidas ON</p>
            <p className="text-sm text-gray-300">Todos os direitos reservados</p>
          </div>
          <div className="flex items-center space-x-4 text-center md:text-right">
            <div className="text-xs text-gray-400">
              <p>Desenvolvido por</p>
              <p className="font-semibold text-gray-300">GV Software</p>
            </div>
            <a
              href="https://www.instagram.com/gv_software/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 px-3 py-2 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg"
            >
              <Instagram className="w-4 h-4" />
              <span className="text-xs font-medium">@gv_software</span>
            </a>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-4 pt-4 text-center">
          <p className="text-xs text-gray-500">🍻 Delivery de bebidas • 🚚 Entrega rápida • 💳 Pagamento fácil</p>
        </div>
      </div>
    </footer>
  )
}

export default function BebidasOnApp() {
  return (
    <ToastProvider>
      <BebidasOnAppContent />
    </ToastProvider>
  )
}

function BebidasOnAppContent() {
  const { addToast } = useToast()
  const [bebidas, setBebidas] = useState<Bebida[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [telaAtual, setTelaAtual] = useState<
    "inicio" | "cardapio" | "carrinho" | "pagamento" | "comprovante" | "admin"
  >("inicio")
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([])
  const [categoriaFiltro, setCategoriaFiltro] = useState<number | "todas">("todas")
  const [busca, setBusca] = useState("")
  const [pedidoAtual, setPedidoAtual] = useState<Pedido | null>(null)
  const [formaPagamento, setFormaPagamento] = useState<"cartao" | "dinheiro" | "pix">("pix")
  const [valorPago, setValorPago] = useState("")
  const [nomeCliente, setNomeCliente] = useState("")
  const [capturandoImagem, setCapturandoImagem] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [abaAdmin, setAbaAdmin] = useState<"produtos" | "categorias" | "pedidos" | "geral">("categorias")
  const [tipoEntrega, setTipoEntrega] = useState<"entrega" | "retirada">("retirada")
  const [enderecoEntrega, setEnderecoEntrega] = useState("")
  const [localizacaoAtual, setLocalizacaoAtual] = useState("")
  const [quantidadesSelecionadas, setQuantidadesSelecionadas] = useState<{ [key: number]: number }>({})
  const [modoTeste, setModoTeste] = useState(false) // 🔴 SEMPRE PRODUÇÃO - SEM DEMO
  const [buscaProdutos, setBuscaProdutos] = useState("")
  const [filtroData, setFiltroData] = useState<"todos" | "semana" | "mes" | "ano">("todos")

  // 🏪 SISTEMA DE STATUS DA LOJA MELHORADO
  const [lojaAberta, setLojaAberta] = useState(true)
  const [statusCarregado, setStatusCarregado] = useState(false)

  // 🆕 NOVO: Estado para upload de imagens e toast helper
  const [uploadando, setUploadando] = useState(false)
  const [novoItem, setNovoItem] = useState({
    nome: "",
    descricao: "",
    preco: "",
    categoria_id: "",
    estoque: "",
    imagem: "",
  })
  const [novaCategoria, setNovaCategoria] = useState({ nome: "", icone: "package", cor: "amber", descricao: "" })
  const [editandoItem, setEditandoItem] = useState<Bebida | null>(null)
  const [editandoCategoria, setEditandoCategoria] = useState<Categoria | null>(null)
  const [modalSenhaAberto, setModalSenhaAberto] = useState(false)
  const [senhaInput, setSenhaInput] = useState("")
  const [senhaCarregando, setSenhaCarregando] = useState(false)
  const [acessoDesenvolvedor, setAcessoDesenvolvedor] = useState(false)
  const [carregandoInicial, setCarregandoInicial] = useState(true)
  const comprovanteRef = useRef<HTMLDivElement>(null)
  const [modalCorrigirImagensAberto, setModalCorrigirImagensAberto] = useState(false)

  // Função helper para mostrar toasts
  const mostrarToast = (description: string, type: "success" | "error" | "warning" | "info" = "info", title = "") => {
    addToast({
      type,
      title: title || (type === "error" ? "Erro" : type === "success" ? "Sucesso" : "Atenção"),
      description,
    })
  }

  // 🆕 NOVO: Função para upload de imagens para Vercel Blob
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEditing = false) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo
    if (!file.type.startsWith("image/")) {
      mostrarToast("Apenas imagens são permitidas", "error")
      return
    }

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      mostrarToast("Imagem muito grande (máx 5MB)", "error")
      return
    }

    setUploadando(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro no upload")
      }

      const data = await response.json()
      const imageUrl = data.url

      if (isEditing && editandoItem) {
        setEditandoItem({ ...editandoItem, imagem: imageUrl })
      } else {
        setNovoItem({ ...novoItem, imagem: imageUrl })
      }

      mostrarToast("Imagem enviada com sucesso!", "success")
    } catch (error) {
      console.error("Erro no upload:", error)
      mostrarToast(error instanceof Error ? error.message : "Erro ao enviar imagem", "error")
    } finally {
      setUploadando(false)
    }
  }

  // 🏪 CARREGAR STATUS DA LOJA AO INICIAR
  useEffect(() => {
    const carregarStatusLoja = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_LOJA_STATUS)
        if (saved !== null) {
          const status = JSON.parse(saved)
          console.log(`🏪 Status da loja carregado: ${status ? "ABERTA" : "FECHADA"}`)
          setLojaAberta(status)
        } else {
          console.log("🏪 Status da loja não encontrado, usando padrão: ABERTA")
          setLojaAberta(true)
        }
      } catch (error) {
        console.error("❌ Erro ao carregar status da loja:", error)
        setLojaAberta(true)
      } finally {
        setStatusCarregado(true)
      }
    }

    carregarStatusLoja()
  }, [])

  // 🧹 LIMPEZA AUTOMÁTICA SEMANAL (SILENCIOSA)
  useEffect(() => {
    const verificarLimpezaAutomatica = async () => {
      try {
        const ultimaLimpeza = localStorage.getItem(STORAGE_KEY_ULTIMA_LIMPEZA)
        const agora = new Date()

        if (!ultimaLimpeza) {
          // Primeira vez - salvar data atual
          localStorage.setItem(STORAGE_KEY_ULTIMA_LIMPEZA, agora.toISOString())
          console.log("📅 Data da primeira limpeza salva")
          return
        }

        const dataUltimaLimpeza = new Date(ultimaLimpeza)
        const diasDesdeUltimaLimpeza = Math.floor(
          (agora.getTime() - dataUltimaLimpeza.getTime()) / (1000 * 60 * 60 * 24),
        )

        console.log(`📅 Dias desde a última limpeza: ${diasDesdeUltimaLimpeza}`)

        // Se passou 7 dias ou mais, fazer limpeza automática
        if (diasDesdeUltimaLimpeza >= 7) {
          console.log("🧹 Iniciando limpeza automática semanal...")
          await limparBancoDadosAutomatico()
          localStorage.setItem(STORAGE_KEY_ULTIMA_LIMPEZA, agora.toISOString())
        }
      } catch (error) {
        console.error("❌ Erro na verificação de limpeza automática:", error)
      }
    }

    // Verificar limpeza após carregar os dados
    if (!carregandoInicial) {
      verificarLimpezaAutomatica()
    }
  }, [carregandoInicial])

  // 🆕 Carregamento instantâneo com cache + atualização em background
  useEffect(() => {
    const carregarInstantaneo = async () => {
      // 1. Carregar do cache primeiro (instantâneo)
      const cacheCarregado = carregarDoCache()

      if (cacheCarregado) {
        setCarregandoInicial(false)
        console.log("⚡ Dados carregados do cache instantaneamente")
      }

      // 2. Atualizar do Supabase em background (sem bloquear a UI)
      setTimeout(() => {
        carregarDados(true) // true = atualização em background
      }, 100)
    }

    carregarInstantaneo()
  }, [])

  const carregarDoCache = () => {
    try {
      const bebidasCache = localStorage.getItem(STORAGE_KEY_BEBIDAS_CACHE)
      const categoriasCache = localStorage.getItem(STORAGE_KEY_CATEGORIAS_CACHE)

      if (bebidasCache && categoriasCache) {
        const dadosBebidasCache = JSON.parse(bebidasCache)
        const dadosCategoriasCache = JSON.parse(categoriasCache)

        // Verificar se o cache expirou
        const agora = Date.now()
        if (dadosBebidasCache.timestamp && agora - dadosBebidasCache.timestamp < CACHE_TIMEOUT) {
          setCategorias(dadosCategoriasCache.data || [])
          setBebidas(dadosBebidasCache.data || [])
          return true
        }
      }
      return false
    } catch (error) {
      console.error("Erro ao carregar cache:", error)
      return false
    }
  }

  const salvarNoCache = (bebidas: any[], categorias: any[]) => {
    try {
      const timestamp = Date.now()
      localStorage.setItem(STORAGE_KEY_BEBIDAS_CACHE, JSON.stringify({ data: bebidas, timestamp }))
      localStorage.setItem(STORAGE_KEY_CATEGORIAS_CACHE, JSON.stringify({ data: categorias, timestamp }))
    } catch (error) {
      console.error("Erro ao salvar cache:", error)
    }
  }

  // 🆕 Carregamento instantâneo com cache + atualização em background
  const carregarDados = async (backgroundUpdate = false) => {
    try {
      if (!backgroundUpdate) {
        setCarregandoInicial(true)
      }

      const [categoriasResult, bebidasResult] = await Promise.allSettled([carregarCategorias(), carregarBebidas()])

      // Carregar pedidos apenas se não for atualização em background
      if (!backgroundUpdate) {
        await carregarPedidos()
      }

      if (!backgroundUpdate) {
        setCarregandoInicial(false)
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      if (!backgroundUpdate) {
        setCarregandoInicial(false)
      }
    }
  }

  // 🆔 GERAR ID ÚNICO SEQUENCIAL - VERSÃO CORRIGIDA PARA EVITAR DUPLICATAS
  const gerarIdUnico = async () => {
    try {
      if (modoTeste) {
        // 🧪 MODO TESTE - Usar timestamp + random para evitar conflitos
        const timestamp = Date.now()
        const random = Math.floor(Math.random() * 10000)
        return `T${timestamp.toString().slice(-8)}${random.toString().padStart(4, "0")}`
      }

      // 🔴 MODO PRODUÇÃO - Usar timestamp + random mais robusto
      const agora = new Date()
      const timestamp = agora.getTime()
      const random = Math.floor(Math.random() * 100000)

      // Formato: YYYYMMDDHHMMSS + 5 dígitos random
      const ano = agora.getFullYear().toString()
      const mes = (agora.getMonth() + 1).toString().padStart(2, "0")
      const dia = agora.getDate().toString().padStart(2, "0")
      const hora = agora.getHours().toString().padStart(2, "0")
      const minuto = agora.getMinutes().toString().padStart(2, "0")
      const segundo = agora.getSeconds().toString().padStart(2, "0")

      const idBase = `${ano}${mes}${dia}${hora}${minuto}${segundo}${random.toString().padStart(5, "0")}`

      // Verificar se este ID já existe (apenas uma verificação simples)
      const { data: existeId, error: erroVerificacao } = await supabase
        .from("pedidos")
        .select("id")
        .eq("id", idBase)
        .limit(1)

      if (erroVerificacao) {
        console.warn("⚠️ Erro ao verificar ID, usando timestamp puro:", erroVerificacao)
        // Fallback: usar apenas timestamp + random maior
        const timestampFallback = Date.now()
        const randomFallback = Math.floor(Math.random() * 1000000)
        return `${timestampFallback}${randomFallback.toString().padStart(6, "0")}`
      }

      // Se o ID não existe, podemos usá-lo
      if (!existeId || existeId.length === 0) {
        return idBase
      }

      // Se existe, adicionar mais aleatoriedade
      const extraRandom = Math.floor(Math.random() * 100000)
      const idFinal = `${idBase}${extraRandom.toString().padStart(6, "0")}`

      console.log("✅ ID único gerado:", idFinal)
      return idFinal
    } catch (error) {
      console.error("❌ Erro crítico ao gerar ID único:", error)
      // Fallback final: timestamp + random muito grande
      const timestamp = Date.now()
      const random = Math.floor(Math.random() * 10000000)
      const idEmergencia = `E${timestamp}${random.toString().padStart(7, "0")}`
      console.log("🚨 Usando ID de emergência:", idEmergencia)
      return idEmergencia
    }
  }

  // 📍 OBTER LOCALIZAÇÃO ATUAL COM MAPA
  const obterLocalizacaoAtual = () => {
    return new Promise<string>((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude
            const lng = position.coords.longitude
            const localizacao = `📍 Localização: https://maps.google.com/?q=${lat},${lng}`
            setLocalizacaoAtual(localizacao)
            console.log("✅ Localização obtida automaticamente:", localizacao)
            resolve(localizacao)
          },
          (error) => {
            console.warn("❌ Erro ao obter localização:", error)
            setLocalizacaoAtual("")
            resolve("") // Continuar sem localização
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 300000,
          },
        )
      } else {
        console.warn("❌ Geolocalização não suportada")
        setLocalizacaoAtual("")
        resolve("")
      }
    })
  }

  const carregarCategorias = async () => {
    try {
      console.log("📂 Carregando categorias do Supabase...")

      const { data, error } = await supabase.from("categorias").select("*").eq("ativo", true)

      if (error) {
        console.error("❌ Erro Supabase:", error)
        console.error("❌ Detalhes:", JSON.stringify(error, null, 2))
        throw error
      }

      const categoriasOrdenadas = (data || []).sort((a, b) => {
        const ordemA = a.ordem || 999
        const ordemB = b.ordem || 999
        return ordemA - ordemB
      })

      console.log("✅ Categorias carregadas:", categoriasOrdenadas?.length || 0)
      setCategorias(categoriasOrdenadas)
      // 🆕 Salvar no cache
      const bebidasAtuais = bebidas.length > 0 ? bebidas : []
      salvarNoCache(bebidasAtuais, categoriasOrdenadas)
    } catch (error) {
      console.error("❌ ERRO CRÍTICO ao carregar categorias:", error)

      // Mostrar erro detalhado para o usuário
      addToast({
        type: "error",
        title: "❌ Erro ao carregar categorias",
        description: error instanceof Error ? error.message : "Erro de conexão com o banco de dados",
      })

      // Usar dados de exemplo como fallback
      console.log("🔄 Usando dados de exemplo como fallback...")
      setCategorias(DADOS_EXEMPLO.categorias)
    }
  }

  const carregarBebidas = async () => {
    try {
      console.log("🍻 Carregando bebidas do Supabase...")

      const { data: bebidasData, error: bebidasError } = await supabase
        .from("bebidas")
        .select("*")
        .eq("ativo", true)
        .order("nome")

      if (bebidasError) {
        console.error("❌ Erro Supabase:", bebidasError)
        console.error("❌ Detalhes:", JSON.stringify(bebidasError, null, 2))
        throw bebidasError
      }

      const bebidasComCategorias = (bebidasData || []).map((bebida) => {
        const categoria = categorias.find((c) => c.id === bebida.categoria_id)
        return {
          ...bebida,
          categoria: categoria || null,
        }
      })

      console.log("✅ Bebidas carregadas:", bebidasComCategorias.length)
      setBebidas(bebidasComCategorias)
      // 🆕 Salvar no cache
      salvarNoCache(bebidasComCategorias, categorias)
    } catch (error) {
      console.error("❌ ERRO CRÍTICO ao carregar bebidas:", error)

      addToast({
        type: "error",
        title: "❌ Erro ao carregar bebidas",
        description: error instanceof Error ? error.message : "Erro de conexão com o banco de dados",
      })

      // Usar dados de exemplo como fallback
      console.log("🔄 Usando dados de exemplo como fallback...")
      setBebidas(DADOS_EXEMPLO.bebidas)
    }
  }

  const carregarPedidos = async () => {
    try {
      console.log("📋 Carregando pedidos...")

      const { data, error } = await supabase
        .from("pedidos")
        .select("id, created_at, total, status")
        .order("created_at", { ascending: false })
        .limit(20)

      if (error) {
        console.error("❌ Erro ao carregar pedidos:", error.message)
        setPedidos([])
        return
      }

      const pedidosFormatados = (data || []).map((pedido) => ({
        id: pedido.id,
        data: new Date(pedido.created_at).toLocaleString("pt-BR"),
        itens: [],
        total: pedido.total,
        formaPagamento: "",
        valorPago: 0,
        troco: 0,
        cliente: "",
        tipoEntrega: "",
        enderecoEntrega: "",
        status: pedido.status || "enviado",
      }))

      setPedidos(pedidosFormatados)
      console.log(`✅ ${pedidosFormatados.length} pedidos carregados`)
    } catch (error: any) {
      console.error("❌ Erro crítico ao carregar pedidos:", error?.message || error)
      setPedidos([])
    }
  }

  const getQuantidadeSelecionada = (bebidaId: number) => {
    return quantidadesSelecionadas[bebidaId] || 1
  }

  const setQuantidadeSelecionada = (bebidaId: number, quantidade: number) => {
    setQuantidadesSelecionadas((prev) => ({
      ...prev,
      [bebidaId]: quantidade,
    }))
  }

  const adicionarAoCarrinho = (bebida: Bebida, quantidade = 1) => {
    if (bebida.estoque === 0) {
      addToast({
        type: "error",
        title: "Produto esgotado!",
        description: "Este item não está mais disponível no estoque.",
      })
      return
    }

    if (quantidade > bebida.estoque) {
      addToast({
        type: "warning",
        title: "Estoque insuficiente!",
        description: `Disponível: ${bebida.estoque} unidades`,
      })
      return
    }

    setCarrinho((prev) => {
      const itemExistente = prev.find((item) => item.bebida.id === bebida.id)
      if (itemExistente) {
        const novaQuantidade = itemExistente.quantidade + quantidade
        if (novaQuantidade <= bebida.estoque) {
          return prev.map((item) => (item.bebida.id === bebida.id ? { ...item, quantidade: novaQuantidade } : item))
        } else {
          addToast({
            type: "warning",
            title: "Estoque insuficiente!",
            description: `Disponível: ${bebida.estoque} unidades`,
          })
          return prev
        }
      }
      return [...prev, { bebida, quantidade }]
    })

    addToast({
      type: "success",
      title: "Adicionado ao carrinho!",
      description: `${quantidade}x ${bebida.nome}`,
    })
  }

  const removerDoCarrinho = (bebidaId: number) => {
    setCarrinho((prev) => {
      const itemExistente = prev.find((item) => item.bebida.id === bebidaId)
      if (itemExistente && itemExistente.quantidade > 1) {
        return prev.map((item) => (item.bebida.id === bebidaId ? { ...item, quantidade: item.quantidade - 1 } : item))
      }
      return prev.filter((item) => item.bebida.id !== bebidaId)
    })
  }

  const totalCarrinho = carrinho.reduce((total, item) => {
    return total + item.bebida.preco * item.quantidade
  }, 0)

  const subtotalItens = carrinho.reduce((total, item) => {
    return total + item.bebida.preco * item.quantidade
  }, 0)

  const totalItens = carrinho.reduce((total, item) => total + item.quantidade, 0)

  const calcularTroco = () => {
    if (formaPagamento === "dinheiro" && valorPago) {
      const valor = Number.parseFloat(valorPago)
      const totalComTaxa = totalCarrinho + (tipoEntrega === "entrega" ? TAXA_ENTREGA : 0)
      return valor - totalComTaxa
    }
    return 0
  }

  const finalizarPedido = async () => {
    console.log("🔄 Iniciando finalização do pedido...")

    // Verificar se a loja está aberta
    if (!lojaAberta) {
      addToast({
        type: "error",
        title: "🏪 Loja Fechada!",
        description: "Desculpe, não estamos aceitando pedidos no momento.",
      })
      return
    }

    // Validações
    if (carrinho.length === 0) {
      addToast({
        type: "error",
        title: "Carrinho vazio!",
        description: "Adicione alguns itens antes de finalizar o pedido.",
      })
      return
    }

    const nomeClientePadrao = "Cliente"

    const totalComTaxa = totalCarrinho + (tipoEntrega === "entrega" ? TAXA_ENTREGA : 0)
    if (formaPagamento === "dinheiro" && (!valorPago || Number.parseFloat(valorPago) < totalComTaxa)) {
      addToast({
        type: "error",
        title: "Valor pago insuficiente!",
        description: "O valor pago deve ser maior ou igual ao total do pedido.",
      })
      return
    }

    try {
      setCarregando(true)

      // Obter localização APENAS se for entrega E tiver endereço preenchido
      let localizacaoFinal = ""
      if (tipoEntrega === "entrega" && enderecoEntrega.trim()) {
        try {
          localizacaoFinal = await obterLocalizacaoAtual()
          addToast({
            type: "info",
            title: "📍 Localização capturada!",
            description: "Sua localização será enviada junto com o pedido",
          })
        } catch (error) {
          console.warn("⚠️ Não foi possível obter localização, continuando sem ela")
          localizacaoFinal = ""
        }
      }

      // Gerar ID único sequencial - VERSÃO CORRIGIDA
      const idUnico = await gerarIdUnico()

      const novoPedido: Pedido = {
        id: idUnico,
        data: new Date().toLocaleString("pt-BR"),
        itens: [...carrinho],
        total: totalComTaxa,
        formaPagamento,
        valorPago: formaPagamento === "dinheiro" ? Number.parseFloat(valorPago) : undefined,
        troco: formaPagamento === "dinheiro" ? calcularTroco() : undefined,
        cliente: nomeClientePadrao,
        tipoEntrega,
        enderecoEntrega: tipoEntrega === "entrega" ? enderecoEntrega : undefined,
        localizacao: localizacaoFinal || undefined,
        status: "enviado",
      }

      console.log("📋 Dados do pedido:", novoPedido)

      if (!modoTeste) {
        // 🔴 MODO PRODUÇÃO - Salvar no banco real
        console.log("💾 Salvando pedido no banco...")

        const dadosParaInserir: any = {
          id: novoPedido.id,
          cliente: novoPedido.cliente,
          total: novoPedido.total,
          forma_pagamento: novoPedido.formaPagamento,
          itens: novoPedido.itens,
          tipo_entrega: novoPedido.tipoEntrega,
          status: novoPedido.status,
        }

        if (novoPedido.valorPago !== undefined) {
          dadosParaInserir.valor_pago = novoPedido.valorPago
        }
        if (novoPedido.troco !== undefined) {
          dadosParaInserir.troco = novoPedido.troco
        }
        if (novoPedido.enderecoEntrega) {
          dadosParaInserir.endereco_entrega = novoPedido.enderecoEntrega
        }
        if (novoPedido.localizacao) {
          dadosParaInserir.localizacao = novoPedido.localizacao
        }

        const { error } = await supabase.from("pedidos").insert([dadosParaInserir])

        if (error) {
          console.error("❌ Erro ao inserir pedido:", error)
          throw new Error(`Erro ao salvar pedido: ${error.message}`)
        }

        console.log("✅ Pedido inserido com sucesso:", novoPedido.id)

        // Atualizar estoque
        console.log("📦 Atualizando estoque...")
        for (const item of carrinho) {
          const novoEstoque = Math.max(0, item.bebida.estoque - item.quantidade)
          const { error: estoqueError } = await supabase
            .from("bebidas")
            .update({ estoque: novoEstoque })
            .eq("id", item.bebida.id)

          if (estoqueError) {
            console.error("❌ Erro ao atualizar estoque:", estoqueError)
          }
        }

        await carregarBebidas()
      } else {
        // 🧪 MODO TESTE - Apenas simular
        console.log("🧪 MODO TESTE - Pedido simulado (não salvo no banco)")
        addToast({
          type: "info",
          title: "🧪 MODO TESTE ATIVO",
          description: "Pedido criado apenas para demonstração!",
        })
      }

      setPedidos((prev) => [novoPedido, ...prev])
      setPedidoAtual(novoPedido)

      // ⚡ COMPORTAMENTO AUTOMÁTICO PARA TODOS OS DISPOSITIVOS
      setTimeout(async () => {
        await compartilharComprovanteAutomatico(novoPedido)
        setTelaAtual("comprovante")
      }, 300)

      console.log("✅ Pedido finalizado com sucesso:", novoPedido.id)
    } catch (error) {
      console.error("❌ Erro ao finalizar pedido:", error)
      addToast({
        type: "error",
        title: "Erro ao finalizar pedido",
        description: error instanceof Error ? error.message : "Erro desconhecido",
      })
    } finally {
      setCarregando(false)
    }
  }

  const compartilharComprovante = async () => {
    if (!pedidoAtual) return

    const isIOS = detectarIOS()

    if (isIOS) {
      addToast({
        type: "info",
        title: "📱 Abrindo WhatsApp...",
        description: "Se não abrir automaticamente, copie e cole a mensagem",
        duration: 3000,
      })
    }

    try {
      let mensagem = `🍻 *PEDIDO BEBIDAS ON* 🍻
`
      mensagem += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`
      mensagem += `📋 *Pedido:* #${pedidoAtual.id}
`
      mensagem += `📅 *Data:* ${pedidoAtual.data}
`

      if (modoTeste) {
        mensagem += `🧪 *MODO TESTE ATIVO*
`
      }

      if (pedidoAtual.tipoEntrega === "entrega") {
        mensagem += `🚚 *Tipo:* ENTREGA
`
        mensagem += `📍 *Endereço:* ${pedidoAtual.enderecoEntrega}
`
        if (pedidoAtual.localizacao) {
          mensagem += `
${pedidoAtual.localizacao}
`
        }
      } else {
        mensagem += `🏪 *Tipo:* RETIRADA NO LOCAL
`
        mensagem += `📍 *Local:* Rua Amazonas 239 - Paraíso/SP
`
        mensagem += `
`
      }

      mensagem += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`
      mensagem += `🛒 *ITENS DO PEDIDO:*
`

      pedidoAtual.itens.forEach((item, index) => {
        mensagem += `${index + 1}. ${item.quantidade}x ${item.bebida.nome}
`
        mensagem += `   💰 R$ ${item.bebida.preco.toFixed(2)} cada
`
        mensagem += `   📊 Subtotal: R$ ${(item.bebida.preco * item.quantidade).toFixed(2)}

`
      })

      mensagem += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`
      mensagem += `💵 *RESUMO FINANCEIRO:*
`
      mensagem += `🛍️ Subtotal dos itens: R$ ${subtotalItens.toFixed(2)}
`

      if (pedidoAtual.tipoEntrega === "entrega") {
        mensagem += `🚚 Taxa de entrega: R$ ${TAXA_ENTREGA.toFixed(2)}
`
      } else {
        mensagem += `🏪 Retirada no local: R$ 0,00
`
      }

      mensagem += `💰 *TOTAL FINAL: R$ ${pedidoAtual.total.toFixed(2)}*

`
      mensagem += `💳 *PAGAMENTO:* ${pedidoAtual.formaPagamento.toUpperCase()}
`

      if (pedidoAtual.formaPagamento === "dinheiro") {
        mensagem += `💵 Valor pago: R$ ${pedidoAtual.valorPago?.toFixed(2)}
`
        if (pedidoAtual.troco && pedidoAtual.troco > 0) {
          mensagem += `🔄 Troco: R$ ${pedidoAtual.troco.toFixed(2)}
`
        } else {
          mensagem += `✅ Não precisa de troco
`
        }
      }

      mensagem += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`
      mensagem += `📞 *BEBIDAS ON* - ${TELEFONE_DISPLAY}
`
      mensagem += `🏠 Rua Amazonas 239 - Paraíso/SP
`

      if (pedidoAtual.tipoEntrega === "entrega") {
        mensagem += `⏰ Aguardando confirmação para entrega!
`
        mensagem += `🚚 Delivery rápido e gelado! 🧊`
      } else {
        mensagem += `⏰ Aguardando confirmação para retirada!
`
        mensagem += `🏪 Retire no balcão! 🧊`
      }

      const whatsappUrl = `https://wa.me/${TELEFONE_WHATSAPP}?text=${encodeURIComponent(mensagem)}`
      window.open(whatsappUrl, "_blank")

      if (isIOS) {
        setTimeout(() => {
          addToast({
            type: "success",
            title: "✅ Mensagem preparada!",
            description: "WhatsApp deve ter aberto com seu pedido",
            duration: 3000,
          })
        }, 1500)
      }

      setTimeout(() => {
        setCarrinho([])
        setEnderecoEntrega("")
        setValorPago("")
        setFormaPagamento("pix")
        setTipoEntrega("retirada")
        setPedidoAtual(null)
        setTelaAtual("inicio")
      }, 2000)
    } catch (error) {
      console.error("Erro ao compartilhar:", error)
      addToast({
        type: "error",
        title: "Erro ao compartilhar",
        description: isIOS
          ? "Tente abrir o WhatsApp manualmente e colar a mensagem"
          : "Ocorreu um erro ao tentar compartilhar o comprovante.",
      })
    }
  }

  const compartilharComprovanteAutomatico = async (pedido: Pedido) => {
    try {
      let mensagem = `🍻 *PEDIDO BEBIDAS ON* 🍻
`
      mensagem += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`
      mensagem += `📋 *Pedido:* #${pedido.id}
`
      mensagem += `📅 *Data:* ${pedido.data}
`

      if (modoTeste) {
        mensagem += `🧪 *MODO TESTE ATIVO*
`
      }

      if (pedido.tipoEntrega === "entrega") {
        mensagem += `🚚 *Tipo:* ENTREGA
`
        mensagem += `📍 *Endereço:* ${pedido.enderecoEntrega}
`
        if (pedido.localizacao) {
          mensagem += `
${pedido.localizacao}
`
        }
      } else {
        mensagem += `🏪 *Tipo:* RETIRADA NO LOCAL
`
        mensagem += `📍 *Local:* Rua Amazonas 239 - Paraíso/SP
`
      }

      mensagem += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`
      mensagem += `🛒 *ITENS DO PEDIDO:*
`

      pedido.itens.forEach((item, index) => {
        mensagem += `${index + 1}. ${item.quantidade}x ${item.bebida.nome}
`
        mensagem += `   💰 R$ ${item.bebida.preco.toFixed(2)} cada
`
        mensagem += `   📊 Subtotal: R$ ${(item.bebida.preco * item.quantidade).toFixed(2)}

`
      })

      mensagem += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`
      mensagem += `💵 *RESUMO FINANCEIRO:*
`
      mensagem += `🛍️ Subtotal dos itens: R$ ${subtotalItens.toFixed(2)}
`

      if (pedido.tipoEntrega === "entrega") {
        mensagem += `🚚 Taxa de entrega: R$ ${TAXA_ENTREGA.toFixed(2)}
`
      } else {
        mensagem += `🏪 Retirada no local: R$ 0,00
`
      }

      mensagem += `💰 *TOTAL FINAL: R$ ${pedido.total.toFixed(2)}*

`
      mensagem += `💳 *PAGAMENTO:* ${pedido.formaPagamento.toUpperCase()}
`

      if (pedido.formaPagamento === "dinheiro") {
        mensagem += `💵 Valor pago: R$ ${pedido.valorPago?.toFixed(2)}
`
        if (pedido.troco && pedido.troco > 0) {
          mensagem += `🔄 Troco: R$ ${pedido.troco.toFixed(2)}
`
        } else {
          mensagem += `✅ Não precisa de troco
`
        }
      }

      mensagem += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`
      mensagem += `📞 *BEBIDAS ON* - ${TELEFONE_DISPLAY}
`
      mensagem += `🏠 Rua Amazonas 239 - Paraíso/SP
`

      if (pedido.tipoEntrega === "entrega") {
        mensagem += `⏰ Aguardando confirmação para entrega!
`
        mensagem += `🚚 Delivery rápido e gelado! 🧊`
      } else {
        mensagem += `⏰ Aguardando confirmação para retirada!
`
        mensagem += `🏪 Retire no balcão! 🧊`
      }

      try {
        const whatsappUrl = `https://wa.me/${TELEFONE_WHATSAPP}?text=${encodeURIComponent(mensagem)}`
        window.location.href = whatsappUrl
        console.log("✅ Método location.href executado")

        setTimeout(() => {
          const popup = window.open(whatsappUrl, "_blank", "noopener,noreferrer")
          if (popup) {
            popup.focus()
          }
          console.log("✅ Método window.open executado")
        }, 50)

        setTimeout(() => {
          const link = document.createElement("a")
          link.href = whatsappUrl
          link.target = "_blank"
          link.rel = "noopener noreferrer"
          link.style.position = "absolute"
          link.style.left = "-9999px"
          document.body.appendChild(link)

          const touchStart = new TouchEvent("touchstart", { bubbles: true })
          const touchEnd = new TouchEvent("touchend", { bubbles: true })
          const click = new MouseEvent("click", { bubbles: true })

          link.dispatchEvent(touchStart)
          link.dispatchEvent(touchEnd)
          link.dispatchEvent(click)
          link.click()
          setTimeout(() => document.body.removeChild(link), 100)
          console.log("✅ Método link com eventos de toque executado")
        }, 100)
      } catch (error) {
        console.error("❌ Erro nos métodos automáticos:", error)
        window.open(`https://wa.me/${TELEFONE_WHATSAPP}?text=${encodeURIComponent(mensagem)}`, "_blank")
      }

      addToast({
        type: "success",
        title: "🚀 WhatsApp abrindo automaticamente!",
        description: "Seu pedido está sendo enviado...",
        duration: 2000,
      })

      setTimeout(() => {
        setCarrinho([])
        setEnderecoEntrega("")
        setValorPago("")
        setFormaPagamento("pix")
        setTipoEntrega("retirada")
      }, 2000)
    } catch (error) {
      console.error("Erro no compartilhamento automático:", error)
      addToast({
        type: "warning",
        title: "Erro no envio automático",
        description: "Use o botão 'Enviar para WhatsApp' manualmente",
      })
    }
  }

  const salvarComprovante = async () => {
    if (!comprovanteRef.current) return

    try {
      setCapturandoImagem(true)
      const html2canvas = (await import("html2canvas")).default

      const canvas = await html2canvas(comprovanteRef.current, {
        backgroundColor: "#1f2937",
        scale: 2,
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: true,
      })

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const link = document.createElement("a")
          link.href = url
          link.download = `comprovante-${pedidoAtual?.id || "venda"}.png`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
          addToast({
            type: "success",
            title: "Comprovante salvo!",
            description: "O comprovante foi salvo com sucesso na sua galeria.",
          })
        }
      }, "image/png")
    } catch (error) {
      console.error("Erro ao salvar comprovante:", error)
      addToast({
        type: "error",
        title: "Erro ao salvar comprovante",
        description: "Ocorreu um erro ao tentar salvar o comprovante.",
      })
    } finally {
      setCapturandoImagem(false)
    }
  }

  const bebidasFiltradas = bebidas.filter((bebida) => {
    const matchCategoria = categoriaFiltro === "todas" || bebida.categoria_id === categoriaFiltro
    const matchBusca =
      bebida.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (bebida.descricao && bebida.descricao.toLowerCase().includes(busca.toLowerCase()))
    return matchCategoria && matchBusca
  })

  const getStatusEstoque = (estoque: number) => {
    if (estoque === 0) return { cor: "bg-red-500", texto: "Esgotado" }
    if (estoque <= 5) return { cor: "bg-yellow-500", texto: `Restam ${estoque}` }
    return { cor: "bg-green-500", texto: "Disponível" }
  }

  const getCorCategoria = (cor: string) => {
    return CORES_CATEGORIAS.find((c) => c.valor === cor) || CORES_CATEGORIAS[0]
  }

  const getIconeCategoria = (icone: string) => {
    const iconeEncontrado = ICONES_CATEGORIAS.find((i) => i.valor === icone)
    return iconeEncontrado?.icone || Package
  }

  const adicionarNovaCategoria = async () => {
    if (!novaCategoria.nome.trim()) {
      addToast({
        type: "error",
        title: "Nome da categoria ausente!",
        description: "Por favor, digite o nome da categoria.",
      })
      return
    }

    if (modoTeste) {
      const novaCategoriaTeste: Categoria = {
        id: Date.now(),
        nome: novaCategoria.nome,
        icone: novaCategoria.icone,
        cor: novaCategoria.cor,
        ativo: true,
        descricao: novaCategoria.descricao,
        ordem: categorias.length + 1,
      }
      setCategorias((prev) => [...prev, novaCategoriaTeste])
      setNovaCategoria({ nome: "", icone: "package", cor: "amber", descricao: "" })
      addToast({
        type: "info",
        title: "🧪 TESTE: Categoria criada localmente!",
        description: "Esta categoria não será salva no banco de dados real.",
      })
      return
    }

    try {
      setCarregando(true)
      const { data, error } = await supabase
        .from("categorias")
        .insert([
          {
            nome: novaCategoria.nome,
            icone: novaCategoria.icone,
            cor: novaCategoria.cor,
            ativo: true,
            descricao: novaCategoria.descricao,
            ordem: categorias.length + 1, // Define a ordem
          },
        ])
        .select()

      if (error) {
        console.error("❌ Erro ao criar categoria:", error)
        addToast({
          type: "error",
          title: "Erro ao criar categoria",
          description: error.message,
        })
        return
      }

      setNovaCategoria({ nome: "", icone: "package", cor: "amber", descricao: "" })
      await carregarCategorias()
      addToast({
        type: "success",
        title: "Categoria criada!",
        description: "A categoria foi criada com sucesso.",
      })
    } catch (error) {
      console.error("❌ Erro ao criar categoria:", error)
      addToast({
        type: "error",
        title: "Erro ao criar categoria",
        description: "Ocorreu um erro ao criar a categoria.",
      })
    } finally {
      setCarregando(false)
    }
  }

  const adicionarNovaBebida = async () => {
    if (!novoItem.nome || !novoItem.preco || !novoItem.categoria_id) {
      addToast({
        type: "error",
        title: "Campos obrigatórios ausentes!",
        description: "Preencha todos os campos obrigatórios para adicionar a bebida.",
      })
      return
    }

    if (modoTeste) {
      const novaBebidaTeste: Bebida = {
        id: Date.now(),
        nome: novoItem.nome,
        descricao: novoItem.descricao,
        preco: Number.parseFloat(novoItem.preco),
        categoria_id: Number.parseInt(novoItem.categoria_id),
        categoria: categorias.find((c) => c.id === Number.parseInt(novoItem.categoria_id)),
        imagem: novoItem.imagem || "/placeholder.svg?height=200&width=300&text=Bebida+Teste",
        estoque: Number.parseInt(novoItem.estoque) || 0,
        ativo: true,
      }
      setBebidas((prev) => [...prev, novaBebidaTeste])
      setNovoItem({ nome: "", descricao: "", preco: "", categoria_id: "", estoque: "", imagem: "" })
      addToast({
        type: "info",
        title: "🧪 TESTE: Bebida criada localmente!",
        description: "Esta bebida não será salva no banco de dados real.",
      })
      return
    }

    try {
      setCarregando(true)
      const { data, error } = await supabase
        .from("bebidas")
        .insert([
          {
            nome: novoItem.nome,
            descricao: novoItem.descricao,
            preco: Number.parseFloat(novoItem.preco),
            categoria_id: Number.parseInt(novoItem.categoria_id),
            imagem: novoItem.imagem || "/placeholder.svg?height=200&width=300&text=Bebida",
            estoque: Number.parseInt(novoItem.estoque) || 0,
            ativo: true,
          },
        ])
        .select()

      if (error) {
        console.error("❌ Erro ao criar bebida:", error)
        addToast({
          type: "error",
          title: "Erro ao criar bebida",
          description: error.message,
        })
        return
      }

      setNovoItem({ nome: "", descricao: "", preco: "", categoria_id: "", estoque: "", imagem: "" })
      await carregarBebidas()
      addToast({
        type: "success",
        title: "Bebida adicionada!",
        description: "A bebida foi adicionada com sucesso ao cardápio.",
      })
    } catch (error) {
      console.error("❌ Erro ao criar bebida:", error)
      addToast({
        type: "error",
        title: "Erro ao criar bebida",
        description: "Ocorreu um erro ao adicionar a bebida.",
      })
    } finally {
      setCarregando(false)
    }
  }

  const excluirBebida = async (id: number) => {
    const bebida = bebidas.find((b) => b.id === id)
    if (bebida && confirm(`❌ Tem certeza que deseja excluir "${bebida.nome}"?`)) {
      if (modoTeste) {
        setBebidas((prev) => prev.filter((b) => b.id !== id))
        addToast({
          type: "info",
          title: "🧪 TESTE: Bebida removida localmente!",
          description: "Esta bebida não será excluída do banco de dados real.",
        })
        return
      }

      try {
        const { error } = await supabase.from("bebidas").delete().eq("id", id)
        if (error) {
          addToast({
            type: "error",
            title: "Erro ao excluir bebida",
            description: error.message,
          })
          return
        }
        await carregarBebidas()
        addToast({
          type: "success",
          title: "Bebida excluída!",
          description: "A bebida foi excluída com sucesso do cardápio.",
        })
      } catch (error) {
        addToast({
          type: "error",
          title: "Erro ao excluir bebida",
          description: "Ocorreu um erro ao excluir a bebida.",
        })
      }
    }
  }

  const atualizarEstoque = async (id: number, novoEstoque: number) => {
    if (modoTeste) {
      setBebidas((prev) => prev.map((b) => (b.id === id ? { ...b, estoque: novoEstoque } : b)))
      return
    }

    try {
      const { error } = await supabase.from("bebidas").update({ estoque: novoEstoque }).eq("id", id)
      if (error) {
        addToast({
          type: "error",
          title: "Erro ao atualizar estoque",
          description: error.message,
        })
        return
      }
      await carregarBebidas()
    } catch (error) {
      addToast({
        type: "error",
        title: "Erro ao atualizar estoque",
        description: "Ocorreu um erro ao atualizar o estoque.",
      })
    }
  }

  // 🔐 ACESSO ADMIN - CORRIGIDO COM MODO TESTE SECRETO
  const acessoAdmin = () => {
    setModalSenhaAberto(true)
    setSenhaInput("")
  }

  const processarSenha = async () => {
    if (!senhaInput.trim()) return

    setSenhaCarregando(true)

    // Simular um pequeno delay para a animação
    await new Promise((resolve) => setTimeout(resolve, 500))

    if (senhaInput === "admin123") {
      console.log("✅ Acesso admin cliente autorizado")
      setTelaAtual("admin")
      setAcessoDesenvolvedor(false) // ❌ Cliente NÃO tem acesso ao backup
      setModalSenhaAberto(false)
      addToast({
        type: "success",
        title: "✅ Acesso autorizado!",
        description: "Bem-vindo ao painel administrativo.",
      })
    } else if (senhaInput === "GVAdmin!1530") {
      console.log("🔧 Acesso desenvolvedor autorizado")
      setTelaAtual("admin")
      setAcessoDesenvolvedor(true) // ✅ Desenvolvedor TEM acesso ao backup
      setModalSenhaAberto(false)
      addToast({
        type: "success",
        title: "🔧 Acesso Desenvolvedor!",
        description: "Bem-vindo ao painel administrativo completo.",
      })
    } else if (senhaInput === "teste123") {
      console.log("🧪 Modo teste ativado")
      setModoTeste(true)
      setModalSenhaAberto(false)
      addToast({
        type: "info",
        title: "🧪 Modo demonstração ativado!",
        description: "Agora você está no modo de demonstração com dados fictícios.",
      })
    } else if (senhaInput === "producao123") {
      console.log("🔴 Modo produção ativado")
      setModoTeste(false)
      setModalSenhaAberto(false)
      addToast({
        type: "success",
        title: "🔴 Modo produção ativado!",
        description: "Voltando aos dados reais do banco.",
      })
      carregarDados()
    } else {
      addToast({
        type: "error",
        title: "Senha incorreta!",
        description: "A senha digitada está incorreta.",
      })
    }

    setSenhaCarregando(false)
    setSenhaInput("")
  }

  const fecharModalSenha = () => {
    setModalSenhaAberto(false)
    setSenhaInput("")
    setSenhaCarregando(false)
  }

  const excluirCategoria = async (id: number) => {
    const categoria = categorias.find((c) => c.id === id)
    if (categoria && confirm(`❌ Tem certeza que deseja excluir "${categoria.nome}"?`)) {
      if (modoTeste) {
        setCategorias((prev) => prev.filter((c) => c.id !== id))
        addToast({
          type: "info",
          title: "🧪 TESTE: Categoria removida localmente!",
          description: "Esta categoria não será excluída do banco de dados real.",
        })
        return
      }

      try {
        const { error } = await supabase.from("categorias").delete().eq("id", id)
        if (error) {
          addToast({
            type: "error",
            title: "Erro ao excluir categoria",
            description: error.message,
          })
          return
        }
        await carregarCategorias()
        addToast({
          type: "success",
          title: "Categoria excluída!",
          description: "A categoria foi excluída com sucesso.",
        })
      } catch (error) {
        addToast({
          type: "error",
          title: "Erro ao excluir categoria",
          description: "Ocorreu um erro ao excluir a categoria.",
        })
      }
    }
  }

  const editarBebida = async () => {
    console.log("🔧 Editando bebida:", editandoItem)
    if (
      !editandoItem ||
      !editandoItem.nome.trim() ||
      !editandoItem.preco ||
      editandoItem.preco <= 0 ||
      !editandoItem.categoria_id
    ) {
      addToast({
        type: "error",
        title: "Campos obrigatórios ausentes!",
        description: "Preencha todos os campos obrigatórios para editar a bebida.",
      })
      return
    }

    if (modoTeste) {
      setBebidas((prev) =>
        prev.map((b) =>
          b.id === editandoItem.id
            ? {
                ...editandoItem,
                categoria: categorias.find((c) => c.id === editandoItem.categoria_id),
              }
            : b,
        ),
      )
      setEditandoItem(null)
      addToast({
        type: "info",
        title: "🧪 TESTE: Bebida editada localmente!",
        description: "As alterações não serão salvas no banco de dados real.",
      })
      return
    }

    try {
      setCarregando(true)
      const { error } = await supabase
        .from("bebidas")
        .update({
          nome: editandoItem.nome,
          descricao: editandoItem.descricao,
          preco: editandoItem.preco,
          categoria_id: editandoItem.categoria_id,
          imagem: editandoItem.imagem,
          estoque: editandoItem.estoque,
        })
        .eq("id", editandoItem.id)

      if (error) {
        addToast({
          type: "error",
          title: "Erro ao editar bebida",
          description: error.message,
        })
        return
      }

      setEditandoItem(null)
      await carregarBebidas()
      addToast({
        type: "success",
        title: "Bebida editada!",
        description: "A bebida foi editada com sucesso.",
      })
    } catch (error) {
      addToast({
        type: "error",
        title: "Erro ao editar bebida",
        description: "Ocorreu um erro ao editar a bebida.",
      })
    } finally {
      setCarregando(false)
    }
  }

  const editarCategoria = async () => {
    console.log("🔧 Editando categoria:", editandoCategoria)
    if (!editandoCategoria || !editandoCategoria.nome.trim()) {
      addToast({
        type: "error",
        title: "Nome da categoria ausente!",
        description: "Por favor, digite o nome da categoria.",
      })
      return
    }

    if (modoTeste) {
      setCategorias((prev) => prev.map((c) => (c.id === editandoCategoria.id ? editandoCategoria : c)))
      setEditandoCategoria(null)
      addToast({
        type: "info",
        title: "🧪 TESTE: Categoria editada localmente!",
        description: "As alterações não serão salvas no banco de dados real.",
      })
      return
    }

    try {
      setCarregando(true)
      const { error } = await supabase
        .from("categorias")
        .update({
          nome: editandoCategoria.nome,
          icone: editandoCategoria.icone,
          cor: editandoCategoria.cor,
          descricao: editandoCategoria.descricao,
        })
        .eq("id", editandoCategoria.id)

      if (error) {
        addToast({
          type: "error",
          title: "Erro ao editar categoria",
          description: error.message,
        })
        return
      }

      setEditandoCategoria(null)
      await carregarCategorias()

      addToast({
        type: "success",
        title: "Categoria editada!",
        description: "A categoria foi editada com sucesso.",
      })
    } catch (error) {
      addToast({
        type: "error",
        title: "Erro ao editar categoria",
        description: "Ocorreu um erro ao editar a categoria.",
      })
    } finally {
      setCarregando(false)
    }
  }

  const alternarStatusLoja = async () => {
    const novoStatus = !lojaAberta
    console.log(
      `🏪 Alterando status da loja: ${lojaAberta ? "ABERTA" : "FECHADA"} → ${novoStatus ? "ABERTA" : "FECHADA"}`,
    )

    try {
      setCarregando(true)

      // Atualizar o estado PRIMEIRO para feedback imediato
      setLojaAberta(novoStatus)

      // Salvar no localStorage de forma síncrona
      try {
        localStorage.setItem(STORAGE_KEY_LOJA_STATUS, JSON.stringify(novoStatus))
        console.log(`💾 Status salvo no localStorage: ${novoStatus ? "ABERTA" : "FECHADA"}`)
      } catch (error) {
        console.error("❌ Erro ao salvar no localStorage:", error)
      }

      // Mostrar toast de confirmação
      addToast({
        type: novoStatus ? "success" : "warning",
        title: `🏪 Loja ${novoStatus ? "ABERTA" : "FECHADA"}!`,
        description: novoStatus
          ? "✅ Clientes podem fazer pedidos normalmente"
          : "⏸️ Pedidos foram pausados temporariamente",
        duration: 3000,
      })

      console.log(`✅ Status da loja alterado com sucesso para: ${novoStatus ? "ABERTA" : "FECHADA"}`)
    } catch (error) {
      console.error("❌ Erro ao alterar status da loja:", error)
      addToast({
        type: "error",
        title: "❌ Erro ao alterar status",
        description: "Não foi possível alterar o status da loja. Tente novamente.",
      })
    } finally {
      setCarregando(false)
    }
  }

  // 🧹 LIMPEZA AUTOMÁTICA DO BANCO DE DADOS (SILENCIOSA)
  const limparBancoDadosAutomatico = async () => {
    try {
      console.log("🧹 Iniciando limpeza automática semanal...")

      // Manter apenas os últimos 50 pedidos
      const { data: todosPedidos, error: erroPedidos } = await supabase
        .from("pedidos")
        .select("id, created_at")
        .order("created_at", { ascending: false })

      if (erroPedidos) throw erroPedidos

      if (todosPedidos && todosPedidos.length > 50) {
        // Identificar pedidos para excluir (manter os 50 mais recentes)
        const pedidosParaExcluir = todosPedidos.slice(50)
        const idsParaExcluir = pedidosParaExcluir.map((p) => p.id)

        // Excluir pedidos antigos
        const { error: erroExclusao } = await supabase.from("pedidos").delete().in("id", idsParaExcluir)

        if (erroExclusao) throw erroExclusao

        console.log(`✅ Limpeza automática concluída: ${pedidosParaExcluir.length} pedidos antigos removidos`)

        // Recarregar pedidos silenciosamente
        await carregarPedidos()
      } else {
        console.log("ℹ️ Limpeza automática: Nada para limpar")
      }
    } catch (error) {
      console.error("❌ Erro na limpeza automática:", error)
    }
  }

  // handleImageUpload duplicada, mantendo a mais recente
  // const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEditing = false) => { ... }

  // Recarregar dados quando mudar o modo
  useEffect(() => {
    carregarDados()
  }, [modoTeste])

  const produtosFiltrados = bebidas.filter(
    (bebida) =>
      bebida.nome.toLowerCase().includes(buscaProdutos.toLowerCase()) ||
      (bebida.descricao && bebida.descricao.toLowerCase().includes(buscaProdutos.toLowerCase())),
  )

  const filtrarPedidosPorData = (pedidos: Pedido[]) => {
    if (filtroData === "todos") return pedidos

    const agora = new Date()
    const dataLimite = new Date()

    switch (filtroData) {
      case "semana":
        dataLimite.setDate(agora.getDate() - 7)
        break
      case "mes":
        dataLimite.setMonth(agora.getMonth() - 1)
        break
      case "ano":
        dataLimite.setFullYear(agora.getFullYear() - 1)
        break
    }

    return pedidos.filter((pedido) => {
      const dataPedido = new Date(pedido.data.split(", ")[0].split("/").reverse().join("-"))
      return dataPedido >= dataLimite
    })
  }

  const pedidosFiltrados = filtrarPedidosPorData(pedidos)

  // 🏪 VERIFICAR STATUS DA LOJA EM TEMPO REAL
  useEffect(() => {
    const verificarStatusLoja = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_LOJA_STATUS)
        if (saved !== null) {
          const status = JSON.parse(saved)
          if (status !== lojaAberta) {
            console.log(`🔄 Status da loja atualizado: ${status ? "ABERTA" : "FECHADA"}`)
            setLojaAberta(status)
          }
        }
      } catch (error) {
        console.error("❌ Erro ao verificar status da loja:", error)
      }
    }

    // Verificar a cada 2 segundos
    const interval = setInterval(verificarStatusLoja, 2000)

    return () => clearInterval(interval)
  }, [lojaAberta])

  // 💾 SISTEMA DE BACKUP AUTOMÁTICO
  const criarBackupAutomatico = async () => {
    try {
      console.log("💾 Criando backup automático...")

      const backup: BackupData = {
        categorias: categorias,
        bebidas: bebidas,
        timestamp: new Date().toISOString(),
        versao: "1.0",
      }

      // Salvar no localStorage
      localStorage.setItem("bebidas_on_backup", JSON.stringify(backup))

      // Criar arquivo para download
      const dataStr = JSON.stringify(backup, null, 2)
      const dataBlob = new Blob([dataStr], { type: "application/json" })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = `bebidas-on-backup-${new Date().toISOString().split("T")[0]}.json`

      // Auto download silencioso
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      console.log("✅ Backup criado com sucesso!")
      addToast({
        type: "success",
        title: "💾 Backup Criado!",
        description: "Seus dados foram salvos automaticamente",
      })
    } catch (error) {
      console.error("❌ Erro ao criar backup:", error)
    }
  }

  // 🔄 RESTAURAR DADOS DE EXEMPLO
  const restaurarDadosExemplo = async () => {
    if (!confirm("🔄 Deseja restaurar os dados de exemplo? Isso irá recriar categorias e produtos básicos.")) {
      return
    }

    try {
      setCarregando(true)
      console.log("🔄 Restaurando dados de exemplo...")

      // 1. Restaurar Categorias
      console.log("📂 Restaurando categorias...")
      for (const categoria of DADOS_EXEMPLO.categorias) {
        const { error } = await supabase.from("categorias").upsert({
          id: categoria.id,
          nome: categoria.nome,
          icone: categoria.icone,
          cor: categoria.cor,
          ativo: categoria.ativo,
          descricao: categoria.descricao,
          ordem: categoria.ordem,
        })

        if (error) {
          console.error("❌ Erro ao restaurar categoria:", categoria.nome, error)
        } else {
          console.log("✅ Categoria restaurada:", categoria.nome)
        }
      }

      // 2. Restaurar Bebidas
      console.log("🍻 Restaurando bebidas...")
      for (const bebida of DADOS_EXEMPLO.bebidas) {
        const { error } = await supabase.from("bebidas").upsert({
          id: bebida.id,
          nome: bebida.nome,
          descricao: bebida.descricao,
          preco: bebida.preco,
          categoria_id: bebida.categoria_id,
          imagem: bebida.imagem,
          estoque: bebida.estoque,
          ativo: bebida.ativo,
        })

        if (error) {
          console.error("❌ Erro ao restaurar bebida:", bebida.nome, error)
        } else {
          console.log("✅ Bebida restaurada:", bebida.nome)
        }
      }

      // 3. Recarregar dados
      await carregarDados()

      addToast({
        type: "success",
        title: "🎉 Dados Restaurados!",
        description: `${DADOS_EXEMPLO.categorias.length} categorias e ${DADOS_EXEMPLO.bebidas.length} produtos foram restaurados!`,
      })

      console.log("✅ Restauração concluída com sucesso!")
    } catch (error) {
      console.error("❌ Erro na restauração:", error)
      addToast({
        type: "error",
        title: "❌ Erro na Restauração",
        description: "Ocorreu um erro ao restaurar os dados",
      })
    } finally {
      setCarregando(false)
    }
  }

  // 📤 EXPORTAR BACKUP MANUAL
  const exportarBackup = () => {
    try {
      const backup: BackupData = {
        categorias: categorias,
        bebidas: bebidas,
        timestamp: new Date().toISOString(),
        versao: "1.0",
      }

      const dataStr = JSON.stringify(backup, null, 2)
      const dataBlob = new Blob([dataStr], { type: "application/json" })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = `bebidas-on-backup-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      addToast({
        type: "success",
        title: "📤 Backup Exportado!",
        description: "Arquivo de backup foi baixado com sucesso",
      })
    } catch (error) {
      console.error("❌ Erro ao exportar backup:", error)
      addToast({
        type: "error",
        title: "❌ Erro no Export",
        description: "Não foi possível exportar o backup",
      })
    }
  }

  // 📥 IMPORTAR BACKUP
  const importarBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const backup: BackupData = JSON.parse(e.target?.result as string)

        if (!backup.categorias || !backup.bebidas) {
          throw new Error("Arquivo de backup inválido")
        }

        if (
          !confirm(
            `📥 Importar backup de ${new Date(backup.timestamp).toLocaleString()}?\n\nCategorias: ${backup.categorias.length}\nBebidas: ${backup.bebidas.length}`,
          )
        ) {
          return
        }

        setCarregando(true)

        // Restaurar categorias
        for (const categoria of backup.categorias) {
          await supabase.from("categorias").upsert(categoria)
        }

        // Restaurar bebidas
        for (const bebida of backup.bebidas) {
          await supabase.from("bebidas").upsert(bebida)
        }

        await carregarDados()

        addToast({
          type: "success",
          title: "📥 Backup Importado!",
          description: "Dados restaurados com sucesso",
        })
      } catch (error) {
        console.error("❌ Erro ao importar backup:", error)
        addToast({
          type: "error",
          title: "❌ Erro na Importação",
          description: "Arquivo de backup inválido ou corrompido",
        })
      } finally {
        setCarregando(false)
      }
    }
    reader.readAsText(file)
  }

  // 🍴 FUNÇÃO UNIVERSAL PARA CORRIGIR URL DE IMAGENS E GERAR PLACEHOLDERS
  const corrigirURLImagem = (url: string | null, nome: string): string => {
    // 1. Se não tem URL, gerar URL de serviço de imagens
    if (!url) {
      return `https://placehold.co/300x200/ff6b35/white?text=${encodeURIComponent(nome)}`
    }

    // 2. Se é placeholder local (começa com '/' ou '/placeholder.svg'), converter para serviço válido
    if (url.startsWith("/placeholder.svg") || (url.startsWith("/") && !url.startsWith("http"))) {
      return `https://placehold.co/300x200/ff6b35/white?text=${encodeURIComponent(nome)}`
    }

    // 3. Se já tem protocolo válido
    if (url.startsWith("http://") || url.startsWith("https://")) {
      // Se for base64/blob ou muito longa, converter para placeholder
      if (url.length > 200 || url.includes("data:image") || url.includes("blob")) {
        return `https://placehold.co/300x200/ff6b35/white?text=${encodeURIComponent(nome)}`
      }
      return url
    }

    // 4. URL sem protocolo - adicionar https://
    console.log(`🔧 Corrigindo URL: ${url} → https://${url}`)
    const urlCorrigida = `https://${url}`

    // Se ficou muito longa após correção, usar placeholder
    if (urlCorrigida.length > 200) {
      return `https://placehold.co/300x200/ff6b35/white?text=${encodeURIComponent(nome)}`
    }

    return urlCorrigida
  }

  // 💾 EXPORTAR SQL COMPLETO
  const exportarBackupSQL = async () => {
    try {
      console.log("💾 Gerando backup SQL COMPLETO...")

      let sql = `-- =============================================
-- 🍻 BACKUP COMPLETO BEBIDAS ON
-- =============================================
-- Data: ${new Date().toLocaleString("pt-BR")}
-- ✅ URLs de imagens corrigidas automaticamente
-- =============================================

-- 📂 CATEGORIAS
`

      for (const cat of categorias) {
        // Atualização: ON CONFLICT para idempotência
        sql += `INSERT INTO categorias (id, nome, icone, cor, ativo) VALUES (${cat.id}, '${cat.nome.replace(/'/g, "''")}', '${cat.icone}', '${cat.cor}', ${cat.ativo}) ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome, icone = EXCLUDED.icone, cor = EXCLUDED.cor, ativo = EXCLUDED.ativo;\n`
      }

      sql += `\n-- 🍻 BEBIDAS\n\n`

      for (const bebida of bebidas) {
        const nome = bebida.nome.replace(/'/g, "''")
        const descricao = (bebida.descricao || "").replace(/'/g, "''")
        // 🔥 AQUI: USA A FUNÇÃO corrigirURLImagem
        const imagemCorrigida = corrigirURLImagem(bebida.imagem, bebida.nome)

        // Atualização: ON CONFLICT para idempotência e atualização de mais campos
        sql += `INSERT INTO bebidas (id, nome, descricao, preco, categoria_id, imagem, estoque, ativo) VALUES (${bebida.id}, '${nome}', '${descricao}', ${bebida.preco}, ${bebida.categoria_id}, '${imagemCorrigida}', ${bebida.estoque}, ${bebida.ativo}) ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome, descricao = EXCLUDED.descricao, preco = EXCLUDED.preco, categoria_id = EXCLUDED.categoria_id, imagem = EXCLUDED.imagem, estoque = EXCLUDED.estoque, ativo = EXCLUDED.ativo;\n`
      }

      sql += `\n-- ✅ Total: ${categorias.length} categorias, ${bebidas.length} bebidas\n`

      const blob = new Blob([sql], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `bebidas-on-COMPLETO-${new Date().toISOString().split("T")[0]}.sql`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      addToast({
        type: "success",
        title: "💾 SQL Exportado!",
        description: `${bebidas.length} bebidas com URLs corrigidas!`,
      })
    } catch (error) {
      console.error("❌ Erro:", error)
      addToast({
        type: "error",
        title: "❌ Erro ao exportar",
        description: "Tente novamente",
      })
    }
  }

  // 📋 COPIAR SQL
  const copiarBackupSQL = async () => {
    try {
      console.log("📋 Copiando SQL...")

      let sql = `-- 🍻 BACKUP BEBIDAS ON - ${new Date().toLocaleString("pt-BR")}\n\n-- 📂 CATEGORIAS\n\n`

      for (const cat of categorias) {
        sql += `INSERT INTO categorias (id, nome, icone, cor, ativo) VALUES (${cat.id}, '${cat.nome.replace(/'/g, "''")}', '${cat.icone}', '${cat.cor}', ${cat.ativo});\n`
      }

      sql += `\n-- 🍻 BEBIDAS\n\n`

      for (const bebida of bebidas) {
        const nome = bebida.nome.replace(/'/g, "''")
        const descricao = (bebida.descricao || "").replace(/'/g, "''")
        const imagemCorrigida = corrigirURLImagem(bebida.imagem, bebida.nome)

        sql += `INSERT INTO bebidas (id, nome, descricao, preco, categoria_id, imagem, estoque, ativo) VALUES (${bebida.id}, '${nome}', '${descricao}', ${bebida.preco}, ${bebida.categoria_id}, '${imagemCorrigida}', ${bebida.estoque}, ${bebida.ativo});\n`
      }

      await navigator.clipboard.writeText(sql)

      addToast({
        type: "success",
        title: "📋 SQL Copiado!",
        description: `${bebidas.length} bebidas com URLs corrigidas!`,
      })
    } catch (error) {
      console.error("❌ Erro:", error)
      addToast({
        type: "error",
        title: "❌ Erro ao copiar",
        description: "Tente novamente",
      })
    }
  }

  // 💾 EXPORTAR SQL OTIMIZADO (NOVO BOTÃO COM CORREÇÃO DE URL)
  const exportarSQLOtimizado = async () => {
    try {
      setCarregando(true)
      addToast({
        type: "info",
        title: "💾 Gerando SQL...",
        description: "Otimizando imagens automaticamente",
      })

      let sql = `-- =============================================
-- 🍻 BACKUP OTIMIZADO BEBIDAS ON
-- =============================================
-- Data: ${new Date().toLocaleString("pt-BR")}
-- ✅ Imagens automaticamente otimizadas!
-- =============================================

-- 📂 CATEGORIAS
`

      // Categorias
      for (const cat of categorias) {
        sql += `INSERT INTO categorias (id, nome, icone, cor, ativo) VALUES (${cat.id}, '${cat.nome.replace(/'/g, "''")}', '${cat.icone}', '${cat.cor}', ${cat.ativo});\n`
      }

      sql += `\n-- 🍻 BEBIDAS (URLs otimizadas automaticamente)\n\n`

      // Bebidas com URLs otimizadas
      for (const bebida of bebidas) {
        const nome = bebida.nome.replace(/'/g, "''")
        const descricao = (bebida.descricao || "").replace(/'/g, "''")
        const imagemOtimizada = corrigirURLImagem(bebida.imagem, bebida.nome)

        sql += `INSERT INTO bebidas (id, nome, descricao, preco, categoria_id, imagem, estoque, ativo) VALUES (${bebida.id}, '${nome}', '${descricao}', ${bebida.preco}, ${bebida.categoria_id}, '${imagemOtimizada}', ${bebida.estoque}, ${bebida.ativo});\n`
      }

      sql += `\n-- ✅ Total: ${categorias.length} categorias, ${bebidas.length} bebidas\n`
      sql += `-- 📏 Tamanho: ${(sql.length / 1024).toFixed(2)} KB\n`

      // Download do arquivo
      const blob = new Blob([sql], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `bebidas-on-otimizado-${new Date().toISOString().split("T")[0]}.sql`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      addToast({
        type: "success",
        title: "💾 SQL Exportado!",
        description: `${bebidas.length} bebidas com imagens otimizadas!`,
      })
    } catch (error) {
      console.error("❌ Erro:", error)
      addToast({
        type: "error",
        title: "❌ Erro ao exportar",
        description: "Tente novamente",
      })
    } finally {
      setCarregando(false)
    }
  }

  // Adicionar useEffect para backup automático após carregamento
  useEffect(() => {
    // Criar backup automático quando houver dados
    if (categorias.length > 0 || bebidas.length > 0) {
      // Backup automático a cada 30 minutos
      const interval = setInterval(
        () => {
          criarBackupAutomatico()
        },
        30 * 60 * 1000,
      ) // 30 minutos

      return () => clearInterval(interval)
    }
  }, [categorias, bebidas])

  // TELA INICIAL - SEM BADGE DE DEMONSTRAÇÃO
  if (telaAtual === "inicio") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-400 via-orange-500 to-yellow-500 flex flex-col overflow-hidden">
        {/* Elementos flutuantes de fundo */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full animate-float-1"></div>
          <div className="absolute top-32 right-16 w-16 h-16 bg-white/5 rounded-full animate-float-2"></div>
          <div className="absolute bottom-32 left-20 w-12 h-12 bg-white/10 rounded-full animate-float-3"></div>
          <div className="absolute bottom-20 right-32 w-24 h-24 bg-white/5 rounded-full animate-float-4"></div>
          <div className="absolute top-1/2 left-8 w-8 h-8 bg-white/10 rounded-full animate-float-5"></div>
          <div className="absolute top-1/3 right-8 w-14 h-14 bg-white/5 rounded-full animate-float-6"></div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4 relative z-10">
          <div className="text-center space-y-8 max-w-md w-full">
            {/* Logo da empresa com animações */}
            <div className="glass-effect rounded-3xl p-8 shadow-2xl border border-white/20 hover-lift animate-fadeInScale">
              <div className="mb-6">
                <div className="w-48 h-48 mx-auto rounded-full overflow-hidden shadow-2xl border-4 border-white/30 animate-logo-chamativa">
                  <Image
                    src="/logo-bebidas-on.png"
                    alt="Bebidas ON Logo"
                    width={200}
                    height={200}
                    className="w-full h-full object-cover animate-float"
                    priority
                  />
                </div>
              </div>
              <h1 className="text-4xl font-bold text-white mb-2 animate-bounce-custom">BEBIDAS ON</h1>
              <div className="bg-gradient-to-r from-yellow-300 to-green-400 bg-clip-text text-transparent animate-pulse-custom">
                <p className="text-xl font-bold mb-2">🚚 DELIVERY PREMIUM</p>
              </div>
              <p className="text-white/90 text-lg font-medium animate-slideInUp">Buzinou, chegou! 📱</p>
              {modoTeste && <Badge className="mt-3 bg-yellow-500 text-black text-sm animate-bounce">🧪 DEMO</Badge>}
            </div>

            {!lojaAberta && (
              <div className="bg-red-500 text-white p-4 rounded-xl text-center animate-pulse">
                <h3 className="text-xl font-bold mb-2">🔴 LOJA FECHADA</h3>
                <p className="text-sm">Não estamos aceitando pedidos no momento</p>
              </div>
            )}

            <div className="space-y-4 animate-fadeInUp" style={{ animationDelay: "0.3s" }}>
              {/* Adicionar loading ao clicar em Ver Cardápio */}
              <Button
                onClick={() => {
                  setCarregando(true)
                  setTimeout(() => {
                    setTelaAtual("cardapio")
                    setCarregando(false)
                  }, 800)
                }}
                className={`w-full text-lg py-6 rounded-2xl font-bold shadow-xl hover-lift animate-glow bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 text-white`}
              >
                🍻 Ver Cardápio Completo
              </Button>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="glass-effect rounded-xl p-3 border border-white/20 hover-lift animate-slideInLeft stagger-1">
                  <div className="text-2xl mb-1 animate-bounce">⚡</div>
                  <p className="text-white/80 text-xs font-medium">Entrega Rápida</p>
                </div>
                <div className="glass-effect rounded-xl p-3 border border-white/20 hover-lift animate-fadeInScale stagger-2">
                  <div className="text-2xl mb-1 animate-bounce" style={{ animationDelay: "0.2s" }}>
                    🧊
                  </div>
                  <p className="text-white/80 text-xs font-medium">Sempre Gelado</p>
                </div>
                <div className="glass-effect rounded-xl p-3 border border-white/20 hover-lift animate-slideInRight stagger-3">
                  <div className="text-2xl mb-1 animate-bounce" style={{ animationDelay: "0.4s" }}>
                    💳
                  </div>
                  <p className="text-white/80 text-xs font-medium">Pix, Cartão ou Dinheiro</p>
                </div>
              </div>

              {/* Card compacto de pedido mínimo */}
              <div
                className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 animate-fadeInUp"
                style={{ animationDelay: "0.5s" }}
              >
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <div className="text-2xl animate-moto-parada">🏍️</div>
                    <h4 className="text-lg font-bold text-white">Pedido Mínimo</h4>
                  </div>
                  <p className="text-white/90 text-sm font-semibold">
                    Entrega disponível para pedidos <span className="text-yellow-300 font-bold">acima de R$ 20,00</span>
                  </p>
                  <p className="text-white/80 text-xs mt-1">
                    Taxa: R$ {TAXA_ENTREGA.toFixed(2)} • Retirada sempre gratuita
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <Rodape />
      </div>
    )
  }

  // TELA DO CARRINHO
  if (telaAtual === "carrinho") {
    return (
      <div className="min-h-screen bg-white">
        <div className="bg-gradient-to-r from-orange-400 via-orange-500 to-yellow-500 p-4 text-white sticky top-0 z-10 shadow-lg">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <Button
              variant="ghost"
              onClick={() => setTelaAtual("inicio")}
              className="text-white hover:bg-white/20 font-semibold hover-lift"
            >
              ← Início
            </Button>
            <div className="flex items-center space-x-3">
              <div
                className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/30 cursor-pointer hover-lift animate-logo-suave"
                onDoubleClick={acessoAdmin}
              >
                <Image
                  src="/logo-bebidas-on.png"
                  alt="Logo"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover animate-float"
                />
              </div>
              <div className="text-center">
                <h1 className="text-2xl font-bold">Cardápio</h1>
                {modoTeste && <Badge className="bg-yellow-500 text-black text-xs">🧪 DEMO</Badge>}
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={() => setTelaAtual("carrinho")}
              className="text-white hover:bg-white/20 relative font-semibold hover-lift"
              disabled={!lojaAberta}
            >
              <ShoppingCart className="w-6 h-6 mr-2" />
              <span className="hidden sm:inline">Carrinho</span>
              {totalItens > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs min-w-[20px] h-5 flex items-center justify-center rounded-full animate-bounce">
                  {totalItens}
                </Badge>
              )}
            </Button>
          </div>
        </div>
        {!lojaAberta && (
          <div className="bg-gradient-to-r from-orange-100 to-yellow-50 border-l-4 border-orange-500 p-4 mx-4 mt-4 rounded-lg shadow-lg animate-pulse">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">⏰</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-orange-800 font-bold">
                  Loja Fechada: Não estamos fazendo pedidos no momento. Volte mais tarde!
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto p-4">
          {carrinho.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-gradient-to-br from-orange-100 to-yellow-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <ShoppingCart className="w-12 h-12 text-orange-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-700 mb-2">Carrinho vazio</h2>
              <p className="text-gray-500 mb-6">Adicione algumas bebidas para continuar</p>
              <Button
                onClick={() => setTelaAtual("cardapio")}
                className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-bold px-8 py-3 rounded-xl"
              >
                🍻 Ver Cardápio
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Itens do Carrinho */}
              <div className="space-y-4">
                {carrinho.map((item) => (
                  <Card key={item.bebida.id} className="shadow-lg">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                          <Image
                            src={item.bebida.imagem || "/placeholder.svg?height=64&width=64&text=Bebida"}
                            alt={item.bebida.nome}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg">{item.bebida.nome}</h3>
                          <p className="text-gray-600">R$ {item.bebida.preco.toFixed(2)} cada</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removerDoCarrinho(item.bebida.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="font-bold text-lg w-8 text-center">{item.quantidade}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => adicionarAoCarrinho(item.bebida, 1)}
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-green-600">
                            R$ {(item.bebida.preco * item.quantidade).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Resumo do Pedido */}
              <Card className="shadow-lg bg-gradient-to-r from-green-50 to-blue-50">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4">Resumo do Pedido</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal ({totalItens} itens):</span>
                      <span className="font-semibold">R$ {subtotalItens.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxa de entrega:</span>
                      <span className="font-semibold">
                        {tipoEntrega === "entrega" ? `R$ ${TAXA_ENTREGA.toFixed(2)}` : "Grátis"}
                      </span>
                    </div>
                    <div className="border-t pt-2 flex justify-between text-xl font-bold text-green-600">
                      <span>Total:</span>
                      <span>R$ {(totalCarrinho + (tipoEntrega === "entrega" ? TAXA_ENTREGA : 0)).toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tipo de Entrega */}
              <Card className="shadow-lg">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4">Tipo de Entrega</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      variant={tipoEntrega === "retirada" ? "default" : "outline"}
                      onClick={() => setTipoEntrega("retirada")}
                      className="p-4 h-auto flex flex-col items-center space-y-2"
                    >
                      <div className="text-2xl">🏪</div>
                      <div>
                        <div className="font-bold">Retirada</div>
                        <div className="text-sm opacity-70">Grátis</div>
                      </div>
                    </Button>
                    <Button
                      variant={tipoEntrega === "entrega" ? "default" : "outline"}
                      onClick={() => setTipoEntrega("entrega")}
                      className="p-4 h-auto flex flex-col items-center space-y-2"
                      disabled={totalCarrinho < PEDIDO_MINIMO_ENTREGA}
                    >
                      <div className="text-2xl">🚚</div>
                      <div>
                        <div className="font-bold">Entrega</div>
                        <div className="text-sm opacity-70">R$ {TAXA_ENTREGA.toFixed(2)}</div>
                      </div>
                    </Button>
                  </div>
                  {totalCarrinho < PEDIDO_MINIMO_ENTREGA && (
                    <p className="text-red-600 text-sm mt-2 text-center">
                      Pedido mínimo para entrega: R$ {PEDIDO_MINIMO_ENTREGA.toFixed(2)}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Endereço de Entrega */}
              {tipoEntrega === "entrega" && (
                <Card className="shadow-lg">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-4">Endereço de Entrega</h3>
                    <Input
                      type="text"
                      placeholder="Digite seu endereço completo (opcional)..."
                      value={enderecoEntrega}
                      onChange={(e) => setEnderecoEntrega(e.target.value)}
                      className="w-full"
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      💡 Se informar o endereço, enviaremos sua localização junto com o pedido
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Botão Finalizar */}
              <Button
                onClick={() => setTelaAtual("pagamento")}
                disabled={carrinho.length === 0}
                className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-bold py-4 text-lg rounded-xl"
              >
                🛒 Finalizar Pedido
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // TELA DE PAGAMENTO
  if (telaAtual === "pagamento") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
        <div className="bg-gradient-to-r from-orange-400 via-orange-500 to-yellow-500 p-4 text-white sticky top-0 z-10 shadow-lg">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <Button
              variant="ghost"
              onClick={() => setTelaAtual("carrinho")}
              className="text-white hover:bg-white/20 font-semibold"
            >
              ← Voltar
            </Button>
            <h1 className="text-2xl font-bold">Pagamento</h1>
            <div className="w-20"></div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto p-4 space-y-6">
          {/* Resumo Final */}
          <Card className="shadow-lg bg-gradient-to-r from-green-50 to-blue-50">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-4">Resumo Final</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>R$ {subtotalItens.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Entrega:</span>
                  <span>{tipoEntrega === "entrega" ? `R$ ${TAXA_ENTREGA.toFixed(2)}` : "Grátis"}</span>
                </div>
                <div className="border-t pt-2 flex justify-between text-xl font-bold text-green-600">
                  <span>Total:</span>
                  <span>R$ {(totalCarrinho + (tipoEntrega === "entrega" ? TAXA_ENTREGA : 0)).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Forma de Pagamento */}
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-4">Forma de Pagamento</h3>
              <div className="grid grid-cols-3 gap-4">
                <Button
                  variant={formaPagamento === "pix" ? "default" : "outline"}
                  onClick={() => setFormaPagamento("pix")}
                  className="p-4 h-auto flex flex-col items-center space-y-2"
                >
                  <div className="text-2xl">📱</div>
                  <div className="font-bold">PIX</div>
                </Button>
                <Button
                  variant={formaPagamento === "cartao" ? "default" : "outline"}
                  onClick={() => setFormaPagamento("cartao")}
                  className="p-4 h-auto flex flex-col items-center space-y-2"
                >
                  <div className="text-2xl">💳</div>
                  <div className="font-bold">Cartão</div>
                </Button>
                <Button
                  variant={formaPagamento === "dinheiro" ? "default" : "outline"}
                  onClick={() => setFormaPagamento("dinheiro")}
                  className="p-4 h-auto flex flex-col items-center space-y-2"
                >
                  <div className="text-2xl">💵</div>
                  <div className="font-bold">Dinheiro</div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Valor Pago (apenas para dinheiro) */}
          {formaPagamento === "dinheiro" && (
            <Card className="shadow-lg border-orange-200">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-4 text-orange-800">💵 Dinheiro</h3>
                <p className="text-sm text-gray-600 mb-2">Pagamento na entrega</p>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Valor que você vai pagar:</label>
                  <Input
                    type="number"
                    placeholder={`Mínimo: R$ ${(totalCarrinho + (tipoEntrega === "entrega" ? TAXA_ENTREGA : 0)).toFixed(2)}`}
                    value={valorPago}
                    onChange={(e) => setValorPago(e.target.value)}
                    className="w-full text-lg border-yellow-300 focus:border-yellow-500"
                    step="0.01"
                    min={(totalCarrinho + (tipoEntrega === "entrega" ? TAXA_ENTREGA : 0)).toFixed(2)}
                  />
                </div>

                {valorPago && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-lg">
                        <span>Total do pedido:</span>
                        <span className="font-bold">
                          R$ {(totalCarrinho + (tipoEntrega === "entrega" ? TAXA_ENTREGA : 0)).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-lg">
                        <span>Valor que você vai pagar:</span>
                        <span className="font-bold">R$ {Number.parseFloat(valorPago || "0").toFixed(2)}</span>
                      </div>
                      <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between text-xl font-bold">
                          <span>Troco:</span>
                          <span className={calcularTroco() >= 0 ? "text-green-600" : "text-red-600"}>
                            {calcularTroco() === 0
                              ? "✅ Não precisa de troco"
                              : calcularTroco() > 0
                                ? `R$ ${calcularTroco().toFixed(2)}`
                                : `❌ Falta R$ ${Math.abs(calcularTroco()).toFixed(2)}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Dados PIX */}
          {formaPagamento === "pix" && (
            <Card className="shadow-lg bg-green-50 border-green-200">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-4 text-green-800 flex items-center">📱 Dados PIX</h3>
                <div className="bg-white border-2 border-green-300 rounded-lg p-4 mb-4">
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-semibold text-gray-600">Chave PIX:</span>
                      <div className="font-bold text-lg text-green-700">{CHAVE_PIX}</div>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-600">Nome:</span>
                      <div className="font-semibold text-gray-800">{NOME_PIX}</div>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-600">Banco:</span>
                      <div className="font-semibold text-gray-800">{BANCO_PIX}</div>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(CHAVE_PIX)
                    addToast({
                      type: "success",
                      title: "Chave PIX copiada!",
                      description: "A chave PIX foi copiada para a área de transferência",
                    })
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg mb-3"
                >
                  📋 Copiar Chave PIX
                </Button>
                <p className="text-center text-sm text-gray-600">
                  Após fazer o PIX, envie o comprovante junto com o pedido
                </p>
              </CardContent>
            </Card>
          )}

          {/* Botão Finalizar */}
          <Button
            onClick={finalizarPedido}
            disabled={carregando || (formaPagamento === "dinheiro" && calcularTroco() < 0)}
            className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-bold py-4 text-lg rounded-xl"
          >
            {carregando ? "Processando..." : "🚀 Confirmar Pedido"}
          </Button>
        </div>
      </div>
    )
  }

  // TELA DO COMPROVANTE
  if (telaAtual === "comprovante" && pedidoAtual) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-800 to-gray-900 text-white">
        <div className="bg-gradient-to-r from-green-600 to-blue-600 p-4 text-white sticky top-0 z-10 shadow-lg">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <Button
              variant="ghost"
              onClick={() => setTelaAtual("inicio")}
              className="text-white hover:bg-white/20 font-semibold"
            >
              ← Início
            </Button>
            <h1 className="text-2xl font-bold">Comprovante</h1>
            <div className="w-20"></div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto p-4">
          <div ref={comprovanteRef} className="bg-white text-black rounded-lg shadow-2xl p-6 space-y-6">
            {/* Cabeçalho */}
            <div className="text-center border-b pb-4">
              <div className="w-16 h-16 mx-auto rounded-full overflow-hidden mb-4">
                <Image
                  src="/logo-bebidas-on.png"
                  alt="Logo"
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>
              <h2 className="text-2xl font-bold text-orange-600">BEBIDAS ON</h2>
              <p className="text-gray-600">Delivery Premium</p>
              <p className="text-sm text-gray-500">{TELEFONE_DISPLAY}</p>
            </div>

            {/* Dados do Pedido */}
            <div className="space-y-2">
              <h3 className="text-lg font-bold">Dados do Pedido</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold">Pedido:</span> #{pedidoAtual.id}
                </div>
                <div>
                  <span className="font-semibold">Data:</span> {pedidoAtual.data}
                </div>
                <div>
                  <span className="font-semibold">Cliente:</span> {pedidoAtual.cliente}
                </div>
                <div>
                  <span className="font-semibold">Tipo:</span>{" "}
                  {pedidoAtual.tipoEntrega === "entrega" ? "🚚 Entrega" : "🏪 Retirada"}
                </div>
              </div>
              {pedidoAtual.enderecoEntrega && (
                <div className="text-sm">
                  <span className="font-semibold">Endereço:</span> {pedidoAtual.enderecoEntrega}
                </div>
              )}
            </div>

            {/* Itens */}
            <div className="space-y-2">
              <h3 className="text-lg font-bold">Itens do Pedido</h3>
              <div className="space-y-2">
                {pedidoAtual.itens.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                    <div>
                      <div className="font-semibold">
                        {item.quantidade}x {item.bebida.nome}
                      </div>
                      <div className="text-sm text-gray-600">R$ {item.bebida.preco.toFixed(2)} cada</div>
                    </div>
                    <div className="font-bold">R$ {(item.bebida.preco * item.quantidade).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totais */}
            <div className="space-y-2 border-t pt-4">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>R$ {subtotalItens.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxa de entrega:</span>
                <span>{pedidoAtual.tipoEntrega === "entrega" ? `R$ ${TAXA_ENTREGA.toFixed(2)}` : "R$ 0,00"}</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-green-600 border-t pt-2">
                <span>Total:</span>
                <span>R$ {pedidoAtual.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Pagamento */}
            <div className="space-y-2 border-t pt-4">
              <h3 className="text-lg font-bold">Pagamento</h3>
              <div className="flex justify-between">
                <span>Forma:</span>
                <span className="font-semibold">{pedidoAtual.formaPagamento.toUpperCase()}</span>
              </div>
              {pedidoAtual.formaPagamento === "dinheiro" && (
                <>
                  <div className="flex justify-between">
                    <span>Valor pago:</span>
                    <span>R$ {pedidoAtual.valorPago?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Troco:</span>
                    <span>R$ {(pedidoAtual.troco || 0).toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Status */}
            <div className="text-center bg-yellow-100 p-4 rounded-lg">
              <p className="font-bold text-yellow-800">⏰ Aguardando confirmação</p>
              <p className="text-sm text-yellow-700">Seu pedido foi enviado via WhatsApp</p>
            </div>
          </div>

          {/* Botões */}
          <div className="mt-6 space-y-4">
            <Button
              onClick={compartilharComprovante}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 text-lg rounded-xl"
            >
              📱 Enviar para WhatsApp
            </Button>
            <Button
              onClick={salvarComprovante}
              disabled={capturandoImagem}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl"
            >
              {capturandoImagem ? "Salvando..." : "💾 Salvar Comprovante"}
            </Button>
            <Button
              onClick={() => {
                setCarrinho([])
                setEnderecoEntrega("")
                setValorPago("")
                setFormaPagamento("pix")
                setTipoEntrega("retirada")
                setPedidoAtual(null)
                setTelaAtual("inicio")
              }}
              variant="outline"
              className="w-full border-white text-white hover:bg-white hover:text-black py-3 rounded-xl"
            >
              🏠 Voltar ao Início
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // TELA ADMIN - MANTENDO O CÓDIGO ORIGINAL DO USUÁRIO
  if (telaAtual === "admin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-3 sm:p-4 text-white sticky top-0 z-10 shadow-lg">
          <div className="max-w-6xl mx-auto">
            {/* Layout Mobile */}
            <div className="block sm:hidden">
              <div className="flex items-center justify-between mb-3">
                <Button
                  variant="ghost"
                  onClick={() => setTelaAtual("inicio")}
                  className="text-white hover:bg-white/20 font-semibold text-sm px-2"
                >
                  ← Sair
                </Button>
                {modoTeste && <Badge className="bg-yellow-500 text-black text-xs">🧪 TESTE</Badge>}
              </div>

              <div className="text-center mb-3">
                <h1 className="text-lg font-bold">🔐 Painel Admin</h1>
              </div>

              <div className="flex items-center justify-center space-x-4">
                <div className="text-center">
                  <div
                    className={`text-sm font-bold transition-all duration-500 ${lojaAberta ? "text-green-400" : "text-red-400"}`}
                  >
                    {lojaAberta ? "🟢 ABERTO" : "🔴 FECHADO"}
                  </div>
                  <div className="text-xs text-gray-300">{lojaAberta ? "Aceitando pedidos" : "Pedidos pausados"}</div>
                </div>
                <button
                  onClick={alternarStatusLoja}
                  disabled={carregando}
                  className={`relative inline-flex h-8 w-16 items-center rounded-full transition-all duration-500 shadow-lg ${
                    lojaAberta
                      ? "bg-gradient-to-r from-green-400 to-green-600 shadow-green-500/50"
                      : "bg-gradient-to-r from-red-400 to-red-600 shadow-red-500/50"
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-all duration-500 shadow-lg ${
                      lojaAberta ? "translate-x-8 rotate-180" : "translate-x-1"
                    }`}
                  >
                    <span
                      className={`flex items-center justify-center h-full text-xs font-bold transition-all duration-500 ${
                        lojaAberta ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {lojaAberta ? "✓" : "✕"}
                    </span>
                  </span>
                  {carregando && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Layout Desktop */}
            <div className="hidden sm:flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => setTelaAtual("inicio")}
                className="text-white hover:bg-white/20 font-semibold"
              >
                ← Sair Admin
              </Button>
              <h1 className="text-2xl font-bold">🔐 Painel Administrativo</h1>
              <div className="flex items-center space-x-4">
                {modoTeste && <Badge className="bg-yellow-500 text-black">🧪 TESTE</Badge>}
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div
                      className={`text-lg font-bold transition-all duration-500 ${lojaAberta ? "text-green-400" : "text-red-400"}`}
                    >
                      {lojaAberta ? "🟢 ABERTO" : "🔴 FECHADO"}
                    </div>
                    <div className="text-xs text-gray-300">{lojaAberta ? "Aceitando pedidos" : "Pedidos pausados"}</div>
                  </div>
                  <button
                    onClick={alternarStatusLoja}
                    disabled={carregando}
                    className={`relative inline-flex h-10 w-20 items-center rounded-full transition-all duration-500 transform hover:scale-110 shadow-2xl ${
                      lojaAberta
                        ? "bg-gradient-to-r from-green-400 to-green-600 shadow-green-500/50"
                        : "bg-gradient-to-r from-red-400 to-red-600 shadow-red-500/50"
                    } hover:shadow-xl`}
                    style={{
                      boxShadow: lojaAberta
                        ? "0 0 20px rgba(34, 197, 94, 0.4), 0 0 40px rgba(34, 197, 94, 0.2)"
                        : "0 0 20px rgba(239, 68, 68, 0.4), 0 0 40px rgba(239, 68, 68, 0.2)",
                    }}
                  >
                    <span
                      className={`inline-block h-8 w-8 transform rounded-full bg-white transition-all duration-500 shadow-lg ${
                        lojaAberta ? "translate-x-10 rotate-180" : "translate-x-1"
                      }`}
                      style={{
                        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2), 0 2px 4px rgba(0, 0, 0, 0.1)",
                      }}
                    >
                      <span
                        className={`flex items-center justify-center h-full text-sm font-bold transition-all duration-500 ${
                          lojaAberta ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {lojaAberta ? "✓" : "✕"}
                      </span>
                    </span>
                    {carregando && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}

                    {/* Efeito de brilho animado */}
                    <div
                      className={`absolute inset-0 rounded-full opacity-30 animate-pulse ${
                        lojaAberta ? "bg-green-300" : "bg-red-300"
                      }`}
                    ></div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto p-4">
          {/* Dashboard Cards - SEM LIMITES */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-6 text-center">
                <div className="text-3xl mb-2">📦</div>
                <h3 className="text-lg font-bold text-blue-800">Produtos</h3>
                <p className="text-3xl font-bold text-blue-600">{bebidas.length}</p>
                <p className="text-xs text-blue-500 mt-1">Total cadastrado</p>
              </CardContent>
            </Card>

            <Card className="shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-6 text-center">
                <div className="text-3xl mb-2">🏷️</div>
                <h3 className="text-lg font-bold text-purple-800">Categorias</h3>
                <p className="text-3xl font-bold text-purple-600">{categorias.length}</p>
                <p className="text-xs text-purple-500 mt-1">Total cadastrado</p>
              </CardContent>
            </Card>

            <Card className="shadow-lg bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-6 text-center">
                <div className="text-3xl mb-2">📋</div>
                <h3 className="text-lg font-bold text-green-800">Pedidos</h3>
                <p className="text-3xl font-bold text-green-600">{pedidosFiltrados.length}</p>
                <p className="text-xs text-green-500 mt-1">📊 Últimos 100</p>
              </CardContent>
            </Card>

            <Card className="shadow-lg bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
              <CardContent className="p-6 text-center">
                <div className="text-3xl mb-2">💰</div>
                <h3 className="text-lg font-bold text-yellow-800">Vendas Totais</h3>
                <p className="text-2xl font-bold text-yellow-600">
                  R$ {pedidosFiltrados.reduce((total, pedido) => total + pedido.total, 0).toFixed(2)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-1 mb-6 bg-white rounded-lg p-1 shadow-lg">
            <Button
              variant={abaAdmin === "categorias" ? "default" : "ghost"}
              onClick={() => setAbaAdmin("categorias")}
              className="flex-1"
            >
              🏷️ Categorias
            </Button>
            <Button
              variant={abaAdmin === "produtos" ? "default" : "ghost"}
              onClick={() => setAbaAdmin("produtos")}
              className="flex-1"
            >
              📦 Produtos
            </Button>
            <Button
              variant={abaAdmin === "pedidos" ? "default" : "ghost"}
              onClick={() => setAbaAdmin("pedidos")}
              className="flex-1"
            >
              📋 Pedidos
            </Button>
            {acessoDesenvolvedor && (
              <Button
                variant={abaAdmin === "geral" ? "default" : "ghost"}
                onClick={() => setAbaAdmin("geral")}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white"
              >
                🔧 Admin Geral
              </Button>
            )}
          </div>

          {/* ABA CATEGORIAS */}
          {abaAdmin === "categorias" && (
            <div className="space-y-6">
              {/* Gerenciar Categorias Header */}
              <Card className="shadow-lg bg-gradient-to-r from-orange-50 to-yellow-50">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold text-orange-800 mb-4">🏷️ Gerenciar Categorias</h2>

                  {/* Adicionar Nova Categoria */}
                  <div className="bg-white rounded-lg p-4 border-2 border-orange-200 mb-6">
                    <h3 className="text-lg font-bold mb-4 text-orange-700">➕ Adicionar Nova Categoria</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Input
                        placeholder="Nome da Categoria *"
                        value={novaCategoria.nome}
                        onChange={(e) => setNovaCategoria({ ...novaCategoria, nome: e.target.value })}
                        className="border-orange-300 focus:border-orange-500"
                      />
                      <Input
                        placeholder="Descrição (opcional)"
                        value={novaCategoria.descricao || ""}
                        onChange={(e) => setNovaCategoria({ ...novaCategoria, descricao: e.target.value })}
                        className="border-orange-300 focus:border-orange-500"
                      />
                      <select
                        value={novaCategoria.icone}
                        onChange={(e) => setNovaCategoria({ ...novaCategoria, icone: e.target.value })}
                        className="px-3 py-2 border border-orange-300 rounded-md focus:border-orange-500"
                      >
                        {ICONES_CATEGORIAS.map((icone) => (
                          <option key={icone.valor} value={icone.valor}>
                            {icone.nome}
                          </option>
                        ))}
                      </select>
                      <select
                        value={novaCategoria.cor}
                        onChange={(e) => setNovaCategoria({ ...novaCategoria, cor: e.target.value })}
                        className="px-3 py-2 border border-orange-300 rounded-md focus:border-orange-500"
                      >
                        {CORES_CATEGORIAS.map((cor) => (
                          <option key={cor.valor} value={cor.valor}>
                            {cor.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Button
                      onClick={adicionarNovaCategoria}
                      disabled={carregando}
                      className="mt-4 bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      {carregando ? "Salvando..." : "➕ Adicionar Categoria"}
                    </Button>
                  </div>

                  {/* Categorias Existentes */}
                  <div>
                    <h3 className="text-lg font-bold mb-4 text-gray-700">📂 Categorias Existentes</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categorias.map((categoria) => {
                        const IconeComponent = getIconeCategoria(categoria.icone)
                        const corInfo = getCorCategoria(categoria.cor)
                        const produtosCount = bebidas.filter((b) => b.categoria_id === categoria.id).length

                        return (
                          <Card key={categoria.id} className={`shadow-lg ${corInfo.classeBg} border-2`}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                  <div className={`p-2 rounded-full ${corInfo.classe} text-white`}>
                                    <IconeComponent className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <h4 className={`font-bold ${corInfo.classeTexto}`}>{categoria.nome}</h4>
                                    <p className="text-sm text-gray-600">{produtosCount} produtos</p>
                                    <p className="text-sm text-gray-500">ID: {categoria.id}</p>
                                  </div>
                                </div>
                                <div className="flex space-x-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setEditandoCategoria(categoria)}
                                    className="h-8 w-8 p-0 hover:bg-blue-50"
                                  >
                                    ✏️
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => excluirCategoria(categoria.id)}
                                    className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                                  >
                                    🗑️
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Modal Editar Categoria - CORRIGIDO */}
              {editandoCategoria && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <Card className="shadow-lg border-2 border-blue-500 bg-blue-50 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold mb-4 text-blue-800">✏️ Editando: {editandoCategoria.nome}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input
                          placeholder="Nome da categoria"
                          value={editandoCategoria.nome}
                          onChange={(e) => setEditandoCategoria({ ...editandoCategoria, nome: e.target.value })}
                          className="border-blue-300 focus:border-blue-500"
                        />
                        <select
                          value={editandoCategoria.icone}
                          onChange={(e) => setEditandoCategoria({ ...editandoCategoria, icone: e.target.value })}
                          className="px-3 py-2 border border-blue-300 rounded-md focus:border-blue-500"
                        >
                          {ICONES_CATEGORIAS.map((icone) => (
                            <option key={icone.valor} value={icone.valor}>
                              {icone.nome}
                            </option>
                          ))}
                        </select>
                        <select
                          value={editandoCategoria.cor}
                          onChange={(e) => setEditandoCategoria({ ...editandoCategoria, cor: e.target.value })}
                          className="px-3 py-2 border border-blue-300 rounded-md focus:border-blue-500"
                        >
                          {CORES_CATEGORIAS.map((cor) => (
                            <option key={cor.valor} value={cor.valor}>
                              {cor.nome}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex space-x-2 mt-4">
                        <Button
                          onClick={editarCategoria}
                          disabled={carregando}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {carregando ? "Salvando..." : "💾 Salvar"}
                        </Button>
                        <Button variant="outline" onClick={() => setEditandoCategoria(null)}>
                          ❌ Cancelar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}

          {/* ABA PRODUTOS */}
          {abaAdmin === "produtos" && (
            <div className="space-y-6">
              {/* Formulário Novo Produto */}
              <Card className="shadow-lg">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4">➕ Novo Produto</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      placeholder="Nome do produto"
                      value={novoItem.nome}
                      onChange={(e) => setNovoItem({ ...novoItem, nome: e.target.value })}
                    />
                    <Input
                      placeholder="Preço (ex: 4.50)"
                      type="number"
                      step="0.01"
                      value={novoItem.preco}
                      onChange={(e) => setNovoItem({ ...novoItem, preco: e.target.value })}
                    />
                    <Input
                      placeholder="Descrição"
                      value={novoItem.descricao}
                      onChange={(e) => setNovoItem({ ...novoItem, descricao: e.target.value })}
                    />
                    <Input
                      placeholder="Estoque"
                      type="number"
                      value={novoItem.estoque}
                      onChange={(e) => setNovoItem({ ...novoItem, estoque: e.target.value })}
                    />
                    <select
                      value={novoItem.categoria_id}
                      onChange={(e) => setNovoItem({ ...novoItem, categoria_id: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Selecione uma categoria</option>
                      {categorias.map((categoria) => (
                        <option key={categoria.id} value={categoria.id}>
                          {categoria.nome}
                        </option>
                      ))}
                    </select>
                    <Input
                      placeholder="URL da imagem (ou faça upload abaixo)"
                      value={novoItem.imagem}
                      onChange={(e) => setNovoItem({ ...novoItem, imagem: e.target.value })}
                    />
                  </div>
                  <div className="mt-4 p-4 border-2 border-dashed border-gray-300 rounded-lg">
                    <div className="flex flex-col md:flex-row items-center gap-4">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">📷 Upload de Imagem</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, false)}
                          disabled={uploadando}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 disabled:opacity-50"
                        />
                        <p className="mt-1 text-xs text-gray-500">PNG, JPG ou WEBP (máx 5MB)</p>
                      </div>
                      {novoItem.imagem && (
                        <div className="flex-shrink-0">
                          <img
                            src={novoItem.imagem || "/placeholder.svg"}
                            alt="Preview"
                            className="w-20 h-20 object-cover rounded-lg border"
                            onError={(e) => {
                              ;(e.target as HTMLImageElement).src = "/generic-product-display.png"
                            }}
                          />
                        </div>
                      )}
                    </div>
                    {uploadando && (
                      <div className="mt-2 flex items-center gap-2 text-orange-600">
                        <div className="animate-spin h-4 w-4 border-2 border-orange-600 border-t-transparent rounded-full"></div>
                        <span className="text-sm">Enviando imagem...</span>
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={adicionarNovaBebida}
                    disabled={carregando || uploadando}
                    className="mt-4 bg-green-600 hover:bg-green-700"
                  >
                    {carregando ? "Salvando..." : "➕ Adicionar Produto"}
                  </Button>
                </CardContent>
              </Card>

              {/* Busca de Produtos */}
              <Card className="shadow-lg">
                <CardContent className="p-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      type="text"
                      placeholder="Buscar produtos..."
                      value={buscaProdutos}
                      onChange={(e) => setBuscaProdutos(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Lista de Produtos */}
              <Card className="shadow-lg">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4">🍻 Produtos ({produtosFiltrados.length})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {produtosFiltrados.map((bebida) => (
                      <div key={bebida.id} className="border rounded-lg p-4 space-y-3">
                        <div className="w-full h-32 rounded-lg overflow-hidden bg-gray-100">
                          <Image
                            src={bebida.imagem || "/placeholder.svg?height=128&width=200&text=Bebida"}
                            alt={bebida.nome}
                            width={200}
                            height={128}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm">{bebida.nome}</h4>
                          <p className="text-xs text-gray-600 line-clamp-2">{bebida.descricao}</p>
                          <div className="flex justify-between items-center mt-2">
                            <span className="font-bold text-green-600">R$ {bebida.preco.toFixed(2)}</span>
                            <Badge className={getStatusEstoque(bebida.estoque).cor}>{bebida.estoque}</Badge>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            value={bebida.estoque}
                            onChange={(e) => atualizarEstoque(bebida.id, Number.parseInt(e.target.value) || 0)}
                            className="flex-1 h-8 text-xs"
                            min="0"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditandoItem(bebida)}
                            className="h-8 w-8 p-0"
                          >
                            ✏️
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => excluirBebida(bebida.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                          >
                            🗑️
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Modal Editar Produto - CORRIGIDO */}
              {editandoItem && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <Card className="shadow-lg border-2 border-blue-500 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold mb-4">✏️ Editando: {editandoItem.nome}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          placeholder="Nome do produto"
                          value={editandoItem.nome}
                          onChange={(e) => setEditandoItem({ ...editandoItem, nome: e.target.value })}
                        />
                        <Input
                          placeholder="Preço"
                          type="number"
                          step="0.01"
                          value={editandoItem.preco.toString()}
                          onChange={(e) =>
                            setEditandoItem({ ...editandoItem, preco: Number.parseFloat(e.target.value) || 0 })
                          }
                        />
                        <Input
                          placeholder="Descrição"
                          value={editandoItem.descricao || ""}
                          onChange={(e) => setEditandoItem({ ...editandoItem, descricao: e.target.value })}
                        />
                        <Input
                          placeholder="Estoque"
                          type="number"
                          value={editandoItem.estoque.toString()}
                          onChange={(e) =>
                            setEditandoItem({ ...editandoItem, estoque: Number.parseInt(e.target.value) || 0 })
                          }
                        />
                        <select
                          value={editandoItem.categoria_id.toString()}
                          onChange={(e) =>
                            setEditandoItem({ ...editandoItem, categoria_id: Number.parseInt(e.target.value) })
                          }
                          className="px-3 py-2 border border-gray-300 rounded-md"
                        >
                          {categorias.map((categoria) => (
                            <option key={categoria.id} value={categoria.id.toString()}>
                              {categoria.nome}
                            </option>
                          ))}
                        </select>
                        <Input
                          placeholder="URL da imagem (ou faça upload abaixo)"
                          value={editandoItem.imagem}
                          onChange={(e) => setEditandoItem({ ...editandoItem, imagem: e.target.value })}
                        />
                      </div>
                      <div className="mt-4 p-4 border-2 border-dashed border-gray-300 rounded-lg">
                        <div className="flex flex-col md:flex-row items-center gap-4">
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              📷 Upload de Nova Imagem
                            </label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, true)}
                              disabled={uploadando}
                              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
                            />
                            <p className="mt-1 text-xs text-gray-500">PNG, JPG ou WEBP (máx 5MB)</p>
                          </div>
                          {editandoItem.imagem && (
                            <div className="flex-shrink-0">
                              <img
                                src={editandoItem.imagem || "/placeholder.svg"}
                                alt="Preview"
                                className="w-20 h-20 object-cover rounded-lg border"
                                onError={(e) => {
                                  ;(e.target as HTMLImageElement).src = "/generic-product-display.png"
                                }}
                              />
                            </div>
                          )}
                        </div>
                        {uploadando && (
                          <div className="mt-2 flex items-center gap-2 text-blue-600">
                            <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                            <span className="text-sm">Enviando imagem...</span>
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2 mt-4">
                        <Button
                          onClick={editarBebida}
                          disabled={carregando || uploadando}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {carregando ? "Salvando..." : "💾 Salvar"}
                        </Button>
                        <Button variant="outline" onClick={() => setEditandoItem(null)}>
                          ❌ Cancelar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}

          {/* ABA PEDIDOS */}
          {abaAdmin === "pedidos" && (
            <div className="space-y-6">
              {/* Filtro por Data */}
              <Card className="shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <label className="text-sm font-medium text-gray-700">Filtrar por período:</label>
                    <select
                      value={filtroData}
                      onChange={(e) => setFiltroData(e.target.value as "todos" | "semana" | "mes" | "ano")}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500"
                    >
                      <option value="todos">Todo período</option>
                      <option value="semana">Última semana</option>
                      <option value="mes">Último mês</option>
                      <option value="ano">Último ano</option>
                    </select>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4">📋 Pedidos ({pedidosFiltrados.length})</h3>
                  <div className="space-y-4">
                    {pedidosFiltrados.map((pedido) => (
                      <div key={pedido.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold">Pedido #{pedido.id}</h4>
                            <p className="text-sm text-gray-600">{pedido.data}</p>
                            <p className="text-sm">Cliente: {pedido.cliente}</p>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-green-600 text-lg">R$ {pedido.total.toFixed(2)}</div>
                            <Badge className="bg-yellow-500 text-black">{pedido.status}</Badge>
                          </div>
                        </div>
                        <div className="text-sm">
                          <strong>Tipo:</strong> {pedido.tipoEntrega === "entrega" ? "🚚 Entrega" : "🏪 Retirada"}
                          {pedido.enderecoEntrega && (
                            <div>
                              <strong>Endereço:</strong> {pedido.enderecoEntrega}
                            </div>
                          )}
                          <div>
                            <strong>Pagamento:</strong> {pedido.formaPagamento.toUpperCase()}
                          </div>
                        </div>
                        <div className="text-sm">
                          <strong>Itens:</strong>
                          <ul className="ml-4 mt-1">
                            {pedido.itens.map((item, index) => (
                              <li key={index}>
                                {item.quantidade}x {item.bebida.nome} - R${" "}
                                {(item.bebida.preco * item.quantidade).toFixed(2)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                    {pedidos.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <div className="text-4xl mb-2">📋</div>
                        <p>Nenhum pedido encontrado</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ABA ADMIN GERAL (SÓ PARA DESENVOLVEDOR) */}
          {abaAdmin === "geral" && acessoDesenvolvedor && (
            <div className="space-y-6">
              {/* 🆘 SEÇÃO DE RECUPERAÇÃO DE DADOS */}
              <Card className="shadow-lg bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold text-red-800 mb-4 flex items-center">🆘 Recuperação de Dados</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Restaurar Dados de Exemplo */}
                    <Button
                      onClick={restaurarDadosExemplo}
                      disabled={carregando}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg flex flex-col items-center space-y-2"
                    >
                      <div className="text-2xl">🔄</div>
                      <div className="text-center">
                        <div className="font-bold">Restaurar Exemplo</div>
                        <div className="text-xs opacity-80">21 produtos básicos</div>
                      </div>
                    </Button>

                    {/* Exportar Backup */}
                    <Button
                      onClick={exportarBackup}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg flex flex-col items-center space-y-2"
                    >
                      <div className="text-2xl">📤</div>
                      <div className="text-center">
                        <div className="font-bold">Exportar Backup</div>
                        <div className="text-xs opacity-80">Baixar arquivo</div>
                      </div>
                    </Button>

                    {/* Importar Backup */}
                    <label className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg flex flex-col items-center space-y-2 cursor-pointer transition-colors">
                      <div className="text-2xl">📥</div>
                      <div className="text-center">
                        <div className="font-bold">Importar Backup</div>
                        <div className="text-xs opacity-80">Restaurar arquivo</div>
                      </div>
                      <input type="file" accept=".json" onChange={importarBackup} className="hidden" />
                    </label>

                    {/* Backup Automático */}
                    <Button
                      onClick={criarBackupAutomatico}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-4 rounded-lg flex flex-col items-center space-y-2"
                    >
                      <div className="text-2xl">💾</div>
                      <div className="text-center">
                        <div className="font-bold">Backup Manual</div>
                        <div className="text-xs opacity-80">Salvar agora</div>
                      </div>
                    </Button>
                  </div>

                  <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 rounded-lg">
                    <h4 className="font-bold text-yellow-800 mb-2">💡 Dicas de Recuperação:</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>
                        • <strong>Restaurar Exemplo:</strong> Cria 6 categorias e 21 produtos básicos
                      </li>
                      <li>
                        • <strong>Backup Automático:</strong> Salva seus dados a cada 30 minutos
                      </li>
                      <li>
                        • <strong>Export/Import:</strong> Faça backup manual dos seus dados
                      </li>
                      <li>
                        • <strong>Emergência:</strong> Use "Restaurar Exemplo" para começar rapidamente
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* 💾 BACKUP SQL */}
              <Card className="shadow-lg bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold text-blue-800 mb-4 flex items-center">💾 Backup SQL com Imagens</h2>

                  <div className="bg-white rounded-lg p-4 mb-4">
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>📌 Este backup inclui:</strong>
                    </p>
                    <ul className="text-sm text-gray-700 space-y-1 ml-4">
                      <li>✅ Todas as categorias com ícones e cores</li>
                      <li>✅ Todas as bebidas com preços e estoques</li>
                      <li>
                        ✅ <strong className="text-blue-600">URLs otimizadas das imagens</strong>
                      </li>
                      <li>✅ Pronto para colar no SQL Editor do Supabase</li>
                    </ul>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button
                      onClick={exportarBackupSQL}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg flex flex-col items-center space-y-2"
                    >
                      <div className="text-2xl">💾</div>
                      <div className="text-center">
                        <div className="font-bold">Exportar SQL Completo</div>
                        <div className="text-xs opacity-80">Backup completo</div>
                      </div>
                    </Button>

                    <Button
                      onClick={copiarBackupSQL}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-lg flex flex-col items-center space-y-2"
                    >
                      <div className="text-2xl">📋</div>
                      <div className="text-center">
                        <div className="font-bold">Copiar SQL</div>
                        <div className="text-xs opacity-80">Área de transferência</div>
                      </div>
                    </Button>

                    {/* NOVO BOTÃO */}
                    <Button
                      onClick={exportarSQLOtimizado}
                      disabled={carregando}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-lg flex flex-col items-center space-y-2"
                    >
                      {carregando ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Gerando...</span>
                        </>
                      ) : (
                        <>
                          <div className="text-2xl">✨</div>
                          <div className="text-center">
                            <div className="font-bold">Exportar SQL Otimizado</div>
                            <div className="text-xs opacity-80">Imagens compactas</div>
                          </div>
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={() => setModalCorrigirImagensAberto(true)}
                      className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-lg flex flex-col items-center space-y-2"
                    >
                      <div className="text-2xl">🖼️</div>
                      <div className="text-center">
                        <div className="font-bold">Corrigir Imagens</div>
                        <div className="text-xs opacity-80">Gerenciar fotos</div>
                      </div>
                    </Button>
                  </div>

                  <div className="mt-4 p-4 bg-blue-100 border border-blue-300 rounded-lg">
                    <h4 className="font-bold text-blue-800 mb-2">📝 Como usar:</h4>
                    <ol className="text-sm text-blue-700 space-y-1">
                      <li>1. Clique em "Exportar SQL Otimizado"</li>
                      <li>2. Copie o SQL gerado</li>
                      <li>3. Vá no Supabase → SQL Editor</li>
                      <li>4. Cole o código SQL</li>
                      <li>5. Clique em "Run" para executar</li>
                      <li>6. ✅ Pronto! Imagens compactas aplicadas!</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>

              {/* 🔧 ESTATÍSTICAS DO SISTEMA */}
              <Card className="shadow-lg bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                    📊 Estatísticas do Sistema
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-lg border-2 border-blue-200">
                      <h3 className="font-bold text-blue-800 mb-2">📦 Produtos</h3>
                      <p className="text-3xl font-bold text-blue-600">{bebidas.length}</p>
                      <p className="text-sm text-gray-600 mt-1">Total cadastrado</p>
                    </div>

                    <div className="bg-white p-4 rounded-lg border-2 border-purple-200">
                      <h3 className="font-bold text-purple-800 mb-2">🏷️ Categorias</h3>
                      <p className="text-3xl font-bold text-purple-600">{categorias.length}</p>
                      <p className="text-sm text-gray-600 mt-1">Total cadastrado</p>
                    </div>

                    <div className="bg-white p-4 rounded-lg border-2 border-green-200">
                      <h3 className="font-bold text-green-800 mb-2">📋 Pedidos</h3>
                      <p className="text-3xl font-bold text-green-600">{pedidos.length}</p>
                      <p className="text-sm text-gray-600 mt-1">Total registrado</p>
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-green-100 border border-green-300 rounded-lg">
                    <h4 className="font-bold text-green-800 mb-2">✅ Status do Sistema:</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>
                        • Banco de dados: <strong>Conectado</strong>
                      </li>
                      <li>
                        • Backup automático: <strong>Ativo (a cada 30 min)</strong>
                      </li>
                      <li>
                        • Limpeza automática: <strong>Ativa (semanal)</strong>
                      </li>
                      <li>
                        • Modo: <strong>{modoTeste ? "🧪 Teste" : "🔴 Produção"}</strong>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    )
  }

  // TELA DO CARDÁPIO (padrão)
  if (carregando) {
    return <Loading3D />
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="bg-gradient-to-r from-orange-400 via-orange-500 to-yellow-500 p-4 text-white sticky top-0 z-10 shadow-lg">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => setTelaAtual("inicio")}
            className="text-white hover:bg-white/20 font-semibold hover-lift"
          >
            ← Início
          </Button>
          <div className="flex items-center space-x-3">
            <div
              className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/30 cursor-pointer hover-lift animate-logo-suave"
              onDoubleClick={acessoAdmin}
            >
              <Image
                src="/logo-bebidas-on.png"
                alt="Logo"
                width={40}
                height={40}
                className="w-full h-full object-cover animate-float"
              />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold">Cardápio</h1>
              {modoTeste && <Badge className="bg-yellow-500 text-black text-xs">🧪 DEMO</Badge>}
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={() => setTelaAtual("carrinho")}
            className="text-white hover:bg-white/20 relative font-semibold hover-lift"
            disabled={!lojaAberta}
          >
            <ShoppingCart className="w-6 h-6 mr-2" />
            <span className="hidden sm:inline">Carrinho</span>
            {totalItens > 0 && (
              <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs min-w-[20px] h-5 flex items-center justify-center rounded-full animate-bounce">
                {totalItens}
              </Badge>
            )}
          </Button>
        </div>
      </div>
      {!lojaAberta && (
        <div className="bg-gradient-to-r from-orange-100 to-yellow-50 border-l-4 border-orange-500 p-4 mx-4 mt-4 rounded-lg shadow-lg animate-pulse">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">⏰</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-orange-800 font-bold">
                Loja Fechada: Não estamos fazendo pedidos no momento. Volte mais tarde!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* AQUI: Adicione bg-white rounded-lg shadow-inner para o fundo do cardápio */}
      <div className="flex-1 max-w-6xl mx-auto p-4 bg-white rounded-lg shadow-inner">
        {/* Barra de Busca */}
        <div className="mb-6">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Buscar bebidas..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10 py-3 rounded-xl border-orange-300 focus:border-orange-500"
            />
          </div>
        </div>

        {/* Filtros de Categoria */}
        <div className="flex flex-wrap gap-3 mb-6 justify-center overflow-x-auto pb-2">
          <Button
            variant={categoriaFiltro === "todas" ? "default" : "outline"}
            onClick={() => setCategoriaFiltro("todas")}
            className="px-4 py-2 hover-lift transition-all duration-300 whitespace-nowrap"
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
                className={`px-4 py-2 hover-lift transition-all duration-300 whitespace-nowrap ${
                  categoriaFiltro === categoria.id
                    ? `${corInfo.classe} text-white hover:${corInfo.classe}/90`
                    : `border-2 ${corInfo.classeTexto} hover:${corInfo.classeBg}`
                }`}
              >
                <IconeComponent className="w-4 h-4 mr-2" />
                {categoria.nome}
              </Button>
            )
          })}
        </div>

        {/* Lista de Bebidas */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {bebidasFiltradas.map((bebida, index) => {
            const IconeComponent = bebida.categoria ? getIconeCategoria(bebida.categoria.icone) : Package
            const corInfo = bebida.categoria ? getCorCategoria(bebida.categoria.cor) : getCorCategoria("amber")

            return (
              <Card
                key={bebida.id}
                className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50 hover-lift transition-all duration-300 hover:shadow-xl animate-fadeInUp"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-6">
                  <div className="relative mb-4">
                    <div className="w-full h-48 rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={bebida.imagem || "/placeholder.svg?height=200&width=300&text=Bebida"}
                        alt={bebida.nome}
                        width={300}
                        height={200}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                      />
                    </div>
                    <div className="absolute top-2 right-2">
                      <Badge className={`${getStatusEstoque(bebida.estoque).cor} text-white animate-pulse`}>
                        {bebida.estoque === 0 ? "Esgotado" : bebida.estoque <= 5 ? `${bebida.estoque}` : "OK"}
                      </Badge>
                    </div>
                    {!lojaAberta && (
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-orange-500 text-white animate-pulse">FECHADO</Badge>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h3 className="font-bold text-xl text-gray-800 mb-1 leading-tight break-words">{bebida.nome}</h3>
                      {bebida.descricao && <p className="text-gray-600 text-sm line-clamp-2">{bebida.descricao}</p>}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl font-bold text-green-600">R$ {bebida.preco.toFixed(2)}</span>
                        {bebida.categoria && (
                          <Badge className={`${corInfo.classeBg} ${corInfo.classeTexto} flex items-center space-x-1`}>
                            <IconeComponent className="w-3 h-3" />
                            <span className="hidden md:inline">{bebida.categoria.nome}</span>
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Seletor de Quantidade */}
                    {bebida.estoque > 0 && (
                      <div className="flex items-center justify-center space-x-2 bg-gray-50 rounded-lg p-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setQuantidadeSelecionada(bebida.id, Math.max(1, getQuantidadeSelecionada(bebida.id) - 1))
                          }
                          className="h-8 w-8 p-0 border-orange-300 hover:bg-orange-100"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="font-bold text-lg w-8 text-center">{getQuantidadeSelecionada(bebida.id)}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setQuantidadeSelecionada(
                              bebida.id,
                              Math.min(bebida.estoque, getQuantidadeSelecionada(bebida.id) + 1),
                            )
                          }
                          className="h-8 w-8 p-0 border-orange-300 hover:bg-orange-100"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    )}

                    <Button
                      onClick={() => {
                        if (!lojaAberta) {
                          addToast({
                            type: "warning",
                            title: "🏪 Loja Fechada!",
                            description: "Não estamos aceitando pedidos no momento.",
                          })
                          return
                        }
                        adicionarAoCarrinho(bebida, getQuantidadeSelecionada(bebida.id))
                      }}
                      disabled={bebida.estoque === 0}
                      className={`w-full px-2 py-2 rounded-xl font-semibold text-[10px] sm:text-xs transition-all duration-200 hover-lift flex items-center justify-center gap-1 whitespace-nowrap ${
                        bebida.estoque === 0
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : !lojaAberta
                            ? "bg-gradient-to-r from-orange-400 to-yellow-500 hover:from-orange-500 hover:to-yellow-600 text-white shadow-lg hover:shadow-xl"
                            : "bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white shadow-lg hover:shadow-xl animate-glow"
                      }`}
                    >
                      {bebida.estoque === 0 ? (
                        "❌ Esgotado"
                      ) : !lojaAberta ? (
                        "Loja Fechada"
                      ) : (
                        <>
                          <Plus className="w-3 h-3" />
                          <span>Adicionar ao Carrinho</span>
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {bebidasFiltradas.length === 0 && (
          <div className="text-center py-16">
            <div className="bg-gradient-to-br from-orange-100 to-yellow-100 rounded-full w-24 h-24 flex items-center justify-center gap-2 mx-auto mb-6">
              <Search className="w-12 h-12 text-orange-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">Nenhuma bebida encontrada</h2>
            <p className="text-gray-500 mb-6">Tente buscar por outro termo ou categoria</p>
            <Button
              onClick={() => {
                setBusca("")
                setCategoriaFiltro("todas")
              }}
              className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-bold px-8 py-3 rounded-xl hover-lift"
            >
              🔄 Limpar Filtros
            </Button>
          </div>
        )}
      </div>

      {/* Rodapé */}
      <Rodape />

      {/* 🔥 MODAL DE SENHA REDESENHADO CONFORME A IMAGEM */}
      {modalSenhaAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            {/* Header com gradiente laranja */}
            <div className="bg-gradient-to-r from-orange-400 via-orange-500 to-yellow-500 p-8 text-center text-white">
              <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Acesso Administrativo</h2>
              <p className="text-white/90 text-sm">Digite a senha para continuar</p>
            </div>

            {/* Conteúdo do modal */}
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Senha de Administrador</label>
                <div className="relative">
                  <input
                    type="password"
                    value={senhaInput}
                    onChange={(e) => setSenhaInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && processarSenha()}
                    className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-700 placeholder-gray-400"
                    placeholder="Digite sua senha..."
                    disabled={senhaCarregando}
                  />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <Key className="w-5 h-5 text-orange-500" />
                  </div>
                </div>
              </div>

              {/* Botões */}
              <div className="flex space-x-3">
                <Button
                  onClick={processarSenha}
                  disabled={senhaCarregando || !senhaInput.trim()}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  {senhaCarregando ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Verificando...</span>
                    </>
                  ) : (
                    <>
                      <span>🚀</span>
                      <span>Acessar</span>
                    </>
                  )}
                </Button>
                <Button
                  onClick={fecharModalSenha}
                  disabled={senhaCarregando}
                  className="flex-1 bg-white hover:bg-gray-50 text-red-600 font-semibold py-3 rounded-xl border-2 border-gray-200 transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <span>✕</span>
                  <span>Cancelar</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🆕 MODAL DE CORREÇÃO DE IMAGENS */}
      {modalCorrigirImagensAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full my-8">
            <div className="bg-gradient-to-r from-purple-400 via-purple-500 to-indigo-500 p-6 text-white flex justify-between items-center sticky top-0">
              <h2 className="text-2xl font-bold">🖼️ Gerenciar Imagens</h2>
              <Button
                onClick={() => setModalCorrigirImagensAberto(false)}
                className="bg-white/20 hover:bg-white/30 text-white"
              >
                ✕ Fechar
              </Button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>📋 Instruções:</strong>
                  <br />• Bebidas com placeholder ou imagens grandes aparecem abaixo
                  <br />• Clique em "Upload" para adicionar imagem
                  <br />• Ou clique em "Gerar Placeholder" para criar uma imagem temporária
                </p>
              </div>

              {/* 💾 BOTÃO EXPORTAR SQL OTIMIZADO */}
              <div className="mb-6">
                <Button
                  onClick={exportarSQLOtimizado}
                  disabled={carregando}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 rounded-lg flex items-center justify-center space-x-2"
                >
                  {carregando ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Gerando SQL...</span>
                    </>
                  ) : (
                    <>
                      <span>💾</span>
                      <span>Exportar SQL Otimizado</span>
                    </>
                  )}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bebidas
                  .filter(
                    (b) =>
                      b.imagem.includes("placeholder.svg") || b.imagem.includes("blob.vercel") || b.imagem.length > 500,
                  )
                  .map((bebida) => (
                    <Card key={bebida.id} className="shadow-md">
                      <CardContent className="p-4">
                        <div className="relative mb-3">
                          <div className="w-full h-32 rounded-lg overflow-hidden bg-gradient-to-br from-orange-400 to-yellow-500 flex items-center justify-center">
                            <Image
                              src={bebida.imagem || "/placeholder.svg"}
                              alt={bebida.nome}
                              width={200}
                              height={128}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                ;(e.target as HTMLImageElement).src =
                                  "/placeholder.svg?height=128&width=200&text=Bebida"
                              }}
                            />
                          </div>
                        </div>

                        <h3 className="font-bold text-sm mb-2 line-clamp-2">{bebida.nome}</h3>
                        <p className="text-xs text-gray-600 mb-3">R$ {bebida.preco.toFixed(2)}</p>

                        <div className="space-y-2">
                          <label className="block">
                            <Button
                              as="div"
                              className="w-full bg-green-600 hover:bg-green-700 text-white text-xs py-2 cursor-pointer"
                            >
                              📤 Upload Imagem
                            </Button>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  const reader = new FileReader()
                                  reader.onload = async (event) => {
                                    const imageUrl = event.target?.result as string
                                    try {
                                      await supabase.from("bebidas").update({ imagem: imageUrl }).eq("id", bebida.id)

                                      await carregarBebidas()

                                      addToast({
                                        type: "success",
                                        title: "Imagem atualizada!",
                                        description: `${bebida.nome} agora tem uma nova imagem`,
                                      })
                                    } catch (error) {
                                      addToast({
                                        type: "error",
                                        title: "Erro ao salvar",
                                        description: "Tente novamente",
                                      })
                                    }
                                  }
                                  reader.readAsDataURL(file)
                                }
                              }}
                              className="hidden"
                            />
                          </label>

                          <Button
                            onClick={async () => {
                              const cores = [
                                "from-orange-400 to-red-500",
                                "from-blue-400 to-purple-500",
                                "from-green-400 to-teal-500",
                                "from-yellow-400 to-orange-500",
                                "from-pink-400 to-purple-500",
                              ]
                              const corAleatoria = cores[Math.floor(Math.random() * cores.length)]
                              const placeholderUrl = `/placeholder.svg?height=200&width=300&text=${encodeURIComponent(
                                bebida.nome,
                              )}&gradient=${encodeURIComponent(corAleatoria)}`

                              try {
                                await supabase.from("bebidas").update({ imagem: placeholderUrl }).eq("id", bebida.id)

                                await carregarBebidas()

                                addToast({
                                  type: "success",
                                  title: "Placeholder gerado!",
                                  description: `${bebida.nome} tem placeholder temporário`,
                                })
                              } catch (error) {
                                addToast({
                                  type: "error",
                                  title: "Erro",
                                  description: "Não foi possível gerar placeholder",
                                })
                              }
                            }}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs py-2"
                          >
                            🎨 Gerar Placeholder
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>

              {bebidas.filter(
                (b) =>
                  b.imagem.includes("placeholder.svg") || b.imagem.includes("blob.vercel") || b.imagem.length > 500,
              ).length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">✅</div>
                  <h3 className="text-xl font-bold text-green-600 mb-2">Todas as imagens estão OK!</h3>
                  <p className="text-gray-600">Nenhuma bebida precisa de correção</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
