import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function ForgotPassword() {
  const [email,   setEmail]   = useState('');
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await api.auth.forgotPassword({ email });
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (sent) return (
    <div style={{ minHeight:'100dvh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:32, background:'var(--bg)', textAlign:'center' }}>
      <div style={{ fontSize:'4rem', marginBottom:16 }}>📬</div>
      <h1 style={{ fontFamily:'var(--font-head)', fontSize:'2rem', color:'var(--green)', marginBottom:12 }}>REVISÁ TU MAIL</h1>
      <p style={{ color:'var(--text2)', lineHeight:1.7, maxWidth:320, marginBottom:8 }}>
        Si ese correo está registrado, te enviamos un link para restablecer tu contraseña.
      </p>
      <p style={{ color:'var(--text3)', fontSize:'0.82rem', maxWidth:300, marginBottom:28 }}>
        El link es válido por 1 hora. Revisá también la carpeta de spam.
      </p>
      <Link to="/login" className="btn btn-secondary" style={{ maxWidth:300, width:'100%' }}>Volver al inicio</Link>
    </div>
  );

  return (
    <div style={{ minHeight:'100dvh', background:'var(--bg)' }}>
      <div style={{ padding:'40px 24px 20px', borderBottom:'1px solid var(--border)', background:'var(--bg2)', display:'flex', alignItems:'center', gap:12 }}>
        <Link to="/login" style={{ color:'var(--text2)', fontSize:'1.4rem', textDecoration:'none' }}>←</Link>
        <h2 style={{ fontSize:'1.4rem' }}>Recuperar contraseña</h2>
      </div>

      <div style={{ padding:'32px 24px', maxWidth:480, margin:'0 auto' }}>
        <p style={{ color:'var(--text2)', marginBottom:24, lineHeight:1.6 }}>
          Ingresá tu correo y te mandamos un link para crear una nueva contraseña.
        </p>

        {error && <div className="alert alert-error" style={{ marginBottom:20 }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div className="input-group">
            <label className="label">Correo electrónico</label>
            <input className="input" type="email" placeholder="tu@mail.com"
              value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
              required inputMode="email" autoComplete="email" />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? <><span className="spinner" style={{ width:18, height:18 }} /> Enviando…</> : 'Enviar link de recuperación'}
          </button>
        </form>
      </div>
    </div>
  );
}
