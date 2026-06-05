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
  const existing = document.getElementById('durabel-pdf-modal');
  if (existing) existing.remove();

  const today = new Date().toLocaleDateString('pt-BR');



  const modal = document.createElement('div');
  modal.id = 'durabel-pdf-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;flex-direction:column;background:#111827;';

  modal.innerHTML = `
    <style>
      #durabel-pdf-modal * { box-sizing: border-box; }
      @media print {
        body { background: white !important; }
        body > *:not(#durabel-pdf-modal) { display: none !important; }
        #durabel-pdf-modal { position: static !important; background: white !important; }
        .pv-bar { display: none !important; }
        .pv-scroll {
          overflow: visible !important; padding: 0 !important;
          background: white !important; display: block !important;
          width: 100% !important; height: auto !important;
          position: static !important; min-height: unset !important;
        }
        .pv-doc {
          transform: none !important; box-shadow: none !important;
          width: 100% !important; min-width: unset !important;
          position: static !important; top: auto !important;
          left: auto !important; background: white !important;
          height: auto !important;
        }
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        @page { size: A4; margin: 8mm 8mm 8mm 8mm; }
      }
    </style>

    <div class="pv-bar" style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:#060B18;border-bottom:2px solid #0077FF;flex-shrink:0;">
      <div>
        <div style="font-family:Arial Black,sans-serif;font-size:14px;font-weight:900;color:#fff;letter-spacing:0.04em;">
          DUR<span style="color:#00BBFF;">AR</span>
          <span style="font-family:Inter,sans-serif;font-size:11px;font-weight:400;color:rgba(255,255,255,0.35);margin-left:6px;">· PDF</span>
        </div>
        <div style="font-size:9px;color:rgba(255,255,255,0.3);font-family:Inter,sans-serif;margin-top:2px;">🤏 Dois dedos = zoom &nbsp;·&nbsp; Um dedo = mover</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center;">
        <button id="pv-print" style="background:linear-gradient(135deg,#0055CC,#0099FF);color:#fff;border:none;padding:10px 18px;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:Inter,sans-serif;box-shadow:0 2px 10px rgba(0,119,255,0.4);">
          🖨️ Salvar PDF
        </button>
        <button id="pv-close" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);color:#fff;width:36px;height:36px;border-radius:10px;font-size:18px;cursor:pointer;">✕</button>
      </div>
    </div>
    <div class="pv-scroll" id="pv-scroll" style="flex:1;overflow:hidden;background:#1e1e2e;display:flex;touch-action:none;position:relative;">
      <div class="pv-doc" id="pv-doc" style="background:white;width:794px;min-width:794px;transform-origin:top left;box-shadow:0 8px 40px rgba(0,0,0,0.6);position:absolute;top:0;left:0;">
        ${html}
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const scroll = document.getElementById('pv-scroll');
  const doc   = document.getElementById('pv-doc');

  const sw = scroll.clientWidth || window.innerWidth;
  let scale = Math.min(1, (sw - 16) / 794);
  let tx = Math.max(0, (sw - 794 * scale) / 2);
  let ty = 20;
  const apply = () => { doc.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`; };
  apply();

  let single = null, startScale = scale, startTx = tx, startTy = ty;
  let startDist = 1, startMidX = 0, startMidY = 0;

  scroll.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (e.touches.length === 1) {
      single = { x: e.touches[0].clientX - tx, y: e.touches[0].clientY - ty };
    } else if (e.touches.length === 2) {
      single = null;
      const [a, b] = [e.touches[0], e.touches[1]];
      startDist = Math.hypot(a.clientX-b.clientX, a.clientY-b.clientY);
      startMidX = (a.clientX+b.clientX)/2; startMidY = (a.clientY+b.clientY)/2;
      startScale = scale; startTx = tx; startTy = ty;
    }
  }, { passive: false });

  scroll.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (e.touches.length === 1 && single) {
      tx = e.touches[0].clientX - single.x;
      ty = e.touches[0].clientY - single.y;
      apply();
    } else if (e.touches.length === 2) {
      const [a, b] = [e.touches[0], e.touches[1]];
      const dist = Math.hypot(a.clientX-b.clientX, a.clientY-b.clientY);
      scale = Math.min(3, Math.max(0.15, startScale*(dist/startDist)));
      tx = startTx + (a.clientX+b.clientX)/2 - startMidX;
      ty = startTy + (a.clientY+b.clientY)/2 - startMidY;
      apply();
    }
  }, { passive: false });

  scroll.addEventListener('touchend', () => { single = null; }, { passive: true });

  document.getElementById('pv-print').onclick = () => {
    const A4H = 1122;
    const total = Math.max(1, Math.ceil(doc.scrollHeight / A4H));
    const pEl = document.getElementById('pdf-page-info');
    if (pEl) pEl.textContent = `Página 1 de ${total}`;
    window.print();
  };

  document.getElementById('pv-close').onclick = () => modal.remove();
}

