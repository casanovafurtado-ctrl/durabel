'use client';

import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, DollarSign, Clock, XCircle, CheckCircle, Plus, ChevronRight, X } from 'lucide-react';
import { parseCurrency } from './CRMPanel';

const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

const crmToStatus = (s) => {
  if (s === 'fechado') return 'fechada';
  if (s === 'perdido') return 'perdida';
  if (['proposta','negociacao'].includes(s)) return 'enviada';
  return null;
};

const fmtCurrency = (v) => v > 0 ? `R$ ${Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2})}` : 'R$ 0,00';
const fmtShort = (v) => v >= 1000 ? `R$${(v/1000).toFixed(1)}k` : `R$${v.toFixed(0)}`;

// ─── Modal de detalhes ─────────────────────────────────
function DetailModal({ title, items, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div className="w-full max-w-lg rounded-t-3xl pb-8 flex flex-col" style={{ background: 'var(--card)', maxHeight: '80vh' }} onClick={e => e.stopPropagation()}>
        <div className="px-5 pt-5 pb-3 flex items-center justify-between flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
          <h3 className="font-bold text-sm" style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text)' }}>{title}</h3>
          <button onClick={onClose} style={{ color: 'var(--muted)' }}><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pt-3">
          {items.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: 'var(--muted)' }}>Nenhum item</p>
          ) : items.map((item, i) => (
            <div key={i} className="flex items-center justify-between py-3"
              style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex-1 min-w-0 pr-3">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--text)', fontFamily: 'Inter' }}>{item.client}</p>
                {item.service && <p className="text-xs truncate" style={{ color: 'var(--muted)' }}>{item.service}</p>}
                {item.month !== undefined && <p className="text-xs" style={{ color: 'var(--dim)' }}>{MONTHS[item.month]}</p>}
              </div>
              <span className="font-bold text-sm flex-shrink-0" style={{ color: item.color || '#10B981', fontFamily: 'Syne' }}>
                {item.value > 0 ? fmtCurrency(item.value) : '—'}
              </span>
            </div>
          ))}
          {items.length > 0 && (
            <div className="flex justify-between py-3 mt-1">
              <span className="text-sm font-bold" style={{ color: 'var(--text)', fontFamily: 'Syne' }}>Total</span>
              <span className="text-sm font-bold" style={{ color: '#10B981', fontFamily: 'Syne' }}>
                {fmtCurrency(items.reduce((s,i) => s+(i.value||0), 0))}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Modal nova proposta manual ────────────────────────
function NewProposalModal({ onClose, onSave }) {
  const [form, setForm] = useState({ client: '', service: '', value: '', status: 'enviada', month: new Date().getMonth() });
  const handleValue = (v) => {
    const d = v.replace(/\D/g,'');
    if (!d) { setForm(p=>({...p,value:''})); return; }
    setForm(p=>({...p, value: (parseInt(d,10)/100).toLocaleString('pt-BR',{minimumFractionDigits:2})}));
  };
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div className="w-full max-w-lg rounded-t-3xl p-6 pb-10 animate-slide-up" style={{ background: 'var(--card)' }} onClick={e => e.stopPropagation()}>
        <h2 className="text-base font-bold mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>Registrar Proposta</h2>
        <div className="space-y-3">
          <input value={form.client} onChange={e => setForm(p=>({...p,client:e.target.value}))} placeholder="Cliente *"
            className="w-full rounded-xl px-3 py-2.5 text-sm"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Inter' }} />
          <input value={form.service} onChange={e => setForm(p=>({...p,service:e.target.value}))} placeholder="Serviço"
            className="w-full rounded-xl px-3 py-2.5 text-sm"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Inter' }} />
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--muted)' }}>R$</span>
              <input value={form.value} onChange={e => handleValue(e.target.value)} placeholder="0,00"
                className="w-full rounded-xl pl-9 pr-3 py-2.5 text-sm"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Inter' }} />
            </div>
            <select value={form.month} onChange={e => setForm(p=>({...p,month:parseInt(e.target.value)}))}
              className="w-full rounded-xl px-3 py-2.5 text-sm"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Inter' }}>
              {MONTHS.map((m,i) => <option key={i} value={i}>{m}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            {[['enviada','Enviada','#F59E0B'],['fechada','Fechada','#10B981'],['perdida','Perdida','#EF4444']].map(([k,l,c]) => (
              <button key={k} onClick={() => setForm(p=>({...p,status:k}))}
                className="flex-1 py-2 rounded-xl text-xs font-semibold"
                style={{ background: form.status===k ? `${c}20` : 'var(--bg)', border: `1px solid ${form.status===k ? c : 'var(--border)'}`, color: form.status===k ? c : 'var(--muted)', fontFamily: 'Inter' }}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => { if(form.client){onSave(form);onClose();} }} disabled={!form.client}
          className="btn-glow w-full py-3 rounded-2xl text-white text-sm font-semibold mt-4"
          style={{ fontFamily: 'Inter', opacity: !form.client ? 0.5 : 1 }}>
          Registrar
        </button>
      </div>
    </div>
  );
}

// ─── Bar Chart interativo ──────────────────────────────
function InteractiveBarChart({ data, onClickMonth }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-1.5 h-24">
      {data.map((v, i) => (
        <button key={i} onClick={() => onClickMonth(i)}
          className="flex-1 flex flex-col items-center gap-1 group"
          style={{ background: 'none', border: 'none', cursor: v > 0 ? 'pointer' : 'default' }}>
          <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: 'var(--blue)', fontSize: '9px', fontFamily: 'Inter' }}>
            {v > 0 ? fmtShort(v) : ''}
          </span>
          <div className="w-full rounded-t-md transition-all group-hover:opacity-80"
            style={{
              height: `${Math.max((v/max)*64, 4)}px`,
              background: v > 0 ? 'linear-gradient(180deg, #0077FF, #0077FF88)' : 'var(--border)',
              minHeight: '4px',
            }} />
          <span style={{ color: 'var(--dim)', fontSize: '9px' }}>{MONTHS[i]}</span>
        </button>
      ))}
    </div>
  );
}

// ─── KPI Card ──────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, sub, color, onClick }) {
  return (
    <button onClick={onClick}
      className="rounded-2xl p-3 text-left w-full transition-all hover:scale-[1.02]"
      style={{ background: 'var(--card)', border: '1px solid var(--border)', cursor: onClick ? 'pointer' : 'default' }}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
          <Icon size={16} style={{ color }} />
        </div>
        {onClick && <ChevronRight size={12} style={{ color: 'var(--dim)', marginLeft: 'auto' }} />}
      </div>
      <div className="text-xl font-bold" style={{ color: 'var(--text)', fontFamily: 'Syne, sans-serif' }}>{value}</div>
      <div className="text-xs font-semibold mt-0.5" style={{ color: 'var(--muted)' }}>{label}</div>
      {sub && <div className="text-xs mt-0.5" style={{ color }}>{sub}</div>}
    </button>
  );
}

