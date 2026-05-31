'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Plus, CheckSquare, Circle, CheckCircle2, Trash2, Pencil, X, Save } from 'lucide-react';

const PRIORITIES = ['alta', 'média', 'baixa'];
const PRIORITY_COLORS = { alta: '#EF4444', média: '#F59E0B', baixa: '#10B981' };

function TaskItem({ task, onComplete, onDelete, onRefresh }) {
  const [done, setDone] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editNotes, setEditNotes] = useState(task.notes || '');
  const parseDue = (dateStr) => {
    if (!dateStr) return '';
    if (dateStr.includes('T')) {
      const d = new Date(dateStr);
      return d.toLocaleDateString('pt-BR', { timeZone: 'America/Recife' })
        .split('/').reverse().join('-');
    }
    return dateStr.split('T')[0];
  };
  const [editDue, setEditDue] = useState(parseDue(task.due));

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
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', taskId: task.id, listId: task.listId, title: editTitle, notes: editNotes, due: editDue }),
    });
    if (res.ok) {
      task.title = editTitle;
      task.notes = editNotes;
      task.due = editDue ? new Date(editDue).toISOString() : null;
      // Não recarrega — atualização local já reflete a mudança
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="p-4 rounded-xl mb-3" style={{ background: 'var(--card)', border: '1px solid rgba(0,119,255,0.4)' }}>
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
    <div className={`flex gap-3 items-start p-4 rounded-xl mb-3 transition-all ${done ? 'opacity-40 scale-95' : ''}`}
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <button onClick={handleComplete} className="flex-shrink-0 mt-0.5">
        {done
          ? <CheckCircle2 size={20} style={{ color: '#10B981' }} />
          : <Circle size={20} style={{ color: 'var(--dim)' }} />
        }
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: 'var(--text)', textDecoration: done ? 'line-through' : 'none', fontFamily: 'Inter, sans-serif' }}>
          {task.title}
        </p>
        {task.notes && (
          <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--muted)' }}>{task.notes}</p>
        )}
        {task.due && (
          <span className="text-xs px-2 py-0.5 rounded-full mt-2 inline-block"
            style={{ background: 'rgba(0,119,255,0.1)', color: 'var(--blue)', border: '1px solid rgba(0,119,255,0.2)' }}>
            📅 {new Date(task.due).toLocaleDateString('pt-BR')}
          </span>
        )}
      </div>
      <div className="flex gap-1 flex-shrink-0">
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
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}>
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
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tasks');
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadTasks(); }, []);

  const removeTask = (id) => setTasks(prev => prev.filter(t => t.id !== id));

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <h2 className="font-bold text-base" style={{ fontFamily: 'Syne, sans-serif' }}>Tarefas</h2>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            {tasks.length} pendente{tasks.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadTasks} className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--muted)' }}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setShowModal(true)} className="btn-glow h-9 px-4 rounded-xl flex items-center gap-2 text-white text-sm"
            style={{ fontFamily: 'Inter, sans-serif' }}>
            <Plus size={15} /> Nova
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4">
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: 'var(--card)' }} />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-16">
            <CheckSquare size={36} style={{ color: 'var(--dim)', margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--muted)', fontFamily: 'Inter, sans-serif' }}>Nenhuma tarefa pendente</p>
            <p className="text-sm mt-1" style={{ color: 'var(--dim)' }}>Peça para a DURABEL criar uma!</p>
          </div>
        ) : (
          tasks.map(t => <TaskItem key={t.id} task={t} onComplete={removeTask} onDelete={removeTask} onRefresh={loadTasks} />)
        )}
      </div>

      {showModal && <NewTaskModal onClose={() => setShowModal(false)} onCreated={loadTasks} />}
    </div>
  );
}
