'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, Square, FileText, Trash2, Download, ChevronDown, ChevronUp, Loader } from 'lucide-react';
import { exportMinutePDF } from '@/lib/pdfExport';

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
}

function MinuteCard({ minute, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-2xl mb-3 overflow-hidden"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <button className="w-full flex items-center justify-between px-4 py-3 text-left"
        onClick={() => setExpanded(e => !e)}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(0,119,255,0.1)', border: '1px solid rgba(0,119,255,0.2)' }}>
            <FileText size={16} style={{ color: 'var(--blue)' }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text)', fontFamily: 'Syne, sans-serif' }}>
              {minute.title}
            </p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>{minute.date}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={e => { e.stopPropagation(); exportMinutePDF(minute); }}
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(0,119,255,0.1)', border: '1px solid rgba(0,119,255,0.2)', color: 'var(--blue)' }}>
            <Download size={14} />
          </button>
          <button onClick={e => { e.stopPropagation(); onDelete(minute.id); }}
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--dim)' }}>
            <Trash2 size={14} />
          </button>
          {expanded ? <ChevronUp size={16} style={{ color: 'var(--dim)' }} /> : <ChevronDown size={16} style={{ color: 'var(--dim)' }} />}
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-4" style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
          <pre className="text-xs leading-relaxed whitespace-pre-wrap"
            style={{ color: 'var(--text)', fontFamily: 'Inter, sans-serif' }}>
            {minute.content}
          </pre>
        </div>
      )}
    </div>
  );
}

