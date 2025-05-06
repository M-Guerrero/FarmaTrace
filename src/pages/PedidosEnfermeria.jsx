import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import Carrusel from '../components/CarruselPedidos.jsx';
import { useNavigate } from 'react-router-dom';

function PedidosEnfermeria() {
  const [controlSeleccionado, setControlSeleccionado] = useState('');
  const [controlesUnicos, setControlesUnicos] = useState([]);
  const [pedidosParaAdministrar, setPedidosParaAdministrar] = useState([]);
  const [pedidosParaEntregar, setPedidosParaEntregar] = useState([]);
  const [pedidosAnteriores, setPedidosAnteriores] = useState([]);
  const [userId, setUserId] = useState(null);
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

      if (error || !data || data.rol !== 'enfermeria') {
        navigate('/sin-acceso');
        return;
      }

      setUserId(user.id);
    };

    verificarRol();
  }, [navigate]);

  useEffect(() => {
    if (!userId) return;

    const fetchDatos = async () => {
      const { data: ubicaciones, error: errorUbicaciones } = await supabase
        .from('ubicacion')
        .select('control');

      if (errorUbicaciones) {
        console.error('Error al obtener ubicaciones:', errorUbicaciones);
        return;
      }

      const controles = [...new Set(ubicaciones.map(u => u.control).filter(Boolean))];
      setControlesUnicos(controles);

      const { data: pedidoData, error: errorPedido } = await supabase
        .from('pedido')
        .select('pedido_id, estado, habitacion, medicamento, ubicacion(control)');

      if (errorPedido) {
        console.error('Error al obtener pedidos:', errorPedido);
        return;
      }

      const pedidosFiltrados = controlSeleccionado
        ? pedidoData.filter(p => p.ubicacion?.control === controlSeleccionado)
        : pedidoData;

      const idsPedidos = pedidosFiltrados.map(p => p.pedido_id);

      const { data: seguimientos, error: errorSeguimiento } = await supabase
        .from('seguimiento_pedido')
        .select('pedido_id, estado, fecha, user_id')
        .in('pedido_id', idsPedidos)
        .order('fecha', { ascending: false });

      if (errorSeguimiento) {
        console.error('Error al obtener seguimientos:', errorSeguimiento);
        return;
      }

      // Filtrar los seguimientos de Farmacia para determinar si la entrega ha sido confirmada
      const entregadosPorEnfermeria = new Set(
        seguimientos.filter(s => s.estado === 'Entregado' && s.user_id && s.user_id == userId).map(s => s.pedido_id)
      );

      const ultimaFechaPorPedido = {};
      seguimientos.forEach(s => {
        if (!ultimaFechaPorPedido[s.pedido_id]) {
          ultimaFechaPorPedido[s.pedido_id] = s.fecha;
        }
      });

      // Añadimos la fecha de seguimiento a los pedidos
      const pedidosConFecha = pedidosFiltrados.map(p => {
        const fechaUltimoCambio = ultimaFechaPorPedido[p.pedido_id] || null;
        return {
          ...p,
          fechaUltimoCambio: fechaUltimoCambio,
        };
      });

      const paraAdministrar = [];
      const anteriores = [];
      const paraConfirmarEntrega = [];

      pedidosConFecha.forEach(p => {
        const { pedido_id, estado } = p;

        if (estado === 'Entregado') {
          if (entregadosPorEnfermeria.has(pedido_id)) {
            paraAdministrar.push(p);
          } else {
            paraConfirmarEntrega.push(p);
          }
        } else if (estado === 'Administrado') {
          anteriores.push(p);
        } else if (estado === 'Entregado' && !entregadosPorEnfermeria.has(pedido_id)) {
          paraConfirmarEntrega.push(p);
        }
      });

      setPedidosParaAdministrar(paraAdministrar);
      setPedidosAnteriores(anteriores);
      setPedidosParaEntregar(paraConfirmarEntrega);
    };

    fetchDatos();
  }, [controlSeleccionado, userId]);

  const avanzarEstado = async (pedidoId, nuevoEstado) => {
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

    const { error: updateError } = await supabase
      .from('pedido')
      .update({ estado: nuevoEstado })
      .eq('pedido_id', pedidoId);

    if (updateError) {
      console.error('Error al actualizar estado del pedido:', updateError);
    }

    setPedidosParaEntregar(prevState => prevState.filter(p => p.pedido_id !== pedidoId));
    setPedidosParaAdministrar(prevState => [...prevState, ...pedidosParaEntregar.filter(p => p.pedido_id === pedidoId)]);
  };

  return (
    <div style={{ padding: '2rem', backgroundColor: '#f5f5f5' }}>
      <h1 style={{ color: '#52B2BF', textAlign: 'center', marginBottom: '2rem' }}>
        Pedidos Enfermería
      </h1>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
        <label style={{ marginRight: '0.5rem', fontWeight: 'bold' }}>Filtrar por control:</label>
        <select
          onChange={e => {
            const value = e.target.value;
            setControlSeleccionado(value);
            localStorage.setItem('controlSeleccionado', value);
          }}
          value={controlSeleccionado}
          style={{
            padding: '0.5rem',
            borderRadius: '6px',
            border: '1px solid #ccc',
            fontSize: '1rem'
          }}
        >
          <option value="">Todos</option>
          {controlesUnicos.map(control => (
            <option key={control} value={control}>{control}</option>
          ))}
        </select>
      </div>

      <Carrusel
        titulo="Pedidos para confirmar Entrega"
        pedidos={pedidosParaEntregar}
        botonTexto="Confirmar Entrega del Fármaco"
        siguienteEstado="Entregado"
        avanzarEstado={avanzarEstado}
        mostrarFecha={true}
      />

      <Carrusel
        titulo="Pedidos para Administrar"
        pedidos={pedidosParaAdministrar}
        botonTexto="Confirmar Administración"
        siguienteEstado="Administrado"
        avanzarEstado={avanzarEstado}
        mostrarFecha={true}
      />

      <Carrusel
        titulo="Pedidos anteriores"
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

export default PedidosEnfermeria;
