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

  // 1) Verificar rol al montar
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

      if (error || !data || data.rol !== 'celador') {
        console.error('Acceso no autorizado', error);
        navigate('/sin-acceso');
        return;
      }

      setUserId(user.id);
      setUserRole(data.rol);
    };

    verificarRol();
  }, [navigate]);

  // 2) Función extraída para recargar siempre toda la lista
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

    // Unir cada pedido con su última fecha de cambio
    const pedidosConFecha = pedidos.map(pedido => {
      const ultimo = seguimientos.find(s => s.pedido_id === pedido.pedido_id);
      return { ...pedido, fechaUltimoCambio: ultimo ? ultimo.fecha : null };
    });

    // Filtrar categorías
    setPedidosParaRecoger(
      pedidosConFecha.filter(p => p.estado === 'Listo para recoger')
    );

    setPedidosParaEntregar(
      pedidosConFecha.filter(p => 
        p.estado === 'Recogido' &&
        seguimientos.some(s => 
          s.pedido_id === p.pedido_id && s.estado === 'Recogido' && s.user_id === userId
        )
      )
    );

    setPedidosSinConfirmarEntrega(
      pedidosConFecha.filter(p =>
        p.estado === 'Entregado' &&
        seguimientos.some(s => 
          s.pedido_id === p.pedido_id && s.estado === 'Entregado' && s.user_id === userId
        ) &&
        !seguimientos.some(s =>
          s.pedido_id === p.pedido_id && s.estado === 'Entregado' && s.user_id !== userId
        )
      )
    );

    setPedidosAnteriores(
      pedidosConFecha.filter(p =>
        (p.estado === 'Entregado' || p.estado === 'Administrado') &&
        seguimientos.some(s =>
          s.pedido_id === p.pedido_id &&
          (s.estado === 'Entregado' || s.estado === 'Administrado') &&
          s.user_id === userId
        ) &&
        seguimientos.some(s =>
          s.pedido_id === p.pedido_id && s.estado !== 'Recogido' && s.user_id !== userId
        )
      )
    );
  };

  // 3) Al cambiar userId / rol, recargar lista
  useEffect(() => {
    if (!userId || userRole !== 'celador') return;
    fetchPedidos();
  }, [userId, userRole]);

  // 4) Al avanzar estado, actualizar DB y recargar lista
  const avanzarEstado = async (pedidoId, nuevoEstado, actualizarPedido = true) => {
    const { error: insertError } = await supabase
      .from('seguimiento_pedido')
      .insert([{
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
        console.error('Error al actualizar pedido:', updateError);
      }
    }

    // recarga completa para reflejar el cambio
    await fetchPedidos();
  };

  if (userRole === null) {
    return <div>Cargando...</div>;
  }

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
