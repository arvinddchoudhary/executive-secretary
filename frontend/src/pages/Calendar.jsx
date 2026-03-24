import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import RescheduleModal from '../components/RescheduleModal';

const HOURS = Array.from({ length: 9 }, (_, i) => i + 9);
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

const priorityColors = {
  high: 'var(--red)',
  medium: 'var(--amber)',
  low: 'var(--green)',
};

const navBtn = {
  background: 'transparent', border: '1px solid var(--border-light)',
  borderRadius: '7px', padding: '7px 14px',
  color: 'var(--text-muted)', fontSize: '12px',
  fontFamily: 'DM Sans, sans-serif', cursor: 'pointer',
};

const Calendar = () => {
  const [schedules, setSchedules] = useState([]);
  const [tasks, setTasks] = useState({});
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [schedRes, taskRes] = await Promise.all([api.get('/schedules/'), api.get('/tasks/')]);
        setSchedules(schedRes.data);
        const taskMap = {};
        taskRes.data.forEach(t => { taskMap[t.id] = t; });
        setTasks(taskMap);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  const getWeekDates = (offset = 0) => {
    const now = new Date();
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + offset * 7);
    return Array.from({ length: 5 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  };

  const weekDates = getWeekDates(weekOffset);

  const getSchedulesForSlot = (date, hour) => {
    return schedules.filter(s => {
      const start = new Date(s.start_time);
      const end = new Date(s.end_time);
      const slotStart = new Date(date); slotStart.setHours(hour, 0, 0, 0);
      const slotEnd = new Date(date); slotEnd.setHours(hour + 1, 0, 0, 0);
      return start < slotEnd && end > slotStart && start.toDateString() === date.toDateString();
    });
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar />
      <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>Schedule View</h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Approved tasks auto-scheduled by AI</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={() => setWeekOffset(w => w - 1)} style={navBtn}>← Prev</button>
            <button onClick={() => setWeekOffset(0)} style={{ ...navBtn, color: weekOffset === 0 ? 'var(--gold)' : 'var(--text-muted)', borderColor: weekOffset === 0 ? 'var(--gold)' : 'var(--border-light)' }}>Today</button>
            <button onClick={() => setWeekOffset(w => w + 1)} style={navBtn}>Next →</button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '80px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading schedule...</div>
        ) : (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '64px repeat(5, 1fr)', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
              <div />
              {weekDates.map((date, i) => {
                const isToday = date.toDateString() === new Date().toDateString();
                return (
                  <div key={i} style={{ padding: '14px 12px', borderLeft: '1px solid var(--border)', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'DM Mono, monospace', marginBottom: '4px' }}>{DAYS[i]}</div>
                    <div style={{
                      fontSize: '20px', fontWeight: '600', fontFamily: 'DM Mono, monospace',
                      color: isToday ? 'var(--gold)' : 'var(--text-primary)',
                      background: isToday ? 'var(--gold-dim)' : 'transparent',
                      borderRadius: '6px', padding: '2px 6px', display: 'inline-block',
                    }}>{date.getDate()}</div>
                  </div>
                );
              })}
            </div>
            {HOURS.map(hour => (
              <div key={hour} style={{ display: 'grid', gridTemplateColumns: '64px repeat(5, 1fr)', borderBottom: '1px solid var(--border)', minHeight: '64px' }}>
                <div style={{ padding: '10px 12px', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace', textAlign: 'right', borderRight: '1px solid var(--border)' }}>{hour}:00</div>
                {weekDates.map((date, di) => {
                  const slotSchedules = getSchedulesForSlot(date, hour);
                  const isToday = date.toDateString() === new Date().toDateString();
                  return (
                    <div key={di} style={{ borderLeft: '1px solid var(--border)', padding: '4px', background: isToday ? 'rgba(201,168,76,0.02)' : 'transparent' }}>
                      {slotSchedules.map(s => {
                        const task = tasks[s.task_id];
                        const color = priorityColors[task?.priority || 'medium'];
                        return (
  <div key={s.id} style={{
    background: `${color}15`, border: `1px solid ${color}40`,
    borderLeft: `3px solid ${color}`, borderRadius: '6px',
    padding: '6px 8px', marginBottom: '2px', cursor: 'pointer',
    transition: 'background 0.15s',
  }}
    onClick={() => setRescheduleTarget({ taskId: s.task_id, taskTitle: task?.title || `Task #${s.task_id}`, start: s.start_time, end: s.end_time })}
    onMouseEnter={e => e.currentTarget.style.background = `${color}25`}
    onMouseLeave={e => e.currentTarget.style.background = `${color}15`}
  >
    <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
      {task?.title || `Task #${s.task_id}`}
    </div>
    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
      {new Date(s.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(s.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
    </div>
    <div style={{ fontSize: '10px', color: color, marginTop: '2px', fontFamily: 'DM Mono, monospace' }}>
      click to reschedule
    </div>
  </div>
);
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: '20px', marginTop: '16px', justifyContent: 'flex-end' }}>
          {[['high', 'High Priority'], ['medium', 'Medium Priority'], ['low', 'Low Priority']].map(([p, label]) => (
            <div key={p} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: priorityColors[p] }} />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
      {rescheduleTarget && (
  <RescheduleModal
    taskId={rescheduleTarget.taskId}
    taskTitle={rescheduleTarget.taskTitle}
    currentStart={rescheduleTarget.start}
    currentEnd={rescheduleTarget.end}
    onClose={() => setRescheduleTarget(null)}
    onRescheduled={() => {
      setRescheduleTarget(null);
      const load = async () => {
        const [schedRes, taskRes] = await Promise.all([api.get('/schedules/'), api.get('/tasks/')]);
        setSchedules(schedRes.data);
        const taskMap = {};
        taskRes.data.forEach(t => { taskMap[t.id] = t; });
        setTasks(taskMap);
      };
      load();
    }}
  />
)}
    </div>
  );
};

export default Calendar;