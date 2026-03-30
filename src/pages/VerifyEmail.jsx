import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../api';

export default function VerifyEmail() {
  const [sp]      = useSearchParams();
  const token     = sp.get('token');
  const [status,  setStatus]  = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token inválido. El link no es correcto.');
      return;
    }

    api.auth.verify(token)
      .then(data => {
        setStatus('success');
        setMessage(data.message);
      })
      .catch(err => {
        setStatus('error');
        setMessage(err.message);
      });
  }, [token]);

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 32, background: 'var(--bg)', textAlign: 'center'
    }}>
      {status === 'loading' && (
        <>
          <div className="spinner" style={{ width: 48, height: 48, borderWidth: 4 }} />
          <p style={{ color: 'var(--text2)', marginTop: 20 }}>Verificando tu cuenta…</p>
        </>
      )}

      {status === 'success' && (
        <>
          <div style={{ fontSize: '4rem', marginBottom: 16 }}>✅</div>
          <h1 style={{ fontFamily: 'var(--font-head)', fontSize: '2rem', color: 'var(--green)', marginBottom: 12 }}>
            ¡CUENTA VERIFICADA!
          </h1>
          <p style={{ color: 'var(--text2)', lineHeight: 1.6, maxWidth: 300, marginBottom: 28 }}>
            {message}
          </p>
          <Link to="/login" className="btn btn-primary" style={{ maxWidth: 300, width: '100%' }}>
            Ingresar a ChauBondi →
          </Link>
        </>
      )}

      {status === 'error' && (
        <>
          <div style={{ fontSize: '4rem', marginBottom: 16 }}>❌</div>
          <h1 style={{ fontFamily: 'var(--font-head)', fontSize: '2rem', color: 'var(--red)', marginBottom: 12 }}>
            LINK INVÁLIDO
          </h1>
          <p style={{ color: 'var(--text2)', lineHeight: 1.6, maxWidth: 300, marginBottom: 28 }}>
            {message}
          </p>
          <Link to="/login" className="btn btn-secondary" style={{ maxWidth: 300, width: '100%' }}>
            Volver al inicio
          </Link>
        </>
      )}
    </div>
  );
}
