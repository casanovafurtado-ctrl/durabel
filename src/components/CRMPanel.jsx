'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Building2, ChevronRight, X, Save, MessageCircle, Download, Phone, Mail, MapPin } from 'lucide-react';
import { exportClientPDF } from '@/lib/pdfExport';

const STATUS_CONFIG = {
  prospecto:   { label: 'Prospecto',         color: '#6B7280', bg: 'rgba(107,114,128,0.1)' },
  proposta:    { label: 'Proposta Enviada',   color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  negociacao:  { label: 'Em Negociação',      color: '#0077FF', bg: 'rgba(0,119,255,0.1)'  },
  fechado:     { label: 'Fechado ✓',          color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
  perdido:     { label: 'Perdido',            color: '#EF4444', bg: 'rgba(239,68,68,0.1)'  },
};

const SERVICE_GROUPS = [
  {
    group: 'Inspeções e Vistorias',
    items: [
      'Inspeção Predial','Inspeção Predial com Base na NBR 16747',
      'Inspeção de Fachadas','Inspeção de Coberturas','Inspeção de Impermeabilização',
      'Inspeção de Reservatórios','Inspeção de Sistemas Hidrossanitários',
      'Inspeção de Sistemas Elétricos','Inspeção de SPDA',
      'Inspeção de Sistemas de Combate a Incêndio (SPCI)',
      'Inspeção de Áreas de Lazer','Inspeção de Piscinas','Inspeção de Quadras Poliesportivas',
      'Inspeção de Estruturas de Concreto','Inspeção de Estruturas Metálicas',
      'Inspeção para Recebimento de Obras',
      'Vistoria Cautelar de Vizinhança','Vistoria Técnica para Entrega de Empreendimentos',
      'Vistoria de Unidades Privativas','Vistoria de Áreas Comuns',
      'Vistoria para Identificação de Infiltrações','Vistoria para Identificação de Vazamentos',
      'Vistoria de Reformas','Vistoria de Obras em Andamento','Vistoria para Recebimento de Serviços',
    ]
  },
  {
    group: 'Laudos Técnicos',
    items: [
      'Laudo de Inspeção Predial','Laudo de Manifestações Patológicas',
      'Laudo de Fachadas','Laudo de Coberturas','Laudo de Impermeabilização',
      'Laudo de Estruturas de Concreto','Laudo de Estruturas Metálicas',
      'Laudo de Corrosão','Laudo de Biocorrosão (MIC)',
      'Laudo de Infiltrações','Laudo de Vazamentos','Laudo de Desempenho Construtivo',
      'Laudo de Recebimento de Obras','Laudo de Entrega de Empreendimentos',
      'Laudo de Reservatórios','Laudo de Piscinas','Laudo de SPDA',
      'Laudo de Sistemas de Combate a Incêndio',
      'Laudo para Assistência Técnica em Garantia','Laudo para Ações Judiciais',
      'Laudo para Produção Antecipada de Provas','Laudo para Seguro',
      'Laudo para Compra e Venda de Imóveis',
    ]
  },
  {
    group: 'Perícias e Assistência Técnica',
    items: [
      'Assistência Técnica Judicial','Assistência Técnica Extrajudicial',
      'Parecer Técnico de Engenharia','Parecer Técnico de Patologias','Parecer Técnico Estrutural',
      'Produção de Quesitos Técnicos','Análise de Laudos Periciais',
      'Impugnação Técnica de Laudos','Acompanhamento de Perícias Judiciais',
      'Consultoria para Litígios Construtivos',
    ]
  },
  {
    group: 'Ensaios e Diagnósticos',
    items: [
      'Percussão de Revestimentos','Inspeção por Drone','Registro Fotográfico Aéreo',
      'Mapeamento de Fachadas por Drone','Termografia Infravermelha',
      'Medição de Umidade','Ensaio de Estanqueidade','Testes Hidráulicos','Testes de Pressão',
      'Inspeção Endoscópica','Levantamento Cadastral','Mapeamento de Danos',
      'Avaliação do Estado de Conservação','Avaliação do Estado de Manutenção',
    ]
  },
  {
    group: 'Manutenção e Gestão',
    items: [
      'Elaboração de Plano de Manutenção','Implantação de Plano de Manutenção',
      'Gestão da Manutenção Predial','Auditoria de Manutenção','Diagnóstico da Manutenção',
      'Calendário de Manutenção','Planejamento Orçamentário da Manutenção',
      'Controle de Indicadores de Manutenção','Gestão da Durabilidade das Edificações',
      'Elaboração de Procedimentos Operacionais','Criação de Checklists de Inspeção',
      'Criação de Rotinas de Manutenção',
    ]
  },
  {
    group: 'Projetos e Especificações',
    items: [
      'Projeto de Recuperação Estrutural','Projeto de Recuperação de Fachadas',
      'Projeto de Recuperação de Coberturas','Projeto de Impermeabilização',
      'Projeto de Reforço Estrutural','Projeto de Recuperação de Reservatórios',
      'Projeto de Recuperação de Piscinas','Memorial Descritivo',
      'Especificação Técnica de Serviços','Compatibilização Técnica',
    ]
  },
  {
    group: 'Fiscalização e Gerenciamento',
    items: [
      'Fiscalização de Obras','Fiscalização de Reformas','Fiscalização de Serviços de Manutenção',
      'Fiscalização de Recuperação Estrutural','Fiscalização de Impermeabilização',
      'Fiscalização de Fachadas','Gerenciamento de Obras','Gerenciamento de Reformas',
      'Gerenciamento de Recuperações',
    ]
  },
  {
    group: 'Consultoria Condominial',
    items: [
      'Consultoria para Síndicos','Consultoria para Administradoras',
      'Consultoria para Condomínios Residenciais','Consultoria para Condomínios Comerciais',
      'Consultoria para Condomínios Horizontais','Consultoria para Construtoras',
      'Consultoria em Garantias Construtivas','Consultoria em Manutenção Predial',
      'Consultoria em Durabilidade das Edificações','Consultoria para Assembleias',
    ]
  },
  {
    group: 'Reformas e Adequações',
    items: [
      'Gestão de Reformas conforme NBR 16280','Análise de Plano de Reforma',
      'Aprovação Técnica de Reformas','Fiscalização de Reformas',
      'Acompanhamento de Reformas','Recebimento de Reformas','Auditoria de Reformas Executadas',
    ]
  },
  {
    group: 'Termos e Contratações',
    items: [
      'Elaboração de Termo de Referência','Elaboração de Escopo Técnico',
      'Elaboração de Caderno de Encargos','Apoio Técnico em Licitações Privadas',
      'Análise de Propostas Técnicas','Equalização Técnica de Propostas',
      'Acompanhamento de Contratações','Fiscalização de Contratos',
    ]
  },
  {
    group: 'Treinamentos e Capacitações',
    items: [
      'Treinamento para Síndicos','Treinamento para Zeladores',
      'Treinamento para Equipes de Manutenção','Palestras Técnicas',
      'Workshops de Engenharia','Cursos de Inspeção Predial','Cursos de Manutenção Predial',
      'Cursos sobre NBR 16280','Cursos sobre Patologias das Construções',
      'Cursos sobre Durabilidade das Edificações',
    ]
  },
  {
    group: 'Pesquisa e Área Acadêmica',
    items: [
      'Pesquisa Aplicada em Corrosão','Pesquisa Aplicada em Biocorrosão',
      'Estudos de Durabilidade','Desenvolvimento de Metodologias de Inspeção',
      'Consultoria Técnica para Pesquisas','Produção de Conteúdo Técnico e Científico',
    ]
  },
];

// Flat list para compatibilidade
const SERVICE_TYPES = SERVICE_GROUPS.flatMap(g => g.items).concat(['Outro (personalizado)']);

// ─── Formatadores ─────────────────────────────────────
const formatPhone = (v) => {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0,2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
};

const formatCNPJ = (v) => {
  const d = v.replace(/\D/g, '').slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0,2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8)}`;
  return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12)}`;
};

