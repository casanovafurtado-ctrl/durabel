'use client';

import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, DollarSign, FileText, CheckCircle, XCircle, Clock, RefreshCw, Plus } from 'lucide-react';

const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

const STATUS_OPTS = [
  { key: 'enviada', label: 'Enviada',  color: '#F59E0B', bg: '#FFF9E6', icon: Clock },
  { key: 'fechada', label: 'Fechada',  color: '#10B981', bg: '#F0FFF4', icon: CheckCircle },
  { key: 'perdida', label: 'Perdida',  color: '#EF4444', bg: '#FFF5F5', icon: XCircle },
];

// Converte "1.500,00" → 1500
const parseCurrency = (v) => {
  if (!v) return 0;
  return parseFloat(String(v).replace(/\./g, '').replace(',', '.')) || 0;
};

// Formata 1500 → "R$ 1.500,00"
const formatCurrency = (v) => {
  if (!v) return '—';
  return `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
};

// Mapeia status do CRM para status de proposta
const crmStatusToProposal = (crmStatus) => {
  if (crmStatus === 'fechado') return 'fechada';
  if (crmStatus === 'perdido') return 'perdida';
  if (['proposta', 'negociacao'].includes(crmStatus)) return 'enviada';
  return null; // prospecto não entra
};

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2"
        style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div className="text-2xl font-bold" style={{ color: 'var(--text)', fontFamily: 'Syne, sans-serif' }}>{value}</div>
      <div className="text-xs font-semibold mt-0.5" style={{ color: 'var(--muted)' }}>{label}</div>
      {sub && <div className="text-xs mt-1" style={{ color }}>{sub}</div>}
    </div>
  );
}

function BarChart({ data, max, color }) {
  return (
    <div className="flex items-end gap-1.5 h-20">
      {data.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full rounded-t-md transition-all"
            style={{
              height: max > 0 ? `${(v / max) * 64}px` : '4px',
              background: v > 0 ? `linear-gradient(180deg, ${color}, ${color}88)` : 'var(--border)',
              minHeight: '4px',
            }} />
          <span style={{ color: 'var(--dim)', fontSize: '9px' }}>{MONTHS[i]}</span>
        </div>
      ))}
    </div>
  );
}

// Modal para registrar proposta manual
function NewProposalModal({ onClose, onSave }) {
  const [form, setForm] = useState({ client: '', service: '', value: '', status: 'enviada', month: new Date().getMonth() });

  const handleValue = (v) => {
    const digits = v.replace(/\D/g, '');
    if (!digits) { setForm(p => ({ ...p, value: '' })); return; }
    const num = parseInt(digits, 10) / 100;
    setForm(p => ({ ...p, value: num.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}>
      <div className="w-full max-w-lg rounded-t-3xl p-6 pb-10 animate-slide-up"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        onClick={e => e.stopPropagation()}>
        <h2 className="text-base font-bold mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>Registrar Proposta Manual</h2>
        <div className="space-y-3">
          <input value={form.client} onChange={e => setForm(p => ({ ...p, client: e.target.value }))}
            placeholder="Cliente / Condomínio *"
            className="w-full rounded-xl px-3 py-2.5 text-sm"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Inter' }} />
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold" style={{ color: 'var(--muted)' }}>R$</span>
              <input value={form.value} onChange={e => handleValue(e.target.value)}
                placeholder="0,00"
                className="w-full rounded-xl pl-9 pr-3 py-2.5 text-sm"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Inter' }} />
            </div>
            <select value={form.month} onChange={e => setForm(p => ({ ...p, month: parseInt(e.target.value) }))}
              className="w-full rounded-xl px-3 py-2.5 text-sm"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Inter' }}>
              {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            {STATUS_OPTS.map(({ key, label, color }) => (
              <button key={key} onClick={() => setForm(p => ({ ...p, status: key }))}
                className="flex-1 py-2 rounded-xl text-xs font-semibold"
                style={{
                  background: form.status === key ? `${color}20` : 'var(--bg)',
                  border: `1px solid ${form.status === key ? color : 'var(--border)'}`,
                  color: form.status === key ? color : 'var(--muted)',
                  fontFamily: 'Inter',
                }}>{label}</button>
            ))}
          </div>
        </div>
        <button onClick={() => { if (form.client) { onSave(form); onClose(); }}}
          disabled={!form.client}
          className="btn-glow w-full py-3 rounded-2xl text-white text-sm font-semibold mt-4"
          style={{ fontFamily: 'Inter', opacity: !form.client ? 0.5 : 1 }}>
          Registrar
        </button>
      </div>
    </div>
  );
}

export default function FinancePanel() {
  const [manualProposals, setManualProposals] = useState([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('durabel_proposals');
      if (saved) setManualProposals(JSON.parse(saved));
    } catch {}
  }, []);

  const saveManual = (updated) => {
    setManualProposals(updated);
    try { localStorage.setItem('durabel_proposals', JSON.stringify(updated)); } catch {}
  };

  const addManual = (form) => {
    saveManual([{ ...form, id: Date.now().toString(), source: 'manual' }, ...manualProposals]);
  };

  // Combina dados do CRM + manuais
  const allProposals = useCallback(() => {
    const crmProposals = [];
    try {
      const clients = JSON.parse(localStorage.getItem('durabel_clients') || '[]');
      clients.forEach(c => {
        const status = crmStatusToProposal(c.status);
        if (status && c.value) {
          crmProposals.push({
            id: `crm_${c.id}`,
            client: c.name + (c.building ? ` — ${c.building}` : ''),
            value: parseCurrency(c.value),
            status,
            month: new Date().getMonth(), // mês atual como aproximação
            source: 'crm',
            service: c.service === 'Outro (personalizado)' && c.serviceCustom ? c.serviceCustom : c.service,
          });
        }
      });
    } catch {}

    const manual = manualProposals.map(p => ({
      ...p,
      value: parseCurrency(p.value),
      source: p.source || 'manual',
    }));

    // Evita duplicatas: se já tem manual com mesmo cliente, não adiciona do CRM
    const manualClients = new Set(manual.map(p => p.client?.toLowerCase()));
    const filteredCRM = crmProposals.filter(p => !manualClients.has(p.client?.toLowerCase()));

    return [...filteredCRM, ...manual];
  }, [manualProposals]);

  const proposals = allProposals();

  // Métricas
  const total = proposals.length;
  const fechadas = proposals.filter(p => p.status === 'fechada');
  const perdidas = proposals.filter(p => p.status === 'perdida');
  const pendentes = proposals.filter(p => p.status === 'enviada');
  const conversion = total > 0 ? Math.round((fechadas.length / total) * 100) : 0;
  const totalFaturado = fechadas.reduce((s, p) => s + (p.value || 0), 0);
  const totalPipeline = pendentes.reduce((s, p) => s + (p.value || 0), 0);

  // Gráfico mensal
  const byMonth = Array(12).fill(0);
  fechadas.forEach(p => { if (p.month >= 0 && p.month < 12) byMonth[p.month] += p.value || 0; });
  const maxMonth = Math.max(...byMonth, 1);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <h2 className="font-bold text-base" style={{ fontFamily: 'Syne, sans-serif' }}>Resultados</h2>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            {proposals.filter(p => p.source === 'crm').length} do CRM · {manualProposals.length} manuais
          </p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="btn-glow h-9 px-4 rounded-xl flex items-center gap-1.5 text-white text-sm"
          style={{ fontFamily: 'Inter' }}>
          <Plus size={14} /> Registrar
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6">

        {/* Info CRM sync */}
        {proposals.filter(p => p.source === 'crm').length > 0 && (
          <div className="rounded-xl px-4 py-2.5 mb-4 flex items-center gap-2"
            style={{ background: 'rgba(0,119,255,0.06)', border: '1px solid rgba(0,119,255,0.2)' }}>
            <RefreshCw size={13} style={{ color: 'var(--blue)' }} />
            <p className="text-xs" style={{ color: 'var(--blue)', fontFamily: 'Inter' }}>
              Sincronizado com a aba Clientes automaticamente
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <StatCard icon={TrendingUp} label="Taxa de Conversão" value={`${conversion}%`}
            sub={`${fechadas.length} de ${total}`} color="#0077FF" />
          <StatCard icon={DollarSign} label="Faturado" value={`R$${(totalFaturado/1000).toFixed(0)}k`}
            sub="propostas fechadas" color="#10B981" />
          <StatCard icon={Clock} label="Pipeline" value={`R$${(totalPipeline/1000).toFixed(0)}k`}
            sub={`${pendentes.length} em aberto`} color="#F59E0B" />
          <StatCard icon={XCircle} label="Taxa de Perda"
            value={total > 0 ? `${Math.round((perdidas.length/total)*100)}%` : '0%'}
            sub={`${perdidas.length} perdidas`} color="#EF4444" />
        </div>

        {/* Chart */}
        <div className="rounded-2xl p-4 mb-4"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <h3 className="text-xs font-bold mb-4 tracking-widest" style={{ color: 'var(--muted)', letterSpacing: '0.1em' }}>
            FATURAMENTO MENSAL (R$)
          </h3>
          <BarChart data={byMonth} max={maxMonth} color="#0077FF" />
        </div>

        {/* Lista */}
        {proposals.length > 0 && (
          <div>
            <h3 className="text-xs font-bold tracking-widest mb-3" style={{ color: 'var(--muted)', letterSpacing: '0.1em' }}>
              PROPOSTAS · {proposals.length}
            </h3>
            {proposals.slice(0, 20).map(p => {
              const st = STATUS_OPTS.find(s => s.key === p.status) || STATUS_OPTS[0];
              return (
                <div key={p.id} className="flex items-center gap-3 py-3"
                  style={{ borderBottom: '1px solid var(--border)' }}>
                  <st.icon size={16} style={{ color: st.color, flexShrink: 0 }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text)', fontFamily: 'Inter' }}>
                      {p.client}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>
                      {MONTHS[p.month]} · {p.source === 'crm' ? '📊 CRM' : '✏️ Manual'}
                    </p>
                  </div>
                  <span className="text-sm font-semibold flex-shrink-0" style={{ color: st.color, fontFamily: 'Syne' }}>
                    {p.value > 0 ? formatCurrency(p.value) : '—'}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {proposals.length === 0 && (
          <div className="text-center py-8">
            <TrendingUp size={36} style={{ color: 'var(--dim)', margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--muted)', fontFamily: 'Inter' }}>
              Cadastre clientes com valor para ver as métricas
            </p>
          </div>
        )}
      </div>

      {showModal && <NewProposalModal onClose={() => setShowModal(false)} onSave={addManual} />}
    </div>
  );
}
