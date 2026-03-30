import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api';

export default function Register() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [form, setForm] = useState({
    nombre: '', apellido: '', email: '', whatsapp: '', password: '', confirm: ''
  });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (!form.email.toLowerCase().endsWith('@soysiglo21.edu.ar')) {
      setError('Usá tu correo institucional @soysiglo21.edu.ar');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { confirm, ...body } = form;
      const data = await api.auth.register(body);
      login(data.token, data.user);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
      <div style={{
        padding: '40px 24px 20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 12
      }}>
        <Link to="/login" style={{ color: 'var(--text2)', fontSize: '1.4rem', textDecoration: 'none' }}>←</Link>
        <h2 style={{ fontSize: '1.4rem' }}>Crear cuenta</h2>
      </div>

      <div style={{ padding: '28px 24px', maxWidth: 480, margin: '0 auto' }}>
        {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="input-group">
              <label className="label">Nombre</label>
              <input className="input" type="text" name="nombre"
                placeholder="Lucas" value={form.nombre} onChange={handleChange}
                required autoComplete="given-name" />
            </div>
            <div className="input-group">
              <label className="label">Apellido</label>
              <input className="input" type="text" name="apellido"
                placeholder="García" value={form.apellido} onChange={handleChange}
                required autoComplete="family-name" />
            </div>
          </div>

          <div className="input-group">
            <label className="label">Correo institucional</label>
            <input className="input" type="email" name="email"
              placeholder="nombre@soysiglo21.edu.ar"
              value={form.email} onChange={handleChange}
              required autoComplete="email" inputMode="email" />
          </div>

          <div className="input-group">
            <label className="label">WhatsApp (con código de área)</label>
            <input className="input" type="tel" name="whatsapp"
              placeholder="3515551234"
              value={form.whatsapp} onChange={handleChange}
              required inputMode="tel"
              style={{ letterSpacing: '0.05em' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>
              Solo números, sin +54. Ejemplo: 3515551234
            </span>
          </div>

          <div className="input-group">
            <label className="label">Contraseña</label>
            <input className="input" type="password" name="password"
              placeholder="Mínimo 6 caracteres"
              value={form.password} onChange={handleChange}
              required autoComplete="new-password" minLength={6} />
          </div>

          <div className="input-group">
            <label className="label">Confirmar contraseña</label>
            <input className="input" type="password" name="confirm"
              placeholder="Repetí la contraseña"
              value={form.confirm} onChange={handleChange}
              required autoComplete="new-password" />
          </div>

          <div className="alert alert-info" style={{ fontSize: '0.8rem' }}>
            🔒 Tu WhatsApp solo se comparte con los miembros de tu grupo <strong>después de confirmar el pago</strong>.
          </div>

          <button type="submit" className="btn btn-primary btn-full"
            disabled={loading} style={{ marginTop: 4 }}>
            {loading
              ? <><span className="spinner" style={{ width: 18, height: 18 }} /> Creando cuenta…</>
              : 'Crear cuenta gratis'}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center', color: 'var(--text2)', fontSize: '0.9rem' }}>
          ¿Ya tenés cuenta? <Link to="/login" style={{ fontWeight: 600 }}>Ingresá</Link>
        </div>
      </div>
    </div>
  );
}
