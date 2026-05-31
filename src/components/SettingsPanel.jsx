'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Key, Save, Eye, EyeOff, CheckCircle2, ChevronDown, ChevronUp,
  Info, User, Bell, Palette, Clock, Building2, Globe, Shield
} from 'lucide-react';

// ─── SEÇÕES DE CHAVES API ───────────────────────────────
const API_SECTIONS = [
  {
    id: 'anthropic',
    icon: '🤖',
    title: 'Claude AI',
    subtitle: 'Motor de inteligência da DURABEL',
    color: '#7C3AED',
    fields: [
      {
        key: 'anthropic_key',
        label: 'Chave API Anthropic',
        placeholder: 'sk-ant-api03-...',
        hint: 'Cada usuário usa sua própria chave.',
        link: 'https://console.anthropic.com',
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
    fields: [
      { key: 'smtp_host', label: 'Servidor SMTP', placeholder: 'email.locaweb.com.br', sensitive: false },
      { key: 'smtp_port', label: 'Porta SMTP', placeholder: '587', sensitive: false },
      { key: 'smtp_email', label: 'E-mail corporativo', placeholder: 'felipe@durar.com.br', sensitive: false },
      { key: 'smtp_password', label: 'Senha do e-mail', placeholder: '••••••••', sensitive: true },
    ],
  },
  {
    id: 'whatsapp',
    icon: '📱',
    title: 'WhatsApp — Z-API',
    subtitle: 'Mensagens para clientes',
    color: '#25D366',
    badge: 'V3',
    fields: [
      { key: 'zapi_instance', label: 'Instance ID', placeholder: '3DF2A1B4C...', sensitive: false, hint: 'z-api.io → Sua Instância' },
      { key: 'zapi_token', label: 'Token Z-API', placeholder: 'F4A1B2C3D...', sensitive: true },
    ],
  },
];

// ─── SEÇÕES DE PREFERÊNCIAS ────────────────────────────
const PREF_SECTIONS = [
  {
    id: 'profile',
    icon: <User size={18} />,
    title: 'Perfil Profissional',
    subtitle: 'Como a DURABEL te conhece',
    color: '#0077FF',
    fields: [
      { key: 'pref_name', label: 'Como prefere ser chamado', placeholder: 'Felipe', type: 'text' },
      { key: 'pref_company', label: 'Nome da empresa', placeholder: 'DURAR Consultoria', type: 'text' },
      { key: 'pref_role', label: 'Cargo', placeholder: 'Diretor', type: 'text' },
      { key: 'pref_phone', label: 'Telefone / WhatsApp', placeholder: '(82) 99999-9999', type: 'text' },
      { key: 'pref_city', label: 'Cidade / Estado', placeholder: 'Maceió, AL', type: 'text' },
    ],
  },
  {
    id: 'work',
    icon: <Clock size={18} />,
    title: 'Rotina de Trabalho',
    subtitle: 'Para o time blocking adaptativo',
    color: '#10B981',
    fields: [
      { key: 'pref_workstart', label: 'Início do expediente', placeholder: '08:00', type: 'time' },
      { key: 'pref_workend', label: 'Fim do expediente', placeholder: '18:00', type: 'time' },
      { key: 'pref_focustime', label: 'Melhor horário para foco', placeholder: 'Manhã (08h-12h)', type: 'select',
        options: ['Manhã (06h-12h)', 'Tarde (12h-18h)', 'Noite (18h-23h)', 'Madrugada (23h-06h)', 'Variável'] },
      { key: 'pref_meetingdays', label: 'Dias preferidos para reunião', placeholder: 'Segunda, Quarta', type: 'text' },
      { key: 'pref_lunchbreak', label: 'Pausa para almoço', placeholder: '12:00 - 13:30', type: 'text' },
    ],
  },
  {
    id: 'notifications',
    icon: <Bell size={18} />,
    title: 'Notificações',
    subtitle: 'Quando e como avisar',
    color: '#EF4444',
    fields: [
      { key: 'pref_remindermin', label: 'Lembrar reuniões com antecedência', placeholder: '30', type: 'select',
        options: ['5 minutos', '15 minutos', '30 minutos', '1 hora', '2 horas', '1 dia antes'] },
      { key: 'pref_followupdays', label: 'Follow-up de proposta após (dias)', placeholder: '3', type: 'select',
        options: ['1 dia', '2 dias', '3 dias', '5 dias', '7 dias', '10 dias', '15 dias'] },
      { key: 'pref_dailybriefing', label: 'Briefing diário automático', placeholder: '08:00', type: 'select',
        options: ['Desativado', '07:00', '08:00', '09:00', '10:00'] },
    ],
  },
  {
    id: 'company',
    icon: <Building2 size={18} />,
    title: 'Dados da Empresa',
    subtitle: 'Para documentos e propostas',
    color: '#6B7280',
    fields: [
      { key: 'comp_cnpj', label: 'CNPJ', placeholder: '00.000.000/0001-00', type: 'text' },
      { key: 'comp_address', label: 'Endereço completo', placeholder: 'Rua, N° — Bairro, Cidade/UF', type: 'text' },
      { key: 'comp_crea', label: 'CREA', placeholder: 'CREA-AL 000000', type: 'text' },
      { key: 'comp_website', label: 'Site', placeholder: 'www.durar.com.br', type: 'text' },
      { key: 'comp_specialties', label: 'Especialidades principais', placeholder: 'Patologia, Corrosão, Fachadas...', type: 'text' },
    ],
  },
  {
    id: 'appearance',
    icon: <Palette size={18} />,
    title: 'Aparência e IA',
    subtitle: 'Comportamento da DURABEL',
    color: '#8B5CF6',
    fields: [
      { key: 'pref_aitone', label: 'Tom da DURABEL', type: 'select',
        options: ['Profissional e direta', 'Formal e detalhada', 'Casual e amigável', 'Técnica e precisa'] },
      { key: 'pref_language', label: 'Idioma preferido', type: 'select',
        options: ['Português (Brasil)', 'English', 'Español'] },
      { key: 'pref_currency', label: 'Moeda', type: 'select',
        options: ['R$ (BRL)', 'US$ (USD)', '€ (EUR)'] },
      { key: 'pref_dateformat', label: 'Formato de data', type: 'select',
        options: ['DD/MM/YYYY', 'YYYY-MM-DD', 'MM/DD/YYYY'] },
    ],
  },
];

// ─── COMPONENTES ────────────────────────────────────────
function FieldInput({ field, value, onChange }) {
  const [visible, setVisible] = useState(false);

  if (field.type === 'select') {
    return (
      <div className="mb-4">
        <label className="block text-xs font-semibold mb-1.5 tracking-wide" style={{ color: 'var(--muted)', fontFamily: 'Inter, sans-serif' }}>
          {field.label}
        </label>
        <select value={value || ''} onChange={e => onChange(field.key, e.target.value)}
          className="w-full rounded-xl px-4 py-3 text-sm"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: value ? 'var(--text)' : 'var(--dim)', fontFamily: 'Inter, sans-serif' }}>
          <option value="">{field.placeholder || 'Selecione...'}</option>
          {(field.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        {field.hint && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <Info size={11} style={{ color: 'var(--dim)' }} />
            <p className="text-xs" style={{ color: 'var(--dim)', fontFamily: 'Inter, sans-serif' }}>{field.hint}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mb-4">
      <label className="block text-xs font-semibold mb-1.5 tracking-wide" style={{ color: 'var(--muted)', fontFamily: 'Inter, sans-serif' }}>
        {field.label}
      </label>
      <div className="relative">
        <input
          type={field.sensitive && !visible ? 'password' : (field.type || 'text')}
          value={value || ''}
          onChange={e => onChange(field.key, e.target.value)}
          placeholder={field.placeholder || ''}
          className="w-full rounded-xl px-4 py-3 text-sm pr-10"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: field.sensitive ? 'monospace' : 'Inter, sans-serif' }}
        />
        {field.sensitive && (
          <button onClick={() => setVisible(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }}>
            {visible ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
      {field.hint && (
        <div className="flex items-center gap-1.5 mt-1.5">
          <Info size={11} style={{ color: 'var(--dim)', flexShrink: 0 }} />
          <p className="text-xs" style={{ color: 'var(--dim)', fontFamily: 'Inter, sans-serif' }}>
            {field.hint}{' '}
            {field.link && <a href={field.link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue)', textDecoration: 'underline' }}>Acessar →</a>}
          </p>
        </div>
      )}
    </div>
  );
}

function AccordionSection({ section, settings, onChange, isAPI }) {
  const [open, setOpen] = useState(section.id === 'anthropic' || section.id === 'profile');
  const [saved, setSaved] = useState(false);

  const hasValues = section.fields.some(f => settings[f.key]);
  const accentColor = isAPI ? section.color : section.color;

  const handleSave = async () => {
    try {
      const fieldsToSave = Object.fromEntries(section.fields.map(f => [f.key, settings[f.key] || '']));
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: fieldsToSave }),
      });
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500); }
    } catch {}
  };

  return (
    <div className="rounded-2xl mb-3 overflow-hidden transition-all"
      style={{ background: open ? `${accentColor}08` : 'var(--card)', border: `1px solid ${open ? accentColor + '30' : 'var(--border)'}` }}>
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${accentColor}15`, border: `1px solid ${accentColor}25` }}>
            {isAPI
              ? <span style={{ fontSize: '16px' }}>{section.icon}</span>
              : <span style={{ color: accentColor }}>{section.icon}</span>
            }
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm" style={{ color: 'var(--text)', fontFamily: 'Syne, sans-serif' }}>
                {section.title}
              </span>
              {section.badge && (
                <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                  style={{ background: 'rgba(0,119,255,0.15)', color: 'var(--blue)', border: '1px solid rgba(0,119,255,0.3)', fontSize: '9px' }}>
                  {section.badge}
                </span>
              )}
            </div>
            <span className="text-xs" style={{ color: 'var(--muted)' }}>{section.subtitle}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasValues && <CheckCircle2 size={15} style={{ color: '#10B981' }} />}
          {open ? <ChevronUp size={16} style={{ color: 'var(--dim)' }} /> : <ChevronDown size={16} style={{ color: 'var(--dim)' }} />}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 animate-fade-in" style={{ borderTop: '1px solid var(--border)' }}>
          <div style={{ paddingTop: '16px' }}>
            {section.fields.map(field => (
              <FieldInput key={field.key} field={field} value={settings[field.key]} onChange={onChange} />
            ))}
            <button onClick={handleSave}
              className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
              style={{
                background: saved ? 'rgba(16,185,129,0.15)' : `linear-gradient(135deg, ${accentColor}CC, ${accentColor})`,
                color: saved ? '#10B981' : 'white',
                border: saved ? '1px solid #10B98144' : 'none',
                fontFamily: 'Inter, sans-serif',
              }}>
              {saved ? <><CheckCircle2 size={15} /> Salvo!</> : <><Save size={15} /> Salvar</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────
export default function SettingsPanel() {
  const { data: session } = useSession();
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('prefs');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        setSettings(data.settings || {});
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  const handleChange = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));

  const allSections = [...API_SECTIONS, ...PREF_SECTIONS];
  const configured = allSections.filter(s => s.fields.some(f => settings[f.key])).length;

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-bold text-base" style={{ fontFamily: 'Syne, sans-serif' }}>Configurações</h2>
          <div className="flex items-center gap-1.5">
            <Shield size={12} style={{ color: 'var(--blue)' }} />
            <span className="text-xs" style={{ color: 'var(--muted)' }}>Dados criptografados</span>
          </div>
        </div>
        {session?.user?.email && (
          <p className="text-xs mb-2" style={{ color: 'var(--dim)' }}>{session.user.email}</p>
        )}
        {/* Progress */}
        <div className="h-1 rounded-full overflow-hidden mb-3" style={{ background: 'var(--border)' }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${(configured / allSections.length) * 100}%`, background: 'linear-gradient(90deg, #0055CC, #00BBFF)' }} />
        </div>
        {/* Tabs */}
        <div className="flex gap-1">
          {[
            { id: 'prefs', label: '⚙️ Preferências' },
            { id: 'keys', label: '🔑 Chaves API' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: activeTab === tab.id ? 'var(--blue)' : 'var(--bg)',
                color: activeTab === tab.id ? 'white' : 'var(--muted)',
                border: `1px solid ${activeTab === tab.id ? 'var(--blue)' : 'var(--border)'}`,
                fontFamily: 'Inter, sans-serif',
              }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6">
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-14 rounded-2xl animate-pulse" style={{ background: 'var(--card)' }} />)}
          </div>
        ) : (
          <>
            {/* Info card */}
            <div className="rounded-xl px-4 py-3 mb-4 flex gap-3"
              style={{ background: 'rgba(0,119,255,0.08)', border: '1px solid rgba(0,119,255,0.2)' }}>
              <Info size={15} style={{ color: 'var(--blue)', flexShrink: 0, marginTop: 1 }} />
              <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)', fontFamily: 'Inter, sans-serif' }}>
                {activeTab === 'keys'
                  ? 'Chaves criptografadas e vinculadas ao seu e-mail. Cada usuário tem configurações independentes.'
                  : 'Suas preferências personalizam como a DURABEL trabalha com você — tom, horários, dados da empresa.'}
              </p>
            </div>

            {activeTab === 'keys'
              ? API_SECTIONS.map(s => <AccordionSection key={s.id} section={s} settings={settings} onChange={handleChange} isAPI={true} />)
              : PREF_SECTIONS.map(s => <AccordionSection key={s.id} section={s} settings={settings} onChange={handleChange} isAPI={false} />)
            }
          </>
        )}
      </div>
    </div>
  );
}
