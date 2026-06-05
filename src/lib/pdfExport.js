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

  // Carrega libs dinamicamente (scripts em innerHTML não executam)
  const loadScript = (src) => new Promise((res, rej) => {
    if (document.querySelector(`script[src="${src}"]`)) { res(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.onload = res;
    s.onerror = rej;
    document.head.appendChild(s);
  });

  const footerHtml = `
    <div style="background:#060B18;border-top:3px solid #0077FF;padding:4mm 10mm;margin-top:12mm;display:flex;justify-content:space-between;align-items:center;-webkit-print-color-adjust:exact;print-color-adjust:exact;">
      <div>
        <div style="font-family:Arial Black,sans-serif;font-size:12px;font-weight:900;color:#fff;letter-spacing:0.05em;">DUR<span style="color:#00BBFF;">AR</span></div>
        <div style="font-family:Arial,sans-serif;font-size:7.5px;color:rgba(255,255,255,0.5);margin-top:1px;">CONSULTORIA E ENGENHARIA &nbsp;·&nbsp; Gerado por Durabel IA Secretária</div>
      </div>
      <div style="text-align:right;font-family:Arial,sans-serif;font-size:7.5px;color:rgba(255,255,255,0.5);">
        <div>${today}</div>
        <div id="pdf-page-info">Página 1 de 1</div>
      </div>
    </div>`;

  const modal = document.createElement('div');
  modal.id = 'durabel-pdf-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;flex-direction:column;background:#111827;';

  modal.innerHTML = `
    <style>
      #durabel-pdf-modal * { box-sizing: border-box; }
    </style>
    <div id="pv-bar" style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:#060B18;border-bottom:2px solid #0077FF;flex-shrink:0;">
      <div>
        <div style="font-family:Arial Black,sans-serif;font-size:14px;font-weight:900;color:#fff;letter-spacing:0.04em;">
          DUR<span style="color:#00BBFF;">AR</span>
          <span style="font-family:Inter,sans-serif;font-size:11px;font-weight:400;color:rgba(255,255,255,0.35);margin-left:6px;">· PDF</span>
        </div>
        <div style="font-size:9px;color:rgba(255,255,255,0.3);font-family:Inter,sans-serif;margin-top:2px;">🤏 Dois dedos = zoom &nbsp;·&nbsp; Um dedo = mover</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center;">
        <button id="pv-download" style="background:linear-gradient(135deg,#0055CC,#0099FF);color:#fff;border:none;padding:10px 18px;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:Inter,sans-serif;box-shadow:0 2px 10px rgba(0,119,255,0.4);">
          ⬇️ Baixar PDF
        </button>
        <button id="pv-close" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);color:#fff;width:36px;height:36px;border-radius:10px;font-size:18px;cursor:pointer;">✕</button>
      </div>
    </div>
    <div id="pv-scroll" style="flex:1;overflow:hidden;background:#1e1e2e;display:flex;touch-action:none;position:relative;">
      <div id="pv-doc" style="background:white;width:794px;min-width:794px;transform-origin:top left;box-shadow:0 8px 40px rgba(0,0,0,0.6);position:absolute;top:0;left:0;">
        ${html}
        ${footerHtml}
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const scroll = document.getElementById('pv-scroll');
  const doc = document.getElementById('pv-doc');

  // Escala inicial para caber na tela
  const sw = scroll.clientWidth || window.innerWidth;
  let scale = Math.min(1, (sw - 16) / 794);
  let tx = Math.max(0, (sw - 794 * scale) / 2);
  let ty = 20;

  const apply = () => {
    doc.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  };
  apply();

  // Pinch zoom + pan
  let single = null, startScale = scale, startTx = tx, startTy = ty;
  let startDist = 1, startMidX = 0, startMidY = 0;

  scroll.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (e.touches.length === 1) {
      single = { x: e.touches[0].clientX - tx, y: e.touches[0].clientY - ty };
    } else if (e.touches.length === 2) {
      single = null;
      const [a, b] = [e.touches[0], e.touches[1]];
      startDist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      startMidX = (a.clientX + b.clientX) / 2;
      startMidY = (a.clientY + b.clientY) / 2;
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
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      const midX = (a.clientX + b.clientX) / 2;
      const midY = (a.clientY + b.clientY) / 2;
      scale = Math.min(3, Math.max(0.15, startScale * (dist / startDist)));
      tx = startTx + (midX - startMidX);
      ty = startTy + (midY - startMidY);
      apply();
    }
  }, { passive: false });

  scroll.addEventListener('touchend', () => { single = null; }, { passive: true });

  // Baixar PDF
  document.getElementById('pv-download').onclick = async () => {
    const btn = document.getElementById('pv-download');
    btn.innerHTML = '⏳ Gerando PDF...';
    btn.disabled = true;

    try {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');

      // Atualiza páginas
      const A4H = 1122;
      const total = Math.max(1, Math.ceil(doc.scrollHeight / A4H));
      const pEl = document.getElementById('pdf-page-info');
      if (pEl) pEl.textContent = `Página 1 de ${total}`;

      // Captura o documento — remove transform temporariamente para capturar tamanho real
      const savedTransform = doc.style.transform;
      const savedPosition = doc.style.position;
      doc.style.transform = 'none';
      doc.style.position = 'relative';
      doc.style.top = '0';
      doc.style.left = '0';

      const canvas = await window.html2canvas(doc, {
        scale: 2, useCORS: true, allowTaint: true,
        backgroundColor: '#ffffff', logging: false,
        scrollX: 0, scrollY: 0,
      });

      // Restaura transform
      doc.style.transform = savedTransform;
      doc.style.position = 'absolute';
      doc.style.top = '0';
      doc.style.left = '0';

      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfW = pdf.internal.pageSize.getWidth();   // 210mm
      const pdfH = pdf.internal.pageSize.getHeight();  // 297mm

      const imgW = canvas.width;
      const imgH = canvas.height;
      // Altura em px que corresponde a uma página A4 na escala do canvas
      const pageCanvasH = Math.round(imgW * (pdfH / pdfW));

      let y = 0, page = 0;
      while (y < imgH) {
        if (page > 0) pdf.addPage();
        const sliceH = Math.min(pageCanvasH, imgH - y);
        const slice = document.createElement('canvas');
        slice.width = imgW;
        slice.height = sliceH;
        slice.getContext('2d').drawImage(canvas, 0, y, imgW, sliceH, 0, 0, imgW, sliceH);
        const imgHmm = sliceH * (pdfW / imgW);
        pdf.addImage(slice.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, pdfW, imgHmm);
        y += pageCanvasH;
        page++;
      }

      pdf.save(`DURAR_${today.replace(/\//g,'_')}.pdf`);
    } catch (err) {
      alert('Erro ao gerar PDF:\n' + err.message);
    } finally {
      btn.innerHTML = '⬇️ Baixar PDF';
      btn.disabled = false;
    }
  };

  document.getElementById('pv-close').onclick = () => modal.remove();
}

// ─────────────────────────────────────────────────────────
// TEMPLATE: ATA DE REUNIÃO
// ─────────────────────────────────────────────────────────
export function exportMinutePDF(minute) {
  const html = `
    <div style="width:210mm; min-height:297mm; padding:0; font-family:'Inter',sans-serif;">
      
      <!-- HEADER -->
      <div style="background:linear-gradient(135deg, #060B18 0%, #0D1526 60%, #0055CC 100%); padding:20px 36px 16px; position:relative; overflow:hidden;">
        
        <!-- Decorative circles -->
        <div style="position:absolute;top:-40px;right:-40px;width:200px;height:200px;border-radius:50%;background:rgba(0,187,255,0.08);"></div>
        <div style="position:absolute;bottom:-60px;left:30%;width:150px;height:150px;border-radius:50%;background:rgba(0,119,255,0.06);"></div>
        
        <!-- Logo area -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:28px;">
          <div>
            <div style="font-family:'Arial Black',Arial,sans-serif;font-size:18px;font-weight:900;color:#fff;letter-spacing:0.03em;">
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
          <div style="font-family:'Arial Black',Arial,sans-serif;font-size:18px;font-weight:900;color:#fff;line-height:1.3;letter-spacing:0.01em;">
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
      <div style="padding:24px 36px;background:#fff;">
        
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
      <div style="padding:16px 36px 20px;background:#fff;">
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
      <div style="background:linear-gradient(135deg,#060B18,#0D1526);padding:16px 36px 14px;position:relative;overflow:hidden;">
        <div style="position:absolute;top:0;right:0;width:300px;height:100%;background:linear-gradient(135deg,transparent,rgba(0,119,255,0.08));"></div>
        
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div>
            <div style="font-family:'Arial Black',Arial,sans-serif;font-size:24px;font-weight:900;color:#fff;">
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
          <div style="font-family:'Playfair Display',serif;font-size:18px;font-weight:600;color:#fff;margin-top:2px;">${client.name}</div>
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
