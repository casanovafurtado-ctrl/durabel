'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

function cleanMarkdown(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/#{1,6}\s/g, '')
    .replace(/`{3}[\s\S]*?`{3}/g, '')
    .replace(/`(.+?)`/g, '$1')
    .replace(/^[-•]\s/gm, '• ')
    .trim();
}

function fixDurabelName(text) {
  const replaceAll = (str, search, replace) => {
    let result = '';
    let last = 0;
    const lower = str.toLowerCase();
    const searchLower = search.toLowerCase();
    let idx = lower.indexOf(searchLower);
    while (idx !== -1) {
      result += str.slice(last, idx) + replace;
      last = idx + search.length;
      idx = lower.indexOf(searchLower, last);
    }
    return result + str.slice(last);
  };

  let fixed = text;
  [
    'durabilidade','duravel','durável','durabél','dúravel',
    'dorabél','dorabel','doravel','dorable','durable',
    'du abel','do abel','du rabél','du rabel',
    'dura bel','dura bell','dura bil','dura vel',
    'drawable','drawbell','draw abel',
  ].forEach(w => { fixed = replaceAll(fixed, w, 'Durabel'); });

  fixed = replaceAll(fixed, ' Abel ', ' Durabel ');
  fixed = replaceAll(fixed, ' abel ', ' Durabel ');
  if (fixed.toLowerCase().startsWith('abel ')) fixed = 'Durabel ' + fixed.slice(5);
  if (fixed.toLowerCase() === 'abel') fixed = 'Durabel';
  return fixed;
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
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end mb-4`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
          style={{ background: 'linear-gradient(135deg, #0055CC, #00BBFF)', color: 'white', fontFamily: 'Syne, sans-serif' }}>
          D
        </div>
      )}
      <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${isUser ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
        style={{
          background: isUser ? 'linear-gradient(135deg, #0055CC22, #00BBFF18)' : 'var(--card)',
          border: `1px solid ${isUser ? '#0077FF44' : 'var(--border)'}`,
          color: 'var(--text)',
        }}>
        {msg.content}
      </div>
    </div>
  );
}

export default function ChatPanel() {
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: 'Olá, Felipe! 👋 Sou a Durabel, sua secretária executiva. Já estou conectada ao seu Google Calendar e Tarefas.\n\nComo posso ajudá-lo agora?',
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [voiceError, setVoiceError] = useState('');

  const audioRef = useRef(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const listeningRef = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => { listeningRef.current = listening; }, [listening]);

  // ── Microfone ────────────────────────────────────────────
  const stopMic = useCallback(() => {
    listeningRef.current = false;
    setListening(false);
    const rec = recognitionRef.current;
    recognitionRef.current = null;
    if (rec) {
      try { rec.stop(); } catch {}
    }
  }, []);

  const startMic = useCallback(() => {
    const SR = window.webkitSpeechRecognition || window.SpeechRecognition;
    if (!SR) return;

    const rec = new SR();
    rec.lang = 'pt-BR';
    rec.continuous = true;
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onresult = (e) => {
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript + ' ';
      }
      if (final.trim()) setInput(prev => (prev ? prev.trim() + ' ' : '') + fixDurabelName(final.trim()));
    };

    rec.onerror = (e) => {
      if (e.error !== 'aborted' && e.error !== 'no-speech') console.warn('Mic:', e.error);
      recognitionRef.current = null;
      listeningRef.current = false;
      setListening(false);
    };

    rec.onend = () => {
      // Só limpa se ainda está em modo de escuta (não foi parado manualmente)
      if (listeningRef.current) {
        recognitionRef.current = null;
        listeningRef.current = false;
        setListening(false);
      }
    };

    recognitionRef.current = rec;
    listeningRef.current = true;
    setListening(true);
    try { rec.start(); } catch { stopMic(); }
  }, [stopMic]);

  const toggleListening = useCallback(() => {
    if (listeningRef.current) {
      stopMic();
    } else {
      setTimeout(startMic, 200);
    }
  }, [stopMic, startMic]);

  // ── Enviar mensagem ──────────────────────────────────────
  const sendMessage = useCallback(async (text) => {
    const content = (text || input).trim();
    if (!content || loading) return;

    // Para mic ANTES de tudo
    if (listeningRef.current) {
      const rec = recognitionRef.current;
      recognitionRef.current = null;
      listeningRef.current = false;
      setListening(false);
      if (rec) try { rec.stop(); } catch {}
    }

    setInput('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
    setLoading(true);

    const newMessages = [...messages, { role: 'user', content }];
    setMessages(newMessages);

    try {
      const localSettings = JSON.parse(localStorage.getItem('durabel_settings') || '{}');
      const anthropicKey = localSettings.anthropic_key || '';

      const crmData = (() => {
        try {
          return {
            clients: JSON.parse(localStorage.getItem('durabel_clients') || '[]'),
            proposals: JSON.parse(localStorage.getItem('durabel_proposals') || '[]'),
          };
        } catch { return { clients: [], proposals: [] }; }
      })();

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, anthropicKey, crmData }),
      });

      const data = await res.json();

      if (data.content) {
        const reply = cleanMarkdown(data.content);
        setMessages(prev => [...prev, { role: 'assistant', content: reply }]);

        if (voiceEnabled) {
          try {
            setSpeaking(true);
            const voiceText = reply.replace(/[*#`_~]/g, '').replace(/\s+/g, ' ').trim().slice(0, 300);
            const voiceRes = await fetch('/api/voice', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: voiceText }),
            });

            if (voiceRes.ok) {
              if (audioRef.current) { try { audioRef.current.pause(); audioRef.current.src = ''; } catch {} audioRef.current = null; }
              const blob = await voiceRes.blob();
              const url = URL.createObjectURL(blob);
              const audio = new Audio();
              audio.preload = 'auto';
              audioRef.current = audio;
              audio.onended = () => { setSpeaking(false); URL.revokeObjectURL(url); audioRef.current = null; };
              audio.onerror = () => { setSpeaking(false); URL.revokeObjectURL(url); audioRef.current = null; };
              audio.src = url;
              audio.load();
              audio.oncanplaythrough = async () => {
                try { await audio.play(); }
                catch { setSpeaking(false); setVoiceError('🔇 Toque na tela para ativar o áudio.'); setTimeout(() => setVoiceError(''), 3000); }
              };
            } else { setSpeaking(false); }
          } catch { setSpeaking(false); }
        }
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Erro de conexão. Tente novamente.' }]);
    }

    setLoading(false);
  }, [input, messages, loading, voiceEnabled]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-2">
        {messages.map((msg, i) => <Message key={i} msg={msg} />)}

        {loading && (
          <div className="flex gap-3 items-end mb-4">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, #0055CC, #00BBFF)', color: 'white', fontFamily: 'Syne, sans-serif' }}>D</div>
            <div className="px-4 py-3 rounded-2xl rounded-bl-sm" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <div className="flex gap-1.5">
                {[0,1,2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full animate-bounce"
                    style={{ background: 'var(--blue)', animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.length === 1 && !loading && (
          <div className="mt-2 mb-4">
            <p className="text-xs mb-3 px-1" style={{ color: 'var(--dim)', fontFamily: 'Inter, sans-serif' }}>Ações rápidas:</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_ACTIONS.map(action => (
                <button key={action} onClick={() => sendMessage(action)}
                  className="text-xs px-3 py-2 rounded-xl transition-all"
                  style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--muted)', fontFamily: 'Inter, sans-serif' }}>
                  {action}
                </button>
              ))}
            </div>
          </div>
        )}

        {voiceError && (
          <div className="text-xs text-center px-4 py-2 rounded-xl mb-2 mx-4"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.3)' }}>
            {voiceError}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="px-4 pb-6 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={listening ? '🎙 Ouvindo... (Enviar para parar)' : 'Fale com a Durabel...'}
              rows={1}
              className="w-full resize-none rounded-2xl px-4 py-3 text-sm"
              style={{
                background: 'var(--card)', border: `1px solid ${listening ? 'var(--neon)' : 'var(--border)'}`,
                color: 'var(--text)', fontFamily: 'Inter, sans-serif',
                maxHeight: '120px', overflow: 'auto', lineHeight: '1.5',
              }}
              onInput={e => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
            />
          </div>

          <button onClick={() => {
            if (speaking && audioRef.current) { audioRef.current.pause(); setSpeaking(false); }
            setVoiceEnabled(v => !v);
          }}
            className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background: voiceEnabled ? 'rgba(124,58,237,0.15)' : 'var(--card)',
              border: `1px solid ${voiceEnabled ? '#7C3AED44' : 'var(--border)'}`,
              color: voiceEnabled ? (speaking ? '#A78BFA' : '#7C3AED') : 'var(--dim)',
              boxShadow: speaking ? '0 0 15px rgba(124,58,237,0.4)' : 'none',
            }}>
            {voiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>

          <button onClick={toggleListening}
            className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background: listening ? 'rgba(0,187,255,0.15)' : 'var(--card)',
              border: `1px solid ${listening ? 'var(--neon)' : 'var(--border)'}`,
              color: listening ? 'var(--neon)' : 'var(--muted)',
              boxShadow: listening ? '0 0 15px rgba(0,187,255,0.3)' : 'none',
            }}>
            {listening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background: input.trim() && !loading ? 'linear-gradient(135deg, #0055CC, #0099FF)' : 'var(--card)',
              border: `1px solid ${input.trim() && !loading ? 'transparent' : 'var(--border)'}`,
              color: input.trim() && !loading ? 'white' : 'var(--dim)',
              boxShadow: input.trim() && !loading ? '0 4px 15px rgba(0,119,255,0.4)' : 'none',
              cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
            }}>
            <Send size={16} />
          </button>
        </div>
        {listening && (
          <p className="text-xs text-center mt-2" style={{ color: 'var(--neon)', fontFamily: 'Inter, sans-serif' }}>
            🎙 Gravando — aperte Enviar ou o mic para parar
          </p>
        )}
      </div>
    </div>
  );
}
