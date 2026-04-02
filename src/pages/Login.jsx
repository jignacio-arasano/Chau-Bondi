import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api';
import { GoogleLogin } from '@react-oauth/google';

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  // Estados para el flujo de Google
  const [askWhatsapp, setAskWhatsapp] = useState(false);
  const [googleCred,  setGoogleCred]  = useState(null);
  const [whatsapp,    setWhatsapp]    = useState('');
  const [googleUser,  setGoogleUser]  = useState(null);

  function handleChange(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })); setError(''); }

  // Login tradicional
  async function handleSubmit(e) {
    e.preventDefault(); setLoading(true); setError('');
    try { 
      const data = await api.auth.login(form); 
      login(data.token, data.user); 
      navigate('/', { replace: true }); 
    }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  // Respuesta exitosa del botón de Google
  async function handleGoogleSuccess(credentialResponse) {
    setLoading(true); setError('');
    try {
      const data = await api.auth.google({ credential: credentialResponse.credential });
      
      // Si el backend dice "Me falta el número", cambiamos la pantalla
      if (data.requires_whatsapp) {
        setGoogleCred(credentialResponse.credential);
        setGoogleUser(data);
        setAskWhatsapp(true);
      } else {
        // Login exitoso normal
        login(data.token, data.user); 
        navigate('/', { replace: true });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Envío del WhatsApp para usuarios nuevos de Google
  async function handleGoogleWhatsappSubmit(e) {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const data = await api.auth.google({ credential: googleCred, whatsapp });
      login(data.token, data.user);
      navigate('/', { replace: true });
    } catch(err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // PANTALLA 2: Pedir WhatsApp a los nuevos
  if (askWhatsapp) {
    return (
      <div style={{ minHeight:'100dvh', display:'flex', flexDirection:'column', background:'var(--bg)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ maxWidth: 480, width: '100%' }}>
          <h2 style={{ marginBottom:8, fontSize:'1.6rem', color:'var(--green)' }}>¡Casi listo, {googleUser?.nombre}! 🎉</h2>
          <p style={{ color:'var(--text2)', marginBottom:24, lineHeight: 1.5 }}>
            Para terminar tu registro con Google y que tus compañeros puedan contactarte en los viajes, necesitamos tu WhatsApp.
          </p>
          
          {error && <div className="alert alert-error" style={{ marginBottom:20 }}>{error}</div>}
          
          <form onSubmit={handleGoogleWhatsappSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div className="input-group">
              <label className="label">WhatsApp (con código de área)</label>
              <input className="input" type="tel" placeholder="3515551234" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} required />
              <span style={{ fontSize:'0.75rem', color:'var(--text3)' }}>Solo números, sin +54. Ej: 3515551234</span>
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop:4 }}>
              {loading ? <><span className="spinner" style={{ width:18, height:18 }} /> Creando cuenta…</> : 'Terminar y Entrar 🚀'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // PANTALLA 1: Login normal
  return (
    <div style={{ minHeight:'100dvh', display:'flex', flexDirection:'column', background:'var(--bg)' }}>
      <div style={{ padding:'60px 24px 40px', textAlign:'center', borderBottom:'1px solid var(--border)' }}>
        <div style={{ fontSize:'3rem', marginBottom:12 }}>🚌</div>
        <h1 style={{ color:'var(--green)', marginBottom:6 }}>CHAUBONDI</h1>
        <p style={{ color:'var(--text2)', fontSize:'0.95rem' }}>Compartí el viaje al Campus Siglo 21</p>
      </div>
      <div style={{ flex:1, padding:'32px 24px', maxWidth:480, margin:'0 auto', width:'100%' }}>
        <h2 style={{ marginBottom:24, fontSize:'1.4rem' }}>Ingresar</h2>
        {error && <div className="alert alert-error" style={{ marginBottom:20 }}>{error}</div>}
        
        {/* BOTÓN DE GOOGLE */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Ocurrió un error al conectar con Google.')}
            useOneTap
            theme="filled_black"
            text="continue_with"
            shape="rectangular"
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }}></div>
          <span style={{ color: 'var(--text3)', fontSize: '0.8rem', fontWeight: 600 }}>O con tu mail</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }}></div>
        </div>

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div className="input-group">
            <label className="label">Correo electrónico</label>
            <input className="input" type="email" name="email" placeholder="tu@mail.com" value={form.email} onChange={handleChange} required autoComplete="email" inputMode="email" />
          </div>
          <div className="input-group">
            <label className="label">Contraseña</label>
            <input className="input" type="password" name="password" placeholder="••••••••" value={form.password} onChange={handleChange} required autoComplete="current-password" />
          </div>
          <div style={{ textAlign:'right', marginTop:-8 }}>
            <Link to="/forgot-password" style={{ fontSize:'0.82rem', color:'var(--text2)' }}>¿Olvidaste tu contraseña?</Link>
          </div>
          <button type="submit" className="btn btn-secondary btn-full" disabled={loading} style={{ marginTop:4 }}>
            {loading ? <><span className="spinner" style={{ width:18, height:18 }} /> Ingresando…</> : 'Ingresar con contraseña'}
          </button>
        </form>
        <div style={{ marginTop:28, textAlign:'center', color:'var(--text2)', fontSize:'0.9rem' }}>
          ¿No tenés cuenta? <Link to="/register" style={{ fontWeight:600, color: 'var(--green)' }}>Registrate</Link>
        </div>
      </div>
    </div>
  );
}