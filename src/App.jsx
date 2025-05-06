import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import CambioContraseña from './pages/CambioContraseña';
import CrearPedido from './pages/CrearPedido';
import PedidosFarmacia from './pages/PedidosFarmacia';
import PedidosCelador from './pages/PedidosCelador';
import PedidosEnfermeria from './pages/PedidosEnfermeria';
import SinAcceso from './pages/SinAcceso';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/cambiar-contraseña" element={<CambioContraseña />} />
        <Route path="/crear-pedido" element={<CrearPedido />} />
        <Route path="/pedidos-farmacia" element={<PedidosFarmacia />} />
        <Route path="/pedidos-celador" element={<PedidosCelador />} />
        <Route path="/pedidos-enfermeria" element={<PedidosEnfermeria />} />
        <Route path="/sin-acceso" element={<SinAcceso />} />
      </Routes>
    </Router>
  );
}

export default App;