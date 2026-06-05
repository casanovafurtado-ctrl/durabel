'use client';

import { useState, useEffect } from 'react';
import { X, Sparkles, FileText, ChevronDown, Loader2, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Lightbulb, BarChart3 } from 'lucide-react';
import { parseCurrency } from './CRMPanel';
import { exportReportPDF } from '@/lib/pdfExport';

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const MONTHS_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

const PERIODS = [
  { key: 'mes_atual',    label: 'Mês atual',     icon: '📅' },
  { key: 'trimestre',    label: 'Trimestre',      icon: '📆' },
  { key: 'semestre',     label: 'Semestre',       icon: '🗓️' },
  { key: 'ano_atual',    label: 'Ano atual',      icon: '📊' },
  { key: 'personalizado',label: 'Personalizado',  icon: '✏️' },
];

function getPeriodRange(key, customStart, customEnd) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  if (key === 'mes_atual')   return { start: m, end: m, year: y };
  if (key === 'trimestre')   return { start: Math.floor(m/3)*3, end: Math.floor(m/3)*3+2, year: y };
  if (key === 'semestre')    return { start: m < 6 ? 0 : 6, end: m < 6 ? 5 : 11, year: y };
  if (key === 'ano_atual')   return { start: 0, end: 11, year: y };
  if (key === 'personalizado') return { start: parseInt(customStart)||0, end: parseInt(customEnd)||11, year: y };
  return { start: 0, end: 11, year: y };
}

function getPeriodLabel(key, range) {
  if (key === 'mes_atual')    return MONTHS[range.start] + ' ' + range.year;
  if (key === 'trimestre')    return `${MONTHS_SHORT[range.start]}–${MONTHS_SHORT[range.end]} ${range.year}`;
  if (key === 'semestre')     return `${range.start === 0 ? '1º' : '2º'} Semestre ${range.year}`;
  if (key === 'ano_atual')    return `Ano ${range.year}`;
  if (key === 'personalizado') return `${MONTHS_SHORT[range.start]}–${MONTHS_SHORT[range.end]} ${range.year}`;
  return 'Período';
}

