import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

function CambioContraseña() {
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [repetirPassword, setRepetirPassword] = useState('');
  const [mensaje, setMensaje] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');

    if (nuevaPassword !== repetirPassword) {
      setMensaje('Las contraseñas no coinciden.');
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: nuevaPassword,
    });

    if (error) {
      setMensaje(`Error: ${error.message}`);
    } else {
      setMensaje('Contraseña actualizada con éxito.');
      setTimeout(() => navigate('/'), 2000);
    }
  };

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
        justifyContent: 'center'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '20px',
        }}>
          <h1 style={{
            fontSize: '2.5rem',
            color: '#52B2BF',
            fontFamily: 'Arial, sans-serif',
            marginBottom: '0.5rem',
          }}>
            {/*<img src="./PharmaTraceLogo.jpg" alt="Logo" style={{ maxWidth: '200px' }} />*/}
            Cambiar Contraseña
          </h1>
        </div>

        <div style={{
          padding: '2rem',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
          width: '100%',
          maxWidth: '400px',
          border: `2px solid #52B2BF`
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ fontSize: '1rem', color: '#52B2BF', marginBottom: '0.5rem' }}>Nueva Contraseña</label>
              <input
                type="password"
                value={nuevaPassword}
                onChange={(e) => setNuevaPassword(e.target.value)}
                required
                style={{
                  padding: '0.8rem',
                  borderRadius: '6px',
                  border: '1px solid #52B2BF',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.3s ease',
                  fontFamily: 'Arial, sans-serif',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '1rem', color: '#52B2BF', marginBottom: '0.5rem' }}>Repetir Nueva Contraseña</label>
              <input
                type="password"
                value={repetirPassword}
                onChange={(e) => setRepetirPassword(e.target.value)}
                required
                style={{
                  padding: '0.8rem',
                  borderRadius: '6px',
                  border: '1px solid #52B2BF',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.3s ease',
                  fontFamily: 'Arial, sans-serif',
                }}
              />
            </div>
            <button
              type="submit"
              style={{
                padding: '0.8rem',
                borderRadius: '6px',
                backgroundColor: '#52B2BF',
                border: 'none',
                color: 'white',
                fontSize: '1rem',
                cursor: 'pointer',
                transition: 'background-color 0.3s ease',
                fontFamily: 'Arial, sans-serif',
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#9bb9cb'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#B6CCD8'}
            >
              Cambiar Contraseña
            </button>
          </form>

          {mensaje && (
            <p style={{
              color: 'red',
              marginTop: '1rem',
              textAlign: 'center',
              fontFamily: 'Arial, sans-serif'
            }}>
              {mensaje}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default CambioContraseña;