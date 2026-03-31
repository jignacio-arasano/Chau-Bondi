import { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function ResetPassword() {
  const [sp]                  = useSearchParams();
  const navigate              = useNavigate();
  const token                 = sp.get('token');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState(false);
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirm) { setError('Las contraseñas no coinciden.'); return; }
    if (password.length < 6)  { setError('La contraseña debe tener al menos 6 caracteres.'); return; }
    setLoading(true); setError('');
    try {
      await api.auth.resetPassword({ token, password });
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!token) return (
    <div style={{ minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', padding:32, background:'var(--bg)', textAlign:'center' }}>
      <div>
        <div style={{ fontSize:'3rem', marginBottom:16 }}>❌</div>
        <h2 style={{ color:'var(--red)' }}>Link inválido</h2>
        <Link to="/forgot-password" className="btn btn-secondary" style={{ marginTop:20, display:'inline-flex' }}>Solicitar uno nuevo</Link>
      </div>
    </div>
  );

  if (success) return (
    <div style={{ minHeight:'100dvh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:32, background:'var(--bg)', textAlign:'center' }}>
      <div style={{ fontSize:'4rem', marginBottom:16 }}>✅</div>
      <h1 style={{ fontFamily:'var(--font-head)', fontSize:'2rem', color:'var(--green)', marginBottom:12 }}>¡LISTO!</h1>
      <p style={{ color:'var(--text2)', marginBottom:28 }}>Tu contraseña fue actualizada correctamente.</p>
      <button className="btn btn-primary" style={{ maxWidth:300, width:'100%' }} onClick={() => navigate('/login', { replace:true })}>
        Iniciar sesión →
      </button>
    </div>
  );

  return (
    <div style={{ minHeight:'100dvh', background:'var(--bg)' }}>
      <div style={{ padding:'40px 24px 20px', borderBottom:'1px solid var(--border)', background:'var(--bg2)' }}>
        <h2 style={{ fontSize:'1.4rem' }}>Nueva contraseña</h2>
      </div>
      <div style={{ padding:'32px 24px', maxWidth:480, margin:'0 auto' }}>
        {error && <div className="alert alert-error" style={{ marginBottom:20 }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div className="input-group">
            <label className="label">Nueva contraseña</label>
            <input className="input" type="password" placeholder="Mínimo 6 caracteres"
              value={password} onChange={e => { setPassword(e.target.value); setError(''); }}
              required minLength={6} autoComplete="new-password" />
          </div>
          <div className="input-group">
            <label className="label">Confirmar contraseña</label>
            <input className="input" type="password" placeholder="Repetí la contraseña"
              value={confirm} onChange={e => { setConfirm(e.target.value); setError(''); }}
              required autoComplete="new-password" />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? <><span className="spinner" style={{ width:18, height:18 }} /> Guardando…</> : 'Guardar nueva contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}
