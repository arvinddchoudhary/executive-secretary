import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const inputStyle = {
  width: '100%',
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  padding: '11px 14px',
  color: 'var(--text-primary)',
  fontSize: '14px',
  fontFamily: 'DM Sans, sans-serif',
  outline: 'none',
};

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      if (isRegister) {
        await api.post('/auth/register', { ...form, role: 'executive' });
        setIsRegister(false);
      } else {
        const res = await api.post('/auth/login', form);
        localStorage.setItem('token', res.data.access_token);
        localStorage.setItem('user', JSON.stringify({ name: form.email.split('@')[0], role: 'Executive' }));
        navigate('/dashboard');
      }
    } catch (e) {
      setError(e.response?.data?.detail || 'Something went wrong');
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
        opacity: 0.4,
      }} />
      <div style={{
        position: 'absolute',
        width: '600px', height: '600px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
      }} />
      <div style={{
        width: '420px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '48px',
        position: 'relative',
        boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
        zIndex: 1,
      }}>
        <div style={{
          position: 'absolute', top: 0, left: '48px', right: '48px', height: '1px',
          background: 'linear-gradient(90deg, transparent, var(--gold), transparent)',
        }} />
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '48px', height: '48px',
            background: 'linear-gradient(135deg, var(--gold), var(--gold-light))',
            borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: '22px', fontWeight: '700', color: '#0a0c10',
            fontFamily: 'Playfair Display, serif',
          }}>S</div>
          <h1 style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: '26px', fontWeight: '600',
            color: 'var(--text-primary)', marginBottom: '6px',
          }}>SecretaryAI</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {isRegister ? 'Create your account' : 'Sign in to your workspace'}
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {isRegister && (
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: '6px' }}>Full Name</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="John Smith" style={inputStyle} />
            </div>
          )}
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: '6px' }}>Email Address</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@company.com" style={inputStyle} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: '6px' }}>Password</label>
            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" style={inputStyle} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>
          {error && (
            <div style={{
              background: 'var(--red-dim)', border: '1px solid var(--red)',
              borderRadius: '8px', padding: '10px 14px',
              fontSize: '13px', color: 'var(--red)',
            }}>{error}</div>
          )}
          <button onClick={handleSubmit} disabled={loading} style={{
            marginTop: '8px',
            background: 'linear-gradient(135deg, var(--gold), var(--gold-light))',
            border: 'none', borderRadius: '8px', padding: '13px',
            color: '#0a0c10', fontWeight: '600', fontSize: '14px',
            fontFamily: 'DM Sans, sans-serif',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
          }}>
            {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </div>
        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: 'var(--text-muted)' }}>
          {isRegister ? 'Already have an account? ' : "Don't have an account? "}
          <span onClick={() => { setIsRegister(!isRegister); setError(''); }} style={{ color: 'var(--gold)', cursor: 'pointer', fontWeight: '500' }}>
            {isRegister ? 'Sign in' : 'Register'}
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;