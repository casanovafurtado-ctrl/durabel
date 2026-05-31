'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, Square, FileText, Trash2, Download, ChevronDown, ChevronUp, Loader, ArrowLeft } from 'lucide-react';
import { exportMinutePDF } from '@/lib/pdfExport';

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
}

const ATA_TYPES = [
  { id: 'detailed', icon: '📋', label: 'Ata Completa', desc: 'Com todos os detalhes, decisões e ações' },
  { id: 'summary', icon: '⚡', label: 'Resumo Executivo', desc: 'Pontos principais e decisões em formato conciso' },
  { id: 'topics', icon: '📌', label: 'Tópicos Abordados', desc: 'Lista estruturada por assunto' },
  { id: 'actions', icon: '✅', label: 'Plano de Ação', desc: 'Focado nas próximas ações e responsáveis' },
  { id: 'mindmap', icon: '🧠', label: 'Mapa Mental', desc: 'Estrutura visual dos temas em texto' },
];

const ATA_PROMPTS = {
  detailed: (transcript, date) => `Gere uma ata de reunião profissional e completa em português com base na transcrição abaixo.
Data: ${date}
Inclua obrigatoriamente: Título, Data, Participantes (se mencionados), Pauta, Pontos Discutidos em detalhes, Decisões Tomadas, Próximas Ações com responsáveis e prazos quando mencionados.
Use seções bem definidas. Sem asteriscos ou markdown, apenas texto limpo com quebras de linha.

TRANSCRIÇÃO: ${transcript}`,

  summary: (transcript, date) => `Com base na transcrição abaixo, gere um RESUMO EXECUTIVO conciso da reunião em português.
Data: ${date}
Formato: 3 a 5 bullet points dos pontos mais importantes, decisões tomadas e próximas ações.
Seja direto e objetivo. Sem asteriscos ou markdown.

TRANSCRIÇÃO: ${transcript}`,

  topics: (transcript, date) => `Com base na transcrição abaixo, liste de forma estruturada todos os TÓPICOS ABORDADOS na reunião em português.
Data: ${date}
Para cada tópico, inclua um breve resumo do que foi discutido.
Organize por ordem de importância. Sem asteriscos ou markdown.

TRANSCRIÇÃO: ${transcript}`,

  actions: (transcript, date) => `Com base na transcrição abaixo, gere um PLANO DE AÇÃO da reunião em português.
Data: ${date}
Liste apenas: O que fazer, Quem é responsável, Prazo (se mencionado).
Formato limpo e direto. Sem asteriscos ou markdown.

TRANSCRIÇÃO: ${transcript}`,

  mindmap: (transcript, date) => `Com base na transcrição abaixo, crie um MAPA MENTAL textual da reunião em português.
Data: ${date}
Use estrutura hierárquica com indentação para mostrar relações entre temas.
Exemplo:
TEMA CENTRAL
  Subtema 1
    Detalhe A
    Detalhe B
  Subtema 2
    Detalhe C

Sem asteriscos ou markdown extra além da indentação.

TRANSCRIÇÃO: ${transcript}`,
};

