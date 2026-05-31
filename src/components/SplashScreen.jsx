'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

const STEPS = [
  { id: 1, icon: '🔐', title: 'Verificando sessão', sub: 'Google OAuth' },
  { id: 2, icon: '📅', title: 'Conectando Google Calendar', sub: 'Sincronizando eventos' },
  { id: 3, icon: '✅', title: 'Carregando tarefas', sub: 'Google Tasks' },
  { id: 4, icon: '🤖', title: 'Iniciando IA', sub: 'Claude Sonnet' },
  { id: 5, icon: '🎙', title: 'Ativando voz', sub: 'ElevenLabs' },
];

export default function SplashScreen({ onDone }) {
  const { data: session } = useSession();
  const [doneSteps, setDoneSteps] = useState([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timers = [];
    const progressValues = [18, 35, 58, 78, 95, 100];

    STEPS.forEach((step, i) => {
      timers.push(setTimeout(() => {
        setDoneSteps(prev => [...prev, step.id]);
        setProgress(progressValues[i]);
      }, 500 + i * 420));
    });

    // Chama onDone depois de todos os steps
    timers.push(setTimeout(() => {
      setProgress(100);
      setTimeout(onDone, 400);
    }, 500 + STEPS.length * 420 + 200));

    return () => timers.forEach(clearTimeout);
  }, [onDone]);

  const firstName = session?.user?.name?.split(' ')[0] || 'Felipe';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', fontFamily: "'Inter', sans-serif",
      animation: 'splashIn 0.4s ease both',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700&family=Inter:wght@300;400;500&display=swap');
        @keyframes splashIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes splashOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes logoIn { from { opacity: 0; transform: scale(0.7); } to { opacity: 1; transform: scale(1); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes dotPulse { 0%,80%,100% { opacity: 0.25; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1); } }
        @keyframes barFill { from { width: 0%; } }
        .splash-step { animation: fadeUp 0.4s ease both; }
        .splash-check { transition: opacity 0.3s, transform 0.3s; }
        .splash-icon { transition: background 0.3s, border-color 0.3s; }
      `}</style>

      {/* LEFT — dark panel */}
      <div style={{
        width: '50%', background: '#060B18',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '48px 32px', position: 'relative', overflow: 'hidden',
      }}>
        {/* BG circles */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 280, height: 280, borderRadius: '50%', background: 'rgba(0,119,255,0.07)' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(0,187,255,0.05)' }} />

        {/* Logo */}
        <div style={{
          width: 96, height: 96, borderRadius: 24, marginBottom: 24,
          background: 'linear-gradient(135deg, #0A1528, #0D1A35)',
          border: '1.5px solid rgba(0,119,255,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', zIndex: 1,
          animation: 'logoIn 0.6s cubic-bezier(0.34,1.56,0.64,1) both',
        }}>
          <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
            <rect x="8" y="6" width="10" height="40" fill="#B5D4F4" rx="2"/>
            <path d="M18 6 Q44 6 44 26 Q44 46 18 46" stroke="#0077FF" strokeWidth="10" fill="none" strokeLinecap="round"/>
            <rect x="17" y="18" width="16" height="11" rx="3" fill="#00BBFF" opacity="0.9"/>
            <circle cx="23" cy="23.5" r="1.5" fill="white"/>
            <circle cx="27" cy="23.5" r="1.5" fill="white"/>
            <circle cx="31" cy="23.5" r="1.5" fill="white"/>
            <path d="M21 29 L19 33 L25 29" fill="#00BBFF" opacity="0.9"/>
          </svg>
        </div>

        <div style={{
          fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 700,
          color: '#fff', letterSpacing: '0.12em', position: 'relative', zIndex: 1,
          animation: 'fadeUp 0.5s 0.2s ease both', opacity: 0, animationFillMode: 'forwards',
        }}>
          DUR<span style={{ color: '#00BBFF' }}>ABEL</span>
        </div>

        <div style={{
          fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.25em',
          textTransform: 'uppercase', marginTop: 6, position: 'relative', zIndex: 1,
          animation: 'fadeUp 0.5s 0.3s ease both', opacity: 0, animationFillMode: 'forwards',
        }}>
          Sua secretária inteligente
        </div>

        {/* Greeting */}
        <div style={{
          marginTop: 32, position: 'relative', zIndex: 1,
          animation: 'fadeUp 0.5s 0.5s ease both', opacity: 0, animationFillMode: 'forwards',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>
            {new Date().getHours() < 12 ? 'Bom dia' : new Date().getHours() < 18 ? 'Boa tarde' : 'Boa noite'},
          </div>
          <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>
            {firstName}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{
        position: 'absolute', left: '50%', top: 0, bottom: 0,
        width: 1, background: 'rgba(255,255,255,0.08)', zIndex: 10,
      }}>
        <div style={{
          position: 'absolute', left: -5, top: '50%', transform: 'translateY(-50%)',
          width: 10, height: 10, borderRadius: '50%', background: '#0077FF',
          boxShadow: '0 0 0 4px rgba(0,119,255,0.2)',
        }} />
      </div>

      {/* RIGHT — light panel */}
      <div style={{
        width: '50%', background: '#0C0C14',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '48px 32px',
      }}>
        <div style={{
          fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.3)',
          letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16,
          animation: 'fadeUp 0.5s 0.4s ease both', opacity: 0, animationFillMode: 'forwards',
        }}>
          Inicializando sistema
        </div>

        {/* Progress bar */}
        <div style={{
          width: '100%', height: 3, background: 'rgba(255,255,255,0.06)',
          borderRadius: 99, overflow: 'hidden', marginBottom: 28,
          animation: 'fadeUp 0.5s 0.5s ease both', opacity: 0, animationFillMode: 'forwards',
        }}>
          <div style={{
            height: '100%', borderRadius: 99,
            background: 'linear-gradient(90deg, #0055CC, #00BBFF)',
            width: `${progress}%`,
            transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1)',
          }} />
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {STEPS.map((step, i) => {
            const done = doneSteps.includes(step.id);
            return (
              <div key={step.id} className="splash-step" style={{
                display: 'flex', alignItems: 'center', gap: 12,
                animationDelay: `${0.5 + i * 0.15}s`, opacity: 0,
                animationFillMode: 'forwards',
              }}>
                <div className="splash-icon" style={{
                  width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, transition: 'all 0.3s',
                  background: done ? 'rgba(0,119,255,0.2)' : 'rgba(255,255,255,0.04)',
                  border: `0.5px solid ${done ? 'rgba(0,119,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
                }}>
                  {step.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: done ? '#E8EDF5' : 'rgba(255,255,255,0.35)', transition: 'color 0.3s' }}>
                    {step.title}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 1 }}>
                    {step.sub}
                  </div>
                </div>
                <div className="splash-check" style={{
                  width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                  background: 'rgba(0,119,255,0.15)', border: '1px solid rgba(0,119,255,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: done ? 1 : 0, transform: done ? 'scale(1)' : 'scale(0.5)',
                }}>
                  <span style={{ fontSize: 10, color: '#00BBFF' }}>✓</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dots */}
        <div style={{
          display: 'flex', gap: 5, marginTop: 28,
          animation: 'fadeUp 0.5s 1.8s ease both', opacity: 0, animationFillMode: 'forwards',
        }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 7, height: 7, borderRadius: '50%',
              background: i === 1 ? '#0077FF' : 'rgba(255,255,255,0.1)',
              animation: `dotPulse 1.4s ${i * 0.2}s ease-in-out infinite`,
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}
