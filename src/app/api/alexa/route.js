import Anthropic from '@anthropic-ai/sdk';

// Resposta padrão da Alexa
function alexaResponse(text, endSession = true, reprompt = null) {
  const ssml = `<speak>${text}</speak>`;
  return Response.json({
    version: '1.0',
    response: {
      outputSpeech: { type: 'SSML', ssml },
      ...(reprompt && {
        reprompt: { outputSpeech: { type: 'SSML', ssml: `<speak>${reprompt}</speak>` } }
      }),
      shouldEndSession: endSession,
    },
  });
}

// Busca dados do KV
async function getKVData(key) {
  try {
    const { kv } = await import('@vercel/kv');
    return await kv.get(key);
  } catch { return null; }
}

// Busca agenda do Google (via sessão de serviço)
async function getCalendarEvents() {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'https://durabel-mu.vercel.app';
    const res = await fetch(`${baseUrl}/api/calendar`, {
      headers: { 'x-alexa-secret': process.env.ALEXA_SECRET || '' }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.events || [];
  } catch { return []; }
}

// Formata hora em Recife
function fmtHora(dtStr) {
  try {
    return new Date(dtStr).toLocaleString('pt-BR', {
      timeZone: 'America/Recife',
      hour: '2-digit', minute: '2-digit'
    });
  } catch { return ''; }
}

// Filtra eventos de hoje em Recife
function eventosHoje(events) {
  const hoje = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Recife' });
  return events.filter(ev => {
    try {
      const dt = ev.start?.dateTime ? new Date(ev.start.dateTime) : new Date(ev.start?.date);
      const dia = dt.toLocaleDateString('pt-BR', { timeZone: 'America/Recife' });
      return dia === hoje;
    } catch { return false; }
  });
}

// Gera resposta com IA
async function gerarRespostaIA(prompt) {
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const res = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: 'Você é a DURABEL, assistente de voz da DURAR Consultoria e Engenharia. Responda de forma MUITO curta e natural para voz — máximo 2 frases. Sem listas. Sem markdown. Linguagem falada natural em português brasileiro.',
      messages: [{ role: 'user', content: prompt }],
    });
    return res.content[0]?.text || 'Não consegui processar sua solicitação.';
  } catch {
    return 'Estou com dificuldades no momento. Tente novamente em instantes.';
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const requestType = body.request?.type;
    const intentName = body.request?.intent?.name;
    const slots = body.request?.intent?.slots || {};

    // LaunchRequest — abre a skill
    if (requestType === 'LaunchRequest') {
      const hora = new Date().toLocaleString('pt-BR', { timeZone: 'America/Recife', hour: '2-digit', minute: '2-digit' });
      return alexaResponse(
        `Olá Felipe! Aqui é a DURABEL. São ${hora} em Recife. O que posso fazer por você? Pode perguntar sobre sua agenda, tarefas, clientes ou pedir um resumo do dia.`,
        false,
        'O que deseja saber? Pode perguntar sobre agenda, tarefas ou clientes.'
      );
    }

    // SessionEndedRequest
    if (requestType === 'SessionEndedRequest') {
      return Response.json({ version: '1.0', response: {} });
    }

    // ─── INTENTS ─────────────────────────────────────────

    // Agenda de hoje
    if (intentName === 'AgendaHojeIntent' || intentName === 'AgendaIntent') {
      const events = await getCalendarEvents();
      const hoje = eventosHoje(events);

      if (hoje.length === 0) {
        return alexaResponse('Sua agenda está livre hoje. Aproveite para focar nas tarefas!');
      }

      if (hoje.length === 1) {
        const ev = hoje[0];
        const hora = ev.start?.dateTime ? ` às ${fmtHora(ev.start.dateTime)}` : '';
        return alexaResponse(`Você tem um compromisso hoje: ${ev.summary}${hora}.`);
      }

      const lista = hoje.slice(0, 3).map(ev => {
        const hora = ev.start?.dateTime ? ` às ${fmtHora(ev.start.dateTime)}` : '';
        return `${ev.summary}${hora}`;
      }).join(', ');

      return alexaResponse(`Você tem ${hoje.length} compromissos hoje. Os principais são: ${lista}.`);
    }

    // Próximo evento
    if (intentName === 'ProximoEventoIntent') {
      const events = await getCalendarEvents();
      const agora = new Date();
      const proximo = events.find(ev => {
        try {
          const dt = new Date(ev.start?.dateTime || ev.start?.date);
          return dt > agora;
        } catch { return false; }
      });

      if (!proximo) return alexaResponse('Não encontrei próximos compromissos na sua agenda.');

      const hora = proximo.start?.dateTime ? ` às ${fmtHora(proximo.start.dateTime)}` : '';
      const dia = new Date(proximo.start?.dateTime || proximo.start?.date)
        .toLocaleDateString('pt-BR', { timeZone: 'America/Recife', weekday: 'long', day: '2-digit', month: 'long' });

      return alexaResponse(`Seu próximo compromisso é ${proximo.summary}, ${dia}${hora}.`);
    }

    // Tarefas
    if (intentName === 'TarefasIntent') {
      const tasks = await getKVData('durabel_tasks');
      if (!tasks || tasks.length === 0) {
        return alexaResponse('Você não tem tarefas pendentes registradas no momento.');
      }
      const pending = tasks.filter(t => !t.completed).slice(0, 3);
      if (pending.length === 0) return alexaResponse('Todas as suas tarefas estão concluídas. Parabéns!');

      const lista = pending.map(t => t.title).join(', ');
      return alexaResponse(`Você tem ${pending.length} tarefas pendentes. As principais são: ${lista}.`);
    }

    // Clientes / CRM
    if (intentName === 'ClientesIntent') {
      const clients = await getKVData('durabel_clients');
      if (!clients || clients.length === 0) {
        return alexaResponse('Não encontrei clientes cadastrados no CRM.');
      }
      const fechados = clients.filter(c => c.status === 'fechado').length;
      const propostas = clients.filter(c => ['proposta','negociacao'].includes(c.status)).length;
      return alexaResponse(`Você tem ${clients.length} clientes cadastrados. ${fechados} contratos fechados e ${propostas} propostas em andamento.`);
    }

    // Follow-up
    if (intentName === 'FollowupIntent') {
      const clients = await getKVData('durabel_clients');
      if (!clients) return alexaResponse('Não consegui acessar o CRM agora.');

      const diasLimite = 7;
      const agora = Date.now();
      const pendentes = clients.filter(c => {
        if (!['proposta','negociacao'].includes(c.status)) return false;
        const ultimo = new Date(c.lastContact || c.createdAt || 0).getTime();
        return (agora - ultimo) / 86400000 >= diasLimite;
      });

      if (pendentes.length === 0) {
        return alexaResponse('Nenhum cliente aguardando follow-up. Sua comunicação está em dia!');
      }

      const nomes = pendentes.slice(0, 2).map(c => c.name).join(' e ');
      return alexaResponse(`${pendentes.length} cliente${pendentes.length > 1 ? 's precisam' : ' precisa'} de follow-up. ${nomes} ${pendentes.length > 1 ? 'estão' : 'está'} aguardando há mais de ${diasLimite} dias.`);
    }

    // Resumo do dia
    if (intentName === 'ResumoDiaIntent') {
      const [events, clients] = await Promise.all([
        getCalendarEvents(),
        getKVData('durabel_clients'),
      ]);

      const hoje = eventosHoje(events);
      const followups = (clients || []).filter(c => {
        if (!['proposta','negociacao'].includes(c.status)) return false;
        const dias = (Date.now() - new Date(c.lastContact || c.createdAt || 0)) / 86400000;
        return dias >= 7;
      });

      const prompt = `
Felipe tem ${hoje.length} compromisso${hoje.length !== 1 ? 's' : ''} hoje${hoje.length > 0 ? ': ' + hoje.map(e => e.summary).join(', ') : ''}.
${followups.length > 0 ? `Tem ${followups.length} cliente${followups.length > 1 ? 's' : ''} aguardando follow-up.` : 'Nenhum follow-up pendente.'}
Dê um resumo executivo animador e prático do dia em 2 frases, sem listar itens.`;

      const resposta = await gerarRespostaIA(prompt);
      return alexaResponse(resposta);
    }

    // Intent desconhecida — usa IA genericamente
    if (intentName && intentName !== 'AMAZON.CancelIntent' && intentName !== 'AMAZON.StopIntent') {
      const slotValue = Object.values(slots).find(s => s.value)?.value || '';
      const resposta = await gerarRespostaIA(
        `Felipe perguntou via Alexa: "${slotValue || intentName}". Responda brevemente sobre a DURAR Consultoria.`
      );
      return alexaResponse(resposta);
    }

    // Cancel / Stop
    return alexaResponse('Até logo, Felipe! Estou sempre aqui quando precisar.');

  } catch (e) {
    console.error('Alexa error:', e);
    return alexaResponse('Tive um problema técnico. Tente novamente em instantes.');
  }
}
