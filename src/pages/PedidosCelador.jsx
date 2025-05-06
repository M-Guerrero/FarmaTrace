import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import Carrusel from '../components/CarruselPedidos.jsx';
import { useNavigate } from 'react-router-dom';

function PedidosCelador() {
  const [pedidosParaRecoger, setPedidosParaRecoger] = useState([]);
  const [pedidosParaEntregar, setPedidosParaEntregar] = useState([]);
  const [pedidosSinConfirmarEntrega, setPedidosSinConfirmarEntrega] = useState([]);
  const [pedidosAnteriores, setPedidosAnteriores] = useState([]);
  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const verificarRol = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate('/');
        return;
      }

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

      if (data.rol !== 'celador') {
        navigate('/sin-acceso');
        return;
      }

      setUserId(user.id);
      setUserRole(data.rol);
    };

    verificarRol();
  }, [navigate]);

  useEffect(() => {
    if (!userId || userRole !== 'celador') return;
  
    const fetchPedidos = async () => {
      const { data: pedidos, error: errorPedidos } = await supabase
        .from('pedido')
        .select('pedido_id, estado, habitacion, medicamento');
  
      if (errorPedidos) {
        console.error('Error al obtener pedidos:', errorPedidos);
        return;
      }
  
      const { data: seguimientos, error: errorSeguimientos } = await supabase
        .from('seguimiento_pedido')
        .select('pedido_id, estado, user_id, fecha')
        .order('fecha', { ascending: false });
  
      if (errorSeguimientos) {
        console.error('Error al obtener seguimientos:', errorSeguimientos);
        return;
      }
  
      // Unir los pedidos con la fecha del último seguimiento
      const pedidosConFecha = pedidos.map(pedido => {
        const ultimoSeguimiento = seguimientos.find(seguimiento => seguimiento.pedido_id === pedido.pedido_id);
        return {
          ...pedido,
          fechaUltimoCambio: ultimoSeguimiento ? ultimoSeguimiento.fecha : null,
        };
      });
  
      // Filtrar "Pedidos para recoger" (estado 'Listo para recoger')
      const pedidosParaRecoger = pedidosConFecha.filter(p => p.estado === 'Listo para recoger');
  
      // Filtrar "Pedidos para entregar" solo para el celador que ha hecho la recogida
      const pedidosParaEntregar = pedidosConFecha.filter(p => {
        if (p.estado !== 'Recogido') return false;
  
        // Verificar si el celador actual es el que hizo la recogida
        const recogidoPorEsteCelador = seguimientos.some(s => 
          s.pedido_id === p.pedido_id && s.estado === 'Recogido' && s.user_id === userId
        );
  
        return recogidoPorEsteCelador;
      });
  
      // Filtrar "Pedidos sin confirmar entrega" (estado 'Entregado', pero no confirmado por otro)
      const pedidosSinConfirmarEntrega = pedidosConFecha.filter(p => {
        if (p.estado !== 'Entregado') return false;
  
        const entregaCelador = seguimientos.find(s =>
          s.pedido_id === p.pedido_id && s.estado === 'Entregado' && s.user_id === userId
        );
  
        const confirmacionEnfermeria = seguimientos.some(s =>
          s.pedido_id === p.pedido_id && s.estado === 'Entregado' && s.user_id !== userId
        );
  
        return entregaCelador && !confirmacionEnfermeria;
      });
  
      // Filtrar "Pedidos anteriores" (estado 'Entregado' o 'Administrado', confirmado por enfermería)
      const pedidosAnteriores = pedidosConFecha.filter(p => {
        if (p.estado !== 'Entregado' && p.estado !== 'Administrado') return false;
  
        const entregaCelador = seguimientos.find(s =>
          s.pedido_id === p.pedido_id && (s.estado === 'Entregado' || s.estado === 'Administrado') && s.user_id === userId
        );
  
        const confirmacionEnfermeria = seguimientos.some(s =>
          s.pedido_id === p.pedido_id && (s.estado === 'Confirmado' || s.estado === 'Entregado') && s.user_id !== userId
        );
  
        return entregaCelador && confirmacionEnfermeria;
      });
  
      // Establecer los estados de los pedidos
      setPedidosParaRecoger(pedidosParaRecoger);
      setPedidosParaEntregar(pedidosParaEntregar); // Solo los pedidos que el celador ha recogido
      setPedidosSinConfirmarEntrega(pedidosSinConfirmarEntrega);
      setPedidosAnteriores(pedidosAnteriores);
    };
  
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
      console.error('Error al insertar seguimiento:', insertError);
      return;
    }

    if (actualizarPedido) {
      const { error: updateError } = await supabase
        .from('pedido')
        .update({ estado: nuevoEstado })
        .eq('pedido_id', pedidoId);

      if (updateError) {
        console.error('Error al actualizar estado del pedido:', updateError);
      }
    }

    // Actualizar el estado local sin necesidad de recargar la página
    setPedidosParaRecoger(prevState =>
      prevState.filter(p => p.pedido_id !== pedidoId)
    );
    setPedidosParaEntregar(prevState =>
      prevState.filter(p => p.pedido_id !== pedidoId)
    );
    setPedidosSinConfirmarEntrega(prevState =>
      prevState.filter(p => p.pedido_id !== pedidoId)
    );
    setPedidosAnteriores(prevState =>
      prevState.filter(p => p.pedido_id !== pedidoId)
    );
  };

  if (userRole === null) return <div>Cargando...</div>;

  return (
    <div style={{ padding: '2rem', backgroundColor: '#f5f5f5' }}>
      <h1 style={{ color: '#52B2BF', textAlign: 'center', marginBottom: '2rem' }}>
        Pedidos Celador
      </h1>

      <Carrusel
        titulo="Pedidos para recoger"
        pedidos={pedidosParaRecoger}
        botonTexto="Confirmar Recogida"
        siguienteEstado="Recogido"
        avanzarEstado={avanzarEstado}
        mostrarFecha={true}
      />

      <Carrusel
        titulo="Pedidos para entregar"
        pedidos={pedidosParaEntregar}
        botonTexto="Confirmar Entrega"
        siguienteEstado="Entregado"
        avanzarEstado={avanzarEstado}
        mostrarFecha={true}
      />

      <Carrusel
        titulo="Pedidos sin confirmar entrega"
        pedidos={pedidosSinConfirmarEntrega}
        mostrarFecha={true}
      />

      <Carrusel
        titulo="Pedidos anteriores"
        pedidos={pedidosAnteriores}
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

export default PedidosCelador;
