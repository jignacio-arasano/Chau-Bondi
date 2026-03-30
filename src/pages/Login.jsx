import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api';

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [form,    setForm]    = useState({ email: '', password: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await api.auth.login(form);
      login(data.token, data.user);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg)'
    }}>
      {/* Header */}
      <div style={{
        padding: '60px 24px 40px',
        textAlign: 'center',
        borderBottom: '1px solid var(--border)'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: 12 }}>🚌</div>
        <h1 style={{ color: 'var(--green)', marginBottom: 6 }}>CHAUBONDI</h1>
        <p style={{ color: 'var(--text2)', fontSize: '0.95rem' }}>
          Compartí el viaje al Campus Siglo 21
        </p>
      </div>

      {/* Form */}
      <div style={{ flex: 1, padding: '32px 24px', maxWidth: 480, margin: '0 auto', width: '100%' }}>
        <h2 style={{ marginBottom: 24, fontSize: '1.4rem' }}>Ingresar</h2>

        {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="input-group">
            <label className="label">Correo institucional</label>
            <input
              className="input"
              type="email"
              name="email"
              placeholder="nombre@soysiglo21.edu.ar"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
              inputMode="email"
            />
          </div>

          <div className="input-group">
            <label className="label">Contraseña</label>
            <input
              className="input"
              type="password"
              name="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
            style={{ marginTop: 8 }}
          >
            {loading ? <><span className="spinner" style={{ width: 18, height: 18 }} /> Ingresando…</> : 'Ingresar'}
          </button>
        </form>

        <div style={{ marginTop: 28, textAlign: 'center', color: 'var(--text2)', fontSize: '0.9rem' }}>
          ¿No tenés cuenta?{' '}
          <Link to="/register" style={{ fontWeight: 600 }}>Registrate</Link>
        </div>

        <div className="alert alert-info" style={{ marginTop: 32 }}>
          <strong>Solo para estudiantes</strong> de Universidad Siglo 21 Córdoba.
          Necesitás tu correo <code>@soysiglo21.edu.ar</code>.
        </div>
      </div>
    </div>
  );
}
