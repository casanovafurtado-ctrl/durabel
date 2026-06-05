'use client';

import BriefingModal, { matchClient, timeUntil } from './BriefingModal';

import { useState, useEffect } from 'react';
import { RefreshCw, Plus, Calendar, MapPin, Users, Trash2, Pencil } from 'lucide-react';

const MEETING_KEYWORDS = ['reunião','reuniao','visita','vistoria','meeting','call','apresentação','apresentacao','inspeção','inspecao','assembleia','consulta','entrevista','workshop','treinamento','capacitação','capacitacao','laudo','perícia','pericia'];

function isMeetingEvent(event) {
  const title = (event.summary || '').toLowerCase();
  const hasKeyword = MEETING_KEYWORDS.some(k => title.includes(k));
  const hasDateTime = !!event.start?.dateTime; // evento com hora = provavelmente reunião
  const hasLocation = !!event.location;
  const hasAttendees = (event.attendees?.length || 0) > 1;
  return hasKeyword || hasLocation || hasAttendees || hasDateTime;
}

function EventCard({ event, onDelete, onEdit, onBriefing }) {
  const [editing, setEditing] = useState(false);
  const parseDate = (dateStr) => {
    if (!dateStr) return '';
    if (dateStr.includes('T')) {
      // Converte para fuso de Recife (UTC-3)
      const d = new Date(dateStr);
      const recife = new Date(d.toLocaleString('en-US', { timeZone: 'America/Recife' }));
      const y = recife.getFullYear();
      const m = String(recife.getMonth() + 1).padStart(2, '0');
      const day = String(recife.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
    return dateStr;
  };

  const parseTime = (dateStr) => {
    if (!dateStr || !dateStr.includes('T')) return '';
    const d = new Date(dateStr);
    const recife = new Date(d.toLocaleString('en-US', { timeZone: 'America/Recife' }));
    return `${String(recife.getHours()).padStart(2, '0')}:${String(recife.getMinutes()).padStart(2, '0')}`;
  };

  const [form, setForm] = useState({
    title: event.title,
    location: event.location || '',
    description: event.description || '',
    date: parseDate(event.start),
    time: parseTime(event.start),
    endTime: parseTime(event.end),
  });

  const start = new Date(event.start);
  const isToday = new Date().toDateString() === start.toDateString();
  const isTomorrow = new Date(Date.now() + 86400000).toDateString() === start.toDateString();

  const dateLabel = isToday ? 'Hoje' : isTomorrow ? 'Amanhã'
    : start.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });

  const timeLabel = event.start.includes('T')
    ? start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : 'Dia inteiro';

  const handleSaveEdit = async () => {
    await onEdit && onEdit(event.id, form);
    event.title = form.title;
    event.location = form.location;
    event.description = form.description;
    if (form.date && form.time) {
      event.start = `${form.date}T${form.time}:00`;
      if (form.endTime) event.end = `${form.date}T${form.endTime}:00`;
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="rounded-xl p-4 mb-3"
        style={{ background: 'var(--card)', border: '1px solid rgba(0,119,255,0.4)' }}>
        <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
          placeholder="Título *"
          className="w-full rounded-xl px-3 py-2 text-sm mb-2"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Inter, sans-serif' }} />
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--muted)' }}>Data</label>
            <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
              className="w-full rounded-xl px-3 py-2 text-sm"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Inter, sans-serif' }} />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--muted)' }}>Início</label>
            <input type="time" value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))}
              className="w-full rounded-xl px-3 py-2 text-sm"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Inter, sans-serif' }} />
          </div>
        </div>
        <div className="mb-2">
          <label className="text-xs mb-1 block" style={{ color: 'var(--muted)' }}>Término</label>
          <input type="time" value={form.endTime} onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))}
            className="w-full rounded-xl px-3 py-2 text-sm"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Inter, sans-serif' }} />
        </div>
        <input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
          placeholder="Local"
          className="w-full rounded-xl px-3 py-2 text-sm mb-2"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Inter, sans-serif' }} />
        <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
          placeholder="Descrição / Pauta" rows={2}
          className="w-full rounded-xl px-3 py-2 text-sm resize-none mb-3"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Inter, sans-serif' }} />
        <div className="flex gap-2">
          <button onClick={() => setEditing(false)}
            className="flex-1 py-2 rounded-xl text-xs font-semibold"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--muted)' }}>
            Cancelar
          </button>
          <button onClick={handleSaveEdit}
            className="flex-1 py-2 rounded-xl text-xs font-semibold text-white"
            style={{ background: 'var(--blue)' }}>
            Salvar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl p-4 mb-3"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${isToday ? 'var(--neon)' : '#0077FF'}`,
      }}>
      <div className="flex justify-between items-start gap-2">
        <h3 className="font-semibold text-sm flex-1" style={{ color: 'var(--text)', fontFamily: 'Inter, sans-serif' }}>
          {event.title}
        </h3>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="text-right">
            <div className="text-xs font-semibold" style={{ color: isToday ? 'var(--neon)' : 'var(--blue)' }}>
              {dateLabel}
            </div>
            <div className="text-xs" style={{ color: 'var(--muted)' }}>{timeLabel}</div>
          </div>
          {isMeetingEvent(event) && (
            <button onClick={() => onBriefing && onBriefing(event)}
              className="px-2 h-7 rounded-lg flex items-center gap-1 text-xs font-semibold ml-1"
              style={{ background: 'rgba(0,119,255,0.1)', border: '1px solid rgba(0,119,255,0.2)', color: 'var(--blue)', fontFamily: 'Inter' }}>
              ✨
            </button>
          )}
          <button onClick={() => setEditing(true)}
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--muted)' }}>
            <Pencil size={12} />
          </button>
          <button onClick={() => onDelete && onDelete(event.id)}
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444' }}>
            <Trash2 size={12} />
          </button>
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
  const [showPast, setShowPast] = useState(false);
  const [briefingEvent, setBriefingEvent] = useState(null);
  const [crmClients, setCrmClients] = useState([]);
  const [savedMinutes, setSavedMinutes] = useState([]);

  const editEvent = async (eventId, form) => {
    try {
      await fetch('/api/calendar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          title: form.title,
          location: form.location || '',
          description: form.description || '',
          date: form.date,
          time: form.time,
          endTime: form.endTime || '',
        }),
      });

      // Atualiza estado local para refletir mudança imediatamente
      setEvents(prev => prev.map(e => {
        if (e.id !== eventId) return e;
        const updated = {
          ...e,
          title: form.title,
          location: form.location,
          description: form.description,
        };
        if (form.date && form.time) {
          updated.start = `${form.date}T${form.time}:00`;
          updated.end = form.endTime
            ? `${form.date}T${form.endTime}:00`
            : updated.end;
        }
        return updated;
      }));
    } catch {}
  };

  const deleteEvent = async (eventId) => {
    try {
      await fetch(`/api/calendar?eventId=${eventId}`, { method: 'DELETE' });
      setEvents(prev => prev.filter(e => e.id !== eventId));
    } catch {}
  };

  const loadEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/calendar?days=30&includePast=true');
      const data = await res.json();
      setEvents(data.events || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    loadEvents();
    try { setCrmClients(JSON.parse(localStorage.getItem('durabel_clients') || '[]')); } catch {}
    try { setSavedMinutes(JSON.parse(localStorage.getItem('durabel_minutes') || '[]')); } catch {}
  }, []);

  const now = new Date();
  const today = events.filter(e => new Date(e.start).toDateString() === now.toDateString());
  const upcoming = events.filter(e => new Date(e.start) > now && new Date(e.start).toDateString() !== now.toDateString());
  const past = events.filter(e => new Date(e.start) < now && new Date(e.start).toDateString() !== now.toDateString()).sort((a,b) => new Date(b.start) - new Date(a.start));

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
            {/* Eventos passados */}
            {past.length > 0 && (
              <div className="mb-4">
                <button onClick={() => setShowPast(s => !s)}
                  className="flex items-center gap-2 mb-2 text-xs font-bold tracking-widest"
                  style={{ color: 'var(--dim)', letterSpacing: '0.1em', background: 'none', border: 'none', cursor: 'pointer' }}>
                  {showPast ? '▾' : '▸'} PASSADOS · {past.length}
                </button>
                {showPast && past.map(e => (
                  <div key={e.id} style={{ opacity: 0.55 }}>
                    <EventCard event={e} onDelete={deleteEvent} onEdit={editEvent} onBriefing={ev => setBriefingEvent(ev)} />
                  </div>
                ))}
              </div>
            )}

            {today.length > 0 && (
              <>
                <p className="text-xs font-bold tracking-widest mb-2" style={{ color: 'var(--neon)', letterSpacing: '0.1em' }}>
                  HOJE · {today.length}
                </p>
                {today.map(e => <EventCard key={e.id} event={e} onDelete={deleteEvent} onEdit={editEvent} />)}
              </>
            )}
            {upcoming.length > 0 && (
              <>
                <p className="text-xs font-bold tracking-widest mb-2 mt-4" style={{ color: 'var(--muted)', letterSpacing: '0.1em' }}>
                  PRÓXIMOS · {upcoming.length}
                </p>
                {upcoming.map(e => <EventCard key={e.id} event={e} onDelete={deleteEvent} onEdit={editEvent} onBriefing={ev => setBriefingEvent(ev)} />)}
              </>
            )}
          </>
        )}
      </div>

      {showModal && <NewEventModal onClose={() => setShowModal(false)} onCreated={loadEvents} />}
      {briefingEvent && (
        <BriefingModal
          event={briefingEvent}
          clients={crmClients}
          minutes={savedMinutes}
          tasks={[]}
          onClose={() => setBriefingEvent(null)} />
      )}
    </div>
  );
}