// ─────────────────────────────────────────────────────────
// TEMPLATE: ATA DE REUNIÃO
// ─────────────────────────────────────────────────────────
export function exportMinutePDF(minute) {
  const today = new Date().toLocaleDateString('pt-BR');

  // Header HTML — reutilizado no thead
  const headerHtml = `
    <div style="background:linear-gradient(135deg,#060B18 0%,#0D1526 60%,#0055CC 100%);padding:16px 36px 14px;position:relative;overflow:hidden;-webkit-print-color-adjust:exact;print-color-adjust:exact;">
      <div style="position:absolute;top:-40px;right:-40px;width:180px;height:180px;border-radius:50%;background:rgba(0,187,255,0.08);"></div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
        <div>
          <div style="font-family:Arial Black,Arial,sans-serif;font-size:18px;font-weight:900;color:#fff;letter-spacing:0.03em;">DUR<span style="color:#00BBFF;">AR</span></div>
          <div style="font-size:8px;color:rgba(255,255,255,0.5);letter-spacing:0.25em;font-family:Arial,sans-serif;">CONSULTORIA E ENGENHARIA</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:9px;color:rgba(255,255,255,0.4);letter-spacing:0.15em;">DOCUMENTO</div>
          <div style="font-size:11px;color:#00BBFF;margin-top:2px;font-family:Arial,sans-serif;">Ata de Reunião</div>
        </div>
      </div>
      <div style="border-left:3px solid #00BBFF;padding-left:12px;">
        <div style="font-family:Arial Black,Arial,sans-serif;font-size:15px;font-weight:900;color:#fff;line-height:1.3;">${minute.title}</div>
        <div style="font-size:10px;color:rgba(255,255,255,0.5);margin-top:4px;font-family:Arial,sans-serif;">${minute.date}</div>
      </div>
      <div style="height:1px;background:linear-gradient(90deg,#00BBFF,transparent);margin-top:12px;"></div>
    </div>`;



  const html = `
    <table style="width:100%;border-collapse:collapse;font-family:'Inter',sans-serif;table-layout:fixed;">
      <thead style="display:table-header-group;"><tr><td style="padding:0;">${headerHtml}</td></tr></thead>
      <tbody>
        <tr><td style="padding:24px 36px;vertical-align:top;">

          <!-- Info strip -->
          <div style="display:flex;gap:0;margin-bottom:24px;border:1px solid #E2E8F0;border-radius:10px;overflow:hidden;">
            ${[
              { label: 'Data', value: minute.date?.split(' ')[0] || '—' },
              { label: 'Hora', value: minute.date?.split(' ')[1] || '—' },
              { label: 'Empresa', value: 'DURAR Consultoria' },
            ].map((item, i) => `
              <div style="flex:1;padding:12px 16px;background:${i % 2 === 0 ? '#F8FAFF' : '#fff'};border-right:1px solid #E2E8F0;">
                <div style="font-size:8px;font-weight:600;color:#6B7280;letter-spacing:0.15em;text-transform:uppercase;">${item.label}</div>
                <div style="font-size:12px;font-weight:600;color:#1A1A2E;margin-top:2px;">${item.value}</div>
              </div>
            `).join('')}
          </div>

          <!-- Content -->
          <div style="font-size:13px;line-height:1.8;color:#2D3748;white-space:pre-wrap;font-weight:300;">
            ${minute.content
              .replace(/^(#+\s.+)$/gm, '<div style="font-family:Arial Black,Arial,sans-serif;font-size:14px;font-weight:900;color:#060B18;margin:20px 0 8px;padding-bottom:6px;border-bottom:2px solid #0077FF20;">$1</div>')
              .replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight:600;color:#060B18;">$1</strong>')
              .replace(/^[-•]\s(.+)$/gm, '<div style="display:flex;gap:8px;margin:4px 0;"><span style="color:#0077FF;margin-top:2px;">▸</span><span>$1</span></div>')
            }
          </div>



        </td></tr>
      </tbody>
    </table>
  `;
  createPrintWindow(html);
}

