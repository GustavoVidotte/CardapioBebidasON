"use client"

export function Loading3D() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-orange-500 via-orange-400 to-yellow-400 flex items-center justify-center z-50">
      <div className="text-center">
        {/* Cerveja 3D girando */}
        <div className="beer-container mb-8">
          <div className="beer-glass">
            <div className="beer-liquid"></div>
            <div className="beer-foam"></div>
            <div className="beer-bubble bubble-1"></div>
            <div className="beer-bubble bubble-2"></div>
            <div className="beer-bubble bubble-3"></div>
          </div>
        </div>

        {/* Texto com animação */}
        <h2 className="text-3xl font-bold text-white mb-4 animate-pulse">Carregando Bebidas...</h2>

        {/* Barra de progresso animada */}
        <div className="w-64 h-2 bg-white/30 rounded-full overflow-hidden mx-auto">
          <div className="h-full bg-white rounded-full animate-loading-bar"></div>
        </div>
      </div>

      <style jsx>{`
        .beer-container {
          perspective: 1000px;
          animation: float 3s ease-in-out infinite;
        }

        .beer-glass {
          width: 100px;
          height: 140px;
          background: linear-gradient(to bottom, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 100%);
          border-radius: 0 0 20px 20px;
          position: relative;
          margin: 0 auto;
          box-shadow: 
            inset 0 0 20px rgba(255,255,255,0.3),
            0 10px 40px rgba(0,0,0,0.3);
          animation: rotate3d 4s ease-in-out infinite;
          transform-style: preserve-3d;
        }

        .beer-liquid {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 70%;
          background: linear-gradient(to bottom, #FFD700 0%, #FFA500 100%);
          border-radius: 0 0 20px 20px;
          animation: wave 2s ease-in-out infinite;
        }

        .beer-foam {
          position: absolute;
          top: 20px;
          left: 0;
          right: 0;
          height: 25px;
          background: linear-gradient(to bottom, #FFFFFF 0%, #FFFACD 100%);
          border-radius: 50% 50% 0 0;
          box-shadow: 
            0 -5px 10px rgba(255,255,255,0.5),
            inset 0 2px 5px rgba(255,255,255,0.8);
          animation: foam 3s ease-in-out infinite;
        }

        .beer-bubble {
          position: absolute;
          background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8), rgba(255,255,255,0.2));
          border-radius: 50%;
          animation: bubble-rise 2s ease-in-out infinite;
        }

        .bubble-1 {
          width: 8px;
          height: 8px;
          left: 30%;
          bottom: 10px;
          animation-delay: 0s;
        }

        .bubble-2 {
          width: 6px;
          height: 6px;
          left: 50%;
          bottom: 20px;
          animation-delay: 0.5s;
        }

        .bubble-3 {
          width: 10px;
          height: 10px;
          left: 65%;
          bottom: 15px;
          animation-delay: 1s;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        @keyframes rotate3d {
          0%, 100% { transform: rotateY(-15deg) rotateX(5deg); }
          50% { transform: rotateY(15deg) rotateX(-5deg); }
        }

        @keyframes wave {
          0%, 100% { transform: translateY(0) scaleY(1); }
          50% { transform: translateY(-3px) scaleY(1.05); }
        }

        @keyframes foam {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(1.1); }
        }

        @keyframes bubble-rise {
          0% {
            transform: translateY(0) scale(1);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100px) scale(0.5);
            opacity: 0;
          }
        }

        @keyframes loading-bar {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }

        .animate-loading-bar {
          animation: loading-bar 1.5s ease-in-out;
        }
      `}</style>
    </div>
  )
}

export default Loading3D
