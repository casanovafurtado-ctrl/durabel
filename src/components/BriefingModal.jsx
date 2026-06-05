'use client';

import { useState } from 'react';
import { Sparkles, Building2, FileText, CheckSquare, TrendingUp, AlertCircle, X } from 'lucide-react';
import { parseCurrency } from './CRMPanel';

const STATUS_LABELS = { prospecto: 'Prospecto', proposta: 'Proposta Enviada', negociacao: 'Em Negociação', fechado: 'Fechado', perdido: 'Perdido' };
const STATUS_COLORS = { prospecto: '#6B7280', proposta: '#F59E0B', negociacao: '#0077FF', fechado: '#10B981', perdido: '#EF4444' };
const MONTHS_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

export function fmtEventTime(ev) {
  if (!ev?.start) return '';
  try {
    if (ev.start.dateTime) {
      const d = new Date(ev.start.dateTime);
      return d.toLocaleString('pt-BR', { timeZone: 'America/Recife', weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    }
    return new Date(ev.start.date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
  } catch { return ''; }
}

export function timeUntil(ev) {
  try {
    const dt = ev.start?.dateTime ? new Date(ev.start.dateTime) : new Date(ev.start?.date);
    const diff = dt - new Date();
    if (diff < 0) return null;
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(h / 24);
    if (d > 0) return `em ${d}d`;
    if (h > 0) return `em ${h}h`;
    const m = Math.floor(diff / 60000);
    if (m > 0) return `em ${m}min`;
    return 'agora';
  } catch { return null; }
}

export function matchClient(eventTitle, clients) {
  if (!eventTitle || !clients?.length) return null;
  const title = eventTitle.toLowerCase();
  return clients.find(c => {
    const name = (c.name || '').toLowerCase();
    const building = (c.building || '').toLowerCase();
    return name.split(' ').some(w => w.length > 3 && title.includes(w))
      || (building && building.split(' ').some(w => w.length > 3 && title.includes(w)));
  }) || null;
}

async function callBriefingAI({ event, matchedClient, minutes, tasks }) {
  const clientData = matchedClient ? {
    name: matchedClient.name,
    building: matchedClient.building,
    responsible: matchedClient.responsible,
    phone: matchedClient.phone,
    status: matchedClient.status,
    notes: matchedClient.notes,
    totalValue: (matchedClient.serviceItems || []).reduce((s, i) => s + parseCurrency(i.value), 0),
    services: matchedClient.serviceItems || [],
  } : null;

  const relatedMinutes = (minutes || []).filter(m => {
    if (!matchedClient) return false;
    const words = [(matchedClient.name||''), (matchedClient.building||'')].join(' ').toLowerCase().split(' ').filter(w => w.length > 3);
    const content = (m.title + ' ' + (m.content||'')).toLowerCase();
    return words.some(w => content.includes(w));
  }).slice(0, 3);

  const relatedTasks = (tasks || []).filter(t => {
    if (!matchedClient) return false;
    const words = [(matchedClient.name||''), (matchedClient.building||'')].join(' ').toLowerCase().split(' ').filter(w => w.length > 3);
    return words.some(w => (t.title||'').toLowerCase().includes(w));
  }).slice(0, 5);

  const ctx = `
REUNIÃO: ${event.summary || 'Sem título'}
DATA/HORA: ${fmtEventTime(event)}
${event.location ? `LOCAL: ${event.location}` : ''}
${event.description ? `DESCRIÇÃO: ${event.description}` : ''}

${clientData ? `CLIENTE NO CRM:
- Nome: ${clientData.name}${clientData.building ? ` / ${clientData.building}` : ''}
- Responsável: ${clientData.responsible || 'não informado'}
- Status: ${STATUS_LABELS[clientData.status] || clientData.status}
- Valor total: R$ ${clientData.totalValue.toLocaleString('pt-BR', {minimumFractionDigits:2})}
- Serviços: ${clientData.services.map(s => s.name + (parseCurrency(s.value) > 0 ? ` R$${parseCurrency(s.value).toLocaleString('pt-BR')}` : '')).join(', ') || 'nenhum'}
- Obs: ${clientData.notes || 'nenhuma'}` : 'CLIENTE: não identificado no CRM'}

${relatedMinutes.length ? `ATAS ANTERIORES:\n${relatedMinutes.map(m => `- ${m.title} (${m.date}): ${(m.content||'').slice(0,250)}`).join('\n')}` : ''}
${relatedTasks.length ? `TAREFAS PENDENTES:\n${relatedTasks.map(t => `- ${t.title}${t.due ? ` (prazo: ${t.due})` : ''}`).join('\n')}` : ''}
`;

  const settings = JSON.parse(localStorage.getItem('durabel_settings') || '{}');
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      anthropicKey: settings.anthropic_key || '',
      systemOverride: `Você é a DURABEL, secretária executiva da DURAR Consultoria e Engenharia. Gere um briefing pré-reunião direto e útil em português.
Responda APENAS com JSON válido:
{"summary":"2-3 frases resumindo contexto e objetivo","attention":["ponto1","ponto2"],"suggestions":["sugestão1","sugestão2","sugestão3"]}
Sem markdown. JSON puro.`,
      messages: [{ role: 'user', content: `Briefing para:\n${ctx}` }],
    }),
  });

  const data = await res.json();
  let text = (data.content || '').replace(/```json\s*/gi,'').replace(/```\s*/g,'').trim();
  const ai = JSON.parse(text);

  return {
    ...ai,
    client: clientData,
    services: clientData?.services?.map(s => ({ name: s.name, value: parseCurrency(s.value) })) || [],
    minutes: relatedMinutes.map(m => ({ title: m.title, date: m.date, snippet: (m.content||'').slice(0,120) })),
    tasks: relatedTasks.map(t => ({ title: t.title, due: t.due || null })),
  };
}