const formatCPF = (v) => {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`;
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
};

const formatCurrency = (v) => {
  // Remove tudo exceto dígitos
  const digits = v.replace(/\D/g, '');
  if (!digits) return '';
  // Converte para centavos e formata
  const num = parseInt(digits, 10) / 100;
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const parseCurrency = (v) => {
  // Converte "1.500,00" para 1500.00
  return parseFloat(v.replace(/\./g, '').replace(',', '.')) || 0;
};

// ─── Status Badge ──────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.prospecto;
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}33` }}>
      {cfg.label}
    </span>
  );
}

// ─── Modal de Cliente ──────────────────────────────────
function ClientModal({ client, onClose, onSave }) {
  const [form, setForm] = useState(client || {
    name: '', building: '', docType: 'CNPJ', doc: '',
    phone: '', email: '', address: '',
    status: 'prospecto', service: '', serviceCustom: '', value: '', notes: '',
  });

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const handlePhone = (v) => set('phone', formatPhone(v));
  const handleDoc = (v) => {
    const formatted = form.docType === 'CNPJ' ? formatCNPJ(v) : formatCPF(v);
    set('doc', formatted);
  };
  const handleValue = (v) => {
    const formatted = formatCurrency(v);
    set('value', formatted);
  };

  const showCustomService = form.service === 'Outro (personalizado)';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.75)' }} onClick={onClose}>
      <div className="w-full max-w-lg rounded-t-3xl pb-8 animate-slide-up overflow-y-auto"
        style={{ background: 'var(--card)', border: '1px solid var(--border)', maxHeight: '92vh' }}
        onClick={e => e.stopPropagation()}>

        <div className="px-5 pt-5 pb-4 flex items-center justify-between sticky top-0"
          style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}>
          <h2 className="font-bold text-base" style={{ fontFamily: 'Syne, sans-serif' }}>
            {client ? 'Editar Cliente' : 'Novo Cliente'}
          </h2>
          <button onClick={onClose} style={{ color: 'var(--muted)' }}><X size={20} /></button>
        </div>

        <div className="px-5 pt-4 space-y-3">

          {/* Nome e Edifício */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--muted)' }}>Nome / Razão Social *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="Condomínio Sol..."
                className="w-full rounded-xl px-3 py-2.5 text-sm"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Inter' }} />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--muted)' }}>Edifício / Condomínio</label>
              <input value={form.building} onChange={e => set('building', e.target.value)}
                placeholder="Ed. San Sebastião"
                className="w-full rounded-xl px-3 py-2.5 text-sm"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Inter' }} />
            </div>
          </div>

          {/* Documento */}
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--muted)' }}>Documento</label>
            <div className="flex gap-2">
              <select value={form.docType} onChange={e => { set('docType', e.target.value); set('doc', ''); }}
                className="rounded-xl px-3 py-2.5 text-sm w-24 flex-shrink-0"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Inter' }}>
                <option>CNPJ</option>
                <option>CPF</option>
              </select>
              <input value={form.doc} onChange={e => handleDoc(e.target.value)}
                placeholder={form.docType === 'CNPJ' ? '00.000.000/0001-00' : '000.000.000-00'}
                className="flex-1 rounded-xl px-3 py-2.5 text-sm"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Inter' }} />
            </div>
          </div>

          {/* Contato */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--muted)' }}>Telefone / WhatsApp</label>
              <input value={form.phone} onChange={e => handlePhone(e.target.value)}
                placeholder="(81) 99999-9999"
                className="w-full rounded-xl px-3 py-2.5 text-sm"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Inter' }} />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--muted)' }}>E-mail</label>
              <input value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="sindico@cond.com"
                className="w-full rounded-xl px-3 py-2.5 text-sm"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Inter' }} />
            </div>
          </div>

          {/* Endereço */}
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--muted)' }}>Endereço</label>
            <input value={form.address} onChange={e => set('address', e.target.value)}
              placeholder="Rua, N° — Bairro, Cidade/UF"
              className="w-full rounded-xl px-3 py-2.5 text-sm"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Inter' }} />
          </div>

          {/* Status e Serviço */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--muted)' }}>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-sm"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Inter' }}>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--muted)' }}>Tipo de Serviço</label>
              <select value={form.service} onChange={e => set('service', e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-sm"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Inter' }}>
                <option value="">Selecione...</option>
                {SERVICE_GROUPS.map(g => (
                  <optgroup key={g.group} label={g.group}>
                    {g.items.map(s => <option key={s} value={s}>{s}</option>)}
                  </optgroup>
                ))}
                <option value="Outro (personalizado)">✏️ Outro (personalizado)</option>
              </select>
            </div>
          </div>

          {/* Serviço personalizado */}
          {showCustomService && (
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--muted)' }}>Descreva o serviço</label>
              <input value={form.serviceCustom} onChange={e => set('serviceCustom', e.target.value)}
                placeholder="Descreva o serviço..."
                className="w-full rounded-xl px-3 py-2.5 text-sm"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Inter' }} />
            </div>
          )}

          {/* Valor */}
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--muted)' }}>Valor da Proposta (R$)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold"
                style={{ color: 'var(--muted)' }}>R$</span>
              <input value={form.value} onChange={e => handleValue(e.target.value)}
                placeholder="0,00"
                className="w-full rounded-xl pl-9 pr-3 py-2.5 text-sm"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Inter' }} />
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--muted)' }}>Observações</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="Notas sobre o cliente, histórico..."
              rows={3}
              className="w-full rounded-xl px-3 py-2.5 text-sm resize-none"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Inter' }} />
          </div>

          <button onClick={() => onSave(form)} disabled={!form.name}
            className="btn-glow w-full py-3 rounded-2xl text-white font-semibold flex items-center justify-center gap-2 text-sm"
            style={{ fontFamily: 'Inter', opacity: !form.name ? 0.5 : 1 }}>
            <Save size={16} /> Salvar Cliente
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Card de Cliente ───────────────────────────────────
function ClientCard({ client, onEdit, onExport, onWhatsApp }) {
  const cfg = STATUS_CONFIG[client.status] || STATUS_CONFIG.prospecto;
  const serviceLabel = client.service === 'Outro (personalizado)' && client.serviceCustom
    ? client.serviceCustom
    : client.service;

  return (
    <div className="rounded-2xl p-4 mb-3 transition-all"
      style={{ background: 'var(--card)', border: '1px solid var(--border)', borderLeft: `3px solid ${cfg.color}` }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-semibold text-sm" style={{ color: 'var(--text)', fontFamily: 'Syne, sans-serif' }}>
              {client.name}
            </span>
            <StatusBadge status={client.status} />
          </div>
          {client.building && (
            <div className="flex items-center gap-1 mb-1">
              <Building2 size={11} style={{ color: 'var(--muted)' }} />
              <span className="text-xs" style={{ color: 'var(--muted)' }}>{client.building}</span>
            </div>
          )}
          {client.phone && (
            <div className="flex items-center gap-1 mb-1">
              <Phone size={11} style={{ color: 'var(--muted)' }} />
              <span className="text-xs" style={{ color: 'var(--muted)' }}>{client.phone}</span>
            </div>
          )}
          {serviceLabel && (
            <div className="text-xs mt-1" style={{ color: 'var(--blue)' }}>🔧 {serviceLabel}</div>
          )}
          {client.value && (
            <div className="text-xs mt-1 font-semibold" style={{ color: '#10B981' }}>R$ {client.value}</div>
          )}
        </div>
        <div className="flex gap-1.5 flex-shrink-0">
          {client.phone && (
            <button onClick={() => onWhatsApp(client)}
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.2)', color: '#25D366' }}>
              <MessageCircle size={14} />
            </button>
          )}
          <button onClick={() => onExport(client)}
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(0,119,255,0.1)', border: '1px solid rgba(0,119,255,0.2)', color: 'var(--blue)' }}>
            <Download size={14} />
          </button>
          <button onClick={() => onEdit(client)}
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--muted)' }}>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN ──────────────────────────────────────────────
export default function CRMPanel() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('todos');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('durabel_clients');
      if (saved) setClients(JSON.parse(saved));
    } catch {}
  }, []);

  const save = (updated) => {
    setClients(updated);
    try { localStorage.setItem('durabel_clients', JSON.stringify(updated)); } catch {}
  };

  const handleSave = (form) => {
    if (editing) {
      save(clients.map(c => c.id === editing.id ? { ...form, id: editing.id } : c));
    } else {
      save([{ ...form, id: Date.now().toString() }, ...clients]);
    }
    setEditing(null);
    setShowModal(false);
  };

  const handleWhatsApp = async (client) => {
    const serviceLabel = client.service === 'Outro (personalizado)' && client.serviceCustom
      ? client.serviceCustom : client.service;
    const msg = `Olá! Aqui é da DURAR Consultoria. Gostaria de falar sobre ${serviceLabel || 'nossos serviços'}.`;
    try {
      const res = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: client.phone, message: msg }),
      });
      const data = await res.json();
      if (!res.ok) alert('WhatsApp: ' + (data.error || 'Erro'));
      else alert('Mensagem enviada!');
    } catch { alert('Erro ao enviar WhatsApp'); }
  };

  const filtered = clients.filter(c => {
    const matchSearch = !search ||
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      (c.building || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'todos' || c.status === filter;
    return matchSearch && matchFilter;
  });

  // Stats
  const total = clients.length;
  const fechados = clients.filter(c => c.status === 'fechado').length;
  const conversion = total > 0 ? Math.round((fechados / total) * 100) : 0;
  const pipeline = clients
    .filter(c => ['proposta', 'negociacao'].includes(c.status) && c.value)
    .reduce((sum, c) => sum + parseCurrency(c.value), 0);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-bold text-base" style={{ fontFamily: 'Syne, sans-serif' }}>Clientes</h2>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>{total} cadastrados · {conversion}% conversão</p>
          </div>
          <button onClick={() => { setEditing(null); setShowModal(true); }}
            className="btn-glow h-9 px-4 rounded-xl flex items-center gap-1.5 text-white text-sm"
            style={{ fontFamily: 'Inter' }}>
            <Plus size={15} /> Novo
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { label: 'Total', value: total, color: 'var(--blue)' },
            { label: 'Fechados', value: fechados, color: '#10B981' },
            { label: 'Pipeline', value: pipeline > 0 ? `R$${(pipeline/1000).toFixed(0)}k` : '—', color: '#F59E0B' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl p-2 text-center"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
              <div className="text-base font-bold" style={{ color, fontFamily: 'Syne, sans-serif' }}>{value}</div>
              <div className="text-xs" style={{ color: 'var(--muted)' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-2">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar cliente ou edifício..."
            className="w-full rounded-xl pl-8 pr-4 py-2.5 text-sm"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Inter' }} />
        </div>

        {/* Filters */}
        <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {[['todos', 'Todos'], ...Object.entries(STATUS_CONFIG).map(([k, v]) => [k, v.label])].map(([k, label]) => (
            <button key={k} onClick={() => setFilter(k)}
              className="px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0"
              style={{
                background: filter === k ? 'var(--blue)' : 'var(--bg)',
                color: filter === k ? 'white' : 'var(--muted)',
                border: `1px solid ${filter === k ? 'var(--blue)' : 'var(--border)'}`,
                fontFamily: 'Inter',
              }}>{label}</button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Building2 size={36} style={{ color: 'var(--dim)', margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--muted)', fontFamily: 'Inter' }}>
              {search ? 'Nenhum cliente encontrado' : 'Cadastre seu primeiro cliente'}
            </p>
          </div>
        ) : (
          filtered.map(c => (
            <ClientCard key={c.id} client={c}
              onEdit={(c) => { setEditing(c); setShowModal(true); }}
              onExport={(c) => exportClientPDF(c)}
              onWhatsApp={handleWhatsApp} />
          ))
        )}
      </div>

      {showModal && (
        <ClientModal
          client={editing}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSave={handleSave} />
      )}
    </div>
  );
}
