"use client"

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-orange-500 to-red-500 flex items-center justify-center overflow-hidden relative">
      {/* Fundo animado com partículas */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/10"
            style={{
              width: `${Math.random() * 100 + 50}px`,
              height: `${Math.random() * 100 + 50}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${Math.random() * 10 + 10}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* Container 3D */}
      <div className="relative z-10 text-center">
        {/* Cerveja 3D animada */}
        <div className="relative w-40 h-40 mx-auto mb-8 perspective-1000">
          <div className="w-full h-full animate-spin-3d transform-style-3d">
            {/* Corpo da cerveja */}
            <div className="absolute inset-0 bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 rounded-t-3xl rounded-b-lg shadow-2xl transform-style-3d">
              {/* Reflexo */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent rounded-t-3xl opacity-50"></div>

              {/* Espuma */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-32 h-16 bg-gradient-to-b from-yellow-50 to-yellow-100 rounded-t-full shadow-lg animate-foam">
                <div className="absolute top-0 left-1/4 w-8 h-8 bg-white/80 rounded-full blur-sm animate-bubble-1"></div>
                <div className="absolute top-2 right-1/4 w-6 h-6 bg-white/80 rounded-full blur-sm animate-bubble-2"></div>
                <div className="absolute top-1 left-1/2 w-5 h-5 bg-white/80 rounded-full blur-sm animate-bubble-3"></div>
              </div>

              {/* Bolhas subindo */}
              <div className="absolute bottom-4 left-1/4 w-2 h-2 bg-white/60 rounded-full animate-rise-1"></div>
              <div className="absolute bottom-8 left-1/2 w-3 h-3 bg-white/50 rounded-full animate-rise-2"></div>
              <div className="absolute bottom-6 right-1/4 w-2 h-2 bg-white/60 rounded-full animate-rise-3"></div>
            </div>
          </div>
        </div>

        {/* Texto */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-white drop-shadow-lg animate-pulse-slow">Bebidas ON</h1>
          <p className="text-xl text-white/90 font-medium animate-fade-in">Carregando seu cardápio...</p>

          {/* Barra de progresso */}
          <div className="w-64 h-2 mx-auto bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
            <div className="h-full bg-gradient-to-r from-white via-yellow-200 to-white animate-progress rounded-full shadow-lg"></div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(180deg); }
        }
        
        @keyframes spin-3d {
          0% { transform: rotateY(0deg) rotateX(10deg); }
          100% { transform: rotateY(360deg) rotateX(10deg); }
        }
        
        @keyframes foam {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        @keyframes bubble-1 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.8; }
          50% { transform: translate(-5px, -10px) scale(1.2); opacity: 0.4; }
        }
        
        @keyframes bubble-2 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.8; }
          50% { transform: translate(5px, -8px) scale(1.1); opacity: 0.5; }
        }
        
        @keyframes bubble-3 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.8; }
          50% { transform: translate(0, -12px) scale(1.3); opacity: 0.3; }
        }
        
        @keyframes rise-1 {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 0.8; }
          90% { opacity: 0.8; }
          100% { transform: translateY(-100px); opacity: 0; }
        }
        
        @keyframes rise-2 {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 0.8; }
          90% { opacity: 0.8; }
          100% { transform: translateY(-120px); opacity: 0; }
        }
        
        @keyframes rise-3 {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 0.8; }
          90% { opacity: 0.8; }
          100% { transform: translateY(-110px); opacity: 0; }
        }
        
        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .animate-spin-3d { animation: spin-3d 4s linear infinite; }
        .animate-foam { animation: foam 2s ease-in-out infinite; }
        .animate-bubble-1 { animation: bubble-1 3s ease-in-out infinite; }
        .animate-bubble-2 { animation: bubble-2 3.5s ease-in-out infinite; }
        .animate-bubble-3 { animation: bubble-3 2.8s ease-in-out infinite; }
        .animate-rise-1 { animation: rise-1 3s ease-in-out infinite; }
        .animate-rise-2 { animation: rise-2 3.5s ease-in-out infinite; }
        .animate-rise-3 { animation: rise-3 3.2s ease-in-out infinite; }
        .animate-progress { animation: progress 1.5s ease-in-out infinite; }
        .animate-pulse-slow { animation: pulse-slow 2s ease-in-out infinite; }
        .animate-fade-in { animation: fade-in 0.8s ease-out; }
      `}</style>
    </div>
  )
}
