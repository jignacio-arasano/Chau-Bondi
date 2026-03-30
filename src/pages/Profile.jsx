import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api';

function Stars({ rating, interactive, onRate }) {
  const [hover, setHover] = useState(0);
  const display = hover || Math.round(rating || 5);

  if (!interactive) {
    return (
      <span className="stars" style={{ fontSize: '1rem' }}>
        {'★'.repeat(Math.round(rating || 5))}
        {'☆'.repeat(5 - Math.round(rating || 5))}
      </span>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1,2,3,4,5].map(s => (
        <button
          key={s}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onRate(s)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '1.8rem', padding: '4px',
            color: s <= display ? '#FFB800' : 'var(--border2)',
            transition: 'color 0.1s'
          }}
        >★</button>
      ))}
    </div>
  );
}

export default function Profile() {
  const { user, logout, refreshUser } = useAuth();
  const navigate  = useNavigate();
  const [sp]      = useSearchParams();

  const [tab,      setTab]      = useState(sp.get('tab') || 'info');
  const [created,  setCreated]  = useState([]);
  const [joined,   setJoined]   = useState([]);
  const [pending,  setPending]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [ratedIds, setRatedIds] = useState(new Set());

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.trips.myCreated(),
      api.trips.myJoined(),
      api.ratings.pending()
    ])
      .then(([c, j, p]) => {
        setCreated(c);
        setJoined(j);
        setPending(p);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function sendRating(id_viaje, id_calificado, puntuacion) {
    try {
      await api.ratings.submit({ id_viaje, id_calificado, puntuacion });
      setRatedIds(prev => new Set([...prev, `${id_viaje}:${id_calificado}`]));
    } catch (err) {
      alert(err.message);
    }
  }

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  const initials = user ? `${user.nombre[0]}${user.apellido[0]}` : '?';

  return (
    <div className="page">
      {/* Header */}
      <div style={{
        background: 'linear-gradient(160deg, #0A0A12 0%, #0D120A 100%)',
        borderBottom: '1px solid var(--border)',
        padding: '48px 24px 24px'
      }}>
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div className="avatar" style={{ width: 56, height: 56, fontSize: '1.2rem', border: '2px solid var(--green)' }}>
              {initials}
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '1.4rem' }}>{user?.nombre} {user?.apellido}</h2>
              <Stars rating={user?.rating_promedio} />
              <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginTop: 2 }}>
                {user?.email}
              </div>
            </div>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
            gap: 1, background: 'var(--border)',
            borderRadius: 10, overflow: 'hidden', marginTop: 20
          }}>
            {[
              { label: 'Rating', value: `${user?.rating_promedio || '5.0'}⭐` },
              { label: 'Creados', value: created.length },
              { label: 'Viajes', value: joined.length }
            ].map(s => (
              <div key={s.label} style={{
                background: 'var(--bg2)', padding: '12px',
                textAlign: 'center'
              }}>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.4rem', color: 'var(--green)' }}>
                  {s.value}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text3)', fontWeight: 600 }}>
                  {s.label.toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', borderBottom: '1px solid var(--border)',
        background: 'var(--bg2)', position: 'sticky', top: 0, zIndex: 10
      }}>
        {[
          { key: 'info',    label: 'Mis datos' },
          { key: 'trips',   label: 'Mis viajes' },
          { key: 'ratings', label: `Calificar${pending.length ? ` (${pending.length})` : ''}` }
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              flex: 1, padding: '14px 8px', border: 'none', background: 'none',
              color: tab === t.key ? 'var(--green)' : 'var(--text2)',
              fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.82rem',
              cursor: 'pointer',
              borderBottom: tab === t.key ? '2px solid var(--green)' : '2px solid transparent',
              transition: 'all 0.15s'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="container" style={{ paddingTop: 24 }}>
        {/* ── Tab: Info ── */}
        {tab === 'info' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'Nombre completo', value: `${user?.nombre} ${user?.apellido}` },
                  { label: 'Email institucional', value: user?.email },
                  { label: 'WhatsApp', value: `+54 ${user?.whatsapp}` },
                ].map(f => (
                  <div key={f.label}>
                    <div className="label" style={{ marginBottom: 4 }}>{f.label}</div>
                    <div style={{ fontWeight: 500 }}>{f.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <button className="btn btn-danger btn-full" onClick={handleLogout}>
              Cerrar sesión
            </button>
          </div>
        )}

        {/* ── Tab: Trips ── */}
        {tab === 'trips' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <h3 style={{ fontSize: '0.8rem', color: 'var(--text2)', letterSpacing: '0.08em', marginBottom: 12 }}>
                VIAJES QUE ORGANICÉ ({created.length})
              </h3>
              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}><div className="spinner" /></div>
              ) : created.length === 0 ? (
                <div style={{ color: 'var(--text3)', fontSize: '0.9rem', padding: '16px 0' }}>
                  Todavía no publicaste ningún viaje.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {created.map(v => (
                    <button
                      key={v.id}
                      onClick={() => navigate(`/trip/${v.id}`)}
                      className="card"
                      style={{ cursor: 'pointer', textAlign: 'left', width: '100%', border: 'none' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <span className={`badge ${v.tipo === 'IDA' ? 'badge-green' : 'badge-orange'}`} style={{ marginBottom: 6 }}>
                            {v.tipo === 'IDA' ? '→ AL CAMPUS' : '← A CASA'}
                          </span>
                          <div style={{ fontWeight: 600 }}>{v.zona_comun.split('/')[0].trim()}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>{v.barrio}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.4rem', color: 'var(--green)' }}>
                            {new Date(v.fecha_hora).toLocaleTimeString('es-AR', {
                              hour: '2-digit', minute: '2-digit', hour12: false,
                              timeZone: 'America/Argentina/Cordoba'
                            })}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text2)' }}>
                            {new Date(v.fecha_hora).toLocaleDateString('es-AR', {
                              day: 'numeric', month: 'short',
                              timeZone: 'America/Argentina/Cordoba'
                            })}
                          </div>
                          {!v.activo && <span className="badge badge-gray" style={{ marginTop: 4 }}>Cancelado</span>}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 style={{ fontSize: '0.8rem', color: 'var(--text2)', letterSpacing: '0.08em', marginBottom: 12 }}>
                VIAJES EN LOS QUE ME UNÍ ({joined.length})
              </h3>
              {joined.length === 0 ? (
                <div style={{ color: 'var(--text3)', fontSize: '0.9rem', padding: '16px 0' }}>
                  Todavía no te uniste a ningún viaje.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {joined.map(p => p.viajes && (
                    <button
                      key={p.id_viaje}
                      onClick={() => navigate(`/trip/${p.viajes.id}`)}
                      className="card"
                      style={{ cursor: 'pointer', textAlign: 'left', width: '100%', border: 'none' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <span className={`badge ${p.viajes.tipo === 'IDA' ? 'badge-green' : 'badge-orange'}`} style={{ marginBottom: 6 }}>
                            {p.viajes.tipo === 'IDA' ? '→ AL CAMPUS' : '← A CASA'}
                          </span>
                          <div style={{ fontWeight: 600 }}>{p.viajes.zona_comun?.split('/')[0].trim()}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>{p.viajes.barrio}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.4rem', color: 'var(--green)' }}>
                            {new Date(p.viajes.fecha_hora).toLocaleTimeString('es-AR', {
                              hour: '2-digit', minute: '2-digit', hour12: false,
                              timeZone: 'America/Argentina/Cordoba'
                            })}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text2)' }}>
                            {new Date(p.viajes.fecha_hora).toLocaleDateString('es-AR', {
                              day: 'numeric', month: 'short',
                              timeZone: 'America/Argentina/Cordoba'
                            })}
                          </div>
                          <span className={`badge ${p.estado_pago ? 'badge-green' : 'badge-orange'}`} style={{ marginTop: 4 }}>
                            {p.estado_pago ? 'Pagado' : 'Pendiente'}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Tab: Ratings ── */}
        {tab === 'ratings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {pending.length === 0 ? (
              <div className="empty-state">
                <div className="icon">⭐</div>
                <h3 style={{ fontFamily: 'var(--font-head)', fontSize: '1.4rem' }}>TODO AL DÍA</h3>
                <p>No tenés calificaciones pendientes.</p>
              </div>
            ) : (
              pending.map(({ viaje, sinCalificar }) => (
                <div key={viaje.id} className="card">
                  <div style={{ marginBottom: 16 }}>
                    <span className={`badge ${viaje.tipo === 'IDA' ? 'badge-green' : 'badge-orange'}`}>
                      {viaje.tipo === 'IDA' ? '→ AL CAMPUS' : '← A CASA'}
                    </span>
                    <div style={{ fontWeight: 600, marginTop: 8 }}>
                      {viaje.zona_comun?.split('/')[0].trim()} — {viaje.barrio}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>
                      {new Date(viaje.fecha_hora).toLocaleString('es-AR', {
                        dateStyle: 'short', timeStyle: 'short',
                        timeZone: 'America/Argentina/Cordoba'
                      })}
                    </div>
                  </div>

                  {sinCalificar.map(p => {
                    const key = `${viaje.id}:${p.id}`;
                    const yaCalifique = ratedIds.has(key);
                    return (
                      <div key={p.id} style={{
                        paddingTop: 14, borderTop: '1px solid var(--border)',
                        display: 'flex', flexDirection: 'column', gap: 8
                      }}>
                        <div style={{ fontWeight: 600 }}>{p.nombre} {p.apellido}</div>
                        {yaCalifique ? (
                          <div className="alert alert-success" style={{ fontSize: '0.8rem' }}>
                            ✅ ¡Calificación enviada!
                          </div>
                        ) : (
                          <Stars
                            interactive
                            onRate={(puntuacion) => sendRating(viaje.id, p.id, puntuacion)}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
