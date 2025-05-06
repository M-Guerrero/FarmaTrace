function SinAcceso() {
  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f5f5f5',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
        border: '2px solid #52B2BF'
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          color: '#52B2BF',
          fontFamily: 'Arial, sans-serif',
          marginBottom: '1rem',
        }}>
          No tienes acceso
        </h1>
        <p style={{
          fontSize: '1rem',
          color: '#333',
          fontFamily: 'Arial, sans-serif',
          textAlign: 'center',
        }}>
          Aún no tienes acceso a esta aplicación. Por favor, contacta con el servicio técnico para obtener acceso.
        </p>
      </div>
    </div>
  );
}

export default SinAcceso;