// ─── O Modal em si ─────────────────────────────────────
export default function BriefingModal({ event, clients, minutes, tasks, onClose }) {
  const [briefing, setBriefing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);

  const matched = matchClient(event?.summary, clients);

  const generate = async () => {
    setLoading(true);
    setStarted(true);
    try {
      const result = await callBriefingAI({ event, matchedClient: matched, minutes, tasks });
      setBriefing(result);
    } catch {
      setBriefing({ summary: 'Não foi possível gerar análise com IA.', client: matched ? { name: matched.name, building: matched.building, responsible: matched.responsible, phone: matched.phone, status: matched.status, totalValue: (matched.serviceItems||[]).reduce((s,i)=>s+parseCurrency(i.value),0) } : null, services: (matched?.serviceItems||[]).map(s=>({name:s.name,value:parseCurrency(s.value)})), minutes:[], tasks:[], attention:[], suggestions:[] });
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.8)' }} onClick={onClose}>
      <div className="w-full max-w-lg rounded-t-3xl flex flex-col" style={{ background: 'var(--card)', maxHeight: '92vh' }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="px-5 pt-5 pb-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#0055CC,#0077FF)' }}>
                <Sparkles size={18} style={{ color: 'white' }} />
              </div>
              <div>
                <h2 className="font-bold text-sm leading-snug" style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text)' }}>
                  {event?.summary || 'Reunião'}
                </h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{fmtEventTime(event)}</p>
              </div>
            </div>
            <button onClick={onClose} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--muted)' }}><X size={20} /></button>
          </div>
          {matched && !started && (
            <p className="text-xs mt-3 font-medium" style={{ color: 'var(--blue)' }}>
              🔗 Identificado: {matched.name}{matched.building ? ` — ${matched.building}` : ''}
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* Botão inicial */}
          {!started && (
            <div className="flex flex-col items-center py-8 gap-4">
              <div className="w-16 h-16 rounded-3xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,rgba(0,85,204,0.12),rgba(0,187,255,0.08))', border: '1px solid rgba(0,119,255,0.2)' }}>
                <Sparkles size={28} style={{ color: 'var(--blue)' }} />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text)', fontFamily: 'Syne' }}>Pronto para a reunião?</p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                  {matched ? 'Vou cruzar CRM, atas e tarefas para preparar você.' : 'Vou analisar os dados disponíveis.'}
                </p>
              </div>
              <button onClick={generate}
                className="btn-glow px-8 py-3 rounded-2xl text-white font-semibold flex items-center gap-2"
                style={{ fontFamily: 'Syne, sans-serif', fontSize: 14 }}>
                <Sparkles size={16} /> Gerar Briefing
              </button>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center py-10 gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(0,119,255,0.1)', animation: 'pulse 1.5s infinite' }}>
                <Sparkles size={20} style={{ color: 'var(--blue)' }} />
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--muted)', fontFamily: 'Inter' }}>Preparando briefing...</p>
              <p className="text-xs" style={{ color: 'var(--dim)' }}>Cruzando CRM, atas e tarefas</p>
            </div>
          )}

          {/* Resultado */}
          {briefing && !loading && (
            <>
              {briefing.summary && (
                <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg,rgba(0,85,204,0.08),rgba(0,187,255,0.04))', border: '1px solid rgba(0,119,255,0.2)' }}>
                  <p className="text-xs font-bold mb-2 tracking-widest" style={{ color: 'var(--blue)', letterSpacing: '0.1em' }}>RESUMO</p>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text)', fontFamily: 'Inter' }}>{briefing.summary}</p>
                </div>
              )}

              {briefing.client && (
                <div className="rounded-2xl p-4" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 size={13} style={{ color: 'var(--blue)' }} />
                    <p className="text-xs font-bold tracking-widest" style={{ color: 'var(--muted)', letterSpacing: '0.1em' }}>CLIENTE</p>
                  </div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text)', fontFamily: 'Syne' }}>{briefing.client.name}</p>
                  {briefing.client.building && <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>🏢 {briefing.client.building}</p>}
                  {briefing.client.responsible && <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>👤 {briefing.client.responsible}</p>}
                  {briefing.client.phone && <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>📞 {briefing.client.phone}</p>}
                  <div className="flex items-center gap-2 mt-2">
                    {briefing.client.status && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: `${STATUS_COLORS[briefing.client.status]}18`, color: STATUS_COLORS[briefing.client.status], border: `1px solid ${STATUS_COLORS[briefing.client.status]}33` }}>
                        {STATUS_LABELS[briefing.client.status]}
                      </span>
                    )}
                    {briefing.client.totalValue > 0 && (
                      <span className="text-xs font-bold" style={{ color: '#10B981' }}>
                        R$ {briefing.client.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {briefing.services?.length > 0 && (
                <div className="rounded-2xl p-4" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp size={13} style={{ color: 'var(--blue)' }} />
                    <p className="text-xs font-bold tracking-widest" style={{ color: 'var(--muted)', letterSpacing: '0.1em' }}>SERVIÇOS</p>
                  </div>
                  {briefing.services.map((s, i) => (
                    <div key={i} className="flex justify-between py-2"
                      style={{ borderBottom: i < briefing.services.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <span className="text-xs flex-1 pr-2" style={{ color: 'var(--text)', fontFamily: 'Inter' }}>{s.name}</span>
                      {s.value > 0 && <span className="text-xs font-bold" style={{ color: '#10B981' }}>R$ {s.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>}
                    </div>
                  ))}
                </div>
              )}

              {briefing.attention?.length > 0 && (
                <div className="rounded-2xl p-4" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.25)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle size={13} style={{ color: '#F59E0B' }} />
                    <p className="text-xs font-bold tracking-widest" style={{ color: '#F59E0B', letterSpacing: '0.1em' }}>ATENÇÃO</p>
                  </div>
                  {briefing.attention.map((a, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <span style={{ color: '#F59E0B', flexShrink: 0 }}>⚠</span>
                      <span className="text-sm leading-relaxed" style={{ color: 'var(--text)', fontFamily: 'Inter' }}>{a}</span>
                    </div>
                  ))}
                </div>
              )}

              {briefing.minutes?.length > 0 && (
                <div className="rounded-2xl p-4" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <FileText size={13} style={{ color: 'var(--blue)' }} />
                    <p className="text-xs font-bold tracking-widest" style={{ color: 'var(--muted)', letterSpacing: '0.1em' }}>REUNIÕES ANTERIORES</p>
                  </div>
                  {briefing.minutes.map((m, i) => (
                    <div key={i} className="py-2" style={{ borderBottom: i < briefing.minutes.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <p className="text-xs font-semibold" style={{ color: 'var(--text)', fontFamily: 'Inter' }}>{m.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--dim)' }}>{m.date}</p>
                      {m.snippet && <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--muted)' }}>{m.snippet}</p>}
                    </div>
                  ))}
                </div>
              )}

              {briefing.tasks?.length > 0 && (
                <div className="rounded-2xl p-4" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckSquare size={13} style={{ color: 'var(--blue)' }} />
                    <p className="text-xs font-bold tracking-widest" style={{ color: 'var(--muted)', letterSpacing: '0.1em' }}>TAREFAS PENDENTES</p>
                  </div>
                  {briefing.tasks.map((t, i) => (
                    <div key={i} className="flex gap-2 py-2"
                      style={{ borderBottom: i < briefing.tasks.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <span style={{ color: 'var(--blue)', flexShrink: 0 }}>▸</span>
                      <div>
                        <p className="text-xs font-medium" style={{ color: 'var(--text)', fontFamily: 'Inter' }}>{t.title}</p>
                        {t.due && <p className="text-xs mt-0.5" style={{ color: 'var(--dim)' }}>Prazo: {t.due}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {briefing.suggestions?.length > 0 && (
                <div className="rounded-2xl p-4" style={{ background: 'rgba(0,119,255,0.06)', border: '1px solid rgba(0,119,255,0.2)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={13} style={{ color: 'var(--blue)' }} />
                    <p className="text-xs font-bold tracking-widest" style={{ color: 'var(--blue)', letterSpacing: '0.1em' }}>SUGESTÕES</p>
                  </div>
                  {briefing.suggestions.map((s, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <span className="text-xs font-bold w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: 'rgba(0,119,255,0.15)', color: 'var(--blue)' }}>{i + 1}</span>
                      <span className="text-sm leading-relaxed" style={{ color: 'var(--text)', fontFamily: 'Inter' }}>{s}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
