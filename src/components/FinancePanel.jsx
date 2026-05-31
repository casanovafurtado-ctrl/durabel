'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, FileText, CheckCircle, XCircle, Clock, Download } from 'lucide-react';
import { exportFinancePDF } from '@/lib/pdfExport';

const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <div className="flex items-start justify-between mb-2">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
          <Icon size={18} style={{ color }} />
        </div>
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
          <span className="text-xs" style={{ color: 'var(--dim)', fontSize: '9px' }}>
            {MONTHS[i]}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function FinancePanel() {
  const [proposals, setProposals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ client: '', service: '', value: '', status: 'enviada', month: new Date().getMonth() });

  useEffect(() => {
    async function load() {
      try {
        const r = await window.storage?.get('finance_proposals');
        if (r) setProposals(JSON.parse(r.value));
      } catch {}
    }
    load();
  }, []);

  const save = async (updated) => {
    setProposals(updated);
    try { await window.storage?.set('finance_proposals', JSON.stringify(updated)); } catch {}
  };

  const addProposal = () => {
    if (!form.client || !form.value) return;
    save([{ ...form, id: Date.now().toString(), value: parseFloat(form.value.replace(/\./g, '').replace(',', '.')) || 0 }, ...proposals]);
    setForm({ client: '', service: '', value: '', status: 'enviada', month: new Date().getMonth() });
    setShowForm(false);
  };

  // Métricas
  const total = proposals.length;
  const fechadas = proposals.filter(p => p.status === 'fechada');
  const perdidas = proposals.filter(p => p.status === 'perdida');
  const pendentes = proposals.filter(p => p.status === 'enviada');
  const conversion = total > 0 ? Math.round((fechadas.length / total) * 100) : 0;
  const totalFaturado = fechadas.reduce((s, p) => s + (p.value || 0), 0);
  const totalPipeline = pendentes.reduce((s, p) => s + (p.value || 0), 0);

  // Por mês
  const byMonth = Array(12).fill(0);
  fechadas.forEach(p => { if (p.month >= 0 && p.month < 12) byMonth[p.month] += p.value || 0; });
  const maxMonth = Math.max(...byMonth, 1);

  const STATUS_OPTS = [
    { key: 'enviada', label: 'Enviada', color: '#F59E0B', icon: Clock },
    { key: 'fechada', label: 'Fechada', color: '#10B981', icon: CheckCircle },
    { key: 'perdida', label: 'Perdida', color: '#EF4444', icon: XCircle },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 flex items-center justify-between flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <h2 className="font-bold text-base" style={{ fontFamily: 'Syne, sans-serif' }}>Dashboard</h2>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>Desempenho comercial DURAR</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => exportFinancePDF(proposals)}
            className="h-9 px-3 rounded-xl flex items-center gap-1.5 text-sm"
            style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--blue)', fontFamily: 'Inter, sans-serif' }}>
            <Download size={14} /> PDF
          </button>
          <button onClick={() => setShowForm(s => !s)}
            className="btn-glow h-9 px-4 rounded-xl text-white text-sm flex items-center gap-1.5"
            style={{ fontFamily: 'Inter, sans-serif' }}>
            <FileText size={14} /> Registrar
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6">

        {/* Form rápido */}
        {showForm && (
          <div className="rounded-2xl p-4 mb-4 animate-fade-in"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <h3 className="text-sm font-bold mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>Nova Proposta</h3>
            <div className="space-y-2">
              <input value={form.client} onChange={e => setForm(p => ({ ...p, client: e.target.value }))}
                placeholder="Cliente / Condomínio *"
                className="w-full rounded-xl px-3 py-2.5 text-sm"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Inter, sans-serif' }} />
              <div className="grid grid-cols-2 gap-2">
                <input value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))}
                  placeholder="Valor R$ *"
                  className="w-full rounded-xl px-3 py-2.5 text-sm"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Inter, sans-serif' }} />
                <select value={form.month} onChange={e => setForm(p => ({ ...p, month: parseInt(e.target.value) }))}
                  className="w-full rounded-xl px-3 py-2.5 text-sm"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Inter, sans-serif' }}>
                  {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                {STATUS_OPTS.map(({ key, label, color }) => (
                  <button key={key} onClick={() => setForm(p => ({ ...p, status: key }))}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                    style={{
                      background: form.status === key ? `${color}20` : 'var(--bg)',
                      border: `1px solid ${form.status === key ? color : 'var(--border)'}`,
                      color: form.status === key ? color : 'var(--muted)',
                      fontFamily: 'Inter, sans-serif',
                    }}>{label}</button>
                ))}
              </div>
              <button onClick={addProposal} disabled={!form.client || !form.value}
                className="btn-glow w-full py-2.5 rounded-xl text-white text-sm font-semibold"
                style={{ fontFamily: 'Inter, sans-serif', opacity: !form.client || !form.value ? 0.5 : 1 }}>
                Adicionar
              </button>
            </div>
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <StatCard icon={TrendingUp} label="Taxa de Conversão" value={`${conversion}%`}
            sub={`${fechadas.length} de ${total} propostas`} color="#0077FF" />
          <StatCard icon={DollarSign} label="Total Faturado" value={`R$${(totalFaturado/1000).toFixed(0)}k`}
            sub="propostas fechadas" color="#10B981" />
          <StatCard icon={Clock} label="Em Pipeline" value={`R$${(totalPipeline/1000).toFixed(0)}k`}
            sub={`${pendentes.length} propostas abertas`} color="#F59E0B" />
          <StatCard icon={XCircle} label="Taxa de Perda" value={total > 0 ? `${Math.round((perdidas.length/total)*100)}%` : '0%'}
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

        {/* Proposals list */}
        {proposals.length > 0 && (
          <div>
            <h3 className="text-xs font-bold tracking-widest mb-3" style={{ color: 'var(--muted)', letterSpacing: '0.1em' }}>
              ÚLTIMAS PROPOSTAS
            </h3>
            {proposals.slice(0, 10).map(p => {
              const st = STATUS_OPTS.find(s => s.key === p.status) || STATUS_OPTS[0];
              return (
                <div key={p.id} className="flex items-center gap-3 py-3"
                  style={{ borderBottom: '1px solid var(--border)' }}>
                  <st.icon size={16} style={{ color: st.color, flexShrink: 0 }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text)', fontFamily: 'Inter, sans-serif' }}>
                      {p.client}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>{MONTHS[p.month]}</p>
                  </div>
                  <span className="text-sm font-semibold flex-shrink-0" style={{ color: st.color, fontFamily: 'Syne, sans-serif' }}>
                    R$ {p.value?.toLocaleString('pt-BR') || '—'}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {proposals.length === 0 && (
          <div className="text-center py-8">
            <TrendingUp size={36} style={{ color: 'var(--dim)', margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--muted)', fontFamily: 'Inter, sans-serif' }}>
              Registre suas propostas para ver as métricas
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
