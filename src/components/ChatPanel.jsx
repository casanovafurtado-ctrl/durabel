'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Mic, MicOff, Sparkles, Volume2, VolumeX, Calendar, X } from 'lucide-react';
import BriefingModal, { fmtEventTime, timeUntil } from './BriefingModal';

// Remove markdown symbols from AI responses
function fixDurabelName(text) {
  // Corrige variações incorretas do nome DURABEL geradas pelo speech-to-text
  return text
    .replace(/Du\s*wrabel/gi, 'DURABEL')
    .replace(/Du\s*abel/gi, 'DURABEL')
    .replace(/Du\s*bel/gi, 'DURABEL')
    .replace(/duravel/gi, 'DURABEL')
    .replace(/durable/gi, 'DURABEL')
    .replace(/du rabel/gi, 'DURABEL')
    .replace(/duráble/gi, 'DURABEL')
    .replace(/Abel/g, 'DURABEL')
    .replace(/Dura bel/gi, 'DURABEL')
    .replace(/Durabél/gi, 'DURABEL');
}

function cleanMarkdown(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')      // **negrito** → negrito
    .replace(/\*(.+?)\*/g, '$1')            // *itálico* → itálico
    .replace(/#{1,6}\s/g, '')               // # Título → Título
    .replace(/`{3}[\s\S]*?`{3}/g, '')      // ```código``` → remove
    .replace(/`(.+?)`/g, '$1')              // `código` → código
    .replace(/^[-•]\s/gm, '• ')            // - item → • item
    .replace(/^\d+\.\s/gm, (m) => m)     // 1. item → mantém
    .trim();
}

const QUICK_ACTIONS = [
  '📅 O que tenho hoje?',
  '✅ Minhas tarefas pendentes',
  '📝 Nova proposta técnica',
  '📧 Redigir e-mail profissional',
  '📋 Agendar reunião',
  '📊 Resumo da semana',
];

function Message({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end mb-4 animate-slide-up`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
          style={{
            background: 'linear-gradient(135deg, #0055CC, #00BBFF)',
            color: 'white', fontFamily: 'Syne, sans-serif',
          }}>D</div>
      )}
      <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
        isUser
          ? 'rounded-br-sm'
          : 'rounded-bl-sm'
      }`} style={{
        background: isUser
          ? 'linear-gradient(135deg, #0055CC22, #00BBFF18)'
          : 'var(--card)',
        border: `1px solid ${isUser ? '#0077FF44' : 'var(--border)'}`,
        color: 'var(--text)',
      }}>
        {msg.content}
      </div>
    </div>
  );
}

