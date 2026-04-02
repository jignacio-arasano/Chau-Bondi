import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

const ZONAS_POR_BARRIO = {
  'Nueva Córdoba': [
    'Patio Olmos', 'Buen Pastor', 'Plaza España', 
    'Farmacity de la Chacabuco', 'Chacabuco e Illia', 
    'Buenos Aires y Estrada', 'Rondeau y Paraná'
  ],
  'Centro': [
    'Patio Olmos', 'Plaza San Martín', 'Terminal T2'
  ],
  'Alberdi': ['Plaza Colón'],
  'General Paz': ['Plaza Alberdi'],
  'Alta Córdoba': ['Plaza Rivadavia'],
  'Zona Sur (Barrio Jardín)': ['Paseo del Jockey'],
  'Zona Norte (Cerro / Urca)': ['Mujer Urbana / Parque de las Naciones']
};

export default function CreateTrip() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    tipo: 'IDA',
    zona_comun: '', // Este es el punto de encuentro final
    barrio: '',     // Este es el "barrio/referencia" escrito a mano (ej: Frente a Starbucks)
    fecha: '',
    hora: ''
  });
  
  const [barrioEncuentro, setBarrioEncuentro] = useState(''); // Estado para el primer desplegable

  const [pasajerosMinimos, setPasajerosMinimos] = useState('1'); 
  const [acompanantes, setAcompanantes] = useState('0');
  
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ac = parseInt(acompanantes, 10);
    const pm = parseInt(pasajerosMinimos, 10);
    const maxPermitido = 3 - ac;
    
    if (pm > maxPermitido) {
      setPasajerosMinimos(maxPermitido.toString());
    }
  }, [acompanantes, pasajerosMinimos]);

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  }

  // Cuando cambian el barrio, borramos el punto de encuentro viejo para que no quede inconsistente
  function handleBarrioChange(e) {
    setBarrioEncuentro(e.target.value);
    setForm(f => ({ ...f, zona_comun: '' }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.zona_comun) { setError('Seleccioná un punto de encuentro específico.'); return; }
    if (!form.fecha || !form.hora) { setError('Ingresá fecha y hora.'); return; }

    const fecha_hora = new Date(`${form.fecha}T${form.hora}:00`).toISOString();
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
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: '1.4rem', cursor: 'pointer', padding: 0, marginBottom: 12 }}>←</button>
          <h2 style={{ fontSize: '1.3rem', letterSpacing: '0.04em' }}>PUBLICAR VIAJE</h2>
          <p style={{ color: 'var(--text2)', fontSize: '0.85rem', marginTop: 4 }}>🚀 Versión Beta: Ayudanos a conectar a más estudiantes de la Siglo.</p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 28 }}>
        {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="input-group">
            <label className="label">Tipo de viaje</label>
            <div className="segment">
              <button type="button" className={`segment-btn ${esIda ? 'active' : ''}`} onClick={() => setForm(f => ({ ...f, tipo: 'IDA' }))}>🎓 Ida al Campus</button>
              <button type="button" className={`segment-btn ${!esIda ? 'active' : ''}`} onClick={() => setForm(f => ({ ...f, tipo: 'VUELTA' }))}>🏠 Vuelta a casa</button>
            </div>
          </div>

          <div className="card" style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.9rem' }}>
              <span>{esIda ? '📍' : '🎓'}</span>
              <div>
                <div style={{ color: 'var(--text2)', fontSize: '0.75rem' }}>ORIGEN</div>
                <div style={{ fontWeight: 600 }}>{esIda ? (form.zona_comun || 'Punto a elegir') : 'Campus Siglo 21'}</div>
              </div>
            </div>
            <div style={{ marginLeft: 10, padding: '4px 0', color: 'var(--border2)', fontSize: '1rem' }}>│</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.9rem' }}>
              <span>{esIda ? '🎓' : '📍'}</span>
              <div>
                <div style={{ color: 'var(--text2)', fontSize: '0.75rem' }}>DESTINO</div>
                <div style={{ fontWeight: 600 }}>{!esIda ? (form.zona_comun || 'Punto a elegir') : 'Campus Siglo 21'}</div>
              </div>
            </div>
          </div>

          {/* 👇 PRIMER DESPLEGABLE: Elegir Barrio */}
          <div className="input-group">
            <label className="label">{esIda ? 'Barrio de encuentro' : 'Barrio de destino'}</label>
            <select className="input" value={barrioEncuentro} onChange={handleBarrioChange} required>
              <option value="">Seleccioná un barrio</option>
              {Object.keys(ZONAS_POR_BARRIO).map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          {/* 👇 SEGUNDO DESPLEGABLE: Elegir Punto Exacto (Aparece solo cuando eligen barrio) */}
          {barrioEncuentro && (
            <div className="input-group fade-up">
              <label className="label">{esIda ? 'Punto exacto' : 'Punto exacto de destino'}</label>
              <select className="input" name="zona_comun" value={form.zona_comun} onChange={handleChange} required>
                <option value="">Seleccioná el lugar</option>
                {ZONAS_POR_BARRIO[barrioEncuentro].map(z => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>
          )}

          <div className="input-group">
            <label className="label">Calle / Dirección de referencia</label>
            <input className="input" type="text" name="barrio" placeholder={esIda ? 'Ej: Frente al kiosco azul' : 'Ej: Sobre Rondeau 200'} value={form.barrio} onChange={handleChange} required />
            <span style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>Indicá algo que ayude a tus pasajeros a encontrarte rápido.</span>
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
            <label style={{ fontSize: '0.85rem', color: 'var(--text2)', marginBottom: '8px', display: 'block' }}>¿Vas con algún amigo/a?</label>
            <select className="input" value={acompanantes} onChange={e => setAcompanantes(e.target.value)}>
              <option value="0">Voy solo / Ya pedí yo el auto (3 lugares libres)</option>
              <option value="1">Voy con 1 amigo/a (2 lugares libres)</option>
              <option value="2">Voy con 2 amigos/as (1 lugar libre)</option>
            </select>
          </div>

          {acompanantes !== '2' ? (
            <div className="segment" style={{ marginBottom: 12, flexDirection: 'column' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text2)', marginBottom: '4px', display: 'block' }}>Condición para salir:</label>
                <span style={{ fontSize: '0.75rem', color: 'var(--text3)', display: 'block', marginBottom: '8px', lineHeight: 1.4 }}>Este es el <strong>mínimo</strong> necesario para confirmar el viaje. Podés salir aunque queden lugares, pero si se suma más gente al grupo, ¡mejor!</span>
              </div>
              {acompanantes === '0' && (
                <select className="input" value={pasajerosMinimos} onChange={e => setPasajerosMinimos(e.target.value)}>
                  <option value="1">🚕 Salgo con 1 persona más</option>
                  <option value="2">🚗 Salgo con 2 personas más</option>
                  <option value="3">🚐 Salgo solo si se llena el auto</option>
                </select>
              )}
              {acompanantes === '1' && (
                <select className="input" value={pasajerosMinimos} onChange={e => setPasajerosMinimos(e.target.value)}>
                  <option value="1">🚕 Salgo con 1 persona más</option>
                  <option value="2">🚐 Salgo solo si se llena el auto</option>
                </select>
              )}
            </div>
          ) : (
            <div className="alert alert-info" style={{ fontSize: '0.82rem', marginBottom: 12 }}>
              <strong>Condición implícita:</strong> Como queda solo 1 lugar libre, el viaje se confirmará automáticamente al sumarse el último pasajero.
            </div>
          )}

          <div className="alert alert-info" style={{ fontSize: '0.82rem' }}>
            <strong>¿Cómo funciona?</strong><br />Publicás el viaje, tus compañeros se unen y automáticamente se habilitan los datos de WhatsApp de todos para coordinar el Uber/Cabify.
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? <><span className="spinner" style={{ width: 18, height: 18 }} /> Publicando…</> : '🚌 Publicar viaje'}
          </button>
        </form>
      </div>
    </div>
  );
}