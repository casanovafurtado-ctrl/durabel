'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Building2, ChevronRight, X, Save, MessageCircle, Download, Phone, Trash2, ChevronDown, ChevronUp, Bell, Clock, CheckCheck, Sparkles } from 'lucide-react';
import { exportClientPDF } from '@/lib/pdfExport';
import { useSession } from 'next-auth/react';

const STATUS_CONFIG = {
  prospecto:   { label: 'Prospecto',         color: '#6B7280', bg: 'rgba(107,114,128,0.1)' },
  proposta:    { label: 'Proposta Enviada',   color: '#F59E0B', bg: 'rgba(245,158,11,0.1)'  },
  negociacao:  { label: 'Em Negociação',      color: '#0077FF', bg: 'rgba(0,119,255,0.1)'   },
  fechado:     { label: 'Fechado ✓',          color: '#10B981', bg: 'rgba(16,185,129,0.1)'  },
  perdido:     { label: 'Perdido',            color: '#EF4444', bg: 'rgba(239,68,68,0.1)'   },
};

const SERVICE_GROUPS = [
  { group: 'Inspeções e Vistorias', items: ['Inspeção Predial','Inspeção Predial com Base na NBR 16747','Inspeção de Fachadas','Inspeção de Coberturas','Inspeção de Impermeabilização','Inspeção de Reservatórios','Inspeção de Sistemas Hidrossanitários','Inspeção de Sistemas Elétricos','Inspeção de SPDA','Inspeção de Sistemas de Combate a Incêndio (SPCI)','Inspeção de Áreas de Lazer','Inspeção de Piscinas','Inspeção de Quadras Poliesportivas','Inspeção de Estruturas de Concreto','Inspeção de Estruturas Metálicas','Inspeção para Recebimento de Obras','Vistoria Cautelar de Vizinhança','Vistoria Técnica para Entrega de Empreendimentos','Vistoria de Unidades Privativas','Vistoria de Áreas Comuns','Vistoria para Identificação de Infiltrações','Vistoria para Identificação de Vazamentos','Vistoria de Reformas','Vistoria de Obras em Andamento','Vistoria para Recebimento de Serviços'] },
  { group: 'Laudos Técnicos', items: ['Laudo de Inspeção Predial','Laudo de Manifestações Patológicas','Laudo de Fachadas','Laudo de Coberturas','Laudo de Impermeabilização','Laudo de Estruturas de Concreto','Laudo de Estruturas Metálicas','Laudo de Corrosão','Laudo de Biocorrosão (MIC)','Laudo de Infiltrações','Laudo de Vazamentos','Laudo de Desempenho Construtivo','Laudo de Recebimento de Obras','Laudo de Entrega de Empreendimentos','Laudo de Reservatórios','Laudo de Piscinas','Laudo de SPDA','Laudo de Sistemas de Combate a Incêndio','Laudo para Assistência Técnica em Garantia','Laudo para Ações Judiciais','Laudo para Produção Antecipada de Provas','Laudo para Seguro','Laudo para Compra e Venda de Imóveis'] },
  { group: 'Perícias e Assistência Técnica', items: ['Assistência Técnica Judicial','Assistência Técnica Extrajudicial','Parecer Técnico de Engenharia','Parecer Técnico de Patologias','Parecer Técnico Estrutural','Produção de Quesitos Técnicos','Análise de Laudos Periciais','Impugnação Técnica de Laudos','Acompanhamento de Perícias Judiciais','Consultoria para Litígios Construtivos'] },
  { group: 'Ensaios e Diagnósticos', items: ['Percussão de Revestimentos','Inspeção por Drone','Registro Fotográfico Aéreo','Mapeamento de Fachadas por Drone','Termografia Infravermelha','Medição de Umidade','Ensaio de Estanqueidade','Testes Hidráulicos','Testes de Pressão','Inspeção Endoscópica','Levantamento Cadastral','Mapeamento de Danos','Avaliação do Estado de Conservação','Avaliação do Estado de Manutenção'] },
  { group: 'Manutenção e Gestão', items: ['Elaboração de Plano de Manutenção','Implantação de Plano de Manutenção','Gestão da Manutenção Predial','Auditoria de Manutenção','Diagnóstico da Manutenção','Calendário de Manutenção','Planejamento Orçamentário da Manutenção','Controle de Indicadores de Manutenção','Gestão da Durabilidade das Edificações','Elaboração de Procedimentos Operacionais','Criação de Checklists de Inspeção','Criação de Rotinas de Manutenção'] },
  { group: 'Projetos e Especificações', items: ['Projeto de Recuperação Estrutural','Projeto de Recuperação de Fachadas','Projeto de Recuperação de Coberturas','Projeto de Impermeabilização','Projeto de Reforço Estrutural','Projeto de Recuperação de Reservatórios','Projeto de Recuperação de Piscinas','Memorial Descritivo','Especificação Técnica de Serviços','Compatibilização Técnica'] },
  { group: 'Fiscalização e Gerenciamento', items: ['Fiscalização de Obras','Fiscalização de Reformas','Fiscalização de Serviços de Manutenção','Fiscalização de Recuperação Estrutural','Fiscalização de Impermeabilização','Fiscalização de Fachadas','Gerenciamento de Obras','Gerenciamento de Reformas','Gerenciamento de Recuperações'] },
  { group: 'Consultoria Condominial', items: ['Consultoria para Síndicos','Consultoria para Administradoras','Consultoria para Condomínios Residenciais','Consultoria para Condomínios Comerciais','Consultoria para Condomínios Horizontais','Consultoria para Construtoras','Consultoria em Garantias Construtivas','Consultoria em Manutenção Predial','Consultoria em Durabilidade das Edificações','Consultoria para Assembleias'] },
  { group: 'Reformas e Adequações', items: ['Gestão de Reformas conforme NBR 16280','Análise de Plano de Reforma','Aprovação Técnica de Reformas','Fiscalização de Reformas','Acompanhamento de Reformas','Recebimento de Reformas','Auditoria de Reformas Executadas'] },
  { group: 'Termos e Contratações', items: ['Elaboração de Termo de Referência','Elaboração de Escopo Técnico','Elaboração de Caderno de Encargos','Apoio Técnico em Licitações Privadas','Análise de Propostas Técnicas','Equalização Técnica de Propostas','Acompanhamento de Contratações','Fiscalização de Contratos'] },
  { group: 'Treinamentos e Capacitações', items: ['Treinamento para Síndicos','Treinamento para Zeladores','Treinamento para Equipes de Manutenção','Palestras Técnicas','Workshops de Engenharia','Cursos de Inspeção Predial','Cursos de Manutenção Predial','Cursos sobre NBR 16280','Cursos sobre Patologias das Construções','Cursos sobre Durabilidade das Edificações'] },
  { group: 'Pesquisa e Área Acadêmica', items: ['Pesquisa Aplicada em Corrosão','Pesquisa Aplicada em Biocorrosão','Estudos de Durabilidade','Desenvolvimento de Metodologias de Inspeção','Consultoria Técnica para Pesquisas','Produção de Conteúdo Técnico e Científico'] },
];

