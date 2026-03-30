import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function PaymentResult() {
  const { status }   = useParams();
  const [sp]         = useSearchParams();
  const navigate     = useNavigate();
  const [checking,   setChecking]   = useState(false);
  const [confirmed,  setConfirmed]  = useState(false);
  const [viajeId,    setViajeId]    = useState(null);

  const externalRef = sp.get('external_reference');
  const paymentId   = sp.get('payment_id');

  useEffect(() => {
    if (status === 'success' && externalRef) {
      setChecking(true);
      // Esperar 2s para que el webhook haya procesado
      const timer = setTimeout(() => {
        api.payments.status({ external_reference: externalRef, payment_id: paymentId })
          .then(data => {
            if (data.paid) {
              setConfirmed(true);
              setViajeId(data.id_viaje);
            }
          })
          .catch(console.error)
          .finally(() => setChecking(false));
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [status, externalRef, paymentId]);

  if (status === 'success') {
    return (
      <div style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        textAlign: 'center',
        background: 'var(--bg)'
      }}>
        {checking ? (
          <>
            <div className="spinner" style={{ width: 48, height: 48, borderWidth: 4 }} />
            <h2 style={{ marginTop: 24, fontFamily: 'var(--font-head)', fontSize: '1.8rem' }}>
              CONFIRMANDO PAGO…
            </h2>
            <p style={{ color: 'var(--text2)', marginTop: 8 }}>
              Esto tarda unos segundos.
            </p>
          </>
        ) : confirmed ? (
          <>
            <div style={{ fontSize: '5rem', marginBottom: 16 }}>🎉</div>
            <h1 style={{ color: 'var(--green)', fontSize: '2.5rem' }}>¡LISTO!</h1>
            <p style={{ color: 'var(--text2)', marginTop: 8, lineHeight: 1.6 }}>
              Tu pago fue confirmado. Ya podés ver los datos de<br />
              contacto de todos los miembros del grupo.
            </p>
            <div className="alert alert-success" style={{ marginTop: 24, textAlign: 'left' }}>
              <strong>Próximos pasos:</strong><br />
              Ingresá al viaje y contactá a tus compañeros por WhatsApp para coordinar dónde pedir el Uber/Cabify.
            </div>
            <button
              className="btn btn-primary btn-full"
              onClick={() => navigate(viajeId ? `/trip/${viajeId}` : '/')}
              style={{ marginTop: 20 }}
            >
              Ver mi grupo →
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: '4rem', marginBottom: 16 }}>✅</div>
            <h1 style={{ color: 'var(--green)' }}>PAGO RECIBIDO</h1>
            <p style={{ color: 'var(--text2)', marginTop: 8 }}>
              Puede tardar unos minutos en acreditarse.
              Pronto vas a poder ver los datos de contacto del grupo.
            </p>
            <button
              className="btn btn-primary btn-full"
              onClick={() => navigate('/')}
              style={{ marginTop: 24 }}
            >
              Ir al inicio
            </button>
          </>
        )}
      </div>
    );
  }

  if (status === 'failure') {
    return (
      <div style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        textAlign: 'center',
        background: 'var(--bg)'
      }}>
        <div style={{ fontSize: '4rem', marginBottom: 16 }}>❌</div>
        <h1 style={{ color: 'var(--red)' }}>PAGO FALLIDO</h1>
        <p style={{ color: 'var(--text2)', marginTop: 8 }}>
          El pago no fue procesado. Podés intentarlo de nuevo.
        </p>
        <button className="btn btn-primary btn-full" onClick={() => navigate(-2)} style={{ marginTop: 24 }}>
          Reintentar
        </button>
        <button className="btn btn-secondary btn-full" onClick={() => navigate('/')} style={{ marginTop: 10 }}>
          Ir al inicio
        </button>
      </div>
    );
  }

  // Pending
  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
      textAlign: 'center',
      background: 'var(--bg)'
    }}>
      <div style={{ fontSize: '4rem', marginBottom: 16 }}>⏳</div>
      <h1 style={{ color: '#FFB800' }}>PAGO PENDIENTE</h1>
      <p style={{ color: 'var(--text2)', marginTop: 8 }}>
        Tu pago está siendo procesado. Cuando se acredite,<br />
        vas a poder ver los contactos del grupo.
      </p>
      <button className="btn btn-primary btn-full" onClick={() => navigate('/')} style={{ marginTop: 24 }}>
        Ir al inicio
      </button>
    </div>
  );
}
