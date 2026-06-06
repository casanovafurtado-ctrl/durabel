'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Plus, CheckSquare, Circle, CheckCircle2, Trash2, Pencil, CalendarPlus, Clock } from 'lucide-react';
import TimeBlockPanel from './TimeBlockPanel';

function TaskItem({ task, onComplete, onDelete, onRefresh }) {
  const [done, setDone] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showCalModal, setShowCalModal] = useState(false);
  const [calTime, setCalTime] = useState('09:00');
  const [saving, setSaving] = useState(false);

  // Estado local do formulário de edição
  const [editTitle, setEditTitle] = useState(task.title);
  const [editNotes, setEditNotes] = useState(task.notes || '');
  const [editDue, setEditDue] = useState(task.due ? task.due.split('T')[0] : '');

  // Sincroniza estado local quando task prop muda
  useEffect(() => {
    setEditTitle(task.title);
    setEditNotes(task.notes || '');
    setEditDue(task.due ? task.due.split('T')[0] : '');
  }, [task.title, task.notes, task.due]);

  // Formata data para exibição
  const formatDue = (dateStr) => {
    if (!dateStr) return null;
    const date = dateStr.split('T')[0]; // pega só YYYY-MM-DD
    const [y, m, d] = date.split('-');
    return `${d}/${m}/${y}`;
  };

  const handleComplete = async () => {
    setDone(true);
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'complete', taskId: task.id, listId: task.listId }),
    });
    setTimeout(() => onComplete(task.id), 600);
  };

  const handleDelete = async () => {
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', taskId: task.id, listId: task.listId }),
    });
    onDelete(task.id);
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          taskId: task.id,
          listId: task.listId,
          title: editTitle,
          notes: editNotes,
          due: editDue || null,
        }),
      });
      if (res.ok) {
        // Recarrega lista do servidor para garantir dados corretos
        onRefresh && onRefresh();
      }
    } catch {}
    setSaving(false);
    setEditing(false);
  };

  const addToCalendar = async () => {
    if (!task.due) return;
    const date = task.due.split('T')[0];
    await fetch('/api/calendar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: task.title, date, time: calTime, description: task.notes || '' }),
    });
    setShowCalModal(false);
    alert('Adicionado ao Google Calendar!');
  };

  if (editing) {
    return (
      <div className="p-4 rounded-xl mb-3"
        style={{ background: 'var(--card)', border: '1px solid rgba(0,119,255,0.4)' }}>
        <label className="text-xs mb-1 block" style={{ color: 'var(--muted)' }}>Título</label>
        <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
          className="w-full rounded-xl px-3 py-2 text-sm mb-2"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Inter, sans-serif' }} />
        <label className="text-xs mb-1 block" style={{ color: 'var(--muted)' }}>Prazo</label>
        <input type="date" value={editDue} onChange={e => setEditDue(e.target.value)}
          className="w-full rounded-xl px-3 py-2 text-sm mb-2"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Inter, sans-serif' }} />
        <label className="text-xs mb-1 block" style={{ color: 'var(--muted)' }}>Observações</label>
        <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)}
          placeholder="Observações..." rows={2}
          className="w-full rounded-xl px-3 py-2 text-sm resize-none mb-3"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Inter, sans-serif' }} />
        <div className="flex gap-2">
          <button onClick={() => setEditing(false)} disabled={saving}
            className="flex-1 py-2 rounded-xl text-xs font-semibold"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--muted)' }}>
            Cancelar
          </button>
          <button onClick={handleSaveEdit} disabled={saving}
            className="flex-1 py-2 rounded-xl text-xs font-semibold text-white"
            style={{ background: saving ? 'var(--dim)' : 'var(--blue)', cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`flex gap-3 items-start p-4 rounded-xl mb-3 transition-all ${done ? 'opacity-40 scale-95' : ''}`}
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <button onClick={handleComplete} className="flex-shrink-0 mt-0.5">
          {done
            ? <CheckCircle2 size={20} style={{ color: '#10B981' }} />
            : <Circle size={20} style={{ color: 'var(--dim)' }} />
          }
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium" style={{
            color: 'var(--text)', textDecoration: done ? 'line-through' : 'none',
            fontFamily: 'Inter, sans-serif'
          }}>
            {task.title}
          </p>
          {task.notes && (
            <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--muted)' }}>{task.notes}</p>
          )}
          {task.due && (
            <span className="text-xs px-2 py-0.5 rounded-full mt-2 inline-block"
              style={{ background: 'rgba(0,119,255,0.1)', color: 'var(--blue)', border: '1px solid rgba(0,119,255,0.2)' }}>
              📅 {formatDue(task.due)}
            </span>
          )}
        </div>
        <div className="flex gap-1 flex-shrink-0">
          {task.due && (
            <button onClick={() => setShowCalModal(true)}
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              title="Adicionar ao Calendário"
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#10B981' }}>
              <CalendarPlus size={12} />
            </button>
          )}
          <button onClick={() => setEditing(true)}
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--muted)' }}>
            <Pencil size={12} />
          </button>
          <button onClick={handleDelete}
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444' }}>
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {showCalModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setShowCalModal(false)}>
          <div className="w-full max-w-lg rounded-t-3xl p-6 pb-10 animate-slide-up"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            onClick={e => e.stopPropagation()}>
            <p className="font-bold text-sm mb-1" style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text)' }}>
              Adicionar ao Calendário
            </p>
            <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>
              {task.title} · {formatDue(task.due)}
            </p>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--muted)' }}>Horário</label>
            <input type="time" value={calTime} onChange={e => setCalTime(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm mb-4"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
            <button onClick={addToCalendar}
              className="btn-glow w-full py-3 rounded-xl text-white text-sm font-semibold"
              style={{ fontFamily: 'Inter, sans-serif' }}>
              📅 Adicionar ao Google Calendar
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function NewTaskModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', notes: '', due: '' });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.title) return;
    setSaving(true);
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      onCreated();
      onClose();
    } catch { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div className="w-full max-w-lg rounded-t-3xl p-6 pb-10 animate-slide-up"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full mx-auto mb-6" style={{ background: 'var(--border)' }} />
        <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text)', fontFamily: 'Syne, sans-serif' }}>
          Nova Tarefa
        </h2>
        <div className="space-y-3">
          <input type="text" placeholder="Título da tarefa *"
            value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            className="w-full rounded-xl px-4 py-3 text-sm"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Inter, sans-serif' }} />
          <input type="date" placeholder="Prazo"
            value={form.due} onChange={e => setForm(p => ({ ...p, due: e.target.value }))}
            className="w-full rounded-xl px-4 py-3 text-sm"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Inter, sans-serif' }} />
          <textarea placeholder="Observações" rows={3}
            value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
            className="w-full rounded-xl px-4 py-3 text-sm resize-none"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Inter, sans-serif' }} />
        </div>
        <button onClick={handleSave} disabled={saving || !form.title}
          className="btn-glow w-full py-3 rounded-2xl text-white font-semibold mt-4 text-sm"
          style={{ fontFamily: 'Inter, sans-serif', opacity: saving || !form.title ? 0.6 : 1 }}>
          {saving ? 'Criando...' : 'Criar no Google Tasks'}
        </button>
      </div>
    </div>
  );
}

