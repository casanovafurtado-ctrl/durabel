'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Plus, Calendar, MapPin, Users } from 'lucide-react';

function EventCard({ event }) {
  const start = new Date(event.start);
  const isToday = new Date().toDateString() === start.toDateString();
  const isTomorrow = new Date(Date.now() + 86400000).toDateString() === start.toDateString();

  const dateLabel = isToday ? 'Hoje' : isTomorrow ? 'Amanhã'
    : start.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });

  const timeLabel = event.start.includes('T')
    ? start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : 'Dia inteiro';

  return (
    <div className="rounded-xl p-4 mb-3 transition-all hover:scale-[1.01]"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${isToday ? 'var(--neon)' : '#0077FF'}`,
      }}>
      <div className="flex justify-between items-start gap-2">
        <h3 className="font-semibold text-sm flex-1" style={{ color: 'var(--text)', fontFamily: 'Inter, sans-serif' }}>
          {event.title}
        </h3>
        <div className="text-right flex-shrink-0">
          <div className="text-xs font-semibold" style={{ color: isToday ? 'var(--neon)' : 'var(--blue)' }}>
            {dateLabel}
          </div>
          <div className="text-xs" style={{ color: 'var(--muted)' }}>{timeLabel}</div>
        </div>
      </div>
      {event.location && (
        <div className="flex items-center gap-1.5 mt-2">
          <MapPin size={11} style={{ color: 'var(--muted)' }} />
          <span className="text-xs" style={{ color: 'var(--muted)' }}>{event.location}</span>
        </div>
      )}
      {event.attendees && (
        <div className="flex items-center gap-1.5 mt-1">
          <Users size={11} style={{ color: 'var(--muted)' }} />
          <span className="text-xs" style={{ color: 'var(--muted)' }}>{event.attendees}</span>
        </div>
      )}
    </div>
  );
}

function NewEventModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', date: '', time: '', location: '', description: '' });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.title || !form.date) return;
    setSaving(true);
    try {
      await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      onCreated();
      onClose();
    } catch { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}>
      <div className="w-full max-w-lg rounded-t-3xl p-6 pb-10 animate-slide-up"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full mx-auto mb-6" style={{ background: 'var(--border)' }} />
        <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text)', fontFamily: 'Syne, sans-serif' }}>
          Novo Evento
        </h2>
        <div className="space-y-3">
          {[
            { key: 'title', placeholder: 'Título *', type: 'text' },
            { key: 'date', placeholder: 'Data *', type: 'date' },
            { key: 'time', placeholder: 'Horário', type: 'time' },
            { key: 'location', placeholder: 'Local', type: 'text' },
          ].map(({ key, placeholder, type }) => (
            <input key={key} type={type} placeholder={placeholder}
              value={form[key]}
              onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
              className="w-full rounded-xl px-4 py-3 text-sm"
              style={{
                background: 'var(--bg)', border: '1px solid var(--border)',
                color: 'var(--text)', fontFamily: 'Inter, sans-serif',
              }} />
          ))}
          <textarea placeholder="Pauta / Descrição" rows={3}
            value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            className="w-full rounded-xl px-4 py-3 text-sm resize-none"
            style={{
              background: 'var(--bg)', border: '1px solid var(--border)',
              color: 'var(--text)', fontFamily: 'Inter, sans-serif',
            }} />
        </div>
        <button onClick={handleSave} disabled={saving || !form.title || !form.date}
          className="btn-glow w-full py-3 rounded-2xl text-white font-semibold mt-4 text-sm"
          style={{ fontFamily: 'Inter, sans-serif', opacity: saving || !form.title ? 0.6 : 1 }}>
          {saving ? 'Salvando...' : 'Criar Evento no Google Calendar'}
        </button>
      </div>
    </div>
  );
}

export default function CalendarPanel() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/calendar?days=14');
      const data = await res.json();
      setEvents(data.events || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadEvents(); }, []);

  const today = events.filter(e => new Date(e.start).toDateString() === new Date().toDateString());
  const upcoming = events.filter(e => new Date(e.start).toDateString() !== new Date().toDateString());

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <h2 className="font-bold text-base" style={{ fontFamily: 'Syne, sans-serif' }}>Agenda</h2>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadEvents} className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--muted)' }}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setShowModal(true)} className="btn-glow h-9 px-4 rounded-xl flex items-center gap-2 text-white text-sm"
            style={{ fontFamily: 'Inter, sans-serif' }}>
            <Plus size={15} /> Novo
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4">
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: 'var(--card)' }} />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16">
            <Calendar size={36} style={{ color: 'var(--dim)', margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--muted)', fontFamily: 'Inter, sans-serif' }}>Nenhum evento nos próximos 14 dias</p>
          </div>
        ) : (
          <>
            {today.length > 0 && (
              <>
                <p className="text-xs font-bold tracking-widest mb-2" style={{ color: 'var(--neon)', letterSpacing: '0.1em' }}>
                  HOJE · {today.length}
                </p>
                {today.map(e => <EventCard key={e.id} event={e} />)}
              </>
            )}
            {upcoming.length > 0 && (
              <>
                <p className="text-xs font-bold tracking-widest mb-2 mt-4" style={{ color: 'var(--muted)', letterSpacing: '0.1em' }}>
                  PRÓXIMOS · {upcoming.length}
                </p>
                {upcoming.map(e => <EventCard key={e.id} event={e} />)}
              </>
            )}
          </>
        )}
      </div>

      {showModal && <NewEventModal onClose={() => setShowModal(false)} onCreated={loadEvents} />}
    </div>
  );
}
