import Anthropic from '@anthropic-ai/sdk';
import { Redis } from '@upstash/redis';

function getRedis() {
  return Redis.fromEnv();
}

function alexaResponse(text, endSession = true, reprompt = null) {
  return Response.json({
    version: '1.0',
    response: {
      outputSpeech: { type: 'SSML', ssml: `<speak>${text}</speak>` },
      ...(reprompt && {
        reprompt: { outputSpeech: { type: 'SSML', ssml: `<speak>${reprompt}</speak>` } }
      }),
      shouldEndSession: endSession,
    },
  });
}

async function getKVData(key) {
  try {
    const redis = getRedis();
    return await redis.get(key);
  } catch { return null; }
}

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

function fmtHora(dtStr) {
  try {
    return new Date(dtStr).toLocaleString('pt-BR', {
      timeZone: 'America/Recife', hour: '2-digit', minute: '2-digit'
    });
  } catch { return ''; }
}

function eventosHoje(events) {
  const hoje = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Recife' });
  return events.filter(ev => {
    try {
      const dt = new Date(ev.start?.dateTime || ev.start?.date);
      return dt.toLocaleDateString('pt-BR', { timeZone: 'America/Recife' }) === hoje;
    } catch { return false; }
  });
}

async function gerarRespostaIA(prompt) {
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const res = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      system: 'Você é a DURABEL, assistente de voz da DURAR Consultoria e Engenharia de Felipe Casa Nova. Responda de forma MUITO curta e natural para voz — máximo 2 frases curtas. Sem listas, sem markdown, linguagem falada em português brasileiro.',
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

    // Launch
    if (requestType === 'LaunchRequest') {
      const hora = new Date().toLocaleString('pt-BR', {
        timeZone: 'America/Recife', hour: '2-digit', minute: '2-digit'
      });
      return alexaResponse(
        `Olá Felipe! Aqui é a DURABEL. São ${hora} em Recife. O que posso fazer por você?`,
        false,
        'Pode perguntar sobre agenda, tarefas, clientes ou pedir um resumo do dia.'
      );
    }

    if (requestType === 'SessionEndedRequest') {
      return Response.json({ version: '1.0', response: {} });
    }

    // Agenda hoje
    if (intentName === 'AgendaHojeIntent') {
      const events = await getCalendarEvents();
      const hoje = eventosHoje(events);
      if (hoje.length === 0) return alexaResponse('Sua agenda está livre hoje. Bom dia para focar nas tarefas!');
      if (hoje.length === 1) {
        const hora = hoje[0].start?.dateTime ? ` às ${fmtHora(hoje[0].start.dateTime)}` : '';
        return alexaResponse(`Você tem um compromisso hoje: ${hoje[0].summary}${hora}.`);
      }
      const lista = hoje.slice(0,3).map(ev => `${ev.summary}${ev.start?.dateTime ? ' às ' + fmtHora(ev.start.dateTime) : ''}`).join(', ');
      return alexaResponse(`Você tem ${hoje.length} compromissos hoje. São eles: ${lista}.`);
    }

    // Próximo evento
    if (intentName === 'ProximoEventoIntent') {
      const events = await getCalendarEvents();
      const agora = new Date();
      const proximo = events.find(ev => new Date(ev.start?.dateTime || ev.start?.date) > agora);
      if (!proximo) return alexaResponse('Não há próximos compromissos na agenda.');
      const hora = proximo.start?.dateTime ? ` às ${fmtHora(proximo.start.dateTime)}` : '';
      const dia = new Date(proximo.start?.dateTime || proximo.start?.date)
        .toLocaleDateString('pt-BR', { timeZone: 'America/Recife', weekday: 'long', day: '2-digit', month: 'long' });
      return alexaResponse(`Seu próximo compromisso é ${proximo.summary}, ${dia}${hora}.`);
    }

    // Tarefas
    if (intentName === 'TarefasIntent') {
      const tasks = await getKVData('durabel_tasks');
      if (!tasks?.length) return alexaResponse('Não há tarefas pendentes registradas.');
      const pending = tasks.filter(t => !t.completed).slice(0,3);
      if (!pending.length) return alexaResponse('Todas as tarefas estão concluídas. Parabéns!');
      return alexaResponse(`Você tem ${pending.length} tarefas pendentes. As principais: ${pending.map(t => t.title).join(', ')}.`);
    }

    // Clientes
    if (intentName === 'ClientesIntent') {
      const clients = await getKVData('durabel_clients');
      if (!clients?.length) return alexaResponse('Não há clientes cadastrados no CRM.');
      const fechados = clients.filter(c => c.status === 'fechado').length;
      const pipeline = clients.filter(c => ['proposta','negociacao'].includes(c.status)).length;
      return alexaResponse(`Você tem ${clients.length} clientes cadastrados: ${fechados} fechados e ${pipeline} em negociação.`);
    }

    // Follow-up
    if (intentName === 'FollowupIntent') {
      const clients = await getKVData('durabel_clients');
      if (!clients) return alexaResponse('Não consegui acessar o CRM agora.');
      const pendentes = clients.filter(c => {
        if (!['proposta','negociacao'].includes(c.status)) return false;
        const dias = (Date.now() - new Date(c.lastContact || c.createdAt || 0)) / 86400000;
        return dias >= 7;
      });
      if (!pendentes.length) return alexaResponse('Nenhum cliente aguardando follow-up. Comunicação em dia!');
      const nomes = pendentes.slice(0,2).map(c => c.name).join(' e ');
      return alexaResponse(`${pendentes.length} cliente${pendentes.length > 1 ? 's precisam' : ' precisa'} de follow-up. ${nomes} aguarda${pendentes.length > 1 ? 'm' : ''} há mais de 7 dias.`);
    }

    // Resumo do dia
    if (intentName === 'ResumoDiaIntent') {
      const [events, clients] = await Promise.all([getCalendarEvents(), getKVData('durabel_clients')]);
      const hoje = eventosHoje(events);
      const followups = (clients || []).filter(c => {
        if (!['proposta','negociacao'].includes(c.status)) return false;
        return (Date.now() - new Date(c.lastContact || c.createdAt || 0)) / 86400000 >= 7;
      });
      const resposta = await gerarRespostaIA(
        `Felipe tem ${hoje.length} compromisso${hoje.length !== 1 ? 's' : ''} hoje${hoje.length > 0 ? ': ' + hoje.map(e => e.summary).join(', ') : ''}. ${followups.length > 0 ? `Tem ${followups.length} cliente${followups.length > 1 ? 's' : ''} aguardando follow-up.` : 'Nenhum follow-up pendente.'} Dê um resumo executivo animador em 2 frases curtas.`
      );
      return alexaResponse(resposta);
    }

    // Stop / Cancel
    if (['AMAZON.CancelIntent','AMAZON.StopIntent'].includes(intentName)) {
      return alexaResponse('Até logo, Felipe! Estarei aqui quando precisar.');
    }

    // Help
    if (intentName === 'AMAZON.HelpIntent') {
      return alexaResponse(
        'Você pode me perguntar sobre sua agenda de hoje, próximo compromisso, tarefas pendentes, situação dos clientes, follow-ups ou pedir um resumo do dia.',
        false, 'O que deseja saber?'
      );
    }

    return alexaResponse('Não entendi bem. Pode repetir de outra forma?', false, 'O que deseja saber?');

  } catch (e) {
    console.error('Alexa error:', e);
    return alexaResponse('Tive um problema técnico. Tente novamente em instantes.');
  }
}
