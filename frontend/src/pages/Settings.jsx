import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import api from '../api/axios';

const inputStyle = {
  background: 'var(--bg-secondary)', border: '1px solid var(--border)',
  borderRadius: '8px', padding: '10px 14px',
  color: 'var(--text-primary)', fontSize: '13px',
  fontFamily: 'DM Mono, monospace', outline: 'none', width: '100%',
};

const DAYS = [
  { label: 'Mon', value: 1 }, { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 }, { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 }, { label: 'Sat', value: 6 },
  { label: 'Sun', value: 7 },
];

const Settings = () => {
  const [form, setForm] = useState({
    work_start_hour: 9, work_end_hour: 18,
    work_days: '1,2,3,4,5',
    lunch_start: '', lunch_end: '',
    slot_interval_minutes: 30,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    api.get('/settings/').then(res => {
      setForm({
        work_start_hour: res.data.work_start_hour,
        work_end_hour: res.data.work_end_hour,
        work_days: res.data.work_days,
        lunch_start: res.data.lunch_start ?? '',
        lunch_end: res.data.lunch_end ?? '',
        slot_interval_minutes: res.data.slot_interval_minutes,
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const toggleDay = (val) => {
    const days = form.work_days ? form.work_days.split(',').map(Number) : [];
    const updated = days.includes(val) ? days.filter(d => d !== val) : [...days, val].sort();
    setForm({ ...form, work_days: updated.join(',') });
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.post('/settings/', {
        ...form,
        lunch_start: form.lunch_start === '' ? null : Number(form.lunch_start),
        lunch_end: form.lunch_end === '' ? null : Number(form.lunch_end),
      });
      showToast('Settings saved successfully');
    } catch {
      showToast('Failed to save settings', 'error');
    }
    setSaving(false);
  };

  const activeDays = form.work_days ? form.work_days.split(',').map(Number) : [];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar />
      {toast && (
        <div style={{
          position: 'fixed', top: '72px', right: '24px', zIndex: 999,
          background: toast.type === 'error' ? 'var(--red-dim)' : 'var(--green-dim)',
          border: `1px solid ${toast.type === 'error' ? 'var(--red)' : 'var(--green)'}`,
          color: toast.type === 'error' ? 'var(--red)' : 'var(--green)',
          padding: '12px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '500',
        }}>{toast.msg}</div>
      )}
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>Work Schedule</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Configure your personal working hours and availability</p>
        </div>

        {loading ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Working Days */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '16px' }}>Working Days</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {DAYS.map(({ label, value }) => (
                  <button key={value} onClick={() => toggleDay(value)} style={{
                    width: '44px', height: '44px', borderRadius: '8px',
                    border: activeDays.includes(value) ? '1px solid var(--gold)' : '1px solid var(--border)',
                    background: activeDays.includes(value) ? 'var(--gold-dim)' : 'transparent',
                    color: activeDays.includes(value) ? 'var(--gold)' : 'var(--text-muted)',
                    fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                    fontFamily: 'DM Sans, sans-serif',
                  }}>{label}</button>
                ))}
              </div>
            </div>

            {/* Working Hours */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '16px' }}>Working Hours</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Start Hour (0-23)</label>
                  <input type="number" min="0" max="23" value={form.work_start_hour}
                    onChange={e => setForm({ ...form, work_start_hour: Number(e.target.value) })}
                    style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>End Hour (0-23)</label>
                  <input type="number" min="0" max="23" value={form.work_end_hour}
                    onChange={e => setForm({ ...form, work_end_hour: Number(e.target.value) })}
                    style={inputStyle} />
                </div>
              </div>
            </div>

            {/* Lunch Break */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '16px' }}>Lunch Break <span style={{ color: 'var(--text-muted)', fontWeight: '400', textTransform: 'none', letterSpacing: 0 }}>(optional)</span></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Lunch Start Hour</label>
                  <input type="number" min="0" max="23" value={form.lunch_start}
                    onChange={e => setForm({ ...form, lunch_start: e.target.value })}
                    placeholder="e.g. 13" style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Lunch End Hour</label>
                  <input type="number" min="0" max="23" value={form.lunch_end}
                    onChange={e => setForm({ ...form, lunch_end: e.target.value })}
                    placeholder="e.g. 14" style={inputStyle} />
                </div>
              </div>
            </div>

            {/* Slot Interval */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '16px' }}>Scheduling Interval</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[15, 30, 45, 60].map(v => (
                  <button key={v} onClick={() => setForm({ ...form, slot_interval_minutes: v })} style={{
                    padding: '8px 20px', borderRadius: '8px',
                    border: form.slot_interval_minutes === v ? '1px solid var(--gold)' : '1px solid var(--border)',
                    background: form.slot_interval_minutes === v ? 'var(--gold-dim)' : 'transparent',
                    color: form.slot_interval_minutes === v ? 'var(--gold)' : 'var(--text-muted)',
                    fontSize: '13px', fontWeight: '500', cursor: 'pointer',
                    fontFamily: 'DM Sans, sans-serif',
                  }}>{v}m</button>
                ))}
              </div>
            </div>

            <button onClick={save} disabled={saving} style={{
              background: 'linear-gradient(135deg, var(--gold), var(--gold-light))',
              border: 'none', borderRadius: '8px', padding: '13px',
              color: '#0a0c10', fontWeight: '600', fontSize: '14px',
              fontFamily: 'DM Sans, sans-serif', cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
            }}>{saving ? 'Saving...' : 'Save Settings'}</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;