export default function ChatPanel() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Olá, Felipe! 👋 Sou a DURABEL, sua secretária executiva. Já estou conectada ao seu Google Calendar e Tarefas.\n\nComo posso ajudá-lo agora?',
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [upcomingEvent, setUpcomingEvent] = useState(null);
  const [dismissedBanner, setDismissedBanner] = useState(false);
  const [showBriefingModal, setShowBriefingModal] = useState(false);
  const [crmClients, setCrmClients] = useState([]);
  const [savedMinutes, setSavedMinutes] = useState([]);
  const [voiceError, setVoiceError] = useState('');
  const audioRef = useRef(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const listeningRef = useRef(false); // Ref para acessar listening dentro de useCallback

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Mantém ref sincronizado com state — garante valor atual dentro de useCallback
  useEffect(() => {
    listeningRef.current = listening;
  }, [listening]);

  // Carrega próximo evento de reunião e dados CRM para o banner
  useEffect(() => {
    const load = async () => {
      try {
        setCrmClients(JSON.parse(localStorage.getItem('durabel_clients')||'[]'));
        setSavedMinutes(JSON.parse(localStorage.getItem('durabel_minutes')||'[]'));
        const res = await fetch('/api/calendar');
        if (!res.ok) return;
        const data = await res.json();
        const now = new Date();
        const in24h = new Date(now.getTime() + 24 * 3600000);
        const keywords = ['reunião','reuniao','meeting','call','apresentação','assembleia','consulta','workshop','treinamento','perícia'];
        const next = (data.events || []).find(ev => {
          try {
            const dt = ev.start?.dateTime ? new Date(ev.start.dateTime) : new Date(ev.start?.date);
            const title = (ev.summary || '').toLowerCase();
            const isMeeting = keywords.some(k => title.includes(k)) || !!ev.location || (ev.attendees?.length||0) > 1;
            return dt >= now && dt <= in24h && isMeeting;
          } catch { return false; }
        });
        if (next) setUpcomingEvent(next);
      } catch {}
    };
    load();
  }, []);

  // Para o microfone — função dedicada, sempre funciona
  const stopMic = () => {
    try { recognitionRef.current?.abort(); } catch {}
    try { recognitionRef.current?.stop(); } catch {}
    recognitionRef.current = null;
    listeningRef.current = false;
    setListening(false);
  };

  // Inicia o microfone
  const startMic = () => {
    const SR = window.webkitSpeechRecognition || window.SpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let final = '';
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript + ' ';
      }
      if (final.trim()) setInput(prev => (prev ? prev.trim() + ' ' : '') + final.trim());
    };

    recognition.onerror = (e) => {
      if (e.error !== 'aborted') console.warn('Mic error:', e.error);
      stopMic();
    };

    recognition.onend = () => {
      // Só atualiza estado se ainda está "escutando" — evita conflito com stopMic
      if (listeningRef.current) stopMic();
    };

    recognitionRef.current = recognition;
    listeningRef.current = true;
    setListening(true);

    try { recognition.start(); }
    catch { stopMic(); }
  };

  const toggleListening = () => {
    if (listeningRef.current) {
      stopMic();
    } else {
      stopMic(); // Garante limpeza antes
      setTimeout(startMic, 200); // Delay para iOS liberar mic
    }
  };

  const sendMessage = useCallback(async (text) => {
    const content = text || input.trim();
    if (!content || loading) return;

    // Para o microfone — usa ref para garantir valor atual
    if (listeningRef.current) {
      stopMic();
    }

    setInput('');
    setLoading(true);

    const newMessages = [...messages, { role: 'user', content }];
    setMessages(newMessages);



    try {
      // Pega chave do localStorage para enviar ao servidor
      const localSettings = JSON.parse(localStorage.getItem('durabel_settings') || '{}');
      const anthropicKey = localSettings.anthropic_key || '';

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, anthropicKey }),
      });
      const data = await res.json();

      if (data.content) {
        setMessages(prev => [...prev, { role: 'assistant', content: cleanMarkdown(data.content) }]);
        // Reproduz voz se habilitado
        if (voiceEnabled) {
          try {
            setSpeaking(true);
            const voiceRes = await fetch('/api/voice', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: data.content.slice(0, 500) }),
            });
            if (voiceRes.ok) {
              // Para áudio anterior se estiver tocando
              if (audioRef.current) {
                try { audioRef.current.pause(); audioRef.current.src = ''; } catch {}
                audioRef.current = null;
              }

              const blob = await voiceRes.blob();
              const url = URL.createObjectURL(blob);

              // Cria elemento audio no DOM para melhor compatibilidade iOS
              const audio = new Audio();
              audio.preload = 'auto';
              audio.volume = 1.0;
              audioRef.current = audio;

              audio.onended = () => {
                setSpeaking(false);
                URL.revokeObjectURL(url);
                audioRef.current = null;
              };
              audio.onerror = (e) => {
                console.error('Audio error:', e);
                setSpeaking(false);
                URL.revokeObjectURL(url);
                audioRef.current = null;
              };

              audio.src = url;
              audio.load();

              // Aguarda carregamento antes de tocar
              audio.oncanplaythrough = async () => {
                try {
                  await audio.play();
                } catch (err) {
                  console.warn('Autoplay bloqueado:', err);
                  setSpeaking(false);
                  setVoiceError('🔇 Toque na tela e tente novamente para ativar o áudio.');
                  setTimeout(() => setVoiceError(''), 4000);
                }
              };
            } else {
              setSpeaking(false);
              // Créditos esgotados ou erro — desativa voz e avisa
              const errData = await voiceRes.json().catch(() => ({}));
              if (voiceRes.status === 401 || voiceRes.status === 429) {
                setVoiceEnabled(false);
                setVoiceError(voiceRes.status === 429
                  ? '🔇 Créditos ElevenLabs esgotados. Voz desativada.'
                  : '🔇 Chave ElevenLabs inválida. Verifique em Configurações.');
                setTimeout(() => setVoiceError(''), 5000);
              }
            }
          } catch { setSpeaking(false); }
        }
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Desculpe, tive um problema na conexão. Tente novamente.',
        }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Erro de conexão. Verifique sua internet e tente novamente.',
      }]);
    }
    setLoading(false);
  }, [input, messages, loading]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      stopMic();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Banner de próxima reunião */}
      {upcomingEvent && !dismissedBanner && (
        <div className="flex-shrink-0 mx-3 mt-3 rounded-2xl overflow-hidden"
          style={{ background: 'linear-gradient(135deg,rgba(0,85,204,0.12),rgba(0,187,255,0.06))', border: '1px solid rgba(0,119,255,0.25)' }}>
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(0,119,255,0.15)' }}>
              <Calendar size={15} style={{ color: 'var(--blue)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate" style={{ color: 'var(--text)', fontFamily: 'Syne' }}>
                {upcomingEvent.summary || 'Reunião'}
              </p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                {timeUntil(upcomingEvent) ? `${timeUntil(upcomingEvent)} · ` : ''}{fmtEventTime(upcomingEvent)}
              </p>
            </div>
            <button onClick={() => setShowBriefingModal(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 flex-shrink-0"
              style={{ background: 'var(--blue)', color: 'white', fontFamily: 'Inter' }}>
              <Sparkles size={11} /> Briefing
            </button>
            <button onClick={() => setDismissedBanner(true)} style={{ color: 'var(--dim)', flexShrink: 0 }}>
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-2">
        {messages.map((msg, i) => <Message key={i} msg={msg} />)}

        {loading && (
          <div className="flex gap-3 items-end mb-4">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #0055CC, #00BBFF)', color: 'white' }}>
              <Sparkles size={14} />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-bl-sm"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <div className="flex gap-1.5 items-center">
                {[0,1,2].map(i => (
                  <div key={i} className={`typing-dot w-2 h-2 rounded-full`}
                    style={{ background: 'var(--blue)' }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Voice error toast */}
      {voiceError && (
        <div className="mx-4 mb-2 px-4 py-2.5 rounded-xl text-xs font-medium animate-fade-in flex items-center gap-2"
          style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#FCA5A5' }}>
          {voiceError}
          <button onClick={() => setVoiceError('')} style={{ marginLeft: 'auto', color: '#F87171' }}>✕</button>
        </div>
      )}

      {/* Quick Actions */}
      {messages.length <= 2 && (
        <div className="px-4 pb-3">
          <div className="flex gap-2 flex-wrap">
            {QUICK_ACTIONS.map(action => (
              <button key={action}
                onClick={() => sendMessage(action)}
                className="text-xs px-3 py-1.5 rounded-full transition-all hover:scale-105"
                style={{
                  background: 'var(--card)', border: '1px solid var(--border)',
                  color: 'var(--muted)', fontFamily: 'Inter, sans-serif',
                }}>
                {action}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-6 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={listening ? '🎙 Ouvindo...' : 'Fale com a DURABEL...'}
              rows={1}
              className="w-full resize-none rounded-2xl px-4 py-3 text-sm transition-all"
              style={{
                background: 'var(--card)', border: '1px solid var(--border)',
                color: listening ? 'var(--neon)' : 'var(--text)',
                fontFamily: 'Inter, sans-serif', maxHeight: '120px', overflow: 'auto',
                lineHeight: '1.5',
              }}
              onInput={e => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
            />
          </div>

          {/* Voice toggle button */}
          <button onClick={() => {
            if (speaking && audioRef.current) { audioRef.current.pause(); setSpeaking(false); }
            setVoiceEnabled(v => !v);
          }}
            className="w-11 h-11 rounded-full flex items-center justify-center transition-all flex-shrink-0"
            style={{
              background: voiceEnabled ? 'rgba(124,58,237,0.15)' : 'var(--card)',
              border: `1px solid ${voiceEnabled ? '#7C3AED44' : 'var(--border)'}`,
              color: voiceEnabled ? (speaking ? '#A78BFA' : '#7C3AED') : 'var(--dim)',
              boxShadow: speaking ? '0 0 15px rgba(124,58,237,0.4)' : 'none',
            }}>
            {voiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>

          {/* Mic button */}
          <button onClick={toggleListening}
            className="w-11 h-11 rounded-full flex items-center justify-center transition-all flex-shrink-0"
            style={{
              background: listening ? 'rgba(0, 187, 255, 0.15)' : 'var(--card)',
              border: `1px solid ${listening ? 'var(--neon)' : 'var(--border)'}`,
              color: listening ? 'var(--neon)' : 'var(--muted)',
              boxShadow: listening ? '0 0 15px rgba(0, 187, 255, 0.3)' : 'none',
            }}>
            {listening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          {/* Send button */}
          <button
            onClick={() => { stopMic(); sendMessage(); }}
            disabled={!input.trim() || loading}
            className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
            style={{
              background: input.trim() && !loading
                ? 'linear-gradient(135deg, #0055CC, #0099FF)'
                : 'var(--card)',
              border: `1px solid ${input.trim() && !loading ? 'transparent' : 'var(--border)'}`,
              color: input.trim() && !loading ? 'white' : 'var(--dim)',
              boxShadow: input.trim() && !loading ? '0 4px 15px rgba(0, 119, 255, 0.4)' : 'none',
              cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
            }}>
            <Send size={16} />
          </button>
        </div>
      </div>

      {showBriefingModal && upcomingEvent && (
        <BriefingModal
          event={upcomingEvent}
          clients={crmClients}
          minutes={savedMinutes}
          tasks={[]}
          onClose={() => setShowBriefingModal(false)} />
      )}
    </div>
  );
}
