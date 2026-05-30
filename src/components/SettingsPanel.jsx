'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Key, Mic, MessageCircle, Mail, Save, Eye, EyeOff,
  CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Info
} from 'lucide-react';

const SECTIONS = [
  {
    id: 'anthropic',
    icon: '🤖',
    title: 'Claude AI',
    subtitle: 'Inteligência da DURABEL',
    color: '#7C3AED',
    borderColor: '#7C3AED44',
    bgColor: 'rgba(124,58,237,0.06)',
    fields: [
      {
        key: 'anthropic_key',
        label: 'Chave API Anthropic',
        placeholder: 'sk-ant-api03-...',
        hint: 'Obtenha em console.anthropic.com → API Keys',
        link: 'https://console.anthropic.com',
        sensitive: true,
      },
    ],
  },
  {
    id: 'voice',
    icon: '🎙',
    title: 'Voz — ElevenLabs',
    subtitle: 'Voz personalizada da DURABEL',
    color: '#0077FF',
    borderColor: '#0077FF44',
    bgColor: 'rgba(0,119,255,0.06)',
    fields: [
      {
        key: 'elevenlabs_key',
        label: 'Chave API ElevenLabs',
        placeholder: 'sk_...',
        hint: 'Obtenha em elevenlabs.io → Profile → API Key',
        link: 'https://elevenlabs.io',
        sensitive: true,
      },
      {
        key: 'elevenlabs_voice_id',
        label: 'Voice ID',
        placeholder: 'ErXwobaYiN019PkySvjV',
        hint: 'Voice Lab → sua voz clonada → copie o ID',
        sensitive: false,
      },
    ],
  },
  {
    id: 'whatsapp',
    icon: '📱',
    title: 'WhatsApp — Z-API',
    subtitle: 'Notificações e mensagens',
    color: '#25D366',
    borderColor: '#25D36644',
    bgColor: 'rgba(37,211,102,0.06)',
    badge: 'V2',
    fields: [
      {
        key: 'zapi_instance',
        label: 'Instance ID (Z-API)',
        placeholder: '3DF2A1B4C...',
        hint: 'Disponível no painel Z-API → Sua Instância',
        link: 'https://z-api.io',
        sensitive: false,
      },
      {
        key: 'zapi_token',
        label: 'Token Z-API',
        placeholder: 'F4A1B2C3D...',
        hint: 'Z-API → Security Token',
        sensitive: true,
      },
    ],
  },
  {
    id: 'email',
    icon: '✉️',
    title: 'E-mail Corporativo',
    subtitle: 'Conta DURAR / Locaweb',
    color: '#F59E0B',
    borderColor: '#F59E0B44',
    bgColor: 'rgba(245,158,11,0.06)',
    fields: [
      {
        key: 'smtp_host',
        label: 'Servidor SMTP',
        placeholder: 'smtp.locaweb.com.br',
        hint: 'Geralmente smtp.locaweb.com.br',
        sensitive: false,
      },
      {
        key: 'smtp_port',
        label: 'Porta SMTP',
        placeholder: '587',
        hint: 'Porta 587 (TLS) ou 465 (SSL)',
        sensitive: false,
      },
      {
        key: 'smtp_email',
        label: 'E-mail corporativo',
        placeholder: 'felipe@durar.com.br',
        hint: 'Seu e-mail com domínio próprio',
        sensitive: false,
      },
      {
        key: 'smtp_password',
        label: 'Senha do e-mail',
        placeholder: '••••••••',
        hint: 'Senha da conta de e-mail',
        sensitive: true,
      },
    ],
  },
];