export default function MinutesPanel() {
  const [step, setStep] = useState('idle'); // idle | recording | processing | review | done
  const [seconds, setSeconds] = useState(0);
  const [title, setTitle] = useState('');
  const [audioBlob, setAudioBlob] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [minutes, setMinutes] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);

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

  const startRecording = async () => {
    setError('');
    try {
      // Pede permissão de microfone
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      });
      streamRef.current = stream;
      chunksRef.current = [];

      // Escolhe o melhor formato disponível
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        streamRef.current?.getTracks().forEach(t => t.stop());
      };

      // Coleta chunks a cada 1s para não perder dados
      recorder.start(1000);
      setStep('recording');
      setSeconds(0);

      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);

    } catch (err) {
      setError('Não foi possível acessar o microfone. Verifique as permissões.');
    }
  };

  const stopRecording = () => {
    clearInterval(timerRef.current);
    mediaRecorderRef.current?.stop();
    setStep('processing');

    // Aguarda o blob ficar pronto
    setTimeout(() => setStep('review'), 1500);
  };

  const transcribeAudio = async () => {
    if (!audioBlob) return;
    setGenerating(true);

    try {
      // Converte blob para base64
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(audioBlob);
      });

      // Envia para API de transcrição + geração de ata
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audio: base64,
          mimeType: audioBlob.type,
          title: title || `Reunião ${new Date().toLocaleDateString('pt-BR')}`,
          duration: seconds,
        }),
      });

      const data = await res.json();

      if (data.content) {
        setTranscript(data.content);
        setStep('review');
      } else {
        setError('Não foi possível transcrever. Tente novamente.');
        setStep('review');
      }
    } catch (err) {
      setError('Erro na transcrição: ' + err.message);
    }
    setGenerating(false);
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
            content: `Gere uma ata de reunião profissional em português com base nesta transcrição.
Inclua: Título, Data (${new Date().toLocaleDateString('pt-BR')}), Participantes (se mencionados), Pauta, Pontos Discutidos, Decisões Tomadas e Próximas Ações com responsáveis e prazos.
Use formatação clara com seções bem definidas.

TRANSCRIÇÃO:
${transcript}`,
          }],
        }),
      });

      const data = await res.json();

      if (data.content) {
        const newMinute = {
          id: Date.now().toString(),
          title: title || `Reunião ${new Date().toLocaleDateString('pt-BR')}`,
          date: new Date().toLocaleString('pt-BR'),
          content: data.content,
        };
        await saveMinutes([newMinute, ...minutes]);
        setStep('done');
        setTranscript('');
        setTitle('');
        setAudioBlob(null);
      }
    } catch {
      setError('Erro ao gerar ata. Tente novamente.');
    }
    setGenerating(false);
  };

  const reset = () => {
    setStep('idle');
    setTranscript('');
    setTitle('');
    setAudioBlob(null);
    setSeconds(0);
    setError('');
    clearInterval(timerRef.current);
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach(t => t.stop());
  };

  const deleteMinute = async (id) => {
    await saveMinutes(minutes.filter(m => m.id !== id));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <h2 className="font-bold text-base" style={{ fontFamily: 'Syne, sans-serif' }}>Minutas de Reunião</h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
          Grave, transcreva e gere atas com IA
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6">

        {/* IDLE */}
        {step === 'idle' && (
          <div className="text-center py-6">
            <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ background: 'rgba(0,119,255,0.1)', border: '2px solid rgba(0,119,255,0.3)' }}>
              <Mic size={32} style={{ color: 'var(--blue)' }} />
            </div>
            <p className="font-semibold mb-1" style={{ color: 'var(--text)', fontFamily: 'Syne, sans-serif' }}>
              Gravar Reunião
            </p>
            <p className="text-sm mb-2" style={{ color: 'var(--muted)' }}>
              A gravação continua mesmo com a tela apagada.
            </p>
            <p className="text-xs mb-6 px-4" style={{ color: 'var(--dim)' }}>
              💡 Mantenha o app aberto no iPhone. A tela pode apagar normalmente — o áudio não para.
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
          <div className="text-center py-6">
            <div className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center"
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

            <p className="text-sm mb-2" style={{ color: 'var(--muted)' }}>🔴 Gravando...</p>

            <div className="rounded-xl px-4 py-3 mb-6 mx-4"
              style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <p className="text-xs" style={{ color: '#10B981' }}>
                ✅ Pode apagar a tela — a gravação continua em segundo plano
              </p>
            </div>

            <button onClick={stopRecording}
              className="px-8 py-4 rounded-2xl text-white font-semibold flex items-center gap-2 mx-auto"
              style={{ background: '#EF4444', fontFamily: 'Inter, sans-serif', boxShadow: '0 4px 15px rgba(239,68,68,0.4)' }}>
              <Square size={18} /> Parar Gravação
            </button>
          </div>
        )}

        {/* PROCESSING */}
        {step === 'processing' && (
          <div className="text-center py-12">
            <Loader size={36} style={{ color: 'var(--blue)', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
            <p style={{ color: 'var(--muted)', fontFamily: 'Inter, sans-serif' }}>Processando áudio...</p>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* REVIEW */}
        {step === 'review' && (
          <div className="animate-fade-in">

            {/* Áudio player */}
            <div className="rounded-xl p-4 mb-4"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold tracking-widest" style={{ color: 'var(--muted)' }}>
                  ÁUDIO GRAVADO
                </p>
                <span className="text-xs font-semibold" style={{ color: 'var(--blue)' }}>
                  {formatTime(seconds)}
                </span>
              </div>
              {audioBlob && (
                <audio controls className="w-full mt-2" style={{ height: '36px' }}>
                  <source src={URL.createObjectURL(audioBlob)} type={audioBlob.type} />
                </audio>
              )}
            </div>

            {/* Erro */}
            {error && (
              <div className="rounded-xl px-4 py-2 mb-4 text-xs"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.3)' }}>
                {error}
              </div>
            )}

            {/* ETAPA 1: Transcrever — só aparece se ainda não transcreveu */}
            {!transcript && (
              <div className="mb-4">
                <div className="rounded-xl px-4 py-3 mb-3"
                  style={{ background: 'rgba(0,119,255,0.06)', border: '1px solid rgba(0,119,255,0.2)' }}>
                  <p className="text-xs" style={{ color: 'var(--blue)' }}>
                    📌 Passo 1 — Transcreva o áudio para continuar
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={reset} disabled={generating}
                    className="py-3 px-4 rounded-xl text-sm font-semibold"
                    style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--muted)', fontFamily: 'Inter, sans-serif' }}>
                    Descartar
                  </button>
                  <button
                    onClick={transcribeAudio}
                    disabled={generating || !audioBlob}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                    style={{
                      background: generating ? 'rgba(0,119,255,0.08)' : 'rgba(0,119,255,0.15)',
                      border: '1px solid rgba(0,119,255,0.3)',
                      color: 'var(--blue)',
                      fontFamily: 'Inter, sans-serif',
                      cursor: generating ? 'not-allowed' : 'pointer',
                    }}>
                    {generating
                      ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Transcrevendo...</>
                      : <><span>🎙</span> Transcrever Áudio</>
                    }
                  </button>
                </div>
              </div>
            )}

            {/* ETAPA 2: Transcrição feita — mostra texto e botão de gerar ata */}
            {transcript && (
              <>
                <div className="rounded-xl p-4 mb-4"
                  style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                  <p className="text-xs font-bold tracking-widest mb-2" style={{ color: 'var(--muted)' }}>
                    TRANSCRIÇÃO
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text)', fontFamily: 'Inter, sans-serif' }}>
                    {transcript}
                  </p>
                </div>

                <div className="rounded-xl px-4 py-3 mb-3"
                  style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <p className="text-xs" style={{ color: '#10B981' }}>
                    ✅ Passo 2 — Revise a transcrição e gere a ata
                  </p>
                </div>

                <div className="flex gap-2">
                  <button onClick={reset} disabled={generating}
                    className="py-3 px-4 rounded-xl text-sm font-semibold"
                    style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--muted)', fontFamily: 'Inter, sans-serif' }}>
                    Descartar
                  </button>
                  <button
                    onClick={generateMinute}
                    disabled={generating}
                    className="flex-1 btn-glow py-3 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2"
                    style={{ fontFamily: 'Inter, sans-serif', cursor: generating ? 'not-allowed' : 'pointer' }}>
                    {generating
                      ? <><Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> Gerando ata...</>
                      : <><FileText size={15} /> Gerar Ata com IA</>
                    }
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* DONE */}
        {step === 'done' && (
          <div className="text-center py-8 animate-fade-in">
            <div className="text-5xl mb-3">✅</div>
            <p className="font-semibold mb-1" style={{ color: 'var(--text)', fontFamily: 'Syne, sans-serif' }}>
              Ata gerada!
            </p>
            <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
              Disponível abaixo com opção de exportar PDF.
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
