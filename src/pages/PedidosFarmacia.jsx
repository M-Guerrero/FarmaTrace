import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Carrusel from '../components/CarruselPedidos.jsx';

function PedidosFarmacia() {
  const [pedidosEnProceso, setPedidosEnProceso] = useState([]);
  const [pedidosListos, setPedidosListos] = useState([]);
  const [pedidosEsperandoConfirmacion, setPedidosEsperandoConfirmacion] = useState([]);
  const [pedidosAnteriores, setPedidosAnteriores] = useState([]);
  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const verificarRolUsuario = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate('/');
        return;
      }

      setUserId(user.id);

      const { data, error } = await supabase
        .from('usuario')
        .select('rol')
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        console.error('Error al obtener el rol:', error?.message);
        navigate('/sin-acceso');
        return;
      }

      if (data.rol !== 'farmacia') {
        navigate('/sin-acceso');
        return;
      }

      setUserRole(data.rol);
    };

    verificarRolUsuario();
  }, [navigate]);

  // EXTRAÍDO: para que lo podamos usar también después
  const fetchPedidos = async () => {
    const { data: pedidoData, error: errorPedido } = await supabase
      .from('pedido')
      .select('pedido_id, estado, habitacion, medicamento');

    if (errorPedido) {
      console.error('Error en pedido:', errorPedido);
      return;
    }

    const idsPedidos = pedidoData.map(p => p.pedido_id);

    const { data: seguimientos, error: errorSeguimiento } = await supabase
      .from('seguimiento_pedido')
      .select('pedido_id, estado, fecha, user_id')
      .in('pedido_id', idsPedidos)
      .order('fecha', { ascending: false });

    if (errorSeguimiento) {
      console.error('Error en seguimientos:', errorSeguimiento);
      return;
    }

    const { data: farmaciaUsuarios, error: errorUsuarios } = await supabase
      .from('usuario')
      .select('user_id')
      .eq('rol', 'farmacia');

    if (errorUsuarios) {
      console.error('Error al obtener los usuarios de farmacia:', errorUsuarios);
      return;
    }

    const idsFarmacia = new Set(farmaciaUsuarios.map(u => u.user_id));

    const enProceso = [];
    const listos = [];
    const esperandoConfirmacion = [];
    const anteriores = [];

    pedidoData.forEach(p => {
      const { pedido_id, estado } = p;
      const seguimientoPedido = seguimientos.filter(s => s.pedido_id === pedido_id);
      const confirmadoPorFarmacia = seguimientoPedido.some(
        s => s.estado === 'Recogido' && idsFarmacia.has(s.user_id)
      );
      const fechaUltimoCambio = seguimientoPedido.length > 0 ? seguimientoPedido[0].fecha : null;
      const pedidoConFecha = { ...p, fechaUltimoCambio };

      if (estado === 'En proceso') {
        enProceso.push(pedidoConFecha);
      } else if (estado === 'Listo para recoger') {
        listos.push(pedidoConFecha);
      } else {
        if (confirmadoPorFarmacia) {
          anteriores.push(pedidoConFecha);
        } else {
          esperandoConfirmacion.push(pedidoConFecha);
        }
      }
    });

    setPedidosEnProceso(enProceso);
    setPedidosListos(listos);
    setPedidosEsperandoConfirmacion(esperandoConfirmacion);
    setPedidosAnteriores(anteriores);
  };

  useEffect(() => {
    if (!userId || userRole !== 'farmacia') return;
    fetchPedidos();
  }, [userId, userRole]);

  const avanzarEstado = async (pedidoId, nuevoEstado, actualizarPedido = true) => {
    const { error: insertError } = await supabase.from('seguimiento_pedido').insert([{
      pedido_id: pedidoId,
      user_id: userId,
      estado: nuevoEstado,
      fecha: new Date().toISOString(),
    }]);

    if (insertError) {
      console.error('Error al insertar en seguimiento_pedido:', insertError);
      return;
    }

    if (actualizarPedido) {
      const { data: pedidoExistente, error: fetchError } = await supabase
        .from('pedido')
        .select('*')
        .eq('pedido_id', pedidoId);

      if (fetchError || !pedidoExistente || pedidoExistente.length === 0) {
        console.error('Error buscando o inexistencia del pedido:', fetchError?.message);
        return;
      }

      const { error: updateError } = await supabase
        .from('pedido')
        .update({ estado: nuevoEstado })
        .eq('pedido_id', pedidoId);

      if (updateError) {
        console.error('Error con update:', updateError.message);
      }
    }

    // Actualiza los pedidos sin recargar
    await fetchPedidos();
  };

  if (userRole === null) {
    return <div>Cargando...</div>;
  }

  return (
    <div style={{ padding: '2rem', backgroundColor: '#f5f5f5' }}>
      <h1 style={{ color: '#52B2BF', textAlign: 'center', marginBottom: '2rem' }}>
        Pedidos Farmacia
      </h1>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
        <Link to="/crear-pedido" style={{
          backgroundColor: '#52B2BF',
          color: 'white',
          padding: '0.5rem 1rem',
          borderRadius: '8px',
          textDecoration: 'none',
          fontWeight: 'bold',
          transition: 'background-color 0.3s',
        }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#9bb9cb'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#52B2BF'}
        >
          Crear Pedido
        </Link>
      </div>

      <Carrusel
        titulo="Pedidos en preparación"
        pedidos={pedidosEnProceso}
        botonTexto="Marcar como Listo para Recoger"
        siguienteEstado="Listo para recoger"
        avanzarEstado={avanzarEstado}
        mostrarFecha={true}
      />

      <Carrusel
        titulo="Pedidos Listos para Recoger"
        pedidos={pedidosListos}
        mostrarFecha={true}
      />

      <Carrusel
        titulo="Esperando Confirmación de Recogida"
        pedidos={pedidosEsperandoConfirmacion}
        botonTexto="Confirmar Recogida"
        siguienteEstado="Recogido"
        avanzarEstado={(pedidoId, estado) => avanzarEstado(pedidoId, estado, false)}
        mostrarFecha={true}
      />

      <Carrusel
        titulo="Pedidos Anteriores"
        pedidos={pedidosAnteriores}
        avanzarEstado={avanzarEstado}
        mostrarFecha={true}
      />

      <button
        onClick={async () => {
          await supabase.auth.signOut();
          navigate('/');
        }}
        style={{
          marginTop: '3rem',
          display: 'block',
          marginLeft: 'auto',
          marginRight: 'auto',
          padding: '0.75rem 2rem',
          backgroundColor: '#d9534f',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          fontSize: '1rem',
          cursor: 'pointer',
        }}
      >
        Cerrar sesión
      </button>
    </div>
  );
}

export default PedidosFarmacia;