// ─── MAIN ──────────────────────────────────────────────
export default function FinancePanel() {
  const [manualProposals, setManualProposals] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [detail, setDetail] = useState(null); // { title, items }
  const [selectedMonth, setSelectedMonth] = useState(null);

  useEffect(() => {
    try { const s = localStorage.getItem('durabel_proposals'); if(s) setManualProposals(JSON.parse(s)); } catch {}
  }, []);

  const saveManual = (updated) => {
    setManualProposals(updated);
    try { localStorage.setItem('durabel_proposals', JSON.stringify(updated)); } catch {}
  };

  // Um cliente = uma proposta com valor total dos serviços
  const allProposals = useMemo(() => {
    const results = [];
    try {
      const clients = JSON.parse(localStorage.getItem('durabel_clients') || '[]');
      const now = new Date().getMonth();
      clients.forEach(c => {
        const status = crmToStatus(c.status);
        if (!status) return;
        const items = (c.serviceItems || []).filter(i => i.name || i.value);
        const totalValue = items.reduce((s, i) => s + parseCurrency(i.value), 0) || parseCurrency(c.value || '');
        const serviceLabel = items.map(i => i.name).filter(Boolean).join(', ') || c.service || '';
        results.push({
          id: 'crm_' + c.id,
          client: c.name + (c.building ? ' — ' + c.building : ''),
          serviceLabel,
          serviceItems: items,
          value: totalValue,
          status,
          month: now,
          source: 'crm',
        });
      });
    } catch(e) {}
    manualProposals.forEach(p => {
      results.push({
        ...p,
        value: parseCurrency(p.value),
        serviceLabel: p.service || '',
        serviceItems: p.service ? [{ name: p.service, value: p.value }] : [],
        source: p.source || 'manual',
      });
    });
    return results;
  }, [manualProposals]);

  // Métricas
  const total = allProposals.length;
  const fechadas = allProposals.filter(p => p.status === 'fechada');
  const enviadas = allProposals.filter(p => p.status === 'enviada');
  const perdidas = allProposals.filter(p => p.status === 'perdida');
  const totalFaturado = fechadas.reduce((s,p) => s+p.value, 0);
  const totalPipeline = enviadas.reduce((s,p) => s+p.value, 0);
  const ticketMedio = fechadas.length > 0 ? totalFaturado / fechadas.length : 0;
  const conversion = total > 0 ? Math.round((fechadas.length/total)*100) : 0;
  const taxaPerda = total > 0 ? Math.round((perdidas.length/total)*100) : 0;

  // Gráfico mensal
  const byMonth = Array(12).fill(0);
  fechadas.forEach(p => { if (p.month >= 0 && p.month < 12) byMonth[p.month] += p.value; });

  // Ranking de serviços
  const serviceRanking = useMemo(() => {
    const map = {};
    fechadas.forEach(p => {
      const items = p.serviceItems || [];
      if (items.length > 0) {
        // Distribui o valor total proporcional entre os serviços
        const valPerItem = p.value / items.length;
        items.forEach(item => {
          const key = item.name || 'Não especificado';
          if (!map[key]) map[key] = { count: 0, total: 0 };
          map[key].count++;
          map[key].total += parseCurrency(item.value) || valPerItem;
        });
      } else {
        const key = p.serviceLabel || 'Não especificado';
        if (!map[key]) map[key] = { count: 0, total: 0 };
        map[key].count++;
        map[key].total += p.value;
      }
    });
    return Object.entries(map).sort((a,b) => b[1].total - a[1].total).slice(0, 5);
  }, [fechadas]);

  const handleClickMonth = (monthIdx) => {
    const items = fechadas.filter(p => p.month === monthIdx);
    if (items.length === 0) return;
    setDetail({
      title: `Fechados em ${MONTHS[monthIdx]}`,
      items: items.map(p => ({ client: p.client, service: p.service, value: p.value, color: '#10B981' })),
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          <h2 className="font-bold text-base" style={{ fontFamily: 'Syne, sans-serif' }}>Resultados</h2>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            {allProposals.filter(p=>p.source==='crm').length} cliente{allProposals.filter(p=>p.source==='crm').length !== 1 ? 's' : ''} do CRM · {manualProposals.length} manuais
          </p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="btn-glow h-9 px-4 rounded-xl flex items-center gap-1.5 text-white text-sm" style={{ fontFamily: 'Inter' }}>
          <Plus size={14} /> Registrar
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6 space-y-4">

        {/* KPIs — clicáveis */}
        <div className="grid grid-cols-2 gap-2">
          <KpiCard icon={TrendingUp} label="Taxa de Conversão" value={`${conversion}%`}
            sub={`${fechadas.length} de ${total}`} color="#0077FF"
            onClick={() => setDetail({ title: 'Propostas Fechadas', items: fechadas.map(p=>({client:p.client,service:p.serviceLabel,value:p.value,month:p.month,color:'#10B981'})) })} />
          <KpiCard icon={DollarSign} label="Faturado" value={fmtShort(totalFaturado)}
            sub="propostas fechadas" color="#10B981"
            onClick={() => setDetail({ title: 'Detalhes Faturamento', items: fechadas.map(p=>({client:p.client,service:p.serviceLabel,value:p.value,month:p.month,color:'#10B981'})) })} />
          <KpiCard icon={Clock} label="Pipeline" value={fmtShort(totalPipeline)}
            sub={`${enviadas.length} em aberto`} color="#F59E0B"
            onClick={() => setDetail({ title: 'Pipeline — Em Negociação', items: enviadas.map(p=>({client:p.client,service:p.serviceLabel,value:p.value,color:'#F59E0B'})) })} />
          <KpiCard icon={XCircle} label="Taxa de Perda" value={`${taxaPerda}%`}
            sub={`${perdidas.length} perdidas`} color="#EF4444"
            onClick={() => setDetail({ title: 'Propostas Perdidas', items: perdidas.map(p=>({client:p.client,service:p.serviceLabel,value:p.value,color:'#EF4444'})) })} />
        </div>

        {/* Ticket médio */}
        <div className="rounded-2xl p-3 flex items-center justify-between"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div>
            <p className="text-xs font-bold" style={{ color: 'var(--muted)' }}>TICKET MÉDIO</p>
            <p className="text-xl font-bold" style={{ color: 'var(--text)', fontFamily: 'Syne' }}>{fmtCurrency(ticketMedio)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs" style={{ color: 'var(--muted)' }}>Acumulado</p>
            <p className="text-base font-bold" style={{ color: '#10B981', fontFamily: 'Syne' }}>{fmtCurrency(totalFaturado)}</p>
          </div>
        </div>

        {/* Gráfico interativo */}
        <div className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold tracking-widest" style={{ color: 'var(--muted)', letterSpacing: '0.1em' }}>
              FATURAMENTO MENSAL
            </h3>
            <p className="text-xs" style={{ color: 'var(--dim)' }}>Toque na barra para ver detalhes</p>
          </div>
          <InteractiveBarChart data={byMonth} onClickMonth={handleClickMonth} />
        </div>

        {/* Ranking de serviços */}
        {serviceRanking.length > 0 && (
          <div className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <h3 className="text-xs font-bold tracking-widest mb-3" style={{ color: 'var(--muted)', letterSpacing: '0.1em' }}>
              TOP SERVIÇOS CONTRATADOS
            </h3>
            {serviceRanking.map(([service, data], i) => {
              const maxTotal = serviceRanking[0][1].total;
              return (
                <div key={service} className="mb-3">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-medium truncate pr-2" style={{ color: 'var(--text)', fontFamily: 'Inter', maxWidth: '65%' }}>
                      {i+1}. {service}
                    </span>
                    <span className="text-xs font-bold flex-shrink-0" style={{ color: '#10B981' }}>
                      {fmtShort(data.total)} ({data.count}x)
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg)' }}>
                    <div className="h-full rounded-full" style={{ width: `${(data.total/maxTotal)*100}%`, background: 'linear-gradient(90deg, #0077FF, #00BBFF)' }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Lista de propostas */}
        {allProposals.length > 0 && (
          <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <h3 className="text-xs font-bold tracking-widest" style={{ color: 'var(--muted)', letterSpacing: '0.1em' }}>
                TODAS AS PROPOSTAS · {allProposals.length}
              </h3>
            </div>
            {allProposals.slice(0,25).map(p => {
              const color = p.status === 'fechada' ? '#10B981' : p.status === 'perdida' ? '#EF4444' : '#F59E0B';
              return (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text)', fontFamily: 'Inter' }}>{p.client}</p>
                    {p.serviceLabel && <p className="text-xs truncate" style={{ color: 'var(--muted)' }}>{p.serviceLabel.length > 50 ? p.serviceLabel.slice(0,50)+'…' : p.serviceLabel}</p>}
                  </div>
                  <span className="text-xs font-bold flex-shrink-0" style={{ color, fontFamily: 'Syne' }}>
                    {p.value > 0 ? fmtShort(p.value) : '—'}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {allProposals.length === 0 && (
          <div className="text-center py-8">
            <TrendingUp size={36} style={{ color: 'var(--dim)', margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--muted)', fontFamily: 'Inter' }}>Cadastre clientes com serviços e valores para ver as métricas</p>
          </div>
        )}
      </div>

      {showModal && <NewProposalModal onClose={() => setShowModal(false)} onSave={p => saveManual([{...p,id:Date.now().toString(),...p}, ...manualProposals])} />}
      {detail && <DetailModal title={detail.title} items={detail.items} onClose={() => setDetail(null)} />}
      {selectedMonth !== null && (
        <DetailModal
          title={`${MONTHS[selectedMonth]} — Faturamento`}
          items={fechadas.filter(p => p.month === selectedMonth).map(p => ({ client: p.client, service: p.service, value: p.value, color: '#10B981' }))}
          onClose={() => setSelectedMonth(null)} />
      )}
    </div>
  );
}