export default function TasksPanel() {
  const [tasks, setTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [tasksTab, setTasksTab] = useState('tarefas');

  const loadTasks = async () => {
    setLoading(true);
    try {
      const [pendingRes, completedRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/tasks?completed=true'),
      ]);
      const pendingData = await pendingRes.json();
      const completedData = await completedRes.json();
      setTasks(pendingData.tasks || []);
      setCompletedTasks(completedData.tasks || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadTasks(); }, []);

  const removeTask = (id) => setTasks(prev => prev.filter(t => t.id !== id));

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-bold text-base" style={{ fontFamily: 'Syne, sans-serif' }}>
              {tasksTab === 'tarefas' ? 'Tarefas' : 'Time Block'}
            </h2>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              {tasksTab === 'tarefas' ? `${tasks.length} pendente${tasks.length !== 1 ? 's' : ''}` : 'IA organiza seu tempo'}
            </p>
          </div>
          {tasksTab === 'tarefas' && (
            <div className="flex gap-2">
              <button onClick={loadTasks} className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--muted)' }}>
                <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              </button>
              <button onClick={() => setShowModal(true)}
                className="btn-glow h-9 px-4 rounded-xl flex items-center gap-2 text-white text-sm"
                style={{ fontFamily: 'Inter, sans-serif' }}>
                <Plus size={15} /> Nova
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-3">
          <button onClick={() => setTasksTab('tarefas')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold"
            style={{ background: tasksTab==='tarefas' ? 'var(--blue)' : 'var(--bg)', color: tasksTab==='tarefas' ? 'white' : 'var(--muted)', border: `1px solid ${tasksTab==='tarefas' ? 'var(--blue)' : 'var(--border)'}`, fontFamily: 'Inter' }}>
            <CheckSquare size={12} /> Tarefas
          </button>
          <button onClick={() => setTasksTab('timeblock')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold"
            style={{ background: tasksTab==='timeblock' ? 'var(--blue)' : 'var(--bg)', color: tasksTab==='timeblock' ? 'white' : 'var(--muted)', border: `1px solid ${tasksTab==='timeblock' ? 'var(--blue)' : 'var(--border)'}`, fontFamily: 'Inter' }}>
            <Clock size={12} /> ⏰ Time Block
          </button>
        </div>
      </div>

      {tasksTab === 'timeblock' ? (
        <TimeBlockPanel tasks={tasks} />
      ) : (
      <div className="flex-1 overflow-y-auto px-4 pt-4">
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: 'var(--card)' }} />
            ))}
          </div>
        ) : (
          <>
            {tasks.length === 0 && completedTasks.length === 0 ? (
              <div className="text-center py-16">
                <CheckSquare size={36} style={{ color: 'var(--dim)', margin: '0 auto 12px' }} />
                <p style={{ color: 'var(--muted)', fontFamily: 'Inter, sans-serif' }}>Nenhuma tarefa pendente</p>
                <p className="text-sm mt-1" style={{ color: 'var(--dim)' }}>Peça para a DURABEL criar uma!</p>
              </div>
            ) : (
              <>
                {tasks.map(t => (
                  <TaskItem
                    key={t.id}
                    task={t}
                    onComplete={removeTask}
                    onDelete={removeTask}
                    onRefresh={loadTasks}
                  />
                ))}

                {completedTasks.length > 0 && (
                  <div className="mt-4 pb-4">
                    <button onClick={() => setShowCompleted(s => !s)}
                      className="flex items-center gap-2 mb-3 w-full text-left"
                      style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                      <span style={{ color: 'var(--dim)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em' }}>
                        {showCompleted ? '▾' : '▸'} CONCLUÍDAS · {completedTasks.length}
                      </span>
                    </button>
                    {showCompleted && completedTasks.map(t => (
                      <div key={t.id} className="flex gap-3 items-start p-3 rounded-xl mb-2"
                        style={{ background: 'var(--card)', border: '1px solid var(--border)', opacity: 0.55 }}>
                        <CheckCircle2 size={18} style={{ color: '#10B981', flexShrink: 0, marginTop: 1 }} />
                        <div className="flex-1">
                          <p className="text-sm line-through"
                            style={{ color: 'var(--muted)', fontFamily: 'Inter, sans-serif' }}>
                            {t.title}
                          </p>
                          {t.due && (
                            <p className="text-xs mt-0.5" style={{ color: 'var(--dim)' }}>
                              📅 {t.due.split('T')[0].split('-').reverse().join('/')}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {showModal && <NewTaskModal onClose={() => setShowModal(false)} onCreated={loadTasks} />}
      </div>
      )}
    </div>
  );
}
