import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function Register() {
  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', whatsapp: '', password: '', confirm: '' });
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirm) { setError('Las contraseñas no coinciden.'); return; }
    setLoading(true); setError('');
    try {
      const { confirm, ...body } = form;
      await api.auth.register(body);
      setSuccess(true);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  if (success) return (
    <div style={{ minHeight:'100dvh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:32, background:'var(--bg)', textAlign:'center' }}>
      <div style={{ fontSize:'4rem', marginBottom:16 }}>📬</div>
      <h1 style={{ fontFamily:'var(--font-head)', fontSize:'2rem', color:'var(--green)', marginBottom:12 }}>¡REVISÁ TU MAIL!</h1>
      <p style={{ color:'var(--text2)', lineHeight:1.7, maxWidth:320, marginBottom:8 }}>
        Te enviamos un link de verificación a <strong style={{ color:'var(--text)' }}>{form.email}</strong>.
      </p>
      <p style={{ color:'var(--text3)', fontSize:'0.85rem', maxWidth:300, marginBottom:28 }}>
        Hacé clic en el link para activar tu cuenta. Revisá también la carpeta de spam.
      </p>
      <Link to="/login" className="btn btn-secondary" style={{ maxWidth:300, width:'100%' }}>Volver al inicio</Link>
    </div>
  );

  return (
    <div style={{ minHeight:'100dvh', background:'var(--bg)' }}>
      <div style={{ padding:'40px 24px 20px', borderBottom:'1px solid var(--border)', background:'var(--bg2)', display:'flex', alignItems:'center', gap:12 }}>
        <Link to="/login" style={{ color:'var(--text2)', fontSize:'1.4rem', textDecoration:'none' }}>←</Link>
        <h2 style={{ fontSize:'1.4rem' }}>Crear cuenta</h2>
      </div>
      <div style={{ padding:'28px 24px 60px', maxWidth:480, margin:'0 auto' }}>
        {error && <div className="alert alert-error" style={{ marginBottom:20 }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div className="input-group">
              <label className="label">Nombre</label>
              <input className="input" type="text" name="nombre" placeholder="Lucas" value={form.nombre} onChange={handleChange} required />
            </div>
            <div className="input-group">
              <label className="label">Apellido</label>
              <input className="input" type="text" name="apellido" placeholder="García" value={form.apellido} onChange={handleChange} required />
            </div>
          </div>
          <div className="input-group">
            <label className="label">Correo electrónico</label>
            <input className="input" type="email" name="email" placeholder="tu@mail.com" value={form.email} onChange={handleChange} required inputMode="email" />
          </div>
          <div className="input-group">
            <label className="label">WhatsApp (con código de área)</label>
            <input className="input" type="tel" name="whatsapp" placeholder="3515551234" value={form.whatsapp} onChange={handleChange} required inputMode="tel" />
            <span style={{ fontSize:'0.75rem', color:'var(--text3)' }}>Solo números, sin +54. Ej: 3515551234</span>
          </div>
          <div className="input-group">
            <label className="label">Contraseña</label>
            <input className="input" type="password" name="password" placeholder="Mínimo 6 caracteres" value={form.password} onChange={handleChange} required minLength={6} />
          </div>
          <div className="input-group">
            <label className="label">Confirmar contraseña</label>
            <input className="input" type="password" name="confirm" placeholder="Repetí la contraseña" value={form.confirm} onChange={handleChange} required />
          </div>
          <div className="alert alert-info" style={{ fontSize:'0.82rem' }}>
            🔒 Tu WhatsApp solo se muestra a los miembros de tu grupo una vez que te unís a un viaje.
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? <><span className="spinner" style={{ width:18, height:18 }} /> Creando cuenta…</> : 'Crear cuenta'}
          </button>
        </form>
        <div style={{ marginTop:24, textAlign:'center', color:'var(--text2)', fontSize:'0.9rem' }}>
          ¿Ya tenés cuenta? <Link to="/login" style={{ fontWeight:600 }}>Ingresá</Link>
        </div>
      </div>
    </div>
  );
}