function MinuteCard({ minute, onDelete, onView }) {
  return (
    <div className="rounded-2xl mb-3 overflow-hidden"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <div className="px-4 py-3 flex items-center justify-between gap-2">
        <button className="flex items-center gap-3 flex-1 text-left" onClick={() => onView(minute)}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(0,119,255,0.1)', border: '1px solid rgba(0,119,255,0.2)' }}>
            <FileText size={16} style={{ color: 'var(--blue)' }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text)', fontFamily: 'Syne, sans-serif' }}>
              {minute.title}
            </p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>{minute.date} · {minute.type || 'Completa'}</p>
          </div>
        </button>
        <div className="flex gap-1.5 flex-shrink-0">
          <button onClick={() => exportMinutePDF(minute)}
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(0,119,255,0.1)', border: '1px solid rgba(0,119,255,0.2)', color: 'var(--blue)' }}>
            <Download size={14} />
          </button>
          <button onClick={() => onDelete(minute.id)}
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444' }}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function MinuteView({ minute, onBack }) {
  return (
    <div className="flex flex-col h-full">

      {/* Header fixo com botão bem visível */}
      <div className="px-4 py-3 flex items-center gap-3 flex-shrink-0"
        style={{ background: 'var(--card)', borderBottom: '2px solid var(--blue)', zIndex: 10 }}>
        <button onClick={onBack}
          className="flex items-center gap-2 px-3 py-2 rounded-xl font-semibold text-sm"
          style={{ background: 'var(--blue)', color: 'white', fontFamily: 'Inter, sans-serif', flexShrink: 0 }}>
          <ArrowLeft size={16} /> Voltar
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate" style={{ color: 'var(--text)', fontFamily: 'Syne, sans-serif' }}>
            {minute.title}
          </p>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>{minute.type} · {minute.date}</p>
        </div>
        <button onClick={() => exportMinutePDF(minute)}
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(0,119,255,0.1)', border: '1px solid rgba(0,119,255,0.2)', color: 'var(--blue)' }}>
          <Download size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <pre className="text-sm leading-relaxed whitespace-pre-wrap"
          style={{ color: 'var(--text)', fontFamily: 'Inter, sans-serif' }}>
          {minute.content}
        </pre>
      </div>
    </div>
  );
}

export default function MinutesPanel() {
  const [step, setStep] = useState('idle');
  const [seconds, setSeconds] = useState(0);
  const [title, setTitle] = useState('');
  const [audioBlob, setAudioBlob] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [minutes, setMinutes] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [manualMode, setManualMode] = useState(false);
  const [manualText, setManualText] = useState('');
  const [selectedType, setSelectedType] = useState('detailed');
  const [viewingMinute, setViewingMinute] = useState(null);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);
  const wakeLockRef = useRef(null);
  const liveRecognitionRef = useRef(null);
  const liveTranscriptRef = useRef('');

  useEffect(() => {
    async function load() {
      try {
        const saved = localStorage.getItem('durabel_minutes');
        if (saved) setMinutes(JSON.parse(saved));
      } catch {}
    }
    load();
  }, []);

  const saveMinutes = async (updated) => {
    setMinutes(updated);
    try { localStorage.setItem('durabel_minutes', JSON.stringify(updated)); } catch {}
  };

  const startLiveRecognition = () => {
    const SR = window.webkitSpeechRecognition || window.SpeechRecognition;
    if (!SR) return;

    let chunkCount = 0;

    const startChunk = () => {
      if (mediaRecorderRef.current?.state !== 'recording') return;

      chunkCount++;
      const rec = new SR();
      rec.lang = 'pt-BR';
      rec.continuous = false;
      rec.interimResults = true;
      rec.maxAlternatives = 1;

      let chunkFinal = '';

      rec.onstart = () => {
        setLiveTranscript(liveTranscriptRef.current + ' 🎙');
      };

      rec.onresult = (e) => {
        let final = '';
        let interim = '';
        for (let i = 0; i < e.results.length; i++) {
          if (e.results[i].isFinal) final += e.results[i][0].transcript + ' ';
          else interim += e.results[i][0].transcript;
        }
        if (final) chunkFinal = final;
        setLiveTranscript(liveTranscriptRef.current + chunkFinal + interim + ' 🎙');
      };

      rec.onend = () => {
        // Salva o que foi capturado neste chunk
        if (chunkFinal.trim()) {
          liveTranscriptRef.current += chunkFinal;
        }
        setLiveTranscript(liveTranscriptRef.current);
        // Reinicia imediatamente
        if (mediaRecorderRef.current?.state === 'recording') {
          setTimeout(startChunk, 100);
        }
      };

      rec.onerror = (e) => {
        if (e.error === 'not-allowed') return;
        if (mediaRecorderRef.current?.state === 'recording') {
          setTimeout(startChunk, 300);
        }
      };

      liveRecognitionRef.current = rec;
      try { rec.start(); } catch { setTimeout(startChunk, 300); }
    };

    startChunk();
  };

  const startRecording = async () => {
    setError('');
    setLiveTranscript('');
    liveTranscriptRef.current = '';

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        streamRef.current?.getTracks().forEach(t => t.stop());
      };

      recorder.start(1000);
      setStep('recording');
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);

      // Wake lock
      try {
        if ('wakeLock' in navigator) wakeLockRef.current = await navigator.wakeLock.request('screen');
      } catch {}

      // Transcrição em tempo real
      startLiveRecognition();

    } catch {
      setError('Não foi possível acessar o microfone.');
    }
  };

  const stopRecording = () => {
    clearInterval(timerRef.current);
    liveRecognitionRef.current?.stop();
    mediaRecorderRef.current?.stop();

    // Salva o que foi transcrito
    const live = liveTranscriptRef.current.trim();
    if (live) setTranscript(live);

    try { wakeLockRef.current?.release(); wakeLockRef.current = null; } catch {}
    setStep('review');
  };

  const reset = () => {
    clearInterval(timerRef.current);
    liveRecognitionRef.current?.stop();
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach(t => t.stop());
    try { wakeLockRef.current?.release(); wakeLockRef.current = null; } catch {}
    setStep('idle');
    setTranscript('');
    setLiveTranscript('');
    liveTranscriptRef.current = '';
    setAudioBlob(null);
    setSeconds(0);
    setError('');
    setManualMode(false);
    setManualText('');
    setSelectedType('detailed');
  };

  const generateMinute = async () => {
    const textToUse = transcript.trim() || manualText.trim();
    if (!textToUse) {
      setError('Adicione o conteúdo da reunião antes de gerar a ata.');
      return;
    }

    setGenerating(true);
    setError('');

    try {
      const localSettings = JSON.parse(localStorage.getItem('durabel_settings') || '{}');
      const anthropicKey = localSettings.anthropic_key || '';
      const date = new Date().toLocaleDateString('pt-BR');
      const prompt = ATA_PROMPTS[selectedType](textToUse, date);
      const typeLabel = ATA_TYPES.find(t => t.id === selectedType)?.label || 'Completa';

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anthropicKey, messages: [{ role: 'user', content: prompt }] }),
      });

      const data = await res.json();

      if (data.content) {
        const newMinute = {
          id: Date.now().toString(),
          title: title || `Reunião ${date}`,
          date: new Date().toLocaleString('pt-BR'),
          type: typeLabel,
          content: data.content,
        };
        await saveMinutes([newMinute, ...minutes]);
        setViewingMinute(newMinute);
        reset();
      } else {
        setError('Erro ao gerar ata. Verifique sua chave API.');
      }
    } catch {
      setError('Erro de conexão. Tente novamente.');
    }
    setGenerating(false);
  };

  const deleteMinute = async (id) => {
    await saveMinutes(minutes.filter(m => m.id !== id));
    if (viewingMinute?.id === id) setViewingMinute(null);
  };

  // View de ata
  if (viewingMinute) {
    return <MinuteView minute={viewingMinute} onBack={() => setViewingMinute(null)} />;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <h2 className="font-bold text-base" style={{ fontFamily: 'Syne, sans-serif' }}>Minutas de Reunião</h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Grave, transcreva e gere atas com IA</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6">

        {/* IDLE */}
        {step === 'idle' && (
          <div className="text-center py-4">
            <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ background: 'rgba(0,119,255,0.1)', border: '2px solid rgba(0,119,255,0.3)' }}>
              <Mic size={32} style={{ color: 'var(--blue)' }} />
            </div>
            <p className="font-semibold mb-1" style={{ color: 'var(--text)', fontFamily: 'Syne, sans-serif' }}>
              Gravar Reunião
            </p>
            <p className="text-xs mb-4 px-4" style={{ color: 'var(--muted)' }}>
              A transcrição ocorre em tempo real enquanto você fala
            </p>
            <input value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Título da reunião (opcional)"
              className="w-full rounded-xl px-4 py-3 text-sm mb-4"
              style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Inter, sans-serif' }} />
            {error && (
              <div className="rounded-xl px-4 py-2 mb-4 text-xs"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.3)' }}>
                {error}
              </div>
            )}
            <button onClick={startRecording}
              className="btn-glow px-8 py-4 rounded-2xl text-white font-semibold flex items-center gap-2 mx-auto"
              style={{ fontFamily: 'Inter, sans-serif' }}>
              <Mic size={18} /> Iniciar Gravação
            </button>
          </div>
        )}

        {/* RECORDING */}
        {step === 'recording' && (
          <div className="text-center py-4">
            <div className="w-24 h-24 rounded-full mx-auto mb-3 flex items-center justify-center"
              style={{
                background: 'rgba(239,68,68,0.1)', border: '2px solid #EF4444',
                boxShadow: '0 0 30px rgba(239,68,68,0.25)',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}>
              <Mic size={36} style={{ color: '#EF4444' }} />
            </div>
            <div className="text-4xl font-bold mb-1" style={{ color: '#EF4444', fontFamily: 'Syne, sans-serif' }}>
              {formatTime(seconds)}
            </div>
            <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>🔴 Gravando · tela mantida acesa</p>

            {/* Live transcript */}
            <div className="rounded-xl p-3 mb-4 text-left min-h-16 max-h-40 overflow-auto"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              {liveTranscript ? (
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text)', fontFamily: 'Inter, sans-serif' }}>
                  {liveTranscript}
                </p>
              ) : (
                <p className="text-xs" style={{ color: 'var(--dim)', fontFamily: 'Inter, sans-serif' }}>
                  🎙 Fale normalmente — o texto aparecerá aqui...
                </p>
              )}
            </div>

            <button onClick={stopRecording}
              className="px-8 py-4 rounded-2xl text-white font-semibold flex items-center gap-2 mx-auto"
              style={{ background: '#EF4444', fontFamily: 'Inter, sans-serif', boxShadow: '0 4px 15px rgba(239,68,68,0.4)' }}>
              <Square size={18} /> Parar Gravação
            </button>
          </div>
        )}

        {/* REVIEW */}
        {step === 'review' && (
          <div className="animate-fade-in">

            {/* Transcrição */}
            <div className="rounded-xl p-4 mb-4"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold tracking-widest" style={{ color: 'var(--muted)' }}>
                  TRANSCRIÇÃO · {formatTime(seconds)}
                </p>
                <button onClick={() => setManualMode(!manualMode)}
                  className="text-xs px-2 py-1 rounded-lg"
                  style={{ background: 'var(--bg)', color: 'var(--muted)', border: '1px solid var(--border)' }}>
                  {manualMode ? 'Ver transcrição' : 'Editar'}
                </button>
              </div>

              {manualMode ? (
                <textarea
                  value={manualText || transcript}
                  onChange={e => setManualText(e.target.value)}
                  placeholder="Edite ou complete a transcrição..."
                  rows={5}
                  className="w-full rounded-xl px-3 py-2 text-sm resize-none"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Inter, sans-serif' }}
                />
              ) : (
                <p className="text-sm leading-relaxed" style={{ color: transcript ? 'var(--text)' : 'var(--dim)', fontFamily: 'Inter, sans-serif' }}>
                  {transcript || 'Nenhuma fala detectada. Clique em "Editar" para digitar manualmente.'}
                </p>
              )}
            </div>

            {/* Tipo de ata */}
            <div className="mb-4">
              <p className="text-xs font-bold tracking-widest mb-3" style={{ color: 'var(--muted)' }}>
                TIPO DE DOCUMENTO
              </p>
              <div className="flex flex-col gap-2">
                {ATA_TYPES.map(type => (
                  <button key={type.id} onClick={() => setSelectedType(type.id)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
                    style={{
                      background: selectedType === type.id ? 'rgba(0,119,255,0.1)' : 'var(--card)',
                      border: `1px solid ${selectedType === type.id ? 'rgba(0,119,255,0.4)' : 'var(--border)'}`,
                    }}>
                    <span style={{ fontSize: '20px' }}>{type.icon}</span>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text)', fontFamily: 'Inter, sans-serif' }}>
                        {type.label}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--muted)' }}>{type.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="rounded-xl px-4 py-2 mb-3 text-xs"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.3)' }}>
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={reset} disabled={generating}
                className="py-3 px-4 rounded-xl text-sm font-semibold"
                style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--muted)', fontFamily: 'Inter, sans-serif' }}>
                Descartar
              </button>
              <button onClick={generateMinute} disabled={generating}
                className="flex-1 btn-glow py-3 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2"
                style={{ fontFamily: 'Inter, sans-serif', opacity: generating ? 0.7 : 1 }}>
                {generating
                  ? <><Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> Gerando...</>
                  : <><FileText size={15} /> Gerar {ATA_TYPES.find(t => t.id === selectedType)?.label}</>
                }
              </button>
            </div>
          </div>
        )}

        {/* Atas salvas */}
        {minutes.length > 0 && step === 'idle' && (
          <div className="mt-4">
            <p className="text-xs font-bold tracking-widest mb-3" style={{ color: 'var(--muted)', letterSpacing: '0.1em' }}>
              ATAS SALVAS · {minutes.length}
            </p>
            {minutes.map(m => (
              <MinuteCard key={m.id} minute={m}
                onDelete={deleteMinute}
                onView={setViewingMinute} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