// ─── Mini bar chart (HTML only) ─────────────────────────
function MiniBar({ data, range }) {
  const slice = data.slice(range.start, range.end + 1);
  const max = Math.max(...slice, 1);
  return (
    <div className="flex items-end gap-1" style={{ height: 40 }}>
      {slice.map((v, i) => (
        <div key={i} className="flex flex-col items-center gap-0.5" style={{ flex: 1 }}>
          <div style={{ width: '100%', height: `${Math.max((v/max)*32, 2)}px`,
            background: v > 0 ? 'linear-gradient(180deg,#0077FF,#0055CC88)' : 'var(--border)',
            borderRadius: '3px 3px 0 0', minHeight: 2 }} />
          <span style={{ fontSize: 8, color: 'var(--dim)' }}>{MONTHS_SHORT[range.start + i]}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Loading state ──────────────────────────────────────
function LoadingScreen() {
  const [step, setStep] = useState(0);
  const steps = [
    '🔍 Analisando dados do período...',
    '📊 Calculando métricas e KPIs...',
    '🧠 IA processando insights...',
    '✍️ Redigindo análise executiva...',
    '📋 Finalizando relatório...',
  ];
  useEffect(() => {
    const t = setInterval(() => setStep(s => Math.min(s + 1, steps.length - 1)), 1200);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex flex-col items-center px-6 flex-1"
      style={{ paddingTop: '10%', paddingBottom: 'calc(env(safe-area-inset-bottom) + 48px)' }}>
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
        style={{ background: 'linear-gradient(135deg,#0055CC,#0077FF)', boxShadow: '0 0 30px rgba(0,119,255,0.4)' }}>
        <Sparkles size={28} style={{ color: 'white' }} />
      </div>
      <h3 className="text-base font-bold mb-2" style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text)' }}>
        Gerando relatório com IA
      </h3>
      <p className="text-xs mb-8 text-center" style={{ color: 'var(--muted)' }}>Aguarde enquanto a DURABEL analisa seus resultados</p>
      <div className="w-full max-w-xs space-y-3">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-3 transition-all"
            style={{ opacity: i <= step ? 1 : 0.25, transform: i <= step ? 'translateX(0)' : 'translateX(-8px)' }}>
            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: i < step ? '#10B981' : i === step ? 'var(--blue)' : 'var(--border)' }}>
              {i < step ? <span style={{ color: 'white', fontSize: 10 }}>✓</span>
                : i === step ? <Loader2 size={10} style={{ color: 'white', animation: 'spin 1s linear infinite' }} />
                : null}
            </div>
            <span className="text-xs" style={{ color: i <= step ? 'var(--text)' : 'var(--dim)', fontFamily: 'Inter' }}>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Report View ────────────────────────────────────────
function ReportView({ report, metrics, range, period, periodLabel, onExport }) {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

      {/* Header do relatório */}
      <div className="rounded-2xl p-4"
        style={{ background: 'linear-gradient(135deg,#060B18,#0D1A3A)', border: '1px solid rgba(0,119,255,0.2)' }}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs font-bold tracking-widest mb-1" style={{ color: 'rgba(0,187,255,0.7)', letterSpacing: '0.15em' }}>RELATÓRIO EXECUTIVO</p>
            <h3 className="text-base font-bold" style={{ fontFamily: 'Syne, sans-serif', color: 'white' }}>{periodLabel}</h3>
          </div>
          <div className="text-right">
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>DURAR Consultoria</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3">
          {[
            { label: 'Faturado', value: `R$${(metrics.totalFaturado/1000).toFixed(1)}k`, color: '#10B981' },
            { label: 'Conversão', value: `${metrics.conversion}%`, color: '#0077FF' },
            { label: 'Pipeline', value: `R$${(metrics.pipeline/1000).toFixed(1)}k`, color: '#F59E0B' },
          ].map(k => (
            <div key={k.label} className="rounded-xl p-2 text-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <div className="text-sm font-bold" style={{ color: k.color, fontFamily: 'Syne' }}>{k.value}</div>
              <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{k.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Gráfico */}
      {metrics.monthlyData.reduce((s,v) => s+v, 0) > 0 && (
        <div className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <p className="text-xs font-bold mb-3 tracking-widest" style={{ color: 'var(--muted)', letterSpacing: '0.1em' }}>FATURAMENTO NO PERÍODO</p>
          <MiniBar data={metrics.monthlyData} range={range} />
        </div>
      )}

      {/* Análise da IA */}
      <div className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,119,255,0.15)' }}>
            <Sparkles size={13} style={{ color: 'var(--blue)' }} />
          </div>
          <p className="text-xs font-bold tracking-widest" style={{ color: 'var(--muted)', letterSpacing: '0.1em' }}>ANÁLISE EXECUTIVA</p>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text)', fontFamily: 'Inter' }}>{report.summary}</p>
      </div>

      {/* Destaques */}
      {report.highlights?.length > 0 && (
        <div className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={14} style={{ color: '#10B981' }} />
            <p className="text-xs font-bold" style={{ color: '#10B981', letterSpacing: '0.1em' }}>DESTAQUES POSITIVOS</p>
          </div>
          {report.highlights.map((h, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <span style={{ color: '#10B981', marginTop: 2, flexShrink: 0 }}>▸</span>
              <span className="text-sm" style={{ color: 'var(--text)', fontFamily: 'Inter', lineHeight: 1.6 }}>{h}</span>
            </div>
          ))}
        </div>
      )}

      {/* Alertas */}
      {report.alerts?.length > 0 && (
        <div className="rounded-2xl p-4" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={14} style={{ color: '#F59E0B' }} />
            <p className="text-xs font-bold" style={{ color: '#F59E0B', letterSpacing: '0.1em' }}>ATENÇÃO</p>
          </div>
          {report.alerts.map((a, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <span style={{ color: '#F59E0B', marginTop: 2, flexShrink: 0 }}>⚠</span>
              <span className="text-sm" style={{ color: 'var(--text)', fontFamily: 'Inter', lineHeight: 1.6 }}>{a}</span>
            </div>
          ))}
        </div>
      )}

      {/* Recomendações */}
      {report.recommendations?.length > 0 && (
        <div className="rounded-2xl p-4" style={{ background: 'rgba(0,119,255,0.06)', border: '1px solid rgba(0,119,255,0.2)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb size={14} style={{ color: 'var(--blue)' }} />
            <p className="text-xs font-bold" style={{ color: 'var(--blue)', letterSpacing: '0.1em' }}>RECOMENDAÇÕES</p>
          </div>
          {report.recommendations.map((r, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <span className="text-xs font-bold w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: 'rgba(0,119,255,0.15)', color: 'var(--blue)' }}>{i+1}</span>
              <span className="text-sm" style={{ color: 'var(--text)', fontFamily: 'Inter', lineHeight: 1.6 }}>{r}</span>
            </div>
          ))}
        </div>
      )}

      {/* Perspectiva */}
      {report.outlook && (
        <div className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={14} style={{ color: 'var(--blue)' }} />
            <p className="text-xs font-bold tracking-widest" style={{ color: 'var(--muted)', letterSpacing: '0.1em' }}>PERSPECTIVA</p>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text)', fontFamily: 'Inter' }}>{report.outlook}</p>
        </div>
      )}

      {/* Top serviços */}
      {metrics.topServices?.length > 0 && (
        <div className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <p className="text-xs font-bold mb-3 tracking-widest" style={{ color: 'var(--muted)', letterSpacing: '0.1em' }}>TOP SERVIÇOS NO PERÍODO</p>
          {metrics.topServices.map(([name, data], i) => {
            const maxV = metrics.topServices[0][1].total;
            return (
              <div key={name} className="mb-3">
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-medium" style={{ color: 'var(--text)', fontFamily: 'Inter' }}>{i+1}. {name}</span>
                  <span className="text-xs font-bold" style={{ color: '#10B981' }}>
                    R${(data.total/1000).toFixed(1)}k ({data.count}x)
                  </span>
                </div>
                <div className="h-1.5 rounded-full" style={{ background: 'var(--bg)' }}>
                  <div style={{ width: `${(data.total/maxV)*100}%`, height: '100%', borderRadius: 9999,
                    background: 'linear-gradient(90deg,#0077FF,#00BBFF)' }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Exportar PDF */}
      <button onClick={onExport}
        className="btn-glow w-full py-4 rounded-2xl text-white font-semibold flex items-center justify-center gap-2"
        style={{ fontFamily: 'Syne, sans-serif', fontSize: 14 }}>
        <FileText size={16} /> Exportar Relatório em PDF
      </button>
    </div>
  );
}

// ─── MAIN ──────────────────────────────────────────────
export default function ReportGenerator({ allProposals, onClose }) {
  const [step, setStep] = useState('select'); // select | loading | result
  const [period, setPeriod] = useState('mes_atual');
  const [customStart, setCustomStart] = useState(0);
  const [customEnd, setCustomEnd] = useState(new Date().getMonth());
  const [report, setReport] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [range, setRange] = useState(null);
  const [periodLabel, setPeriodLabel] = useState('');
  const [error, setError] = useState('');

  const generate = async () => {
    const r = getPeriodRange(period, customStart, customEnd);
    const lbl = getPeriodLabel(period, r);
    setRange(r);
    setPeriodLabel(lbl);
    setStep('loading');
    setError('');

    // Filtra propostas do período
    const inPeriod = allProposals.filter(p => p.month >= r.start && p.month <= r.end);
    const fechadas = inPeriod.filter(p => p.status === 'fechada');
    const enviadas = inPeriod.filter(p => p.status === 'enviada');
    const perdidas = inPeriod.filter(p => p.status === 'perdida');
    const total = inPeriod.length;

    const totalFaturado = fechadas.reduce((s,p) => s+p.value, 0);
    const pipeline = enviadas.reduce((s,p) => s+p.value, 0);
    const conversion = total > 0 ? Math.round((fechadas.length/total)*100) : 0;
    const taxaPerda = total > 0 ? Math.round((perdidas.length/total)*100) : 0;
    const ticketMedio = fechadas.length > 0 ? totalFaturado / fechadas.length : 0;

    // Gráfico mensal
    const monthlyData = Array(12).fill(0);
    fechadas.forEach(p => { if(p.month >= 0) monthlyData[p.month] += p.value; });

    // Top serviços
    const svcMap = {};
    fechadas.forEach(p => {
      const k = p.service || 'Não especificado';
      if (!svcMap[k]) svcMap[k] = { count: 0, total: 0 };
      svcMap[k].count++;
      svcMap[k].total += p.value;
    });
    const topServices = Object.entries(svcMap).sort((a,b) => b[1].total-a[1].total).slice(0,5);

    const m = { totalFaturado, pipeline, conversion, taxaPerda, ticketMedio,
      fechadasCount: fechadas.length, enviadasCount: enviadas.length,
      perdidasCount: perdidas.length, total, monthlyData, topServices,
      lbl };
    setMetrics(m);

    // Contexto para a IA
    const ctx = `
Período: ${lbl}
Total de propostas: ${total}
Propostas fechadas: ${fechadas.length}
Propostas em aberto/pipeline: ${enviadas.length}
Propostas perdidas: ${perdidas.length}
Faturamento total: R$ ${totalFaturado.toLocaleString('pt-BR', {minimumFractionDigits:2})}
Pipeline em aberto: R$ ${pipeline.toLocaleString('pt-BR', {minimumFractionDigits:2})}
Taxa de conversão: ${conversion}%
Taxa de perda: ${taxaPerda}%
Ticket médio: R$ ${ticketMedio.toLocaleString('pt-BR', {minimumFractionDigits:2})}
Top serviços fechados: ${topServices.map(([s,d]) => `${s} (${d.count}x, R$${d.total.toLocaleString('pt-BR')})`).join('; ') || 'Nenhum'}
Clientes fechados: ${fechadas.map(p => `${p.client} — ${p.service} (R$${p.value.toLocaleString('pt-BR')})`).join('; ') || 'Nenhum'}
Propostas perdidas: ${perdidas.map(p => `${p.client} — ${p.service}`).join('; ') || 'Nenhuma'}
`;

    try {
      const settings = JSON.parse(localStorage.getItem('durabel_settings') || '{}');
      const anthropicKey = settings.anthropic_key || '';

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          anthropicKey,
          systemOverride: `Você é a DURABEL, secretária executiva da DURAR Consultoria e Engenharia (Recife/PE e Alagoas). 
Analise os dados de resultados comerciais e gere um relatório executivo objetivo, profissional e perspicaz.
Responda APENAS com JSON válido no formato:
{
  "summary": "parágrafo de análise geral do período (3-4 frases)",
  "highlights": ["ponto positivo 1", "ponto positivo 2", "ponto positivo 3"],
  "alerts": ["alerta ou ponto de atenção 1", "alerta 2"],
  "recommendations": ["ação recomendada 1", "ação recomendada 2", "ação recomendada 3"],
  "outlook": "parágrafo de perspectiva e próximos passos (2-3 frases)"
}
Seja direto, específico com os números fornecidos, e use linguagem executiva em português brasileiro.
Não use markdown. Não inclua nada além do JSON.`,
          messages: [{ role: 'user', content: `Gere o relatório executivo com estes dados:\n${ctx}` }],
        }),
      });

      const data = await res.json();
      let text = data.content || '';
      // Remove markdown code fences se presentes
      text = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      const parsed = JSON.parse(text);
      setReport(parsed);
      setStep('result');
    } catch (e) {
      setError('Erro ao gerar análise. Verifique sua chave Anthropic nas Configurações.');
      setStep('select');
    }
  };

  const handleExport = () => {
    exportReportPDF({ report, metrics, periodLabel, range });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.8)' }}>
      <div className="w-full max-w-lg rounded-t-3xl flex flex-col" style={{ background: 'var(--card)', maxHeight: '94vh' }}>

        {/* Topbar */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#0055CC,#0077FF)' }}>
              <Sparkles size={15} style={{ color: 'white' }} />
            </div>
            <div>
              <h2 className="font-bold text-sm" style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text)' }}>
                {step === 'select' ? 'Relatório com IA' : step === 'loading' ? 'Gerando...' : periodLabel}
              </h2>
              {step === 'result' && <p className="text-xs" style={{ color: 'var(--muted)' }}>Análise executiva DURABEL</p>}
            </div>
          </div>
          <button onClick={onClose} style={{ color: 'var(--muted)' }}><X size={20} /></button>
        </div>

        {/* Seleção de período */}
        {step === 'select' && (
          <div className="flex-1 overflow-y-auto px-5 py-5">
            <p className="text-xs font-bold mb-3 tracking-widest" style={{ color: 'var(--muted)', letterSpacing: '0.12em' }}>
              ESCOLHA O PERÍODO
            </p>
            <div className="space-y-2 mb-4">
              {PERIODS.map(p => (
                <button key={p.key} onClick={() => setPeriod(p.key)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left transition-all"
                  style={{
                    background: period === p.key ? 'rgba(0,119,255,0.12)' : 'var(--bg)',
                    border: `1.5px solid ${period === p.key ? 'rgba(0,119,255,0.4)' : 'var(--border)'}`,
                    transform: period === p.key ? 'scale(1.01)' : 'scale(1)',
                  }}>
                  <span style={{ fontSize: 20 }}>{p.icon}</span>
                  <span className="text-sm font-semibold"
                    style={{ color: period === p.key ? 'var(--blue)' : 'var(--text)', fontFamily: 'Inter' }}>
                    {p.label}
                  </span>
                  {period === p.key && (
                    <span className="ml-auto text-xs font-bold" style={{ color: 'var(--blue)' }}>✓</span>
                  )}
                </button>
              ))}
            </div>

            {/* Personalizado */}
            {period === 'personalizado' && (
              <div className="rounded-2xl p-4 mb-4" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                <p className="text-xs font-bold mb-3" style={{ color: 'var(--muted)' }}>INTERVALO DE MESES</p>
                <div className="grid grid-cols-2 gap-3">
                  {[['De', customStart, setCustomStart],['Até', customEnd, setCustomEnd]].map(([label, val, setter]) => (
                    <div key={label}>
                      <label className="text-xs mb-1 block" style={{ color: 'var(--dim)' }}>{label}</label>
                      <select value={val} onChange={e => setter(parseInt(e.target.value))}
                        className="w-full rounded-xl px-3 py-2 text-sm"
                        style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Inter' }}>
                        {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-xl p-3 mb-4" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <p className="text-xs" style={{ color: '#EF4444' }}>{error}</p>
              </div>
            )}

            <button onClick={generate}
              className="btn-glow w-full py-4 rounded-2xl text-white font-bold flex items-center justify-center gap-2"
              style={{ fontFamily: 'Syne, sans-serif' }}>
              <Sparkles size={18} /> Gerar Relatório com IA
            </button>
            <p className="text-xs text-center mt-2" style={{ color: 'var(--dim)' }}>
              A IA vai analisar seus dados e gerar insights executivos
            </p>
          </div>
        )}

        {step === 'loading' && <LoadingScreen />}

        {step === 'result' && report && (
          <ReportView
            report={report} metrics={metrics} range={range}
            period={period} periodLabel={periodLabel}
            onExport={handleExport} />
        )}
      </div>
    </div>
  );
}
