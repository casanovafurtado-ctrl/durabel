'use client';

import { useState } from 'react';
import { Clock, Sparkles, Calendar, CheckSquare, ChevronRight, Plus, X, Loader2 } from 'lucide-react';

const HORIZONS = [
  { key: 'hoje',    label: 'Hoje',           icon: '☀️' },
  { key: 'amanha',  label: 'Amanhã',         icon: '🌅' },
  { key: 'semana',  label: 'Próximos 7 dias', icon: '📅' },
];

const BLOCK_COLORS = ['#0077FF','#10B981','#8B5CF6','#F59E0B','#EF4444','#06B6D4'];

// ─── Loading steps ──────────────────────────────────────
function LoadingScreen() {
  const [step, setStep] = useState(0);
  const steps = [
    '📋 Lendo suas tarefas pendentes...',
    '📅 Analisando sua agenda...',
    '🧠 IA identificando janelas livres...',
    '⏰ Montando blocos de foco...',
    '✅ Finalizando sugestões...',
  ];
  useState(() => {
    const t = setInterval(() => setStep(s => Math.min(s+1, steps.length-1)), 1100);
    return () => clearInterval(t);
  });
  return (
    <div className="flex flex-col items-center px-6" style={{ paddingTop: '10%', paddingBottom: 'calc(env(safe-area-inset-bottom) + 48px)' }}>
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
        style={{ background: 'linear-gradient(135deg,#0055CC,#0077FF)', boxShadow: '0 0 30px rgba(0,119,255,0.35)' }}>
        <Clock size={28} style={{ color: 'white' }} />
      </div>
      <h3 className="text-base font-bold mb-2" style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text)' }}>
        Montando seu Time Block
      </h3>
      <p className="text-xs mb-8 text-center" style={{ color: 'var(--muted)' }}>
        Analisando agenda e tarefas para sugerir os melhores blocos
      </p>
      <div className="w-full max-w-xs space-y-3">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-3 transition-all"
            style={{ opacity: i <= step ? 1 : 0.2, transform: i <= step ? 'translateX(0)' : 'translateX(-8px)' }}>
            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: i < step ? '#10B981' : i === step ? 'var(--blue)' : 'var(--border)' }}>
              {i < step
                ? <span style={{ color:'white', fontSize:10 }}>✓</span>
                : i === step
                  ? <Loader2 size={10} style={{ color:'white', animation:'spin 1s linear infinite' }} />
                  : null}
            </div>
            <span className="text-xs" style={{ color: i <= step ? 'var(--text)' : 'var(--dim)', fontFamily: 'Inter' }}>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Block card ─────────────────────────────────────────
function BlockCard({ block, index, onSchedule, scheduling }) {
  const color = BLOCK_COLORS[index % BLOCK_COLORS.length];
  const [scheduled, setScheduled] = useState(false);

  const handleSchedule = async () => {
    await onSchedule(block);
    setScheduled(true);
  };

  return (
    <div className="rounded-2xl mb-3 overflow-hidden"
      style={{ background: 'var(--card)', border: '1px solid var(--border)', borderLeft: `4px solid ${color}` }}>
      <div className="p-4">
        {/* Dia + horário */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="px-2.5 py-1 rounded-lg"
              style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
              <span className="text-xs font-bold" style={{ color, fontFamily: 'Syne' }}>{block.time}</span>
            </div>
            <span className="text-xs font-semibold" style={{ color: 'var(--muted)', fontFamily: 'Inter' }}>{block.day}</span>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background: `${color}12`, color, border: `1px solid ${color}25` }}>
            {block.duration}
          </span>
        </div>

        {/* Tarefa sugerida */}
        <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text)', fontFamily: 'Syne' }}>
          {block.task}
        </p>
        {block.reason && (
          <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--muted)', fontFamily: 'Inter' }}>
            {block.reason}
          </p>
        )}

        {/* Prioridade */}
        {block.priority && (
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{
                background: block.priority === 'alta' ? 'rgba(239,68,68,0.1)' : block.priority === 'média' ? 'rgba(245,158,11,0.1)' : 'rgba(107,114,128,0.1)',
                color: block.priority === 'alta' ? '#EF4444' : block.priority === 'média' ? '#F59E0B' : '#6B7280',
              }}>
              {block.priority === 'alta' ? '🔴' : block.priority === 'média' ? '🟡' : '🟢'} Prioridade {block.priority}
            </span>
          </div>
        )}

        {/* Botão agendar */}
        <button onClick={handleSchedule} disabled={scheduled || scheduling}
          className="w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2"
          style={{
            background: scheduled ? 'rgba(16,185,129,0.1)' : `${color}15`,
            border: `1px solid ${scheduled ? 'rgba(16,185,129,0.3)' : color + '35'}`,
            color: scheduled ? '#10B981' : color,
            fontFamily: 'Inter',
            opacity: scheduling ? 0.6 : 1,
          }}>
          {scheduled
            ? <><span>✓</span> Adicionado à agenda</>
            : scheduling
              ? <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> Agendando...</>
              : <><Calendar size={12} /> Bloquear na agenda</>}
        </button>
      </div>
    </div>
  );
}

