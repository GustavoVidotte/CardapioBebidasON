export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
        <p className="text-lg font-semibold text-gray-700">Carregando Bebidas ON...</p>
        <p className="text-sm text-gray-500">Preparando seu cardápio 🍻</p>
      </div>
    </div>
  )
}


/* // TELA DE LOADING INICIAL
  if (carregandoDados) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center space-y-4 animate-fadeInScale">
          <div className="w-24 h-24 mx-auto rounded-full overflow-hidden shadow-2xl border-4 border-white/30 animate-logo-chamativa">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-MAf9kkdTHQNURZA6HEvE69rfyuTkMS.png"
              alt="Bebidas ON Logo"
              width={96}
              height={96}
              className="w-full h-full object-cover"
              priority
            />
          </div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="text-xl font-bold text-gray-700">Carregando Bebidas ON...</p>
          <p className="text-sm text-gray-500">Preparando seu cardápio gelado 🍻</p>
          {modoTeste && <Badge className="bg-yellow-500 text-black text-sm animate-bounce">🧪 MODO DEMONSTRAÇÃO</Badge>}
        </div>
      </div>
    )
  }
*/
