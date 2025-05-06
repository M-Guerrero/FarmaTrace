import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMessage('Error al iniciar sesión: ' + error.message);
    } else {
      const user = data.user;
      fetchUserRole(user.id);  // Pasamos el user.id al fetchUserRole
    }
  };

  const fetchUserRole = async (user_id) => {
    // Verificamos si el rol está correctamente asignado a través de la columna user_id
    const { data, error } = await supabase
      .from('usuario')
      .select('rol')  // Seleccionamos solo el rol
      .eq('user_id', user_id)  // Cambié 'id' por 'user_id' para coincidir con la columna
      .single();  // Debería devolver un solo registro

    if (error || !data) {
      setErrorMessage('No se pudo obtener el rol del usuario.');
    } else {
      const userRole = data.rol;  // Guardamos el rol que viene de la base de datos
      localStorage.setItem('userRole', userRole);  // Almacenamos el rol en el localStorage
      redirectToRolePage(userRole);  // Redirigimos a la página correspondiente
    }
  };

  const redirectToRolePage = (role) => {
    if (role === 'no_rol') {
      navigate('/sin-acceso');
    } else if (role === 'farmacia') {
      navigate('/crear-pedido');
    } else if (role === 'celador') {
      navigate('/pedidos-celador');
    } else if (role === 'enfermeria') {
      navigate('/pedidos-enfermeria')
    } else {
      navigate('/sin-acceso');
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
            {<img src="./PharmaTrace.png" alt="Logo" style={{ maxWidth: '200px' }} />}
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
          <h1 style={{
            textAlign: 'center',
            marginBottom: '1rem',
            color: '#52B2BF',
            fontFamily: 'Arial, sans-serif'
          }}>
            Iniciar Sesión
          </h1>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                padding: '0.8rem',
                borderRadius: '6px',
                border: '1px solid #52B2BF',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.3s ease',
                fontFamily: 'Arial, sans-serif'
              }}
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                padding: '0.8rem',
                borderRadius: '6px',
                border: '1px solid #52B2BF',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.3s ease',
                fontFamily: 'Arial, sans-serif'
              }}
            />
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
                fontFamily: 'Arial, sans-serif'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#9bb9cb'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#B6CCD8'}
            >
              Entrar
            </button>
          </form>
  
          {errorMessage && (
            <p style={{
              color: 'red',
              marginTop: '1rem',
              textAlign: 'center',
              fontFamily: 'Arial, sans-serif'
            }}>
              {errorMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;