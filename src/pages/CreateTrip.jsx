import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

const ZONAS = [
  'Patio Olmos / Buen Pastor / Plaza España',
  'Plaza San Martín / Terminal T2',
  'Plaza Colón',
  'Plaza Alberdi',
  'Mujer Urbana / Parque de las Naciones',
  'Paseo del Jockey',
  'Plaza Rivadavia'
];

export default function CreateTrip() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    tipo: 'IDA',
    zona_comun: '',
    barrio: '',
    fecha: '',
    hora: ''
  });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.zona_comun) { setError('Seleccioná una zona común.'); return; }
    if (!form.fecha || !form.hora) { setError('Ingresá fecha y hora.'); return; }

    const fecha_hora = new Date(`${form.fecha}T${form.hora}:00`).toISOString();

    setLoading(true);
    setError('');
    try {
      const viaje = await api.trips.create({
        tipo:       form.tipo,
        zona_comun: form.zona_comun,
        barrio:     form.barrio,
        fecha_hora
      });
      navigate(`/trip/${viaje.id}`, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const today    = new Date().toISOString().split('T')[0];
  const esIda    = form.tipo === 'IDA';

  return (
    <div className="page">
      {/* Header */}
      <div style={{
        padding: '48px 24px 20px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg2)'
      }}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <button onClick={() => navigate(-1)} style={{
            background: 'none', border: 'none', color: 'var(--text2)',
            fontSize: '1.4rem', cursor: 'pointer', padding: 0, marginBottom: 12
          }}>←</button>
          <h2 style={{ fontSize: '1.3rem', letterSpacing: '0.04em' }}>PUBLICAR VIAJE</h2>
          <p style={{ color: 'var(--text2)', fontSize: '0.85rem', marginTop: 4 }}>
            Gratis para el organizador. Pasajeros pagan $200 de servicio.
          </p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 28 }}>
        {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Tipo */}
          <div className="input-group">
            <label className="label">Tipo de viaje</label>
            <div className="segment">
              <button
                type="button"
                className={`segment-btn ${esIda ? 'active' : ''}`}
                onClick={() => setForm(f => ({ ...f, tipo: 'IDA' }))}
              >🎓 Ida al Campus</button>
              <button
                type="button"
                className={`segment-btn ${!esIda ? 'active' : ''}`}
                onClick={() => setForm(f => ({ ...f, tipo: 'VUELTA' }))}
              >🏠 Vuelta a casa</button>
            </div>
          </div>

          {/* Ruta visual */}
          <div className="card" style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.9rem' }}>
              <span>{esIda ? '📍' : '🎓'}</span>
              <div>
                <div style={{ color: 'var(--text2)', fontSize: '0.75rem' }}>ORIGEN</div>
                <div style={{ fontWeight: 600 }}>
                  {esIda ? (form.zona_comun || 'Zona a elegir') : 'Campus Siglo 21'}
                </div>
              </div>
            </div>
            <div style={{ marginLeft: 10, padding: '4px 0', color: 'var(--border2)', fontSize: '1rem' }}>│</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.9rem' }}>
              <span>{esIda ? '🎓' : '📍'}</span>
              <div>
                <div style={{ color: 'var(--text2)', fontSize: '0.75rem' }}>DESTINO</div>
                <div style={{ fontWeight: 600 }}>
                  {!esIda ? (form.zona_comun || 'Zona a elegir') : 'Campus Siglo 21'}
                </div>
              </div>
            </div>
          </div>

          {/* Zona común */}
          <div className="input-group">
            <label className="label">
              {esIda ? 'Punto de encuentro' : 'Destino (zona)'}
            </label>
            <select
              className="input"
              name="zona_comun"
              value={form.zona_comun}
              onChange={handleChange}
              required
            >
              <option value="">Seleccioná una zona</option>
              {ZONAS.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>

          {/* Barrio específico */}
          <div className="input-group">
            <label className="label">Barrio / dirección de referencia</label>
            <input
              className="input"
              type="text"
              name="barrio"
              placeholder={esIda ? 'Ej: Frente al Bar Del Bono' : 'Ej: Barrio Jardín'}
              value={form.barrio}
              onChange={handleChange}
              required
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>
              Indicá algo que ayude a tus pasajeros a encontrarte.
            </span>
          </div>

          {/* Fecha y hora */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="input-group">
              <label className="label">Fecha</label>
              <input
                className="input"
                type="date"
                name="fecha"
                min={today}
                value={form.fecha}
                onChange={handleChange}
                required
                style={{ colorScheme: 'dark' }}
              />
            </div>
            <div className="input-group">
              <label className="label">Hora</label>
              <input
                className="input"
                type="time"
                name="hora"
                value={form.hora}
                onChange={handleChange}
                required
                style={{ colorScheme: 'dark' }}
              />
            </div>
          </div>

          {/* Info */}
          <div className="alert alert-info" style={{ fontSize: '0.82rem' }}>
            <strong>¿Cómo funciona?</strong><br />
            Publicás el viaje gratis. Cada pasajero que se una paga $200 de servicio (no reembolsable).
            Una vez que paguen, todos ven los datos de WhatsApp para coordinar el Uber/Cabify.
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
            style={{ marginTop: 4 }}
          >
            {loading
              ? <><span className="spinner" style={{ width: 18, height: 18 }} /> Publicando…</>
              : '🚌 Publicar viaje'}
          </button>
        </form>
      </div>
    </div>
  );
}