// ─── Result view ────────────────────────────────────────
function ResultView({ result, horizon, onSchedule, scheduling }) {
  const horizonLabel = HORIZONS.find(h => h.key === horizon)?.label || '';
  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 32px)' }}>

      {/* Header */}
      <div className="rounded-2xl p-4"
        style={{ background: 'linear-gradient(135deg,#060B18,#0D1A3A)', border: '1px solid rgba(0,119,255,0.2)' }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs font-bold tracking-widest mb-1" style={{ color: 'rgba(0,187,255,0.7)', letterSpacing: '0.15em' }}>
              TIME BLOCKING
            </p>
            <h3 className="text-base font-bold" style={{ fontFamily: 'Syne, sans-serif', color: 'white' }}>
              {horizonLabel}
            </h3>
          </div>
          <div className="text-right">
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>DURAR</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Blocos', value: result.blocks?.length || 0, color: '#0077FF' },
            { label: 'Tarefas', value: result.tasksCount || 0, color: '#10B981' },
            { label: 'Horas livres', value: result.freeHours ? `${result.freeHours}h` : '—', color: '#F59E0B' },
          ].map(k => (
            <div key={k.label} className="rounded-xl p-2 text-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <div className="text-sm font-bold" style={{ color: k.color, fontFamily: 'Syne' }}>{k.value}</div>
              <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{k.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Análise */}
      {result.analysis && (
        <div className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,119,255,0.15)' }}>
              <Sparkles size={13} style={{ color: 'var(--blue)' }} />
            </div>
            <p className="text-xs font-bold tracking-widest" style={{ color: 'var(--muted)', letterSpacing: '0.1em' }}>ANÁLISE</p>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text)', fontFamily: 'Inter' }}>{result.analysis}</p>
        </div>
      )}

      {/* Blocos */}
      {result.blocks?.length > 0 && (
        <>
          <p className="text-xs font-bold tracking-widest" style={{ color: 'var(--muted)', letterSpacing: '0.1em' }}>
            BLOCOS SUGERIDOS · {result.blocks.length}
          </p>
          {result.blocks.map((block, i) => (
            <BlockCard key={i} block={block} index={i}
              onSchedule={onSchedule} scheduling={scheduling === i} />
          ))}
        </>
      )}

      {/* Dica */}
      {result.tip && (
        <div className="rounded-2xl p-4" style={{ background: 'rgba(0,119,255,0.06)', border: '1px solid rgba(0,119,255,0.2)' }}>
          <p className="text-xs font-bold mb-2" style={{ color: 'var(--blue)' }}>💡 DICA</p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text)', fontFamily: 'Inter' }}>{result.tip}</p>
        </div>
      )}
    </div>
  );
}

