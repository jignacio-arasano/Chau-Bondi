import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

const ZONAS = [
  'Patio Olmos',
  'Buen Pastor',
  'Plaza España',
  'Plaza San Martín',
  'Terminal T2',
  'Plaza Colón',
  'Plaza Alberdi',
  'Mujer Urbana / Parque de las Naciones',
  'Paseo del Jockey',
  'Plaza Rivadavia',
  'Farmacity de la Chacabuco',
  'Chacabuco e Illia',
  'Buenos Aires y Estrada',
  'Rondeau y Paraná'
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
  
  const [pasajerosMinimos, setPasajerosMinimos] = useState('1'); 
  const [acompanantes, setAcompanantes] = useState('0');
  
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  // Efecto dinámico para ajustar la condición si cambian los acompañantes
  useEffect(() => {
    const ac = parseInt(acompanantes, 10);
    const pm = parseInt(pasajerosMinimos, 10);
    const maxPermitido = 3 - ac;
    
    // Si el usuario tenía puesto "pedir 3 personas" pero ahora dijo que va con 1 amigo, 
    // lo bajamos automáticamente a 2 para que no se rompa la matemática.
    if (pm > maxPermitido) {
      setPasajerosMinimos(maxPermitido.toString());
    }
  }, [acompanantes, pasajerosMinimos]);

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.zona_comun) { setError('Seleccioná una zona común.'); return; }
    if (!form.fecha || !form.hora) { setError('Ingresá fecha y hora.'); return; }

    const fecha_hora = new Date(`${form.fecha}T${form.hora}:00`).toISOString();
    
    // Si quedan 0 lugares libres (acompanantes = 2), por defecto se pide 1 pasajero más para llenarlo
    const minReq = acompanantes === '2' ? 1 : parseInt(pasajerosMinimos, 10);

    setLoading(true);
    setError('');
    try {
      const viaje = await api.trips.create({
        tipo:       form.tipo,
        zona_comun: form.zona_comun,
        barrio:     form.barrio,
        fecha_hora,
        pasajeros_minimos: minReq,
        acompanantes: parseInt(acompanantes, 10)
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
             🚀 Versión Beta: Ayudanos a conectar a más estudiantes de la Siglo.
          </p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 28 }}>
        {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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

          <div className="input-group">
            <label className="label">
              {esIda ? 'Punto de encuentro' : 'Destino (zona)'}
            </label>
            <select className="input" name="zona_comun" value={form.zona_comun} onChange={handleChange} required>
              <option value="">Seleccioná una zona</option>
              {ZONAS.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>

          <div className="input-group">
            <label className="label">Barrio / dirección de referencia</label>
            <input className="input" type="text" name="barrio" placeholder={esIda ? 'Ej: Frente al Bar Del Bono' : 'Ej: Barrio Jardín'} value={form.barrio} onChange={handleChange} required />
            <span style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>
              Indicá algo que ayude a tus pasajeros a encontrarte.
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="input-group">
              <label className="label">Fecha</label>
              <input className="input" type="date" name="fecha" min={today} value={form.fecha} onChange={handleChange} required style={{ colorScheme: 'dark' }} />
            </div>
            <div className="input-group">
              <label className="label">Hora</label>
              <input className="input" type="time" name="hora" value={form.hora} onChange={handleChange} required style={{ colorScheme: 'dark' }} />
            </div>
          </div>

          <div className="segment" style={{ marginBottom: 12 }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text2)', marginBottom: '8px', display: 'block' }}>
              ¿Vas con algún amigo/a?
            </label>
            <select 
              className="input" 
              value={acompanantes} 
              onChange={e => setAcompanantes(e.target.value)}
            >
              <option value="0">Voy solo (3 lugares libres)</option>
              <option value="1">Voy con 1 amigo/a (2 lugares libres)</option>
              <option value="2">Voy con 2 amigos/as (1 lugar libre)</option>
            </select>
          </div>

          {/* 👇 SELECTOR DINÁMICO: Condición de salida */}
          {acompanantes !== '2' ? (
            <div className="segment" style={{ marginBottom: 12, flexDirection: 'column' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text2)', marginBottom: '4px', display: 'block' }}>
                  Condición para salir:
                </label>
                <span style={{ fontSize: '0.75rem', color: 'var(--text3)', display: 'block', marginBottom: '8px', lineHeight: 1.4 }}>
                  Este es el <strong>mínimo</strong> necesario para confirmar el viaje. Podés salir aunque queden lugares, pero si se suma más gente al grupo, ¡mejor!
                </span>
              </div>
              
              {acompanantes === '0' && (
                <select className="input" value={pasajerosMinimos} onChange={e => setPasajerosMinimos(e.target.value)}>
                  <option value="1">🚕 Salgo si se une 1 persona más</option>
                  <option value="2">🚗 Salgo si se une 2 personas más</option>
                  <option value="3">🚐 Salgo solo si se llena el auto</option>
                </select>
              )}

              {acompanantes === '1' && (
                <select className="input" value={pasajerosMinimos} onChange={e => setPasajerosMinimos(e.target.value)}>
                  <option value="1">🚕 Salgo si se une 1 persona más</option>
                  <option value="2">🚐 Salgo solo si se llena el auto</option>
                </select>
              )}
            </div>
          ) : (
            <div className="alert alert-info" style={{ fontSize: '0.82rem', marginBottom: 12 }}>
              Como queda solo 1 lugar libre, el viaje se confirmará automáticamente al sumarse el último pasajero.
            </div>
          )}

          <div className="alert alert-info" style={{ fontSize: '0.82rem' }}>
            <strong>¿Cómo funciona?</strong><br />
            Publicás el viaje, tus compañeros se unen y automáticamente se habilitan los datos de WhatsApp de todos para que puedan coordinar el Uber/Cabify y compartir gastos.
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? <><span className="spinner" style={{ width: 18, height: 18 }} /> Publicando…</> : '🚌 Publicar viaje'}
          </button>
        </form>
      </div>
    </div>
  );
}