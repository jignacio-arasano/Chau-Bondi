import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ICONS = {
  home:   { path: '/',        label: 'Inicio',  icon: '🏠' },
  search: { path: '/search',  label: 'Buscar',  icon: '🔍' },
  create: { path: '/create',  label: 'Publicar', icon: '➕' },
  profile:{ path: '/profile', label: 'Perfil',  icon: '👤' }
};

const HIDE_ON = ['/login', '/register', '/payment'];

export default function Navbar() {
  const { user }    = useAuth();
  const { pathname } = useLocation();

  if (!user) return null;
  if (HIDE_ON.some(p => pathname.startsWith(p))) return null;

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'rgba(10,10,18,0.92)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderTop: '1px solid var(--border)',
      padding: '8px 0 calc(8px + env(safe-area-inset-bottom))',
      zIndex: 100
    }}>
      <div style={{
        display: 'flex',
        maxWidth: 480,
        margin: '0 auto',
        padding: '0 8px'
      }}>
        {Object.values(ICONS).map(({ path, label, icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            style={({ isActive }) => ({
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              padding: '6px 4px',
              borderRadius: 10,
              textDecoration: 'none',
              color: isActive ? 'var(--green)' : 'var(--text3)',
              transition: 'color 0.15s',
              background: isActive ? 'var(--green-bg)' : 'transparent'
            })}
          >
            <span style={{ fontSize: '1.35rem', lineHeight: 1 }}>{icon}</span>
            <span style={{ fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.04em' }}>
              {label}
            </span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
