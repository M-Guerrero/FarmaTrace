import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function CambioContraseña() {
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
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow rounded-xl">
      <h2 className="text-xl font-bold mb-4">Cambiar Contraseña</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium mb-1">Nueva contraseña</label>
          <input
            type="password"
            className="w-full border p-2 rounded"
            value={nuevaPassword}
            onChange={(e) => setNuevaPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Repetir nueva contraseña</label>
          <input
            type="password"
            className="w-full border p-2 rounded"
            value={repetirPassword}
            onChange={(e) => setRepetirPassword(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Cambiar contraseña
        </button>
      </form>
      {mensaje && <p className="mt-4 text-center text-sm text-red-600">{mensaje}</p>}
    </div>
  );
}