const formatPhone = (v) => { const d = v.replace(/\D/g,'').slice(0,11); if(d.length<=2)return d; if(d.length<=6)return`(${d.slice(0,2)}) ${d.slice(2)}`; if(d.length<=10)return`(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`; return`(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`; };
const formatCNPJ = (v) => { const d=v.replace(/\D/g,'').slice(0,14); if(d.length<=2)return d; if(d.length<=5)return`${d.slice(0,2)}.${d.slice(2)}`; if(d.length<=8)return`${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5)}`; if(d.length<=12)return`${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8)}`; return`${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12)}`; };
const formatCPF = (v) => { const d=v.replace(/\D/g,'').slice(0,11); if(d.length<=3)return d; if(d.length<=6)return`${d.slice(0,3)}.${d.slice(3)}`; if(d.length<=9)return`${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`; return`${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`; };
const formatCurrency = (v) => { const digits=v.replace(/\D/g,''); if(!digits)return''; const num=parseInt(digits,10)/100; return num.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}); };
export const parseCurrency = (v) => parseFloat(String(v||'').replace(/\./g,'').replace(',','.'))||0;

// ─── Service Picker ────────────────────────────────────
function ServicePicker({ selected, onChange, onClose }) {
  const [tab, setTab] = useState('grupo');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [search, setSearch] = useState('');
  const [custom, setCustom] = useState('');

  const allItems = SERVICE_GROUPS.flatMap(g => g.items.map(item => ({ item, group: g.group })));
  const filtered = search ? allItems.filter(({item}) => item.toLowerCase().includes(search.toLowerCase())) : [];

  const toggle = (item) => {
    if (selected.includes(item)) onChange(selected.filter(s => s !== item));
    else onChange([...selected, item]);
  };

  const addCustom = () => {
    if (custom.trim() && !selected.includes(custom.trim())) {
      onChange([...selected, custom.trim()]);
      setCustom('');
    }
  };

  const groupItems = selectedGroup ? SERVICE_GROUPS.find(g => g.group === selectedGroup)?.items || [] : [];

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.75)' }} onClick={onClose}>
      <div className="w-full max-w-lg rounded-t-3xl pb-6 flex flex-col" style={{ background: 'var(--card)', maxHeight: '85vh' }} onClick={e => e.stopPropagation()}>
        <div className="px-5 pt-5 pb-3 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm" style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text)' }}>Selecionar Serviços</h3>
            <button onClick={onClose} style={{ color: 'var(--muted)' }}><X size={18} /></button>
          </div>
          {/* Tabs */}
          <div className="flex gap-1 mb-3 p-1 rounded-xl" style={{ background: 'var(--bg)' }}>
            {[['grupo','Por Grupo'],['busca','Buscar']].map(([k,l]) => (
              <button key={k} onClick={() => { setTab(k); setSelectedGroup(null); }}
                className="flex-1 py-2 rounded-lg text-xs font-semibold"
                style={{ background: tab===k ? 'var(--blue)' : 'transparent', color: tab===k ? 'white' : 'var(--muted)', fontFamily: 'Inter' }}>
                {l}
              </button>
            ))}
          </div>
          {/* Selected badges */}
          {selected.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {selected.map(s => (
                <span key={s} onClick={() => toggle(s)}
                  className="text-xs px-2 py-1 rounded-full cursor-pointer flex items-center gap-1"
                  style={{ background: 'rgba(0,119,255,0.15)', color: 'var(--blue)', border: '1px solid rgba(0,119,255,0.3)' }}>
                  {s.length > 25 ? s.slice(0,25)+'…' : s} <X size={10} />
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-5">
          {/* Busca */}
          {tab === 'busca' && (
            <>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Digite para buscar..." autoFocus
                className="w-full rounded-xl px-4 py-2.5 text-sm mb-3"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Inter' }} />
              {search && filtered.map(({item, group}) => (
                <button key={item} onClick={() => toggle(item)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-left"
                  style={{ background: selected.includes(item) ? 'rgba(0,119,255,0.1)' : 'var(--bg)', border: `1px solid ${selected.includes(item) ? 'rgba(0,119,255,0.3)' : 'var(--border)'}` }}>
                  <div className="w-4 h-4 rounded flex-shrink-0 flex items-center justify-center"
                    style={{ background: selected.includes(item) ? 'var(--blue)' : 'var(--border)' }}>
                    {selected.includes(item) && <span style={{ color: 'white', fontSize: '10px' }}>✓</span>}
                  </div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: 'var(--text)', fontFamily: 'Inter' }}>{item}</p>
                    <p className="text-xs" style={{ color: 'var(--dim)' }}>{group}</p>
                  </div>
                </button>
              ))}
            </>
          )}

          {/* Por grupo */}
          {tab === 'grupo' && !selectedGroup && (
            <div className="space-y-1.5">
              {SERVICE_GROUPS.map(g => {
                const count = g.items.filter(i => selected.includes(i)).length;
                return (
                  <button key={g.group} onClick={() => setSelectedGroup(g.group)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-left"
                    style={{ background: count > 0 ? 'rgba(0,119,255,0.08)' : 'var(--bg)', border: `1px solid ${count > 0 ? 'rgba(0,119,255,0.3)' : 'var(--border)'}` }}>
                    <span className="text-sm font-medium" style={{ color: 'var(--text)', fontFamily: 'Inter' }}>{g.group}</span>
                    <div className="flex items-center gap-2">
                      {count > 0 && <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: 'var(--blue)', color: 'white' }}>{count}</span>}
                      <ChevronRight size={14} style={{ color: 'var(--muted)' }} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {tab === 'grupo' && selectedGroup && (
            <>
              <button onClick={() => setSelectedGroup(null)} className="flex items-center gap-2 mb-3 text-sm" style={{ color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter' }}>
                ← {selectedGroup}
              </button>
              <div className="space-y-1.5">
                {groupItems.map(item => (
                  <button key={item} onClick={() => toggle(item)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left"
                    style={{ background: selected.includes(item) ? 'rgba(0,119,255,0.1)' : 'var(--bg)', border: `1px solid ${selected.includes(item) ? 'rgba(0,119,255,0.3)' : 'var(--border)'}` }}>
                    <div className="w-4 h-4 rounded flex-shrink-0 flex items-center justify-center"
                      style={{ background: selected.includes(item) ? 'var(--blue)' : 'var(--border)' }}>
                      {selected.includes(item) && <span style={{ color: 'white', fontSize: '10px' }}>✓</span>}
                    </div>
                    <span className="text-sm" style={{ color: 'var(--text)', fontFamily: 'Inter' }}>{item}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Personalizado */}
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            <p className="text-xs font-bold mb-2" style={{ color: 'var(--muted)' }}>✏️ PERSONALIZADO</p>
            <div className="flex gap-2">
              <input value={custom} onChange={e => setCustom(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCustom()}
                placeholder="Descreva o serviço..."
                className="flex-1 rounded-xl px-3 py-2 text-sm"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Inter' }} />
              <button onClick={addCustom}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
                style={{ background: 'var(--blue)', fontFamily: 'Inter' }}>
                + Add
              </button>
            </div>
          </div>
        </div>

        <div className="px-5 pt-4 flex-shrink-0">
          <button onClick={onClose}
            className="btn-glow w-full py-3 rounded-2xl text-white text-sm font-semibold"
            style={{ fontFamily: 'Inter' }}>
            Confirmar {selected.length > 0 ? `(${selected.length} serviço${selected.length > 1 ? 's' : ''})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Serviços com valores individuais ─────────────────
function ServicesWithValues({ services, onChange }) {
  const addService = () => onChange([...services, { name: '', value: '' }]);
  const update = (i, field, val) => {
    const updated = [...services];
    if (field === 'value') val = formatCurrency(val);
    updated[i] = { ...updated[i], [field]: val };
    onChange(updated);
  };
  const remove = (i) => onChange(services.filter((_, idx) => idx !== i));

  return (
    <div>
      {services.map((s, i) => (
        <div key={i} className="flex gap-2 mb-2">
          <input value={s.name} onChange={e => update(i, 'name', e.target.value)}
            placeholder="Serviço"
            className="flex-1 rounded-xl px-3 py-2 text-sm"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Inter' }} />
          <div className="relative w-28">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--muted)' }}>R$</span>
            <input value={s.value} onChange={e => update(i, 'value', e.target.value)}
              placeholder="0,00"
              className="w-full rounded-xl pl-7 pr-2 py-2 text-sm"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Inter' }} />
          </div>
          <button onClick={() => remove(i)}
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 self-center"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>
            <Trash2 size={12} />
          </button>
        </div>
      ))}
      <button onClick={addService}
        className="w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1"
        style={{ background: 'var(--bg)', border: '1px dashed var(--border)', color: 'var(--muted)', fontFamily: 'Inter' }}>
        <Plus size={12} /> Adicionar serviço
      </button>
    </div>
  );
}

// ─── Modal de Cliente ──────────────────────────────────
function ClientModal({ client, onClose, onSave }) {
  const [form, setForm] = useState(client || {
    name: '', building: '', docType: 'CNPJ', doc: '', responsible: '',
    phone: '', email: '', address: '',
    status: 'prospecto',
    serviceItems: [], // [{name, value}]
    notes: '',
  });
  const [showServicePicker, setShowServicePicker] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Serviços selecionados (nomes) para o picker
  const selectedServiceNames = (form.serviceItems || []).map(s => s.name).filter(Boolean);

  const handleServicePickerChange = (names) => {
    // Mantém valores já preenchidos, adiciona novos
    const existing = form.serviceItems || [];
    const updated = names.map(name => {
      const found = existing.find(e => e.name === name);
      return found || { name, value: '' };
    });
    set('serviceItems', updated);
  };

  const totalValue = (form.serviceItems || []).reduce((s, i) => s + parseCurrency(i.value), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.75)' }} onClick={onClose}>
      <div className="w-full max-w-lg rounded-t-3xl pb-8 flex flex-col" style={{ background: 'var(--card)', maxHeight: '93vh' }} onClick={e => e.stopPropagation()}>
        <div className="px-5 pt-5 pb-3 flex items-center justify-between flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="font-bold text-base" style={{ fontFamily: 'Syne, sans-serif' }}>{client ? 'Editar' : 'Novo'} Cliente</h2>
          <button onClick={onClose} style={{ color: 'var(--muted)' }}><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--muted)' }}>Nome / Razão Social *</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Condomínio..."
                className="w-full rounded-xl px-3 py-2.5 text-sm"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Inter' }} />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--muted)' }}>Edifício</label>
              <input value={form.building} onChange={e => set('building', e.target.value)} placeholder="Ed. Nome"
                className="w-full rounded-xl px-3 py-2.5 text-sm"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Inter' }} />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--muted)' }}>Documento</label>
            <div className="flex gap-2">
              <select value={form.docType} onChange={e => { set('docType', e.target.value); set('doc', ''); }}
                className="rounded-xl px-3 py-2.5 text-sm w-20 flex-shrink-0"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Inter' }}>
                <option>CNPJ</option><option>CPF</option>
              </select>
              <input value={form.doc} onChange={e => set('doc', form.docType==='CNPJ' ? formatCNPJ(e.target.value) : formatCPF(e.target.value))}
                placeholder={form.docType==='CNPJ' ? '00.000.000/0001-00' : '000.000.000-00'}
                className="flex-1 rounded-xl px-3 py-2.5 text-sm"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Inter' }} />
            </div>
          </div>

          {form.docType === 'CNPJ' && (
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--muted)' }}>Responsável / Contato</label>
              <input value={form.responsible || ''} onChange={e => set('responsible', e.target.value)}
                placeholder="Nome do síndico ou responsável"
                className="w-full rounded-xl px-3 py-2.5 text-sm"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Inter' }} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--muted)' }}>Telefone / WhatsApp</label>
              <input value={form.phone} onChange={e => set('phone', formatPhone(e.target.value))} placeholder="(81) 99999-9999"
                className="w-full rounded-xl px-3 py-2.5 text-sm"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Inter' }} />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--muted)' }}>E-mail</label>
              <input value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@cond.com"
                className="w-full rounded-xl px-3 py-2.5 text-sm"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Inter' }} />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--muted)' }}>Endereço</label>
            <input value={form.address} onChange={e => set('address', e.target.value)} placeholder="Rua, N° — Bairro, Cidade/UF"
              className="w-full rounded-xl px-3 py-2.5 text-sm"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Inter' }} />
          </div>

          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--muted)' }}>Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-sm"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Inter' }}>
              {Object.entries(STATUS_CONFIG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>

          {/* Serviços com valores */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>Serviços e Valores</label>
              <button onClick={() => setShowServicePicker(true)}
                className="text-xs px-3 py-1 rounded-lg font-semibold"
                style={{ background: 'rgba(0,119,255,0.1)', color: 'var(--blue)', border: '1px solid rgba(0,119,255,0.2)', fontFamily: 'Inter' }}>
                + Selecionar
              </button>
            </div>
            <ServicesWithValues
              services={form.serviceItems || []}
              onChange={v => set('serviceItems', v)} />
            {totalValue > 0 && (
              <div className="flex justify-between mt-2 px-3 py-2 rounded-xl"
                style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>Total</span>
                <span className="text-sm font-bold" style={{ color: '#10B981', fontFamily: 'Syne' }}>
                  R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--muted)' }}>Observações</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="Notas sobre o cliente..." rows={3}
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

      {showServicePicker && (
        <ServicePicker
          selected={selectedServiceNames}
          onChange={handleServicePickerChange}
          onClose={() => setShowServicePicker(false)} />
      )}
    </div>
  );
}

// ─── Card de Cliente ───────────────────────────────────
function ClientCard({ client, onEdit, onExport, onWhatsApp, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[client.status] || STATUS_CONFIG.prospecto;
  const items = client.serviceItems || [];
  const totalValue = items.reduce((s, i) => s + parseCurrency(i.value), 0);
  const displayValue = totalValue > 0 ? totalValue : parseCurrency(client.value || '');
  const displayService = items.length > 0 ? items.map(i => i.name).filter(Boolean) : (client.service ? [client.service] : []);

  return (
    <div className="rounded-2xl mb-3 overflow-hidden"
      style={{ background: 'var(--card)', border: '1px solid var(--border)', borderLeft: `3px solid ${cfg.color}` }}>

      {/* Header clicável */}
      <button className="w-full flex items-start gap-3 p-4 text-left"
        onClick={() => setExpanded(e => !e)}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-semibold text-sm" style={{ color: 'var(--text)', fontFamily: 'Syne' }}>{client.name}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}33` }}>
              {cfg.label}
            </span>
          </div>
          {client.building && <p className="text-xs" style={{ color: 'var(--muted)' }}>🏢 {client.building}</p>}
          {displayService.length > 0 && (
            <p className="text-xs mt-1" style={{ color: 'var(--blue)' }}>
              🔧 {displayService[0]}{displayService.length > 1 ? ` +${displayService.length - 1}` : ''}
            </p>
          )}
          {displayValue > 0 && (
            <p className="text-xs mt-1 font-bold" style={{ color: '#10B981' }}>
              R$ {displayValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          )}
        </div>
        <div style={{ color: 'var(--dim)', flexShrink: 0, marginTop: 2 }}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {/* Detalhes expandidos */}
      {expanded && (
        <div className="px-4 pb-4" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="pt-3 space-y-2">
            {client.responsible && (
              <div className="flex items-center gap-2">
                <span className="text-xs w-16 font-semibold" style={{ color: 'var(--dim)' }}>Contato</span>
                <span className="text-xs font-medium" style={{ color: 'var(--blue)' }}>{client.responsible}</span>
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-2">
                <span className="text-xs w-16 font-semibold" style={{ color: 'var(--dim)' }}>Telefone</span>
                <span className="text-xs" style={{ color: 'var(--text)' }}>{client.phone}</span>
              </div>
            )}
            {client.email && (
              <div className="flex items-center gap-2">
                <span className="text-xs w-16 font-semibold" style={{ color: 'var(--dim)' }}>E-mail</span>
                <span className="text-xs" style={{ color: 'var(--text)' }}>{client.email}</span>
              </div>
            )}
            {client.doc && (
              <div className="flex items-center gap-2">
                <span className="text-xs w-16 font-semibold" style={{ color: 'var(--dim)' }}>{client.docType || 'Doc'}</span>
                <span className="text-xs" style={{ color: 'var(--text)' }}>{client.doc}</span>
              </div>
            )}
            {client.address && (
              <div className="flex items-start gap-2">
                <span className="text-xs w-16 font-semibold flex-shrink-0" style={{ color: 'var(--dim)' }}>Endereço</span>
                <span className="text-xs" style={{ color: 'var(--text)' }}>{client.address}</span>
              </div>
            )}
            {items.length > 0 && (
              <div className="pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                <p className="text-xs font-bold mb-2" style={{ color: 'var(--muted)', letterSpacing: '0.08em' }}>SERVIÇOS</p>
                {items.map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-1.5"
                    style={{ borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <span className="text-xs flex-1 pr-2" style={{ color: 'var(--text)' }}>{item.name || '—'}</span>
                    <span className="text-xs font-bold flex-shrink-0" style={{ color: '#10B981' }}>
                      {parseCurrency(item.value) > 0 ? `R$ ${parseCurrency(item.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}
                    </span>
                  </div>
                ))}
                {totalValue > 0 && (
                  <div className="flex justify-between pt-2 mt-1">
                    <span className="text-xs font-bold" style={{ color: 'var(--muted)' }}>Total</span>
                    <span className="text-sm font-bold" style={{ color: '#10B981', fontFamily: 'Syne' }}>
                      R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>
            )}
            {client.notes && (
              <div className="pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                <p className="text-xs font-bold mb-1" style={{ color: 'var(--muted)' }}>OBSERVAÇÕES</p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text)' }}>{client.notes}</p>
              </div>
            )}

            {/* Ações */}
            <div className="flex gap-2 pt-3">
              {client.phone && (
                <button onClick={() => onWhatsApp(client)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1"
                  style={{ background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.2)', color: '#25D366', fontFamily: 'Inter' }}>
                  <MessageCircle size={12} /> WhatsApp
                </button>
              )}
              <button onClick={() => onExport(client)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1"
                style={{ background: 'rgba(0,119,255,0.1)', border: '1px solid rgba(0,119,255,0.2)', color: 'var(--blue)', fontFamily: 'Inter' }}>
                <Download size={12} /> PDF
              </button>
              <button onClick={() => onEdit(client)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--muted)', fontFamily: 'Inter' }}>
                ✏️ Editar
              </button>
                <button onClick={() => { if (window.confirm(`Excluir ${client.name}?`)) onDelete(client.id); }}
                className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontFamily: 'Inter' }}>
                <Trash2 size={12} /> Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ─── Helpers de Follow-up ──────────────────────────────
function daysSince(dateStr) {
  if (!dateStr) return 999;
  try { return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000); } catch { return 999; }
}

function urgencyConfig(days) {
  if (days >= 15) return { color: '#EF4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', label: `${days}d sem contato`, dot: '#EF4444' };
  if (days >= 8)  return { color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', label: `${days}d sem contato`, dot: '#F59E0B' };
  return { color: '#0077FF', bg: 'rgba(0,119,255,0.06)', border: 'rgba(0,119,255,0.2)', label: `${days}d sem contato`, dot: '#0077FF' };
}

// ─── Card de Follow-up ─────────────────────────────────
function FollowupCard({ client, onContacted, onWhatsApp, onGenerate, generatingMsg, generatedMsg }) {
  const days = daysSince(client.lastContact || client.createdAt);
  const urg = urgencyConfig(days);
  const cfg = STATUS_CONFIG[client.status] || STATUS_CONFIG.proposta;
  const services = (client.serviceItems || []).map(s => s.name).filter(Boolean).join(', ') || client.service || '';
  const totalValue = (client.serviceItems || []).reduce((s, i) => s + parseCurrency(i.value), 0) || parseCurrency(client.value || '');
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-2xl mb-3 overflow-hidden"
      style={{ background: urg.bg, border: `1.5px solid ${urg.border}`, borderLeft: `4px solid ${urg.color}` }}>

      {/* Header */}
      <button className="w-full flex items-start gap-3 p-4 text-left" onClick={() => setExpanded(e => !e)}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-semibold text-sm" style={{ color: 'var(--text)', fontFamily: 'Syne' }}>{client.name}</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: `${urg.color}20`, color: urg.color, border: `1px solid ${urg.color}40` }}>
              {urg.label}
            </span>
          </div>
          {client.building && <p className="text-xs mb-0.5" style={{ color: 'var(--muted)' }}>🏢 {client.building}</p>}
          {services && <p className="text-xs" style={{ color: 'var(--muted)' }}>🔧 {services.length > 45 ? services.slice(0,45)+'…' : services}</p>}
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}33` }}>
              {cfg.label}
            </span>
            {totalValue > 0 && <span className="text-xs font-bold" style={{ color: '#10B981' }}>R${(totalValue/1000).toFixed(1)}k</span>}
          </div>
        </div>
        <div style={{ color: 'var(--dim)', flexShrink: 0, marginTop: 2 }}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {/* Expandido */}
      {expanded && (
        <div className="px-4 pb-4" style={{ borderTop: `1px solid ${urg.border}` }}>

          {/* Mensagem gerada pela IA */}
          {generatedMsg && (
            <div className="mt-3 rounded-xl p-3 mb-3"
              style={{ background: 'rgba(0,119,255,0.06)', border: '1px solid rgba(0,119,255,0.2)' }}>
              <p className="text-xs font-bold mb-2" style={{ color: 'var(--blue)' }}>✨ MENSAGEM GERADA</p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text)', fontFamily: 'Inter' }}>{generatedMsg}</p>
            </div>
          )}

          {/* Ações */}
          <div className="grid grid-cols-2 gap-2 mt-3">
            <button
              onClick={() => onGenerate(client)}
              disabled={generatingMsg}
              className="py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
              style={{ background: 'rgba(0,119,255,0.1)', border: '1px solid rgba(0,119,255,0.25)', color: 'var(--blue)', fontFamily: 'Inter', opacity: generatingMsg ? 0.6 : 1 }}>
              {generatingMsg ? <span style={{ animation: 'pulse 1s infinite' }}>⏳</span> : <Sparkles size={12} />}
              {generatingMsg ? 'Gerando...' : 'Gerar mensagem'}
            </button>
            {client.phone && (
              <button
                onClick={() => onWhatsApp(client, generatedMsg)}
                className="py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                style={{ background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.25)', color: '#25D366', fontFamily: 'Inter' }}>
                <MessageCircle size={12} /> WhatsApp
              </button>
            )}
          </div>
          <button
            onClick={() => onContacted(client)}
            className="w-full mt-2 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
            style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#10B981', fontFamily: 'Inter' }}>
            <CheckCheck size={13} /> Marcar como contatado
          </button>
        </div>
      )}
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
  const [crmTab, setCrmTab] = useState('clientes'); // 'clientes' | 'followup'
  const [followupDays, setFollowupDays] = useState(7);
  const [generatingMsg, setGeneratingMsg] = useState(null);
  const [generatedMsgs, setGeneratedMsgs] = useState({});
  const { data: session } = useSession();

  useEffect(() => {
    try { const s = localStorage.getItem('durabel_clients'); if (s) setClients(JSON.parse(s)); } catch {}
  }, []);

  const save = (updated) => {
    setClients(updated);
    try { localStorage.setItem('durabel_clients', JSON.stringify(updated)); } catch {}
    fetch('/api/kv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: `durabel_clients_${session?.user?.email || 'default'}`, data: updated }),
    }).catch(() => {});
  };

  const handleSave = (form) => {
    if (editing) save(clients.map(c => c.id === editing.id ? { ...form, id: editing.id } : c));
    else save([{ ...form, id: Date.now().toString(), createdAt: new Date().toISOString(), lastContact: new Date().toISOString() }, ...clients]);
    setEditing(null); setShowModal(false);
  };

  const handleDelete = (id) => {
  save(clients.filter(c => c.id !== id));
};

  const handleWhatsApp = async (client) => {
    const service = (client.serviceItems || [])[0]?.name || client.service || 'nossos serviços';
    const msg = `Olá! Aqui é da DURAR Consultoria. Gostaria de falar sobre ${service}.`;
    try {
      const res = await fetch('/api/whatsapp', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ phone: client.phone, message: msg }) });
      const data = await res.json();
      alert(res.ok ? 'Mensagem enviada!' : 'Erro: ' + data.error);
    } catch { alert('Erro ao enviar'); }
  };

  const filtered = clients.filter(c => {
    const ms = !search || [c.name, c.building, ...(c.serviceItems||[]).map(s=>s.name)].join(' ').toLowerCase().includes(search.toLowerCase());
    const mf = filter === 'todos' || c.status === filter;
    return ms && mf;
  });

  const total = clients.length;
  const fechados = clients.filter(c => c.status === 'fechado').length;
  const pipeline = clients.filter(c => ['proposta','negociacao'].includes(c.status))
    .reduce((s, c) => s + (c.serviceItems||[]).reduce((ss,i) => ss+parseCurrency(i.value), 0) + parseCurrency(c.value||''), 0);
  const conversion = total > 0 ? Math.round((fechados/total)*100) : 0;

  // Follow-up: clientes com proposta/negociação há X dias
  const followupClients = clients
    .filter(c => ['proposta','negociacao'].includes(c.status))
    .map(c => ({ ...c, _days: daysSince(c.lastContact || c.createdAt) }))
    .filter(c => c._days >= followupDays)
    .sort((a, b) => b._days - a._days);

  const handleContacted = (client) => {
    const updated = clients.map(c => c.id === client.id
      ? { ...c, lastContact: new Date().toISOString(), status: c.status === 'proposta' ? 'negociacao' : c.status }
      : c);
    save(updated);
  };

  const handleFollowupWhatsApp = (client, msg) => {
    const text = msg || `Olá! Aqui é Felipe da DURAR Consultoria. Tudo bem? Gostaria de dar seguimento à nossa proposta de ${(client.serviceItems||[])[0]?.name || client.service || 'serviço técnico'}. Podemos conversar?`;
    const phone = client.phone.replace(/\D/g,'');
    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleGenerateMsg = async (client) => {
    setGeneratingMsg(client.id);
    const services = (client.serviceItems||[]).map(s=>s.name).filter(Boolean).join(', ') || client.service || 'serviço técnico';
    const days = daysSince(client.lastContact || client.createdAt);
    const totalValue = (client.serviceItems||[]).reduce((s,i)=>s+parseCurrency(i.value),0)||parseCurrency(client.value||'');
    try {
      const settings = JSON.parse(localStorage.getItem('durabel_settings')||'{}');
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          anthropicKey: settings.anthropic_key || '',
          systemOverride: `Você é Felipe Casa Nova, diretor da DURAR Consultoria e Engenharia (Recife/PE). Escreva uma mensagem de WhatsApp de follow-up profissional, calorosa e direta para retomar contato com um cliente. Máximo 4 linhas. Sem saudação formal demais. Sem asteriscos ou markdown. Apenas o texto da mensagem.`,
          messages: [{ role: 'user', content: `Cliente: ${client.name}${client.building ? ' / ' + client.building : ''}
Serviço proposto: ${services}
Valor: ${totalValue > 0 ? 'R$' + totalValue.toLocaleString('pt-BR') : 'não definido'}
Dias sem contato: ${days}
Responsável: ${client.responsible || 'não informado'}

Gere a mensagem de follow-up.` }],
        }),
      });
      const data = await res.json();
      setGeneratedMsgs(prev => ({ ...prev, [client.id]: data.content || '' }));
    } catch {
      setGeneratedMsgs(prev => ({ ...prev, [client.id]: `Olá! Aqui é Felipe da DURAR Consultoria. Tudo bem? Gostaria de retomar nossa conversa sobre ${services}. Podemos avançar?` }));
    }
    setGeneratingMsg(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header com abas */}
      <div className="px-4 pt-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-bold text-base" style={{ fontFamily: 'Syne, sans-serif' }}>
              {crmTab === 'clientes' ? 'Clientes' : 'Follow-up'}
            </h2>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              {crmTab === 'clientes'
                ? `${total} cadastrados · ${conversion}% conversão`
                : `${followupClients.length} aguardando retorno`}
            </p>
          </div>
          {crmTab === 'clientes' && (
            <button onClick={() => { setEditing(null); setShowModal(true); }}
              className="btn-glow h-9 px-4 rounded-xl flex items-center gap-1.5 text-white text-sm" style={{ fontFamily: 'Inter' }}>
              <Plus size={15} /> Novo
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-3">
          <button onClick={() => setCrmTab('clientes')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold"
            style={{ background: crmTab==='clientes' ? 'var(--blue)' : 'var(--bg)', color: crmTab==='clientes' ? 'white' : 'var(--muted)', border: `1px solid ${crmTab==='clientes' ? 'var(--blue)' : 'var(--border)'}`, fontFamily: 'Inter' }}>
            <Building2 size={12} /> Clientes
          </button>
          <button onClick={() => setCrmTab('followup')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold relative"
            style={{ background: crmTab==='followup' ? '#F59E0B' : 'var(--bg)', color: crmTab==='followup' ? 'white' : 'var(--muted)', border: `1px solid ${crmTab==='followup' ? '#F59E0B' : 'var(--border)'}`, fontFamily: 'Inter' }}>
            <Bell size={12} /> Follow-up
            {followupClients.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center"
                style={{ background: '#EF4444', color: 'white', fontSize: 10 }}>
                {followupClients.length}
              </span>
            )}
          </button>
        </div>

        {/* Conteúdo condicional do header */}
        {crmTab === 'clientes' && (
          <>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[['Total', total, 'var(--blue)'], ['Fechados', fechados, '#10B981'], ['Pipeline', pipeline > 0 ? `R$${(pipeline/1000).toFixed(0)}k` : '—', '#F59E0B']].map(([l,v,col]) => (
                <div key={l} className="rounded-xl p-2 text-center" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                  <div className="text-base font-bold" style={{ color: col, fontFamily: 'Syne' }}>{v}</div>
                  <div className="text-xs" style={{ color: 'var(--muted)' }}>{l}</div>
                </div>
              ))}
            </div>
            <div className="relative mb-2">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente ou serviço..."
                className="w-full rounded-xl pl-8 pr-4 py-2.5 text-sm"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Inter' }} />
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-3" style={{ scrollbarWidth: 'none' }}>
              {[['todos','Todos'], ...Object.entries(STATUS_CONFIG).map(([k,v]) => [k,v.label])].map(([k,l]) => (
                <button key={k} onClick={() => setFilter(k)}
                  className="px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0"
                  style={{ background: filter===k ? 'var(--blue)' : 'var(--bg)', color: filter===k ? 'white' : 'var(--muted)', border: `1px solid ${filter===k ? 'var(--blue)' : 'var(--border)'}`, fontFamily: 'Inter' }}>
                  {l}
                </button>
              ))}
            </div>
          </>
        )}

        {crmTab === 'followup' && (
          <div className="flex items-center gap-2 pb-3">
            <Clock size={13} style={{ color: 'var(--muted)' }} />
            <span className="text-xs" style={{ color: 'var(--muted)' }}>Alertar após</span>
            {[3,5,7,14].map(d => (
              <button key={d} onClick={() => setFollowupDays(d)}
                className="px-3 py-1 rounded-full text-xs font-semibold"
                style={{ background: followupDays===d ? '#F59E0B' : 'var(--bg)', color: followupDays===d ? 'white' : 'var(--muted)', border: `1px solid ${followupDays===d ? '#F59E0B' : 'var(--border)'}`, fontFamily: 'Inter' }}>
                {d}d
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto px-4 pt-4">
        {crmTab === 'clientes' ? (
          filtered.length === 0 ? (
            <div className="text-center py-16">
              <Building2 size={36} style={{ color: 'var(--dim)', margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--muted)', fontFamily: 'Inter' }}>{search ? 'Nenhum cliente encontrado' : 'Cadastre seu primeiro cliente'}</p>
            </div>
          ) : (
            filtered.map(c => (
              <ClientCard key={c.id} client={c}
                onEdit={c => { setEditing(c); setShowModal(true); }}
                onExport={exportClientPDF}
                onWhatsApp={handleWhatsApp}
                onDelete={handleDelete} />
            ))
          )
        ) : (
          followupClients.length === 0 ? (
            <div className="text-center py-16">
              <Bell size={36} style={{ color: 'var(--dim)', margin: '0 auto 12px' }} />
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--muted)', fontFamily: 'Inter' }}>Tudo em dia!</p>
              <p className="text-xs" style={{ color: 'var(--dim)' }}>Nenhuma proposta há mais de {followupDays} dias sem contato</p>
            </div>
          ) : (
            followupClients.map(c => (
              <FollowupCard key={c.id} client={c}
                onContacted={handleContacted}
                onWhatsApp={handleFollowupWhatsApp}
                onGenerate={handleGenerateMsg}
                generatingMsg={generatingMsg === c.id}
                generatedMsg={generatedMsgs[c.id]} />
            ))
          )
        )}
      </div>

      {showModal && <ClientModal client={editing} onClose={() => { setShowModal(false); setEditing(null); }} onSave={handleSave} />}
    </div>
  );
}
