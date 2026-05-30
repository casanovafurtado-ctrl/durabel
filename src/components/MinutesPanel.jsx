'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, FileText, Trash2, Download, Clock, Square } from 'lucide-react';

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function MinuteCard({ minute, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-2xl mb-3 overflow-hidden"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <button className="w-full px-4 py-3 flex items-center gap-3 text-left"
        onClick={() => setExpanded(e => !e)}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(0,119,255,0.1)', border: '1px solid rgba(0,119,255,0.2)' }}>
          <FileText size={16} style={{ color: 'var(--blue)' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)', fontFamily: 'Syne, sans-serif' }}>
            {minute.title}
          </p>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>{minute.date}</p>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onDelete(minute.id); }}
          style={{ color: 'var(--dim)' }}>
          <Trash2 size={15} />
        </button>
      </button>
      {expanded && (
        <div className="px-4 pb-4 animate-fade-in" style={{ borderTop: '1px solid var(--border)' }}>
          <pre className="text-xs mt-3 whitespace-pre-wrap leading-relaxed"
            style={{ color: 'var(--text)', fontFamily: 'Inter, sans-serif' }}>
            {minute.content}
          </pre>
        </div>
      )}
    </div>
  );
}

export default function MinutesPanel() {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [title, setTitle] = useState('');
  const [minutes, setMinutes] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [step, setStep] = useState('idle'); // idle | recording | review | done

  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const fullTranscriptRef = useRef('');

  useEffect(() => {
    async function load() {
      try {
        const r = await window.storage?.get('meeting_minutes');
        if (r) setMinutes(JSON.parse(r.value));
      } catch {}
    }
    load();
  }, []);

  const saveMinutes = async (updated) => {
    setMinutes(updated);
    try { await window.storage?.set('meeting_minutes', JSON.stringify(updated)); } catch {}
  };

  const startRecording = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Seu navegador não suporta gravação de voz. Use o Chrome.');
      return;
    }

    fullTranscriptRef.current = '';
    setTranscript('');
    setSeconds(0);
    setRecording(true);
    setStep('recording');

    const SR = window.webkitSpeechRecognition;
    const recognition = new SR();
    recognition.lang = 'pt-BR';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (e) => {
      let interim = '';
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          final += e.results[i][0].transcript + ' ';
        } else {
          interim += e.results[i][0].transcript;
        }
      }
      if (final) fullTranscriptRef.current += final;
      setTranscript(fullTranscriptRef.current + interim);
    };

    recognition.onerror = () => stopRecording();
    recognitionRef.current = recognition;
    recognition.start();

    timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    clearInterval(timerRef.current);
    setRecording(false);
    setStep('review');
  };

  const generateMinute = async () => {
    if (!transcript.trim()) return;
    setGenerating(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Gere uma ata de reunião profissional e estruturada em português com base na transcrição abaixo. 
Inclua: Título, Data (${new Date().toLocaleDateString('pt-BR')}), Participantes (se mencionados), Pauta, Pontos Discutidos, Decisões Tomadas e Próximas Ações com responsáveis e prazos quando mencionados.
Use formatação clara com seções bem definidas.

TRANSCRIÇÃO:
${transcript}`,
          }],
        }),
      });

      const data = await res.json();
      const content = data.content || 'Não foi possível gerar a ata.';

      const newMinute = {
        id: Date.now().toString(),
        title: title || `Reunião ${new Date().toLocaleDateString('pt-BR')}`,
        date: new Date().toLocaleString('pt-BR'),
        content,
      };

      await saveMinutes([newMinute, ...minutes]);
      setStep('done');
      setTranscript('');
      setTitle('');
      fullTranscriptRef.current = '';
    } catch {
      alert('Erro ao gerar ata. Tente novamente.');
    }
    setGenerating(false);
  };

  const reset = () => {
    setStep('idle');
    setTranscript('');
    setTitle('');
    setSeconds(0);
    fullTranscriptRef.current = '';
  };

  const deleteMinute = async (id) => {
    await saveMinutes(minutes.filter(m => m.id !== id));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <h2 className="font-bold text-base" style={{ fontFamily: 'Syne, sans-serif' }}>Minutas de Reunião</h2>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>Grave, transcreva e gere atas com IA</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6">

        {/* IDLE */}
        {step === 'idle' && (
          <div className="text-center py-8">
            <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center transition-all"
              style={{ background: 'rgba(0,119,255,0.1)', border: '2px solid rgba(0,119,255,0.3)' }}>
              <Mic size={32} style={{ color: 'var(--blue)' }} />
            </div>
            <p className="font-semibold mb-1" style={{ color: 'var(--text)', fontFamily: 'Syne, sans-serif' }}>
              Gravar Reunião
            </p>
            <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
              Aperte o botão e comece a falar. A DURABEL transcreve e gera a ata automaticamente.
            </p>
            <input value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Título da reunião (opcional)"
              className="w-full rounded-xl px-4 py-3 text-sm mb-4"
              style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Inter, sans-serif' }} />
            <button onClick={startRecording}
              className="btn-glow px-8 py-4 rounded-2xl text-white font-semibold flex items-center gap-2 mx-auto"
              style={{ fontFamily: 'Inter, sans-serif' }}>
              <Mic size={18} /> Iniciar Gravação
            </button>
          </div>
        )}

        {/* RECORDING */}
        {step === 'recording' && (
          <div className="text-center py-6">
            <div className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '2px solid #EF4444',
                boxShadow: '0 0 30px rgba(239,68,68,0.3)',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}>
              <Mic size={36} style={{ color: '#EF4444' }} />
            </div>

            <div className="text-3xl font-bold mb-1" style={{ color: '#EF4444', fontFamily: 'Syne, sans-serif' }}>
              {formatTime(seconds)}
            </div>
            <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>🔴 Gravando...</p>

            {transcript && (
              <div className="rounded-xl p-3 mb-4 text-left"
                style={{ background: 'var(--card)', border: '1px solid var(--border)', maxHeight: '150px', overflow: 'auto' }}>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)', fontFamily: 'Inter, sans-serif' }}>
                  {transcript}
                </p>
              </div>
            )}

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
            <div className="rounded-xl p-3 mb-4"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <p className="text-xs font-bold mb-2 tracking-widest" style={{ color: 'var(--muted)' }}>
                TRANSCRIÇÃO · {formatTime(seconds)}
              </p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text)', fontFamily: 'Inter, sans-serif' }}>
                {transcript || 'Nenhum áudio detectado.'}
              </p>
            </div>

            <div className="flex gap-2">
              <button onClick={reset}
                className="flex-1 py-3 rounded-xl text-sm font-semibold"
                style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--muted)', fontFamily: 'Inter, sans-serif' }}>
                Descartar
              </button>
              <button onClick={generateMinute} disabled={generating || !transcript.trim()}
                className="flex-1 btn-glow py-3 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2"
                style={{ fontFamily: 'Inter, sans-serif', opacity: generating || !transcript.trim() ? 0.6 : 1 }}>
                {generating ? (
                  <><span className="animate-spin">⟳</span> Gerando ata...</>
                ) : (
                  <><FileText size={15} /> Gerar Ata</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* DONE */}
        {step === 'done' && (
          <div className="text-center py-6 animate-fade-in">
            <div className="text-5xl mb-3">✅</div>
            <p className="font-semibold mb-1" style={{ color: 'var(--text)', fontFamily: 'Syne, sans-serif' }}>
              Ata gerada com sucesso!
            </p>
            <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
              Disponível abaixo nas minutas salvas.
            </p>
            <button onClick={reset}
              className="btn-glow px-6 py-3 rounded-xl text-white text-sm font-semibold"
              style={{ fontFamily: 'Inter, sans-serif' }}>
              Nova Gravação
            </button>
          </div>
        )}

        {/* Saved minutes */}
        {minutes.length > 0 && (
          <div className={step !== 'idle' ? 'mt-6' : ''}>
            <p className="text-xs font-bold tracking-widest mb-3" style={{ color: 'var(--muted)', letterSpacing: '0.1em' }}>
              ATAS SALVAS · {minutes.length}
            </p>
            {minutes.map(m => <MinuteCard key={m.id} minute={m} onDelete={deleteMinute} />)}
          </div>
        )}
      </div>
    </div>
  );
}
