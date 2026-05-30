'use client';

import { signIn, useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) router.push('/dashboard');
  }, [session, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="flex gap-2">
          {[0,1,2].map(i => (
            <div key={i} className={`typing-dot w-3 h-3 rounded-full`}
              style={{ background: 'var(--blue)' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: 'var(--bg)' }}>

      {/* Background glow effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #0077FF 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, #00BBFF 0%, transparent 70%)' }} />
      </div>

      {/* Grid lines bg */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      <div className="relative z-10 flex flex-col items-center gap-8 px-8 max-w-sm w-full">

        {/* Logo */}
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="relative">
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="39" stroke="url(#grad)" strokeWidth="1.5" />
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="80" y2="80">
                  <stop offset="0%" stopColor="#0055CC" />
                  <stop offset="100%" stopColor="#00BBFF" />
                </linearGradient>
              </defs>
              {/* Letter D */}
              <path d="M22 20h14c10 0 17 7 17 20s-7 20-17 20H22V20z" fill="none" stroke="url(#grad)" strokeWidth="3" strokeLinejoin="round"/>
              {/* Chat bubble */}
              <rect x="30" y="32" width="18" height="13" rx="4" fill="url(#grad)" opacity="0.9"/>
              <circle cx="36" cy="38" r="1.5" fill="white"/>
              <circle cx="40" cy="38" r="1.5" fill="white"/>
              <circle cx="44" cy="38" r="1.5" fill="white"/>
              <path d="M34 45l-2 3 5-3" fill="url(#grad)" opacity="0.9"/>
            </svg>
            {/* Glow ring */}
            <div className="absolute inset-0 rounded-full animate-pulse-slow"
              style={{ boxShadow: '0 0 30px rgba(0, 119, 255, 0.3)' }} />
          </div>

          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-wider text-white"
              style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '0.15em' }}>
              DUR<span style={{ color: 'var(--neon)' }}>ABEL</span>
            </h1>
            <div className="flex items-center gap-2 justify-center mt-1">
              <div className="h-px flex-1" style={{ background: 'var(--blue)' }} />
              <p className="text-xs tracking-widest font-medium" style={{ color: 'var(--muted)', letterSpacing: '0.2em' }}>
                SUA SECRETÁRIA INTELIGENTE
              </p>
              <div className="h-px flex-1" style={{ background: 'var(--blue)' }} />
            </div>
          </div>
        </div>

        {/* Features list */}
        <div className="w-full space-y-3 animate-fade-in" style={{ animationDelay: '0.2s', opacity: 0, animationFillMode: 'forwards' }}>
          {[
            { icon: '🗓', text: 'Google Calendar integrado' },
            { icon: '✓', text: 'Gestão de tarefas em tempo real' },
            { icon: '🎙', text: 'Comando por voz' },
            { icon: '📄', text: 'Geração de propostas e laudos' },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-3 px-4 py-2 rounded-xl"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <span className="text-lg">{icon}</span>
              <span className="text-sm" style={{ color: 'var(--muted)' }}>{text}</span>
            </div>
          ))}
        </div>

        {/* Login button */}
        <button
          onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
          className="btn-glow w-full py-4 rounded-2xl text-white font-semibold text-base flex items-center justify-center gap-3 animate-fade-in"
          style={{ fontFamily: 'Inter, sans-serif', animationDelay: '0.4s', opacity: 0, animationFillMode: 'forwards' }}>
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#fff" opacity=".9"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff" opacity=".8"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fff" opacity=".7"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff" opacity=".6"/>
          </svg>
          Entrar com Google
        </button>

        <p className="text-xs text-center" style={{ color: 'var(--dim)' }}>
          Ao entrar, você autoriza acesso ao Google Calendar e Tarefas
        </p>
      </div>
    </div>
  );
}
