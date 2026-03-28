import { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import TaskDetailModal from '../components/TaskDetailModal';

const priorityConfig = {
  high: { color: 'var(--red)', bg: 'var(--red-dim)', label: 'HIGH' },
  medium: { color: 'var(--amber)', bg: 'var(--amber-dim)', label: 'MED' },
  low: { color: 'var(--green)', bg: 'var(--green-dim)', label: 'LOW' },
};

const statusConfig = {
  pending: { color: 'var(--amber)', bg: 'var(--amber-dim)', label: 'Pending' },
  approved: { color: 'var(--blue)', bg: 'var(--blue-dim)', label: 'Approved' },
  completed: { color: 'var(--green)', bg: 'var(--green-dim)', label: 'Completed' },
  rejected: { color: 'var(--red)', bg: 'var(--red-dim)', label: 'Rejected' },
};

const Badge = ({ type, value }) => {
  const cfg = type === 'priority' ? priorityConfig[value] : statusConfig[value];
  if (!cfg) return null;
  return (
    <span style={{
      background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.color}30`,
      borderRadius: '4px', padding: '2px 8px',
      fontSize: '11px', fontWeight: '600',
      fontFamily: 'DM Mono, monospace', letterSpacing: '0.5px',
    }}>{cfg.label}</span>
  );
};

const btnPrimary = {
  background: 'linear-gradient(135deg, var(--gold), var(--gold-light))',
  border: 'none', borderRadius: '8px', padding: '9px 18px',
  color: '#0a0c10', fontWeight: '600', fontSize: '13px',
  fontFamily: 'DM Sans, sans-serif', cursor: 'pointer',
};
const btnSecondary = {
  background: 'transparent',
  border: '1px solid var(--border-light)', borderRadius: '8px', padding: '9px 18px',
  color: 'var(--text-secondary)', fontSize: '13px',
  fontFamily: 'DM Sans, sans-serif', cursor: 'pointer',
};
const btnSmallGreen = {
  background: 'var(--green-dim)', border: '1px solid var(--green)',
  color: 'var(--green)', borderRadius: '6px', padding: '4px 10px',
  fontSize: '11px', fontWeight: '600', fontFamily: 'DM Sans, sans-serif', cursor: 'pointer',
};
const btnSmallRed = {
  background: 'var(--red-dim)', border: '1px solid var(--red)',
  color: 'var(--red)', borderRadius: '6px', padding: '4px 10px',
  fontSize: '11px', fontWeight: '600', fontFamily: 'DM Sans, sans-serif', cursor: 'pointer',
};
const btnSmallBlue = {
  background: 'var(--blue-dim)', border: '1px solid var(--blue)',
  color: 'var(--blue)', borderRadius: '6px', padding: '4px 10px',
  fontSize: '11px', fontWeight: '600', fontFamily: 'DM Sans, sans-serif', cursor: 'pointer',
};
const inputStyle = {
  background: 'var(--bg-secondary)', border: '1px solid var(--border)',
  borderRadius: '8px', padding: '10px 14px',
  color: 'var(--text-primary)', fontSize: '13px',
  fontFamily: 'DM Sans, sans-serif', outline: 'none',
};

const Dashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [testEmail, setTestEmail] = useState({ sender: '', subject: '', body: '' });
  const [showModal, setShowModal] = useState(false);
  const [sending, setSending] = useState(false);
  const [polling, setPolling] = useState(false);
  const [toast, setToast] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadTasks = useCallback(async () => {
    try {
      const res = await api.get('/tasks/');
      setTasks(res.data);
    } catch {
      showToast('Failed to load tasks', 'error');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
  loadTasks();
  const interval = setInterval(loadTasks, 30000);
  return () => clearInterval(interval);
  }, [loadTasks]);

  const updateTask = async (id, status) => {
    try {
      await api.patch(`/tasks/${id}`, { status });
      showToast(`Task marked as ${status}`);
      loadTasks();
    } catch {
      showToast('Update failed', 'error');
    }
  };

  const sendTestEmail = async () => {
    setSending(true);
    try {
      await api.post('/emails/ingest', testEmail);
      showToast('Email processed successfully');
      setShowModal(false);
      setTestEmail({ sender: '', subject: '', body: '' });
      loadTasks();
    } catch {
      showToast('Failed to process email', 'error');
    }
    setSending(false);
  };

  const pollGmail = async () => {
    setPolling(true);
    try {
      const res = await api.post('/emails/poll');
      showToast(`Fetched ${res.data.fetched} new email(s)`);
      loadTasks();
    } catch {
      showToast('Gmail poll failed', 'error');
    }
    setPolling(false);
  };

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);
  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    approved: tasks.filter(t => t.status === 'approved').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  };

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
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}>{toast.msg}</div>
      )}
      <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>Task Intelligence</h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>AI-extracted tasks from your inbox</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={pollGmail} disabled={polling} style={btnSecondary}>{polling ? 'Polling...' : '⟳ Poll Gmail'}</button>
            <button onClick={() => setShowModal(true)} style={btnPrimary}>+ Inject Email</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
          {[
            { label: 'Total Tasks', value: stats.total, color: 'var(--text-primary)', accent: 'var(--blue)' },
            { label: 'Pending Review', value: stats.pending, color: 'var(--amber)', accent: 'var(--amber)' },
            { label: 'Approved', value: stats.approved, color: 'var(--blue)', accent: 'var(--blue)' },
            { label: 'Completed', value: stats.completed, color: 'var(--green)', accent: 'var(--green)' },
          ].map(({ label, value, color, accent }) => (
            <div key={label} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: '12px', padding: '20px 24px', position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: accent }} />
              <div style={{ fontSize: '32px', fontWeight: '700', color, fontFamily: 'DM Mono, monospace', marginBottom: '4px' }}>{value}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '4px', marginBottom: '20px' }}>
          {['all', 'pending', 'approved', 'completed', 'rejected'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              background: filter === f ? 'var(--gold-dim)' : 'transparent',
              border: filter === f ? '1px solid var(--gold)' : '1px solid transparent',
              color: filter === f ? 'var(--gold)' : 'var(--text-muted)',
              padding: '6px 16px', borderRadius: '6px', cursor: 'pointer',
              fontSize: '12px', fontWeight: '500', fontFamily: 'DM Sans, sans-serif', textTransform: 'capitalize',
            }}>{f}</button>
          ))}
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 80px 100px 100px 180px', padding: '12px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
            {['Task', 'Description', 'Priority', 'Status', 'Est. Time', 'Actions'].map(h => (
              <div key={h} style={{ fontSize: '10px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'DM Mono, monospace' }}>{h}</div>
            ))}
          </div>
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>Loading tasks...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>📭</div>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>No tasks found</div>
            </div>
          ) : filtered.map((task, i) => (
            <div key={task.id} style={{
              display: 'grid', gridTemplateColumns: '2fr 1fr 80px 100px 100px 180px',
              padding: '16px 20px', borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
              alignItems: 'center',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div>
                <div onClick={() => setSelectedTaskId(task.id)} style={{
  fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)',
  marginBottom: '2px', cursor: 'pointer',
  textDecoration: 'underline', textDecorationColor: 'var(--border-light)',
}}>{task.title}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>#{task.id} · {new Date(task.created_at).toLocaleDateString()}</div>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', paddingRight: '12px', lineHeight: '1.4' }}>
                {task.description?.slice(0, 60)}{task.description?.length > 60 ? '...' : ''}
              </div>
              <Badge type="priority" value={task.priority} />
              <Badge type="status" value={task.status} />
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'DM Mono, monospace' }}>{task.estimated_minutes}m</div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {task.status === 'pending' && (
                  <>
                    <button onClick={() => updateTask(task.id, 'approved')} style={btnSmallGreen}>Approve</button>
                    <button onClick={() => updateTask(task.id, 'rejected')} style={btnSmallRed}>Reject</button>
                  </>
                )}
                {task.status === 'approved' && (
                  <button onClick={() => updateTask(task.id, 'completed')} style={btnSmallBlue}>Complete</button>
                )}
                {(task.status === 'completed' || task.status === 'rejected') && (
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>—</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: '16px', padding: '36px', width: '520px',
            boxShadow: '0 40px 80px rgba(0,0,0,0.6)', position: 'relative',
          }}>
            <div style={{ position: 'absolute', top: 0, left: '48px', right: '48px', height: '1px', background: 'linear-gradient(90deg, transparent, var(--gold), transparent)' }} />
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', marginBottom: '24px', color: 'var(--text-primary)' }}>Inject Test Email</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[{ label: 'Sender Email', key: 'sender', placeholder: 'client@company.com' }, { label: 'Subject', key: 'subject', placeholder: 'Meeting Request for Q4 Review' }].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: '6px' }}>{label}</label>
                  <input value={testEmail[key]} onChange={e => setTestEmail({ ...testEmail, [key]: e.target.value })} placeholder={placeholder} style={{ ...inputStyle, width: '100%' }} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: '6px' }}>Email Body</label>
                <textarea value={testEmail.body} onChange={e => setTestEmail({ ...testEmail, body: e.target.value })} placeholder="Hi, I'd like to schedule a meeting..." rows={4} style={{ ...inputStyle, width: '100%', resize: 'vertical', lineHeight: '1.5' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={btnSecondary}>Cancel</button>
              <button onClick={sendTestEmail} disabled={sending} style={btnPrimary}>{sending ? 'Processing...' : 'Process Email'}</button>
            </div>
          </div>
        </div>
      )}
      {selectedTaskId && (
  <TaskDetailModal
    taskId={selectedTaskId}
    onClose={() => setSelectedTaskId(null)}
    onUpdated={() => { loadTasks(); setSelectedTaskId(null); }}
  />
)}
    </div>
  );
};

export default Dashboard;