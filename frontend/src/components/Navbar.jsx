import { useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <nav style={{
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border)',
      padding: '0 32px',
      height: '60px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '28px', height: '28px',
            background: 'linear-gradient(135deg, var(--gold), var(--gold-light))',
            borderRadius: '6px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', fontWeight: '700', color: '#0a0c10',
            fontFamily: 'Playfair Display, serif',
          }}>S</div>
          <span style={{
  fontFamily: 'Playfair Display, serif',
  fontSize: '16px', fontWeight: '600',
  color: 'var(--text-primary)',
}}>SecretaryAI</span>
<div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
  <div style={{
    width: '7px', height: '7px', borderRadius: '50%',
    background: 'var(--green)',
    boxShadow: '0 0 6px var(--green)',
    animation: 'pulse 2s infinite',
  }} />
  <span style={{ fontSize: '10px', color: 'var(--green)', fontFamily: 'DM Mono, monospace' }}>LIVE</span>
</div>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {[{ label: 'Dashboard', path: '/dashboard' }, { label: 'Calendar', path: '/calendar' }, { label: 'Settings', path: '/settings' },].map(({ label, path }) => (
            <button key={path} onClick={() => navigate(path)} style={{
              background: location.pathname === path ? 'var(--gold-dim)' : 'transparent',
              border: 'none',
              color: location.pathname === path ? 'var(--gold)' : 'var(--text-secondary)',
              padding: '6px 14px', borderRadius: '6px',
              cursor: 'pointer', fontSize: '13px', fontWeight: '500',
              fontFamily: 'DM Sans, sans-serif',
            }}>{label}</button>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>{user.name || 'Executive'}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{user.role || 'Admin'}</div>
        </div>
        <div style={{
          width: '34px', height: '34px',
          background: 'var(--gold-dim)',
          border: '1px solid var(--gold)',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '13px', fontWeight: '600', color: 'var(--gold)',
        }}>{(user.name || 'E')[0].toUpperCase()}</div>
        <button onClick={logout} style={{
          background: 'transparent',
          border: '1px solid var(--border-light)',
          color: 'var(--text-muted)',
          padding: '6px 12px', borderRadius: '6px',
          cursor: 'pointer', fontSize: '12px',
          fontFamily: 'DM Sans, sans-serif',
        }}>Logout</button>
      </div>
    </nav>
  );
};

export default Navbar;