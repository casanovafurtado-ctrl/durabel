// Utilitário de exportação de PDF para DURABEL
// Usa window.print() com CSS @media print otimizado

const DURAR_COLORS = {
  navy: '#060B18',
  blue: '#0077FF',
  neon: '#00BBFF',
  text: '#1A1A2E',
  muted: '#6B7280',
  light: '#F8FAFF',
  border: '#E2E8F0',
  white: '#FFFFFF',
};

function injectPrintStyles() {
  const id = 'durabel-print-styles';
  if (document.getElementById(id)) return;
  const style = document.createElement('style');
  style.id = id;
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');
    
    @media print {
      body > *:not(#durabel-pdf-root) { display: none !important; }
      #durabel-pdf-root { display: block !important; }
      @page { margin: 0; size: A4; }
    }
  `;
  document.head.appendChild(style);
}

function createPrintWindow(html) {
  // Remove modal anterior se existir
  const existing = document.getElementById('durabel-pdf-modal');
  if (existing) existing.remove();

  // Cria modal overlay dentro do app — sem abrir nova aba
  const modal = document.createElement('div');
  modal.id = 'durabel-pdf-modal';
  modal.style.cssText = `
    position: fixed; inset: 0; z-index: 99999;
    background: #fff; display: flex; flex-direction: column;
    font-family: 'Inter', sans-serif;
  `;

  modal.innerHTML = `
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
    <style>
      #durabel-pdf-modal * { box-sizing: border-box; }
      #durabel-pdf-modal .pdf-topbar {
        display: flex; align-items: center; justify-content: space-between;
        padding: 12px 16px; background: #060B18;
        border-bottom: 1px solid rgba(255,255,255,0.1);
        flex-shrink: 0; position: sticky; top: 0; z-index: 10;
      }
      #durabel-pdf-modal .pdf-content {
        flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch;
        background: #f5f5f5;
        display: flex; justify-content: center; padding: 20px 16px;
      }
      #durabel-pdf-modal .pdf-inner {
        background: white; width: 100%; max-width: 210mm;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        height: auto; overflow: visible;
      }
      #durabel-pdf-modal .btn-back {
        background: rgba(255,255,255,0.1); color: white;
        border: 1px solid rgba(255,255,255,0.2); padding: 8px 16px;
        border-radius: 10px; font-size: 14px; font-weight: 600;
        cursor: pointer; display: flex; align-items: center; gap: 6px;
        font-family: 'Inter', sans-serif;
      }
      #durabel-pdf-modal .btn-print {
        background: linear-gradient(135deg, #0055CC, #0099FF);
        color: white; border: none; padding: 8px 16px;
        border-radius: 10px; font-size: 14px; font-weight: 600;
        cursor: pointer; box-shadow: 0 2px 10px rgba(0,119,255,0.4);
        font-family: 'Inter', sans-serif;
      }
      @media print {
        #durabel-pdf-modal .pdf-topbar { display: none !important; }
        #durabel-pdf-modal {
          position: static !important;
          height: auto !important;
          overflow: visible !important;
        }
        #durabel-pdf-modal .pdf-content {
          padding: 0 !important;
          overflow: visible !important;
          height: auto !important;
          background: white !important;
        }
        #durabel-pdf-modal .pdf-inner {
          box-shadow: none !important;
          max-width: 100% !important;
          overflow: visible !important;
          height: auto !important;
        }
        body > *:not(#durabel-pdf-modal) { display: none !important; }
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        @page {
          margin: 0 !important;
          size: A4;
        }
        .pdf-running-footer {
          display: block !important;
          position: fixed !important;
          bottom: 0 !important;
          left: 0 !important;
          right: 0 !important;
        }
        .pdf-last-footer { display: none !important; }
      }
    </style>
    <div class="pdf-topbar">
      <span style="color:rgba(255,255,255,0.6);font-size:13px;font-weight:600;">DURAR — Visualização PDF</span>
      <div style="display:flex;gap:8px;align-items:center;">
        <button class="btn-print" onclick="window.print()">🖨️ Salvar PDF</button>
        <button onclick="document.getElementById('durabel-pdf-modal').remove()"
          style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:white;width:34px;height:34px;border-radius:10px;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;">
          ✕
        </button>
      </div>
    </div>
    <div class="pdf-content">
      <div class="pdf-inner">${html}</div>
    </div>
  `;

  document.body.appendChild(modal);
}

// ─────────────────────────────────────────────────────────
// TEMPLATE: ATA DE REUNIÃO
// ─────────────────────────────────────────────────────────
export function exportMinutePDF(minute) {
  const html = `
    <div style="width:210mm; min-height:297mm; padding:0; font-family:'Inter',sans-serif;">
      
      <!-- HEADER -->
      <div style="background:linear-gradient(135deg, #060B18 0%, #0D1526 60%, #0055CC 100%); padding:40px 50px 30px; position:relative; overflow:hidden;">
        
        <!-- Decorative circles -->
        <div style="position:absolute;top:-40px;right:-40px;width:200px;height:200px;border-radius:50%;background:rgba(0,187,255,0.08);"></div>
        <div style="position:absolute;bottom:-60px;left:30%;width:150px;height:150px;border-radius:50%;background:rgba(0,119,255,0.06);"></div>
        
        <!-- Logo area -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:28px;">
          <div>
            <div style="font-family:'Arial Black',Arial,sans-serif;font-size:26px;font-weight:900;color:#fff;letter-spacing:0.03em;">
              DUR<span style="color:#00BBFF;">AR</span>
            </div>
            <div style="font-size:9px;color:rgba(255,255,255,0.5);letter-spacing:0.25em;margin-top:2px;font-family:Arial,sans-serif;font-weight:600;">
              CONSULTORIA E ENGENHARIA
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:10px;color:rgba(255,255,255,0.5);letter-spacing:0.15em;">DOCUMENTO</div>
            <div style="font-family:'Playfair Display',serif;font-size:13px;color:#00BBFF;margin-top:2px;">Ata de Reunião</div>
          </div>
        </div>
        
        <!-- Title -->
        <div style="border-left:3px solid #00BBFF;padding-left:16px;">
          <div style="font-family:'Arial Black',Arial,sans-serif;font-size:20px;font-weight:900;color:#fff;line-height:1.3;letter-spacing:0.01em;">
            ${minute.title}
          </div>
          <div style="font-size:11px;color:rgba(255,255,255,0.5);margin-top:6px;font-weight:400;font-family:Arial,sans-serif;letter-spacing:0.05em;">
            ${minute.date}
          </div>
        </div>
        
        <!-- Accent line -->
        <div style="height:1px;background:linear-gradient(90deg,#00BBFF,transparent);margin-top:24px;"></div>
      </div>

      <!-- CONTENT -->
      <div style="padding:40px 50px;background:#fff;">
        
        <!-- Info strip -->
        <div style="display:flex;gap:0;margin-bottom:32px;border:1px solid #E2E8F0;border-radius:10px;overflow:hidden;">
          ${[
            { label: 'Data', value: minute.date?.split(' ')[0] || '—' },
            { label: 'Hora', value: minute.date?.split(' ')[1] || '—' },
            { label: 'Empresa', value: 'DURAR Consultoria' },
          ].map((item, i) => `
            <div style="flex:1;padding:14px 20px;background:${i % 2 === 0 ? '#F8FAFF' : '#fff'};border-right:1px solid #E2E8F0;">
              <div style="font-size:9px;font-weight:600;color:#6B7280;letter-spacing:0.15em;text-transform:uppercase;">${item.label}</div>
              <div style="font-size:13px;font-weight:600;color:#1A1A2E;margin-top:3px;">${item.value}</div>
            </div>
          `).join('')}
        </div>

        <!-- Content -->
        <div style="font-size:13px;line-height:1.8;color:#2D3748;white-space:pre-wrap;font-weight:300;">
          ${minute.content
            .replace(/^(#+\s.+)$/gm, '<div style="font-family:\'Playfair Display\',serif;font-size:15px;font-weight:600;color:#060B18;margin:24px 0 8px;padding-bottom:6px;border-bottom:2px solid #0077FF20;">$1</div>')
            .replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight:600;color:#060B18;">$1</strong>')
            .replace(/^[-•]\s(.+)$/gm, '<div style="display:flex;gap:8px;margin:4px 0;"><span style="color:#0077FF;margin-top:2px;">▸</span><span>$1</span></div>')
          }
        </div>
      </div>

      <!-- FOOTER -->


      <!-- Signature area — extracts named participants from content -->
      <div style="padding:30px 50px 40px;background:#fff;">
        <div style="font-size:11px;font-weight:700;color:#6B7280;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:20px;font-family:Arial,sans-serif;">
          Assinaturas
        </div>
        <div style="display:flex;gap:40px;flex-wrap:wrap;">
          ${(() => {
            // Extrai participantes do conteúdo
            const lines = (minute.content || '').split('\n');
            const participants = [];
            let inParticipants = false;
            for (const line of lines) {
              if (/participante[s]?/i.test(line)) { inParticipants = true; continue; }
              if (inParticipants && line.trim() === '') { inParticipants = false; }
              if (inParticipants && line.trim()) {
                const name = line.trim().split('—')[0].split('-')[0].trim();
                if (name.length > 2 && name.length < 60) participants.push(name);
              }
            }
            // Se não achou participantes, usa genérico
            const sigs = participants.length > 0 ? participants : ['Responsável Técnico', 'Participante'];
            return sigs.map(name => `
              <div style="min-width:180px;flex:1;margin-bottom:20px;">
                <div style="border-top:1.5px solid #1A1A2E;padding-top:10px;">
                  <div style="font-size:11px;color:#374151;font-family:Arial,sans-serif;font-weight:500;">${name}</div>
                </div>
              </div>
            `).join('');
          })()}
        </div>
      </div>
    </div>
  `;
  createPrintWindow(html);
}

// ─────────────────────────────────────────────────────────
// TEMPLATE: FICHA DE CLIENTE CRM
// ─────────────────────────────────────────────────────────
export function exportClientPDF(client) {
  const STATUS_LABELS = {
    prospecto: 'Prospecto', proposta: 'Proposta Enviada',
    negociacao: 'Em Negociação', fechado: 'Fechado', perdido: 'Perdido',
  };
  const STATUS_COLORS = {
    prospecto: '#6B7280', proposta: '#F59E0B',
    negociacao: '#0077FF', fechado: '#10B981', perdido: '#EF4444',
  };
  const statusColor = STATUS_COLORS[client.status] || '#6B7280';
  const statusLabel = STATUS_LABELS[client.status] || client.status;

  const html = `
    <div style="width:210mm;min-height:297mm;font-family:'Inter',sans-serif;">

      <!-- HEADER -->
      <div style="background:linear-gradient(135deg,#060B18,#0D1526);padding:36px 50px 28px;position:relative;overflow:hidden;">
        <div style="position:absolute;top:0;right:0;width:300px;height:100%;background:linear-gradient(135deg,transparent,rgba(0,119,255,0.08));"></div>
        
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div>
            <div style="font-family:'Playfair Display',serif;font-size:26px;font-weight:700;color:#fff;">
              DUR<span style="color:#00BBFF;">AR</span>
            </div>
            <div style="font-size:9px;color:rgba(255,255,255,0.4);letter-spacing:0.25em;margin-top:2px;">
              CONSULTORIA E ENGENHARIA
            </div>
          </div>
          <div style="background:${statusColor}22;border:1px solid ${statusColor}55;padding:6px 16px;border-radius:20px;">
            <span style="font-size:11px;font-weight:600;color:${statusColor};">${statusLabel}</span>
          </div>
        </div>

        <div style="margin-top:24px;">
          <div style="font-size:10px;color:rgba(255,255,255,0.4);letter-spacing:0.2em;text-transform:uppercase;">Ficha de Cliente</div>
          <div style="font-family:'Playfair Display',serif;font-size:24px;font-weight:600;color:#fff;margin-top:4px;">${client.name}</div>
          ${client.building ? `<div style="font-size:13px;color:#00BBFF;margin-top:4px;">🏢 ${client.building}</div>` : ''}
        </div>
      </div>

      <!-- CONTENT -->
      <div style="padding:36px 50px;background:#fff;">
        
        <!-- Contact grid -->
        <div style="margin-bottom:28px;">
          <div style="font-size:10px;font-weight:700;letter-spacing:0.2em;color:#0077FF;text-transform:uppercase;margin-bottom:12px;">
            Informações de Contato
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            ${[
              { icon: '📞', label: 'Telefone', value: client.phone },
              { icon: '✉️', label: 'E-mail', value: client.email },
              { icon: '📍', label: 'Endereço', value: client.address },
              { icon: '🔧', label: 'Serviço', value: client.service },
            ].filter(f => f.value).map(f => `
              <div style="background:#F8FAFF;border:1px solid #E2E8F0;border-radius:8px;padding:12px 16px;">
                <div style="font-size:9px;font-weight:600;color:#6B7280;letter-spacing:0.1em;text-transform:uppercase;">${f.label}</div>
                <div style="font-size:13px;color:#1A1A2E;margin-top:4px;font-weight:500;">${f.icon} ${f.value}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Financial -->
        ${client.value ? `
        <div style="margin-bottom:28px;">
          <div style="font-size:10px;font-weight:700;letter-spacing:0.2em;color:#0077FF;text-transform:uppercase;margin-bottom:12px;">
            Informações Comerciais
          </div>
          <div style="background:linear-gradient(135deg,#F0FFF4,#E6FFFA);border:1px solid #10B98133;border-radius:10px;padding:20px 24px;display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-size:11px;color:#6B7280;font-weight:500;">Valor da Proposta</div>
              <div style="font-family:'Playfair Display',serif;font-size:28px;font-weight:700;color:#10B981;">R$ ${client.value}</div>
            </div>
            <div style="font-size:36px;">💰</div>
          </div>
        </div>
        ` : ''}

        <!-- Notes -->
        ${client.notes ? `
        <div style="margin-bottom:28px;">
          <div style="font-size:10px;font-weight:700;letter-spacing:0.2em;color:#0077FF;text-transform:uppercase;margin-bottom:12px;">
            Observações
          </div>
          <div style="background:#F8FAFF;border-left:3px solid #0077FF;padding:16px 20px;border-radius:0 8px 8px 0;font-size:13px;color:#2D3748;line-height:1.7;">
            ${client.notes}
          </div>
        </div>
        ` : ''}
      </div>

      <!-- FOOTER -->
      <div style="padding:20px 50px;background:#F8FAFF;border-top:2px solid #E2E8F0;display:flex;justify-content:space-between;">
        <div style="font-size:10px;color:#6B7280;">DURAR Consultoria e Engenharia</div>
        <div style="font-size:10px;color:#6B7280;">Gerado em ${new Date().toLocaleDateString('pt-BR')}</div>
      </div>
    </div>
  `;
  createPrintWindow(html);
}

// ─────────────────────────────────────────────────────────
// TEMPLATE: RELATÓRIO FINANCEIRO
// ─────────────────────────────────────────────────────────
export function exportFinancePDF(proposals) {
  const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const total = proposals.length;
  const fechadas = proposals.filter(p => p.status === 'fechada');
  const perdidas = proposals.filter(p => p.status === 'perdida');
  const pendentes = proposals.filter(p => p.status === 'enviada');
  const conversion = total > 0 ? Math.round((fechadas.length / total) * 100) : 0;
  const totalFaturado = fechadas.reduce((s, p) => s + (p.value || 0), 0);
  const totalPipeline = pendentes.reduce((s, p) => s + (p.value || 0), 0);
  const currentYear = new Date().getFullYear();

  const STATUS_CONFIG = {
    enviada: { label: 'Enviada', color: '#F59E0B', bg: '#FFF9E6' },
    fechada: { label: 'Fechada', color: '#10B981', bg: '#F0FFF4' },
    perdida: { label: 'Perdida', color: '#EF4444', bg: '#FFF5F5' },
  };

  const html = `
    <div style="width:210mm;min-height:297mm;font-family:'Inter',sans-serif;">

      <!-- HEADER -->
      <div style="background:linear-gradient(135deg,#060B18 0%,#0D1526 50%,#0A1535 100%);padding:36px 50px 32px;position:relative;overflow:hidden;">
        <div style="position:absolute;top:-50px;right:-50px;width:250px;height:250px;border-radius:50%;background:rgba(0,187,255,0.05);"></div>
        <div style="position:absolute;bottom:-80px;left:20%;width:200px;height:200px;border-radius:50%;background:rgba(0,119,255,0.04);"></div>

        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;">
          <div>
            <div style="font-family:'Playfair Display',serif;font-size:26px;font-weight:700;color:#fff;">
              DUR<span style="color:#00BBFF;">AR</span>
            </div>
            <div style="font-size:9px;color:rgba(255,255,255,0.4);letter-spacing:0.25em;margin-top:2px;">
              CONSULTORIA E ENGENHARIA
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:9px;color:rgba(255,255,255,0.4);letter-spacing:0.15em;">RELATÓRIO</div>
            <div style="font-family:'Playfair Display',serif;font-size:13px;color:#00BBFF;margin-top:2px;">Desempenho Comercial ${currentYear}</div>
          </div>
        </div>

        <!-- KPI Cards -->
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;">
          ${[
            { label: 'Total Propostas', value: total, color: '#00BBFF', prefix: '' },
            { label: 'Taxa Conversão', value: `${conversion}%`, color: '#10B981', prefix: '' },
            { label: 'Faturado', value: `R$${(totalFaturado/1000).toFixed(1)}k`, color: '#10B981', prefix: '' },
            { label: 'Pipeline', value: `R$${(totalPipeline/1000).toFixed(1)}k`, color: '#F59E0B', prefix: '' },
          ].map(kpi => `
            <div style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:14px;">
              <div style="font-size:9px;color:rgba(255,255,255,0.4);letter-spacing:0.1em;text-transform:uppercase;">${kpi.label}</div>
              <div style="font-family:'Playfair Display',serif;font-size:22px;font-weight:700;color:${kpi.color};margin-top:4px;">${kpi.value}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- CONTENT -->
      <div style="padding:36px 50px;background:#fff;">

        <!-- Summary bars -->
        <div style="margin-bottom:32px;">
          <div style="font-size:10px;font-weight:700;letter-spacing:0.2em;color:#0077FF;text-transform:uppercase;margin-bottom:16px;">
            Distribuição por Status
          </div>
          <div style="display:flex;gap:8px;height:32px;border-radius:8px;overflow:hidden;margin-bottom:10px;">
            ${fechadas.length > 0 ? `<div style="flex:${fechadas.length};background:#10B981;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:white;">${fechadas.length}</div>` : ''}
            ${pendentes.length > 0 ? `<div style="flex:${pendentes.length};background:#F59E0B;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:white;">${pendentes.length}</div>` : ''}
            ${perdidas.length > 0 ? `<div style="flex:${perdidas.length};background:#EF4444;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:white;">${perdidas.length}</div>` : ''}
          </div>
          <div style="display:flex;gap:20px;">
            ${[
              { label: 'Fechadas', color: '#10B981', count: fechadas.length },
              { label: 'Pendentes', color: '#F59E0B', count: pendentes.length },
              { label: 'Perdidas', color: '#EF4444', count: perdidas.length },
            ].map(s => `
              <div style="display:flex;align-items:center;gap:6px;">
                <div style="width:10px;height:10px;border-radius:2px;background:${s.color};"></div>
                <span style="font-size:11px;color:#6B7280;">${s.label}: <strong style="color:#1A1A2E;">${s.count}</strong></span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Proposals table -->
        ${proposals.length > 0 ? `
        <div>
          <div style="font-size:10px;font-weight:700;letter-spacing:0.2em;color:#0077FF;text-transform:uppercase;margin-bottom:12px;">
            Detalhamento de Propostas
          </div>
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="background:#F8FAFF;">
                <th style="padding:10px 14px;text-align:left;font-size:10px;font-weight:600;color:#6B7280;letter-spacing:0.1em;text-transform:uppercase;border-bottom:2px solid #E2E8F0;">Cliente</th>
                <th style="padding:10px 14px;text-align:left;font-size:10px;font-weight:600;color:#6B7280;letter-spacing:0.1em;text-transform:uppercase;border-bottom:2px solid #E2E8F0;">Mês</th>
                <th style="padding:10px 14px;text-align:center;font-size:10px;font-weight:600;color:#6B7280;letter-spacing:0.1em;text-transform:uppercase;border-bottom:2px solid #E2E8F0;">Status</th>
                <th style="padding:10px 14px;text-align:right;font-size:10px;font-weight:600;color:#6B7280;letter-spacing:0.1em;text-transform:uppercase;border-bottom:2px solid #E2E8F0;">Valor</th>
              </tr>
            </thead>
            <tbody>
              ${proposals.map((p, i) => {
                const st = STATUS_CONFIG[p.status] || STATUS_CONFIG.enviada;
                return `
                <tr style="background:${i % 2 === 0 ? '#fff' : '#FAFBFF'};">
                  <td style="padding:10px 14px;font-size:12px;color:#1A1A2E;font-weight:500;border-bottom:1px solid #F1F5F9;">${p.client}</td>
                  <td style="padding:10px 14px;font-size:12px;color:#6B7280;border-bottom:1px solid #F1F5F9;">${MONTHS[p.month] || '—'}</td>
                  <td style="padding:10px 14px;text-align:center;border-bottom:1px solid #F1F5F9;">
                    <span style="background:${st.bg};color:${st.color};font-size:10px;font-weight:600;padding:3px 10px;border-radius:20px;border:1px solid ${st.color}33;">${st.label}</span>
                  </td>
                  <td style="padding:10px 14px;font-size:12px;font-weight:700;color:${st.color};text-align:right;border-bottom:1px solid #F1F5F9;">
                    ${p.value ? `R$ ${p.value.toLocaleString('pt-BR')}` : '—'}
                  </td>
                </tr>
              `}).join('')}
            </tbody>
            <tfoot>
              <tr style="background:#F8FAFF;">
                <td colspan="3" style="padding:12px 14px;font-size:12px;font-weight:700;color:#1A1A2E;border-top:2px solid #E2E8F0;">Total Faturado</td>
                <td style="padding:12px 14px;font-family:'Playfair Display',serif;font-size:16px;font-weight:700;color:#10B981;text-align:right;border-top:2px solid #E2E8F0;">
                  R$ ${totalFaturado.toLocaleString('pt-BR')}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        ` : ''}
      </div>

    </div>
  `;
  createPrintWindow(html);
}
