import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

function CrearPedido() {
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();
  const [habitacion, setHabitacion] = useState('');
  const [medicamento, setMedicamento] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const verificarRolUsuario = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from('usuario')
        .select('rol')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error al obtener el rol:', error.message);
        setUserRole(null);
      } else {
        setUserRole(data.rol); 
      }
    } else {
      navigate('/login');
    }
  };

  useEffect(() => {
    verificarRolUsuario(); 
  }, []);

  useEffect(() => {
    if (userRole && userRole !== 'farmacia') {
      navigate('/sin-acceso'); 
    }
  }, [userRole, navigate]);

  if (userRole === null) {
    return <div>Loading...</div>;
  }

  const verificarHabitacion = async (habitacionIngresada) => {
    const habitacionFormateada = habitacionIngresada.trim();
  
    const { data, error } = await supabase
      .from('ubicacion')
      .select('habitacion', { head: false })
      .eq('habitacion', habitacionFormateada)
      .maybeSingle();
  
    if (error) {
      console.error('Error al verificar habitación:', error.message);
      return false;
    }
  
    return !!data;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const habitacionValida = await verificarHabitacion(habitacion);

    if (!habitacionValida) {
      setErrorMessage('La habitación no existe. Por favor, ingrese una habitación válida.');
      return;
    }

    const { error } = await supabase
      .from('pedido')
      .insert([
        {
          medicamento: medicamento.trim(),
          habitacion: habitacion.trim(),
          estado: 'En proceso',
        },
      ]);

    if (error) {
      console.error('Error al crear el pedido:', error.message);
      setErrorMessage('Error al crear el pedido. Intente nuevamente.');
    } else {
      setSuccessMessage('Pedido creado correctamente.');
      setMedicamento('');
      setHabitacion('');
    }
  };

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f5f5f5',
      padding: '20px',
    }}>
      <div style={{
        padding: '2rem',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '400px',
        border: `2px solid #52B2BF`,
      }}>
        <h1 style={{
          textAlign: 'center',
          marginBottom: '1rem',
          color: '#52B2BF',
          fontFamily: 'Arial, sans-serif',
        }}>
          Crear Pedido
        </h1>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label htmlFor="medicamento" style={{ fontSize: '1rem', color: '#333', fontWeight: '600', marginBottom: '0.5rem' }}>
              Medicamento:
            </label>
            <input
              type="text"
              id="medicamento"
              value={medicamento}
              onChange={(e) => setMedicamento(e.target.value)}
              placeholder="Ingrese el medicamento"
              required
              style={{
                padding: '0.8rem',
                borderRadius: '6px',
                border: '1px solid #52B2BF',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.3s ease',
                fontFamily: 'Arial, sans-serif',
                marginBottom: '1rem'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label htmlFor="habitacion" style={{ fontSize: '1rem', color: '#333', fontWeight: '600', marginBottom: '0.5rem' }}>
              Habitación:
            </label>
            <input
              type="text"
              id="habitacion"
              value={habitacion}
              onChange={(e) => setHabitacion(e.target.value)}
              placeholder="Ingrese la habitación"
              required
              style={{
                padding: '0.8rem',
                borderRadius: '6px',
                border: '1px solid #52B2BF',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.3s ease',
                fontFamily: 'Arial, sans-serif',
                marginBottom: '1rem'
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
            onMouseOut={(e) => e.target.style.backgroundColor = '#52B2BF'}
          >
            Crear Pedido
          </button>
        </form>
        {errorMessage && <p style={{ color: 'red', textAlign: 'center', marginTop: '1rem' }}>{errorMessage}</p>}
        {successMessage && <p style={{ color: 'green', textAlign: 'center', marginTop: '1rem' }}>{successMessage}</p>}
      </div>
      <div style={{ marginTop: '1.5rem', width: '100%', maxWidth: '400px' }}>
      <button
        type="button"
        onClick={() => navigate('/pedidos-farmacia')}
        style={{
          width: '100%',
          padding: '0.8rem',
          borderRadius: '6px',
          backgroundColor: '#52B2BF',
          border: 'none',
          color: 'white',
          fontSize: '1rem',
          cursor: 'pointer',
          fontFamily: 'Arial, sans-serif',
          transition: 'background-color 0.3s ease',
        }}
        onMouseOver={(e) => e.target.style.backgroundColor = '#9bb9cb'}
        onMouseOut={(e) => e.target.style.backgroundColor = '#52B2BF'}
      >
        Ver Pedidos
      </button>
    </div>
    </div>
  );
}

export default CrearPedido;