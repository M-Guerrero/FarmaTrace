import React, { useRef, useEffect, useState } from 'react';

function Carrusel({ titulo, pedidos, botonTexto, siguienteEstado, avanzarEstado, mostrarFecha, mostrarEstado }) {
  const scrollRef = useRef();
  const [showArrows, setShowArrows] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      if (scrollRef.current) {
        const { scrollWidth, clientWidth } = scrollRef.current;
        setShowArrows(scrollWidth > clientWidth);
      }
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [pedidos]);

  const scroll = (dir) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: dir === 'left' ? -300 : 300,
        behavior: 'smooth',
      });
    }
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div style={{ marginBottom: '2rem' }}>
      <h2 style={{ color: '#52B2BF', marginBottom: '1rem' }}>{titulo}</h2>
      <div style={{ position: 'relative' }}>
        {showArrows && (
          <button onClick={() => scroll('left')} style={navBtnStyleLeft}>
            &#9664;
          </button>
        )}
        <div
          ref={scrollRef}
          style={{
            display: 'flex',
            overflowX: 'auto',
            scrollBehavior: 'smooth',
            gap: '1rem',
            paddingBottom: '1rem',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {pedidos.length > 0 ? (
            pedidos.map((p) => (
              <div key={p.pedido_id} style={tarjetaStyle}>
                <p><strong>Habitación:</strong> {p.habitacion}</p>
                <p><strong>Medicamento:</strong> {p.medicamento}</p>
                <p><strong>Estado:</strong> {p.estado}</p>
                {mostrarEstado && p.estado && (
                  <p><strong>Estado actual:</strong> {p.estado}</p>
                )}
                {mostrarFecha && p.fechaUltimoCambio && (
                  <p><strong>Última actualización:</strong> {formatearFecha(p.fechaUltimoCambio)}</p>
                )}
                {botonTexto && (
                  <button
                    onClick={() => avanzarEstado(p.pedido_id, siguienteEstado)}
                    style={botonPedido}
                  >
                    {botonTexto}
                  </button>
                )}
              </div>
            ))
          ) : (
            <div style={tarjetaVacia}>
              <p style={{ textAlign: 'center', color: '#aaa' }}>No hay pedidos.</p>
            </div>
          )}
        </div>
        {showArrows && (
          <button onClick={() => scroll('right')} style={navBtnStyleRight}>
            &#9654;
          </button>
        )}
      </div>
    </div>
  );
}

const tarjetaStyle = {
  minWidth: '250px',
  maxWidth: '250px',
  minHeight: '180px',
  backgroundColor: '#ffffff',
  border: '2px solid #52B2BF',
  borderRadius: '12px',
  padding: '1rem',
  boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
};

const tarjetaVacia = {
  minWidth: '100%',
  minHeight: '180px',
  backgroundColor: '#ffffff',
  border: '2px solid #52B2BF',
  borderRadius: '12px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
};

const botonPedido = {
  marginTop: '1rem',
  padding: '0.5rem',
  backgroundColor: '#52B2BF',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
};

const navBtnBase = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  backgroundColor: 'rgba(128, 128, 128, 0.5)',
  border: 'none',
  borderRadius: '50%',
  width: '40px',
  height: '40px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.2rem',
  color: 'white',
  cursor: 'pointer',
  zIndex: 1,
  padding: 0,
};

const navBtnHoverStyle = {
  backgroundColor: 'rgba(128, 128, 128, 0.8)', // más opaco al hacer hover
};

const navBtnStyleLeft = { ...navBtnBase, left: '-20px' };
const navBtnStyleRight = { ...navBtnBase, right: '-20px' };

export default Carrusel;