// ─── MAIN ───────────────────────────────────────────────
export default function TimeBlockPanel({ tasks }) {
  const [step, setStep] = useState('select'); // select | loading | result
  const [horizon, setHorizon] = useState('hoje');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [scheduling, setScheduling] = useState(null);

  const generate = async () => {
    setStep('loading');
    setError('');

    try {
      // Busca agenda
      let events = [];
      try {
        const res = await fetch('/api/calendar');
        if (res.ok) {
          const data = await res.json();
          const now = new Date();
          const nowRecife = new Date(now.toLocaleString('en-US', { timeZone: 'America/Recife' }));
          const cutoff = new Date(now.getTime() + (horizon === 'hoje' ? 1 : horizon === 'amanha' ? 2 : 7) * 86400000);
          events = (data.events || []).filter(ev => {
            try {
              const dt = new Date(ev.start?.dateTime || ev.start?.date);
              return dt >= now && dt <= cutoff;
            } catch { return false; }
          }).map(ev => ({
            title: ev.summary,
            start: ev.start?.dateTime ? new Date(ev.start.dateTime).toLocaleString('pt-BR', { timeZone: 'America/Recife', weekday: 'short', hour: '2-digit', minute: '2-digit' }) : ev.start?.date,
            end: ev.end?.dateTime ? new Date(ev.end.dateTime).toLocaleString('pt-BR', { timeZone: 'America/Recife', hour: '2-digit', minute: '2-digit' }) : '',
          }));
        }
      } catch {}

      const pending = (tasks || []).filter(t => !t.completed).map(t => ({
        title: t.title,
        due: t.due ? t.due.split('T')[0] : null,
        notes: t.notes || '',
      }));

      const horizonLabel = HORIZONS.find(h => h.key === horizon)?.label;
      const nowRecife2 = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Recife' }));
      const horaAtual = nowRecife2.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const dataAtual = nowRecife2.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
      const diaSemana = nowRecife2.getDay(); // 0=dom, 6=sab
      const isWeekend = diaSemana === 0 || diaSemana === 6;

      // Pega preferências das configurações
      const workStart = settings.pref_workstart || '08:00';
      const workEnd = settings.pref_workend || '18:00';
      const weekendPref = settings.pref_weekend || 'Não trabalho';

      const ctx = `
HORIZONTE: ${horizonLabel}
DATA E HORA ATUAL (fuso Recife/UTC-3): ${dataAtual} às ${horaAtual}
DIA DA SEMANA: ${isWeekend ? 'Final de semana' : 'Dia útil'}

HORÁRIO DE TRABALHO DO FELIPE:
- Início: ${workStart}
- Fim: ${workEnd}
- Final de semana: ${weekendPref}

REGRAS IMPORTANTES:
1. São ${horaAtual} agora em Recife. Sugira APENAS blocos no futuro.
2. Se horizonte "Hoje" e restam menos de 1h de expediente, avise e sugira amanhã.
3. Respeite o horário de trabalho (${workStart}–${workEnd}).
4. Se hoje for fim de semana: ${weekendPref === 'Não trabalho' ? 'NÃO sugira blocos hoje — Felipe não trabalha no fim de semana.' : 'Felipe ' + weekendPref.toLowerCase() + ', pode sugerir blocos.'}
5. Use os dias da semana corretos (não invente datas passadas).

TAREFAS PENDENTES (${pending.length}):
${pending.map(t => `- ${t.title}${t.due ? ` (prazo: ${t.due})` : ''}${t.notes ? ` — ${t.notes}` : ''}`).join('\n') || 'Nenhuma tarefa pendente'}

COMPROMISSOS JÁ AGENDADOS (${events.length}):
${events.map(e => `- ${e.title}: ${e.start}${e.end ? ` até ${e.end}` : ''}`).join('\n') || 'Agenda livre'}
`;

      const settings = JSON.parse(localStorage.getItem('durabel_settings') || '{}');
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          anthropicKey: settings.anthropic_key || '',
          systemOverride: `Você é a DURABEL, secretária executiva da DURAR Consultoria e Engenharia. Analise as tarefas e agenda e sugira blocos de foco inteligentes para o período solicitado.

Responda APENAS com JSON válido:
{
  "analysis": "2-3 frases analisando a situação da agenda e tarefas",
  "freeHours": 6,
  "tasksCount": 4,
  "blocks": [
    {
      "day": "Terça, 10/06",
      "time": "09h–11h",
      "duration": "2 horas",
      "task": "Nome da tarefa ou atividade",
      "reason": "Por que este horário é ideal para esta tarefa",
      "priority": "alta"
    }
  ],
  "tip": "Dica prática sobre produtividade ou gestão do tempo para Felipe"
}

Prioridade pode ser: alta, média, baixa.
Sugira de 2 a 5 blocos reais e práticos baseados nas tarefas listadas.
Respeite os compromissos já agendados — não sobreponha horários.
Use horário comercial: 8h–18h.
Sem markdown. JSON puro.`,
          messages: [{ role: 'user', content: `Monte o time block para:\n${ctx}` }],
        }),
      });

      const data = await res.json();
      let text = (data.content || '').replace(/```json\s*/gi,'').replace(/```\s*/g,'').trim();
      const parsed = JSON.parse(text);
      setResult(parsed);
      setStep('result');
    } catch (e) {
      setError('Erro ao gerar. Verifique sua chave Anthropic nas Configurações.');
      setStep('select');
    }
  };

  const handleSchedule = async (block, index) => {
    setScheduling(index);
    try {
      // Monta data/hora para criar evento
      const today = new Date();
      const dayOffset = horizon === 'amanha' ? 1 : 0;
      const date = new Date(today.getTime() + dayOffset * 86400000);
      const dateStr = date.toISOString().split('T')[0];

      // Extrai hora de início do campo "time" (ex: "09h–11h")
      const match = block.time.match(/(\d{1,2})h/);
      const hour = match ? parseInt(match[1]) : 9;
      const endMatch = block.time.match(/–\s*(\d{1,2})h/);
      const endHour = endMatch ? parseInt(endMatch[1]) : hour + 1;

      await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `⏰ ${block.task}`,
          startDateTime: `${dateStr}T${String(hour).padStart(2,'0')}:00:00`,
          endDateTime: `${dateStr}T${String(endHour).padStart(2,'0')}:00:00`,
          description: block.reason || '',
        }),
      });
    } catch {}
    setScheduling(null);
  };

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#0055CC,#0077FF)' }}>
            <Clock size={15} style={{ color: 'white' }} />
          </div>
          <div>
            <h2 className="font-bold text-sm" style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text)' }}>
              {step === 'select' ? 'Time Blocking' : step === 'loading' ? 'Analisando...' : `Time Block — ${HORIZONS.find(h=>h.key===horizon)?.label}`}
            </h2>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              {step === 'select' ? 'IA sugere blocos de foco baseados na sua agenda' : step === 'result' ? 'Toque em "Bloquear" para adicionar ao Calendar' : ''}
            </p>
          </div>
          {step === 'result' && (
            <button onClick={() => { setStep('select'); setResult(null); }} className="ml-auto"
              style={{ color: 'var(--muted)' }}>
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Seleção */}
      {step === 'select' && (
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <p className="text-xs font-bold mb-3 tracking-widest" style={{ color: 'var(--muted)', letterSpacing: '0.12em' }}>
            ESCOLHA O HORIZONTE
          </p>
          <div className="space-y-2 mb-6">
            {HORIZONS.map(h => (
              <button key={h.key} onClick={() => setHorizon(h.key)}
                className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-left transition-all"
                style={{
                  background: horizon===h.key ? 'rgba(0,119,255,0.1)' : 'var(--bg)',
                  border: `1.5px solid ${horizon===h.key ? 'rgba(0,119,255,0.4)' : 'var(--border)'}`,
                  transform: horizon===h.key ? 'scale(1.01)' : 'scale(1)',
                }}>
                <span style={{ fontSize: 24 }}>{h.icon}</span>
                <span className="text-sm font-semibold"
                  style={{ color: horizon===h.key ? 'var(--blue)' : 'var(--text)', fontFamily: 'Inter' }}>
                  {h.label}
                </span>
                {horizon===h.key && <span className="ml-auto text-xs font-bold" style={{ color: 'var(--blue)' }}>✓</span>}
              </button>
            ))}
          </div>

          {tasks?.length > 0 && (
            <div className="rounded-2xl p-4 mb-6" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
              <p className="text-xs font-bold mb-2" style={{ color: 'var(--muted)' }}>📋 TAREFAS QUE SERÃO ANALISADAS</p>
              {tasks.filter(t=>!t.completed).slice(0,5).map((t,i) => (
                <div key={i} className="flex items-center gap-2 py-1.5"
                  style={{ borderBottom: i < Math.min(tasks.filter(t=>!t.completed).length,5)-1 ? '1px solid var(--border)' : 'none' }}>
                  <CheckSquare size={12} style={{ color: 'var(--blue)', flexShrink: 0 }} />
                  <span className="text-xs" style={{ color: 'var(--text)', fontFamily: 'Inter' }}>{t.title}</span>
                  {t.due && <span className="text-xs ml-auto flex-shrink-0" style={{ color: 'var(--dim)' }}>{t.due.split('T')[0].split('-').reverse().join('/')}</span>}
                </div>
              ))}
              {tasks.filter(t=>!t.completed).length > 5 && (
                <p className="text-xs mt-2" style={{ color: 'var(--dim)' }}>+{tasks.filter(t=>!t.completed).length - 5} mais</p>
              )}
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
            <Clock size={18} /> Montar Time Block com IA
          </button>
          <p className="text-xs text-center mt-2" style={{ color: 'var(--dim)' }}>
            Analisa tarefas + agenda e sugere os melhores horários
          </p>
        </div>
      )}

      {step === 'loading' && <LoadingScreen />}

      {step === 'result' && result && (
        <ResultView result={result} horizon={horizon}
          onSchedule={(block) => handleSchedule(block, result.blocks.indexOf(block))}
          scheduling={scheduling} />
      )}
    </div>
  );
}