function FieldInput({ field, value, onChange }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="mb-4">
      <label className="block text-xs font-semibold mb-1.5 tracking-wide"
        style={{ color: 'var(--muted)', fontFamily: 'Inter, sans-serif' }}>
        {field.label}
      </label>
      <div className="relative">
        <input
          type={field.sensitive && !visible ? 'password' : 'text'}
          value={value || ''}
          onChange={e => onChange(field.key, e.target.value)}
          placeholder={field.placeholder}
          className="w-full rounded-xl px-4 py-3 text-sm pr-10"
          style={{
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            fontFamily: 'monospace',
          }}
        />
        {field.sensitive && (
          <button
            onClick={() => setVisible(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--muted)' }}>
            {visible ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
      <div className="flex items-center gap-1.5 mt-1.5">
        <Info size={11} style={{ color: 'var(--dim)', flexShrink: 0 }} />
        <p className="text-xs" style={{ color: 'var(--dim)', fontFamily: 'Inter, sans-serif' }}>
          {field.hint}{' '}
          {field.link && (
            <a href={field.link} target="_blank" rel="noopener noreferrer"
              style={{ color: 'var(--blue)', textDecoration: 'underline' }}>
              Acessar →
            </a>
          )}
        </p>
      </div>
    </div>
  );
}

function Section({ section, settings, onChange }) {
  const [open, setOpen] = useState(section.id === 'anthropic');
  const [saved, setSaved] = useState(false);

  const hasValues = section.fields.some(f => settings[f.key]);

  const handleSave = async () => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: section.id,
          fields: Object.fromEntries(section.fields.map(f => [f.key, settings[f.key] || ''])),
        }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } catch {}
  };

  return (
    <div className="rounded-2xl mb-4 overflow-hidden transition-all"
      style={{
        background: open ? section.bgColor : 'var(--card)',
        border: `1px solid ${open ? section.borderColor : 'var(--border)'}`,
      }}>

      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <span className="text-xl">{section.icon}</span>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm" style={{ color: 'var(--text)', fontFamily: 'Syne, sans-serif' }}>
                {section.title}
              </span>
              {section.badge && (
                <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                  style={{ background: 'rgba(0,119,255,0.15)', color: 'var(--blue)', border: '1px solid rgba(0,119,255,0.3)' }}>
                  {section.badge}
                </span>
              )}
            </div>
            <span className="text-xs" style={{ color: 'var(--muted)' }}>{section.subtitle}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasValues && (
            <CheckCircle2 size={16} style={{ color: '#10B981' }} />
          )}
          {open
            ? <ChevronUp size={16} style={{ color: 'var(--dim)' }} />
            : <ChevronDown size={16} style={{ color: 'var(--dim)' }} />
          }
        </div>
      </button>

      {/* Fields */}
      {open && (
        <div className="px-4 pb-4 animate-fade-in">
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
            {section.fields.map(field => (
              <FieldInput
                key={field.key}
                field={field}
                value={settings[field.key]}
                onChange={onChange}
              />
            ))}

            <button
              onClick={handleSave}
              className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
              style={{
                background: saved
                  ? 'rgba(16,185,129,0.15)'
                  : `linear-gradient(135deg, ${section.color}CC, ${section.color})`,
                color: saved ? '#10B981' : 'white',
                border: saved ? '1px solid #10B98144' : 'none',
                fontFamily: 'Inter, sans-serif',
              }}>
              {saved
                ? <><CheckCircle2 size={16} /> Salvo com sucesso!</>
                : <><Save size={16} /> Salvar configurações</>
              }
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SettingsPanel() {
  const { data: session } = useSession();
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        setSettings(data.settings || {});
      } catch {}
      setLoading(false);
    }
    loadSettings();
  }, []);

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const configuredCount = SECTIONS.filter(s =>
    s.fields.some(f => settings[f.key])
  ).length;

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <h2 className="font-bold text-base" style={{ fontFamily: 'Syne, sans-serif' }}>
          Configurações
        </h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
          {configuredCount}/{SECTIONS.length} integrações configuradas
          {session?.user?.email && (
            <span style={{ color: 'var(--dim)' }}> · {session.user.email}</span>
          )}
        </p>

        {/* Progress bar */}
        <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(configuredCount / SECTIONS.length) * 100}%`,
              background: 'linear-gradient(90deg, #0055CC, #00BBFF)',
            }} />
        </div>
      </div>

      {/* Sections */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6">
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: 'var(--card)' }} />
            ))}
          </div>
        ) : (
          <>
            {/* Info card */}
            <div className="rounded-xl px-4 py-3 mb-4 flex gap-3"
              style={{ background: 'rgba(0,119,255,0.08)', border: '1px solid rgba(0,119,255,0.2)' }}>
              <AlertCircle size={16} style={{ color: 'var(--blue)', flexShrink: 0, marginTop: 2 }} />
              <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)', fontFamily: 'Inter, sans-serif' }}>
                Suas chaves são <strong style={{ color: 'var(--text)' }}>criptografadas</strong> e vinculadas ao seu e-mail. Cada usuário tem configurações independentes.
              </p>
            </div>

            {SECTIONS.map(section => (
              <Section
                key={section.id}
                section={section}
                settings={settings}
                onChange={handleChange}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
