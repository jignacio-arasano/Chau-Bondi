import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api';
import TripCard from '../components/TripCard';

export default function Home() {
  const { user }    = useAuth();
  const navigate    = useNavigate();
  const [proximos,  setProximos]  = useState([]);
  const [pending,   setPending]   = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      api.trips.list({ tipo: null }),
      api.ratings.pending()
    ])
      .then(([trips, p]) => {
        setProximos(trips.slice(0, 5));
        setPending(p);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const hora = new Date().getHours();
  const saludo = hora < 12 ? 'Buen día' : hora < 20 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <div className="page">
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(160deg, #0A0A12 0%, #0D1A12 100%)',
        padding: '48px 24px 32px',
        borderBottom: '1px solid var(--border)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Fondo decorativo */}
        <div style={{
          position: 'absolute', top: -40, right: -40,
          width: 180, height: 180, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,230,118,0.08) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <p style={{ color: 'var(--text2)', fontSize: '0.9rem', marginBottom: 4 }}>
            {saludo}, <strong style={{ color: 'var(--text)' }}>{user?.nombre}</strong> 👋
          </p>
          <h1 style={{ lineHeight: 1, marginBottom: 4 }}>
            <span style={{ color: 'var(--green)' }}>CHAU</span>
            <span style={{ color: 'var(--text)' }}>BONDI</span>
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: '0.9rem' }}>
            Compartí el viaje al Campus. Dividí el gasto.
          </p>

          {/* Botones principales */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 24 }}>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/search?tipo=IDA')}
              style={{ flexDirection: 'column', gap: 4, padding: '18px 12px', height: 'auto' }}
            >
              <span style={{ fontSize: '1.8rem' }}>🎓</span>
              <span style={{ fontSize: '0.95rem' }}>Ir al Campus</span>
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => navigate('/search?tipo=VUELTA')}
              style={{ flexDirection: 'column', gap: 4, padding: '18px 12px', height: 'auto' }}
            >
              <span style={{ fontSize: '1.8rem' }}>🏠</span>
              <span style={{ fontSize: '0.95rem' }}>Volver a casa</span>
            </button>
          </div>

          <button
            className="btn btn-secondary btn-full"
            onClick={() => navigate('/create')}
            style={{ marginTop: 12 }}
          >
            ➕ Publicar mi viaje
          </button>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 24 }}>
        {/* Calificaciones pendientes */}
        {pending.length > 0 && (
          <div className="alert alert-info" style={{ marginBottom: 20 }}>
            <strong>⭐ Tenés {pending.length} calificación{pending.length > 1 ? 'es' : ''} pendiente{pending.length > 1 ? 's' : ''}</strong>
            {' '}— ayudá a la comunidad puntuando a tus compañeros.
            <button
              className="btn btn-sm"
              onClick={() => navigate('/profile?tab=ratings')}
              style={{ marginTop: 8, width: '100%', background: 'rgba(61,142,255,0.15)', color: 'var(--blue)', border: '1px solid rgba(61,142,255,0.3)' }}
            >
              Calificar ahora
            </button>
          </div>
        )}

        {/* Próximos viajes */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: '1.1rem', letterSpacing: '0.05em' }}>PRÓXIMOS VIAJES</h2>
          <button
            onClick={() => navigate('/search')}
            style={{ background: 'none', border: 'none', color: 'var(--green)', fontSize: '0.85rem',
              fontWeight: 600, cursor: 'pointer', padding: 0 }}
          >
            Ver todos →
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <div className="spinner" />
          </div>
        ) : proximos.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🚌</div>
            <h3 style={{ fontFamily: 'var(--font-head)', fontSize: '1.4rem' }}>SIN VIAJES HOY</h3>
            <p>¡Publicá el tuyo y encontrá compañeros!</p>
            <button className="btn btn-primary" onClick={() => navigate('/create')}
              style={{ marginTop: 20 }}>
              Publicar viaje
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {proximos.map(t => <TripCard key={t.id} trip={t} />)}
          </div>
        )}
      </div>
    </div>
  );
}