// ─────────────────────────────────────────────────────────
// TEMPLATE: FICHA DE CLIENTE CRM
// ─────────────────────────────────────────────────────────
export function exportClientPDF(client) {
  const STATUS_LABELS = { prospecto:'Prospecto', proposta:'Proposta Enviada', negociacao:'Em Negociação', fechado:'Fechado', perdido:'Perdido' };
  const STATUS_COLORS = { prospecto:'#6B7280', proposta:'#F59E0B', negociacao:'#0077FF', fechado:'#10B981', perdido:'#EF4444' };
  const statusColor = STATUS_COLORS[client.status] || '#6B7280';
  const statusLabel = STATUS_LABELS[client.status] || client.status;
  const today = new Date().toLocaleDateString('pt-BR');

  const items = client.serviceItems || [];
  const totalValue = items.reduce((s, i) => s + (parseFloat(String(i.value||'').replace(/\./g,'').replace(',','.')) || 0), 0);

  const headerHtml = `
    <div style="background:linear-gradient(135deg,#060B18 0%,#0D1526 60%,#0055CC 100%);padding:16px 36px 14px;position:relative;overflow:hidden;-webkit-print-color-adjust:exact;print-color-adjust:exact;">
      <div style="position:absolute;top:-40px;right:-40px;width:180px;height:180px;border-radius:50%;background:rgba(0,187,255,0.08);"></div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
        <div>
          <div style="font-family:Arial Black,Arial,sans-serif;font-size:18px;font-weight:900;color:#fff;letter-spacing:0.03em;">DUR<span style="color:#00BBFF;">AR</span></div>
          <div style="font-size:8px;color:rgba(255,255,255,0.5);letter-spacing:0.25em;font-family:Arial,sans-serif;">CONSULTORIA E ENGENHARIA</div>
        </div>
        <div style="background:${statusColor}22;border:1px solid ${statusColor}55;padding:5px 14px;border-radius:20px;">
          <span style="font-size:10px;font-weight:600;color:${statusColor};">${statusLabel}</span>
        </div>
      </div>
      <div style="border-left:3px solid #00BBFF;padding-left:12px;">
        <div style="font-size:9px;color:rgba(255,255,255,0.4);letter-spacing:0.2em;text-transform:uppercase;margin-bottom:2px;">Ficha de Cliente</div>
        <div style="font-family:Arial Black,Arial,sans-serif;font-size:16px;font-weight:900;color:#fff;line-height:1.3;">${client.name}</div>
        ${client.building ? `<div style="font-size:11px;color:#00BBFF;margin-top:3px;">🏢 ${client.building}</div>` : ''}
      </div>
      <div style="height:1px;background:linear-gradient(90deg,#00BBFF,transparent);margin-top:12px;"></div>
    </div>`;



  const html = `
    <table style="width:100%;border-collapse:collapse;font-family:'Inter',sans-serif;table-layout:fixed;">
      <thead style="display:table-header-group;"><tr><td style="padding:0;">${headerHtml}</td></tr></thead>
      <tbody><tr><td style="padding:24px 36px;vertical-align:top;">

        <!-- Contato -->
        <div style="margin-bottom:20px;">
          <div style="font-size:9px;font-weight:700;letter-spacing:0.2em;color:#0077FF;text-transform:uppercase;margin-bottom:10px;">Informações de Contato</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            ${[
              { icon:'📞', label:'Telefone', value: client.phone },
              { icon:'✉️', label:'E-mail', value: client.email },
              { icon:'📄', label:'Documento', value: client.doc ? `${client.docType||'Doc'}: ${client.doc}` : null },
              { icon:'📍', label:'Endereço', value: client.address },
            ].filter(f => f.value).map(f => `
              <div style="background:#F8FAFF;border:1px solid #E2E8F0;border-radius:8px;padding:10px 14px;">
                <div style="font-size:8px;font-weight:600;color:#6B7280;letter-spacing:0.1em;text-transform:uppercase;">${f.label}</div>
                <div style="font-size:12px;color:#1A1A2E;margin-top:3px;font-weight:500;">${f.icon} ${f.value}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Serviços -->
        ${items.length > 0 ? `
        <div style="margin-bottom:20px;">
          <div style="font-size:9px;font-weight:700;letter-spacing:0.2em;color:#0077FF;text-transform:uppercase;margin-bottom:10px;">Informações Comerciais</div>
          <table style="width:100%;border-collapse:collapse;border:1px solid #E2E8F0;border-radius:8px;overflow:hidden;">
            <thead>
              <tr style="background:#F8FAFF;">
                <th style="padding:8px 12px;font-size:9px;font-weight:600;color:#6B7280;text-align:left;border-bottom:1px solid #E2E8F0;">Serviço</th>
                <th style="padding:8px 12px;font-size:9px;font-weight:600;color:#6B7280;text-align:right;border-bottom:1px solid #E2E8F0;">Valor</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((item, i) => `
                <tr style="background:${i%2===0?'#fff':'#FAFBFF'}">
                  <td style="padding:8px 12px;font-size:12px;color:#1A1A2E;border-bottom:1px solid #F1F5F9;">${item.name||'—'}</td>
                  <td style="padding:8px 12px;font-size:12px;color:#10B981;font-weight:600;text-align:right;border-bottom:1px solid #F1F5F9;">${item.value ? 'R$ '+item.value : '—'}</td>
                </tr>
              `).join('')}
              ${totalValue > 0 ? `
              <tr style="background:#F8FAFF;">
                <td style="padding:10px 12px;font-size:12px;font-weight:700;color:#1A1A2E;">Total</td>
                <td style="padding:10px 12px;font-size:14px;font-weight:700;color:#10B981;text-align:right;">R$ ${totalValue.toLocaleString('pt-BR',{minimumFractionDigits:2})}</td>
              </tr>` : ''}
            </tbody>
          </table>
        </div>` : ''}

        <!-- Observações -->
        ${client.notes ? `
        <div>
          <div style="font-size:9px;font-weight:700;letter-spacing:0.2em;color:#0077FF;text-transform:uppercase;margin-bottom:8px;">Observações</div>
          <div style="background:#F8FAFF;border-left:3px solid #0077FF;padding:12px 16px;border-radius:0 8px 8px 0;font-size:12px;color:#2D3748;line-height:1.7;">${client.notes}</div>
        </div>` : ''}

      </td></tr></tbody>
    </table>`;

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
    <div style="width:100%;font-family:'Inter',sans-serif;">

      <!-- HEADER -->
      <div style="background:linear-gradient(135deg,#060B18 0%,#0D1526 50%,#0A1535 100%);padding:36px 50px 32px;position:relative;overflow:hidden;">
        <div style="position:absolute;top:-50px;right:-50px;width:250px;height:250px;border-radius:50%;background:rgba(0,187,255,0.05);"></div>
        <div style="position:absolute;bottom:-80px;left:20%;width:200px;height:200px;border-radius:50%;background:rgba(0,119,255,0.04);"></div>

        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;">
          <div>
            <div style="font-family:'Arial Black',Arial,sans-serif;font-size:24px;font-weight:900;color:#fff;">
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
      <div style="padding:24px 36px;background:#fff;">

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

// ─────────────────────────────────────────────────────────
// TEMPLATE: RELATÓRIO EXECUTIVO COM IA
// ─────────────────────────────────────────────────────────
export function exportReportPDF({ report, metrics, periodLabel, range }) {
  const MONTHS_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const fmtCurr = (v) => v > 0 ? `R$ ${Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2})}` : 'R$ 0,00';

  // Mini bar chart SVG inline
  const monthSlice = metrics.monthlyData.slice(range.start, range.end + 1);
  const maxV = Math.max(...monthSlice, 1);
  const barW = Math.max(Math.floor(480 / monthSlice.length) - 4, 10);
  const bars = monthSlice.map((v, i) => {
    const h = Math.max(Math.round((v / maxV) * 80), 2);
    const x = i * (barW + 4);
    const color = v > 0 ? '#0077FF' : '#E2E8F0';
    return `
      <rect x="${x}" y="${80 - h}" width="${barW}" height="${h}" rx="3" fill="${color}" opacity="0.85"/>
      <text x="${x + barW/2}" y="96" text-anchor="middle" font-size="8" fill="#9CA3AF" font-family="Arial">${MONTHS_SHORT[range.start + i]}</text>
    `;
  }).join('');
  const svgWidth = monthSlice.length * (barW + 4);
  const chartSVG = `<svg width="${svgWidth}" height="100" xmlns="http://www.w3.org/2000/svg">${bars}</svg>`;

  const html = `
    <div style="width:210mm;min-height:297mm;font-family:Arial,sans-serif;padding-bottom:20mm;">

      <!-- HEADER -->
      <div style="background:linear-gradient(135deg,#060B18 0%,#0D1A3A 60%,#0044AA 100%);padding:40px 50px 32px;position:relative;overflow:hidden;">
        <div style="position:absolute;top:-50px;right:-50px;width:220px;height:220px;border-radius:50%;background:rgba(0,187,255,0.06);"></div>
        <div style="position:absolute;bottom:-40px;left:20%;width:160px;height:160px;border-radius:50%;background:rgba(0,119,255,0.05);"></div>

        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;">
          <div>
            <div style="font-family:'Arial Black',Arial,sans-serif;font-size:28px;font-weight:900;color:#fff;letter-spacing:0.03em;">
              DUR<span style="color:#00BBFF;">AR</span>
            </div>
            <div style="font-size:8px;color:rgba(255,255,255,0.4);letter-spacing:0.25em;margin-top:3px;">CONSULTORIA E ENGENHARIA</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:9px;color:rgba(255,255,255,0.35);letter-spacing:0.15em;text-transform:uppercase;">Documento</div>
            <div style="font-size:13px;color:#00BBFF;margin-top:3px;font-weight:600;">Relatório Executivo</div>
          </div>
        </div>

        <div style="border-left:3px solid #00BBFF;padding-left:16px;">
          <div style="font-size:22px;font-weight:900;color:#fff;letter-spacing:0.01em;">${periodLabel}</div>
          <div style="font-size:10px;color:rgba(255,255,255,0.45);margin-top:5px;">Gerado em ${new Date().toLocaleDateString('pt-BR')} · DURABEL IA Secretária</div>
        </div>

        <div style="height:1px;background:linear-gradient(90deg,#00BBFF,transparent);margin-top:24px;"></div>
      </div>

      <!-- KPIs -->
      <div style="padding:32px 50px 0;">
        <div style="display:flex;gap:0;border:1px solid #E2E8F0;border-radius:12px;overflow:hidden;margin-bottom:28px;">
          ${[
            { label: 'Faturado', value: fmtCurr(metrics.totalFaturado), color: '#10B981' },
            { label: 'Conversão', value: `${metrics.conversion}%`, color: '#0077FF' },
            { label: 'Pipeline', value: fmtCurr(metrics.pipeline), color: '#F59E0B' },
            { label: 'Ticket Médio', value: fmtCurr(metrics.ticketMedio), color: '#8B5CF6' },
          ].map((k, i) => `
            <div style="flex:1;padding:16px 20px;background:${i%2===0?'#F8FAFF':'#fff'};border-right:1px solid #E2E8F0;text-align:center;">
              <div style="font-size:9px;color:#6B7280;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:5px;">${k.label}</div>
              <div style="font-size:14px;font-weight:700;color:${k.color};">${k.value}</div>
            </div>
          `).join('')}
        </div>

        <!-- Conversão visual -->
        <div style="display:flex;gap:12px;margin-bottom:28px;">
          ${[
            { n: metrics.fechadasCount, label: 'Fechadas', color: '#10B981', bg: '#F0FDF4' },
            { n: metrics.enviadasCount, label: 'Em aberto', color: '#F59E0B', bg: '#FFFBEB' },
            { n: metrics.perdidasCount, label: 'Perdidas', color: '#EF4444', bg: '#FEF2F2' },
            { n: metrics.total, label: 'Total', color: '#374151', bg: '#F9FAFB' },
          ].map(k => `
            <div style="flex:1;padding:14px;border-radius:10px;background:${k.bg};text-align:center;">
              <div style="font-size:22px;font-weight:700;color:${k.color};">${k.n}</div>
              <div style="font-size:9px;color:#6B7280;margin-top:2px;">${k.label}</div>
            </div>
          `).join('')}
        </div>

        <!-- Gráfico -->
        ${monthSlice.length > 1 ? `
        <div style="margin-bottom:28px;">
          <div style="font-size:9px;font-weight:700;color:#6B7280;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:12px;">Faturamento no Período</div>
          <div style="display:flex;justify-content:center;padding:12px;background:#F8FAFF;border:1px solid #E2E8F0;border-radius:10px;">
            ${chartSVG}
          </div>
        </div>
        ` : ''}

        <!-- Análise da IA -->
        <div style="margin-bottom:22px;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
            <div style="width:3px;height:18px;background:linear-gradient(180deg,#0077FF,#00BBFF);border-radius:2px;"></div>
            <div style="font-size:9px;font-weight:700;color:#6B7280;letter-spacing:0.12em;text-transform:uppercase;">Análise Executiva</div>
          </div>
          <div style="font-size:13px;line-height:1.8;color:#374151;background:#F8FAFF;padding:16px 20px;border-radius:10px;border-left:3px solid #0077FF;">
            ${report.summary || ''}
          </div>
        </div>

        <!-- Destaques -->
        ${report.highlights?.length ? `
        <div style="margin-bottom:22px;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
            <div style="width:3px;height:18px;background:#10B981;border-radius:2px;"></div>
            <div style="font-size:9px;font-weight:700;color:#6B7280;letter-spacing:0.12em;text-transform:uppercase;">Destaques Positivos</div>
          </div>
          ${report.highlights.map(h => `
            <div style="display:flex;gap:8px;margin-bottom:8px;font-size:12px;color:#374151;line-height:1.6;">
              <span style="color:#10B981;font-weight:700;flex-shrink:0;margin-top:1px;">▸</span><span>${h}</span>
            </div>
          `).join('')}
        </div>
        ` : ''}

        <!-- Alertas -->
        ${report.alerts?.length ? `
        <div style="margin-bottom:22px;background:#FFFBEB;border:1px solid #FDE68A;border-radius:10px;padding:16px 20px;">
          <div style="font-size:9px;font-weight:700;color:#92400E;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:10px;">⚠ Atenção</div>
          ${report.alerts.map(a => `
            <div style="display:flex;gap:8px;margin-bottom:6px;font-size:12px;color:#374151;line-height:1.6;">
              <span style="color:#F59E0B;flex-shrink:0;margin-top:1px;">•</span><span>${a}</span>
            </div>
          `).join('')}
        </div>
        ` : ''}

        <!-- Recomendações -->
        ${report.recommendations?.length ? `
        <div style="margin-bottom:22px;background:#EFF6FF;border:1px solid #BFDBFE;border-radius:10px;padding:16px 20px;">
          <div style="font-size:9px;font-weight:700;color:#1D4ED8;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:10px;">Recomendações</div>
          ${report.recommendations.map((r, i) => `
            <div style="display:flex;gap:10px;margin-bottom:8px;font-size:12px;color:#374151;line-height:1.6;">
              <span style="background:#0077FF;color:white;font-size:9px;font-weight:700;width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;">${i+1}</span>
              <span>${r}</span>
            </div>
          `).join('')}
        </div>
        ` : ''}

        <!-- Perspectiva -->
        ${report.outlook ? `
        <div style="margin-bottom:22px;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
            <div style="width:3px;height:18px;background:linear-gradient(180deg,#8B5CF6,#0077FF);border-radius:2px;"></div>
            <div style="font-size:9px;font-weight:700;color:#6B7280;letter-spacing:0.12em;text-transform:uppercase;">Perspectiva</div>
          </div>
          <div style="font-size:13px;line-height:1.8;color:#374151;">${report.outlook}</div>
        </div>
        ` : ''}

        <!-- Top serviços -->
        ${metrics.topServices?.length ? `
        <div style="margin-bottom:22px;">
          <div style="font-size:9px;font-weight:700;color:#6B7280;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:10px;">Top Serviços no Período</div>
          ${metrics.topServices.map(([name, data], i) => {
            const maxSvc = metrics.topServices[0][1].total;
            const pct = Math.round((data.total/maxSvc)*100);
            return `
            <div style="margin-bottom:10px;">
              <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                <span style="font-size:11px;color:#374151;">${i+1}. ${name}</span>
                <span style="font-size:11px;font-weight:700;color:#10B981;">R$${(data.total/1000).toFixed(1)}k (${data.count}x)</span>
              </div>
              <div style="height:4px;background:#E2E8F0;border-radius:9999px;overflow:hidden;">
                <div style="width:${pct}%;height:100%;background:linear-gradient(90deg,#0077FF,#00BBFF);border-radius:9999px;"></div>
              </div>
            </div>`;
          }).join('')}
        </div>
        ` : ''}
      </div>

      <!-- RUNNING FOOTER (via CSS @media print) -->
      <div class="pdf-running-footer">
        <div style="height:2px;background:linear-gradient(90deg,#0077FF,#00BBFF);width:100%;"></div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 40px;background:#060B18;">
          <span style="color:rgba(255,255,255,0.9);font-size:9px;font-weight:700;letter-spacing:0.15em;">DURAR Consultoria e Engenharia</span>
          <span style="color:rgba(255,255,255,0.45);font-size:9px;">Relatório DURABEL · ${new Date().toLocaleDateString('pt-BR')}</span>
        </div>
      </div>
    </div>
  `;
  createPrintWindow(html);
}
