'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Building2, Phone, Mail, MapPin, ChevronRight, X, Save, MessageCircle, Download } from 'lucide-react';
import { exportClientPDF } from '@/lib/pdfExport';

const STATUS_CONFIG = {
  prospecto: { label: 'Prospecto', color: '#6B7280', bg: 'rgba(107,114,128,0.1)' },
  proposta: { label: 'Proposta Enviada', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  negociacao: { label: 'Em Negociação', color: '#0077FF', bg: 'rgba(0,119,255,0.1)' },
  fechado: { label: 'Fechado ✓', color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
  perdido: { label: 'Perdido', color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
};

const SERVICE_TYPES = [
  'Inspeção de Fachada',
  'Inspeção de Cobertura',
  'Inspeção Estrutural',
  'Inspeção de Fundação',
  'Vistoria Cautelar',
  'Laudo de Patologia',
  'Impermeabilização',
  'Consultoria Técnica',
];

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.prospecto;
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}33` }}>
      {cfg.label}
    </span>
  );
}

function ClientModal({ client, onClose, onSave }) {
  const [form, setForm] = useState(client || {
    name: '', building: '', phone: '', email: '', address: '',
    status: 'prospecto', service: '', value: '', notes: '',
  });

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}>
      <div className="w-full max-w-lg rounded-t-3xl pb-8 animate-slide-up overflow-y-auto"
        style={{ background: 'var(--card)', border: '1px solid var(--border)', maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}>

        <div className="px-5 pt-5 pb-4 flex items-center justify-between sticky top-0"
          style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}>
          <h2 className="font-bold text-base" style={{ fontFamily: 'Syne, sans-serif' }}>
            {client ? 'Editar Cliente' : 'Novo Cliente'}
          </h2>
          <button onClick={onClose} style={{ color: 'var(--muted)' }}><X size={20} /></button>
        </div>

        <div className="px-5 pt-4 space-y-3">
          {/* Nome e Edifício */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--muted)' }}>
                Nome / Razão Social *
              </label>
              <input value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="Condomínio Sol..."
                className="w-full rounded-xl px-3 py-2.5 text-sm"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Inter, sans-serif' }} />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--muted)' }}>
                Edifício / Condomínio
              </label>
              <input value={form.building} onChange={e => set('building', e.target.value)}
                placeholder="Ed. San Sebastião"
                className="w-full rounded-xl px-3 py-2.5 text-sm"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Inter, sans-serif' }} />
            </div>
          </div>

          {/* Contato */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--muted)' }}>Telefone / WhatsApp</label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)}
                placeholder="(82) 99999-9999"
                className="w-full rounded-xl px-3 py-2.5 text-sm"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Inter, sans-serif' }} />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--muted)' }}>E-mail</label>
              <input value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="sindico@cond.com"
                className="w-full rounded-xl px-3 py-2.5 text-sm"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Inter, sans-serif' }} />
            </div>
          </div>

          {/* Endereço */}
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--muted)' }}>Endereço</label>
            <input value={form.address} onChange={e => set('address', e.target.value)}
              placeholder="Rua, Bairro — Maceió/AL"
              className="w-full rounded-xl px-3 py-2.5 text-sm"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Inter, sans-serif' }} />
          </div>

          {/* Status e Serviço */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--muted)' }}>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-sm"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Inter, sans-serif' }}>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--muted)' }}>Tipo de Serviço</label>
              <select value={form.service} onChange={e => set('service', e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-sm"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Inter, sans-serif' }}>
                <option value="">Selecione...</option>
                {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Valor */}
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--muted)' }}>Valor da Proposta (R$)</label>
            <input value={form.value} onChange={e => set('value', e.target.value)}
              placeholder="5.000,00"
              className="w-full rounded-xl px-3 py-2.5 text-sm"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Inter, sans-serif' }} />
          </div>

          {/* Observações */}
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--muted)' }}>Observações</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="Notas sobre o cliente, histórico..."
              rows={3}
              className="w-full rounded-xl px-3 py-2.5 text-sm resize-none"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Inter, sans-serif' }} />
          </div>

          <button onClick={() => onSave(form)}
            disabled={!form.name}
            className="btn-glow w-full py-3 rounded-2xl text-white font-semibold flex items-center justify-center gap-2 text-sm"
            style={{ fontFamily: 'Inter, sans-serif', opacity: !form.name ? 0.5 : 1 }}>
            <Save size={16} /> Salvar Cliente
          </button>
        </div>
      </div>
    </div>
  );
}

function ClientCard({ client, onEdit, onWhatsApp, onExport }) {
  const cfg = STATUS_CONFIG[client.status] || STATUS_CONFIG.prospecto;
  return (
    <div className="rounded-2xl p-4 mb-3 transition-all"
      style={{ background: 'var(--card)', border: '1px solid var(--border)', borderLeft: `3px solid ${cfg.color}` }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm" style={{ color: 'var(--text)', fontFamily: 'Syne, sans-serif' }}>
              {client.name}
            </span>
            <StatusBadge status={client.status} />
          </div>
          {client.building && (
            <div className="flex items-center gap-1 mt-1">
              <Building2 size={11} style={{ color: 'var(--muted)' }} />
              <span className="text-xs" style={{ color: 'var(--muted)' }}>{client.building}</span>
            </div>
          )}
          {client.service && (
            <div className="text-xs mt-1" style={{ color: 'var(--blue)' }}>🔧 {client.service}</div>
          )}
          {client.value && (
            <div className="text-xs mt-1 font-semibold" style={{ color: '#10B981' }}>R$ {client.value}</div>
          )}
        </div>
        <div className="flex gap-1.5 flex-shrink-0">
          {client.phone && (
            <button onClick={() => onWhatsApp(client)}
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.2)', color: '#25D366' }}>
              <MessageCircle size={14} />
            </button>
          )}
          <button onClick={() => onEdit(client)}
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--muted)' }}>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CRMPanel() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('todos');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const saved = localStorage.getItem('durabel_clients');
        if (saved) setClients(JSON.parse(saved));
      } catch {}
    }
    load();
  }, []);

  const save = async (updated) => {
    setClients(updated);
    try { localStorage.setItem('durabel_clients', JSON.stringify(updated)); } catch {}
  };

  const handleSave = (form) => {
    if (editing) {
      save(clients.map(c => c.id === editing.id ? { ...form, id: editing.id } : c));
    } else {
      save([{ ...form, id: Date.now().toString() }, ...clients]);
    }
    setEditing(null);
    setShowModal(false);
  };

  const handleWhatsApp = async (client) => {
    const msg = `Olá! Aqui é da DURAR Consultoria. Gostaria de falar sobre ${client.service || 'nossos serviços'}.`;
    try {
      const res = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: client.phone, message: msg }),
      });
      const data = await res.json();
      if (!res.ok) alert('WhatsApp: ' + (data.error || 'Erro'));
      else alert('Mensagem enviada!');
    } catch { alert('Erro ao enviar WhatsApp'); }
  };

  const filtered = clients.filter(c => {
    const matchSearch = !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.building || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'todos' || c.status === filter;
    return matchSearch && matchFilter;
  });

  // Stats
  const total = clients.length;
  const fechados = clients.filter(c => c.status === 'fechado').length;
  const conversion = total > 0 ? Math.round((fechados / total) * 100) : 0;
  const pipeline = clients
    .filter(c => ['proposta', 'negociacao'].includes(c.status) && c.value)
    .reduce((sum, c) => sum + parseFloat(c.value.replace(/\./g, '').replace(',', '.') || 0), 0);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-bold text-base" style={{ fontFamily: 'Syne, sans-serif' }}>Clientes</h2>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>{total} cadastrados · {conversion}% conversão</p>
          </div>
          <button onClick={() => { setEditing(null); setShowModal(true); }}
            className="btn-glow h-9 px-4 rounded-xl flex items-center gap-1.5 text-white text-sm"
            style={{ fontFamily: 'Inter, sans-serif' }}>
            <Plus size={15} /> Novo
          </button>
        </div>

        {/* Mini stats */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { label: 'Total', value: total, color: 'var(--blue)' },
            { label: 'Fechados', value: fechados, color: '#10B981' },
            { label: 'Pipeline', value: pipeline > 0 ? `R$${(pipeline/1000).toFixed(0)}k` : '—', color: '#F59E0B' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl p-2 text-center"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
              <div className="text-base font-bold" style={{ color, fontFamily: 'Syne, sans-serif' }}>{value}</div>
              <div className="text-xs" style={{ color: 'var(--muted)' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-2">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar cliente ou edifício..."
            className="w-full rounded-xl pl-8 pr-4 py-2.5 text-sm"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Inter, sans-serif' }} />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {[['todos', 'Todos'], ...Object.entries(STATUS_CONFIG).map(([k, v]) => [k, v.label])].map(([k, label]) => (
            <button key={k} onClick={() => setFilter(k)}
              className="px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all"
              style={{
                background: filter === k ? 'var(--blue)' : 'var(--bg)',
                color: filter === k ? 'white' : 'var(--muted)',
                border: `1px solid ${filter === k ? 'var(--blue)' : 'var(--border)'}`,
                fontFamily: 'Inter, sans-serif',
              }}>{label}</button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pt-4">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Building2 size={36} style={{ color: 'var(--dim)', margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--muted)', fontFamily: 'Inter, sans-serif' }}>
              {search ? 'Nenhum cliente encontrado' : 'Cadastre seu primeiro cliente'}
            </p>
          </div>
        ) : (
          filtered.map(c => (
            <ClientCard key={c.id} client={c}
              onEdit={(c) => { setEditing(c); setShowModal(true); }}
              onWhatsApp={handleWhatsApp}
              onExport={(c) => exportClientPDF(c)} />
          ))
        )}
      </div>

      {showModal && (
        <ClientModal
          client={editing}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSave={handleSave} />
      )}
    </div>
  );
}
