"use client"

export function Loading3D() {
  return (
    <div className="loading-3d-container">
      <div className="loading-3d-content">
        {/* Cerveja 3D girando */}
        <div className="beer-container">
          <div className="beer-glass">
            <div className="beer-liquid"></div>
            <div className="beer-foam"></div>
            <div className="beer-bubble bubble-1"></div>
            <div className="beer-bubble bubble-2"></div>
            <div className="beer-bubble bubble-3"></div>
          </div>
        </div>

        {/* Texto com animação */}
        <h2 className="loading-3d-title">Carregando Bebidas...</h2>

        {/* Barra de progresso animada */}
        <div className="loading-3d-progress-container">
          <div className="loading-3d-progress-bar"></div>
        </div>
      </div>
    </div>
  )
}

export default Loading3D
