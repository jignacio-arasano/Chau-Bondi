import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import TripCard from '../components/TripCard';

const ZONAS = [
  'Patio Olmos / Buen Pastor / Plaza España',
  'Plaza San Martín / Terminal T2',
  'Plaza Colón',
  'Plaza Alberdi',
  'Mujer Urbana / Parque de las Naciones',
  'Paseo del Jockey',
  'Plaza Rivadavia'
];

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [tipo,   setTipo]   = useState(searchParams.get('tipo') || '');
  const [zona,   setZona]   = useState('');
  const [fecha,  setFecha]  = useState('');
  const [trips,  setTrips]  = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Buscar automáticamente si viene con tipo desde Home
  useEffect(() => {
    if (searchParams.get('tipo')) {
      buscar();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function buscar() {
    setLoading(true);
    setSearched(true);
    try {
      const params = {};
      if (tipo)  params.tipo  = tipo;
      if (zona)  params.zona  = zona;
      if (fecha) params.fecha = fecha;
      const data = await api.trips.list(params);
      setTrips(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleTipo(t) {
    setTipo(prev => prev === t ? '' : t);
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="page">
      {/* Header */}
      <div style={{
        background: 'var(--bg2)',
        borderBottom: '1px solid var(--border)',
        padding: '48px 24px 20px',
        position: 'sticky', top: 0, zIndex: 10
      }}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <h2 style={{ marginBottom: 16, fontSize: '1.2rem', letterSpacing: '0.05em' }}>BUSCAR VIAJES</h2>

          {/* Tipo */}
          <div className="segment" style={{ marginBottom: 12 }}>
            <button
              className={`segment-btn ${tipo === 'IDA' ? 'active' : ''}`}
              onClick={() => handleTipo('IDA')}
            >🎓 Al Campus</button>
            <button
              className={`segment-btn ${tipo === '' ? 'active' : ''}`}
              onClick={() => setTipo('')}
            >Todos</button>
            <button
              className={`segment-btn ${tipo === 'VUELTA' ? 'active' : ''}`}
              onClick={() => handleTipo('VUELTA')}
            >🏠 A casa</button>
          </div>

          {/* Zona */}
          <select
            className="input"
            value={zona}
            onChange={e => setZona(e.target.value)}
            style={{ marginBottom: 10, fontSize: '0.9rem' }}
          >
            <option value="">📍 Todas las zonas</option>
            {ZONAS.map(z => (
              <option key={z} value={z}>{z}</option>
            ))}
          </select>

          {/* Fecha */}
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              className="input"
              type="date"
              value={fecha}
              min={today}
              onChange={e => setFecha(e.target.value)}
              style={{ flex: 1, fontSize: '0.9rem', colorScheme: 'dark' }}
            />
            <button className="btn btn-primary" onClick={buscar} style={{ padding: '13px 20px' }}>
              Buscar
            </button>
          </div>
        </div>
      </div>

      {/* Resultados */}
      <div className="container" style={{ paddingTop: 20 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div className="spinner" />
          </div>
        ) : !searched ? (
          <div className="empty-state">
            <div className="icon">🔍</div>
            <h3 style={{ fontFamily: 'var(--font-head)', fontSize: '1.4rem' }}>BUSCÁ TU VIAJE</h3>
            <p>Usá los filtros de arriba para encontrar compañeros.</p>
          </div>
        ) : trips.length === 0 ? (
          <div className="empty-state">
            <div className="icon">😔</div>
            <h3 style={{ fontFamily: 'var(--font-head)', fontSize: '1.4rem' }}>SIN RESULTADOS</h3>
            <p>No hay viajes con esos filtros. ¡Publicá el tuyo!</p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: '0.8rem', color: 'var(--text2)', marginBottom: 14 }}>
              {trips.length} viaje{trips.length !== 1 ? 's' : ''} encontrado{trips.length !== 1 ? 's' : ''}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {trips.map(t => <TripCard key={t.id} trip={t} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
