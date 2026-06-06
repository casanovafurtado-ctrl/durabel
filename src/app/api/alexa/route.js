import Anthropic from '@anthropic-ai/sdk';
import { Redis } from '@upstash/redis';

function getRedis() {
  try { return Redis.fromEnv(); } catch { return null; }
}

function alexaResponse(text, endSession = false, reprompt = null) {
  const followUp = reprompt || 'Posso ajudar com mais alguma coisa?';
  const body = {
    version: '1.0',
    response: {
      outputSpeech: { type: 'SSML', ssml: `<speak>${text}</speak>` },
      reprompt: { outputSpeech: { type: 'SSML', ssml: `<speak>${followUp}</speak>` } },
      shouldEndSession: endSession,
    },
  };
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function getKVData(key) {
  try {
    const redis = getRedis();
    if (!redis) return null;
    return await redis.get(key);
  } catch { return null; }
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
  return (events || []).filter(ev => {
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
      max_tokens: 150,
      system: 'Você é a DURABEL, assistente de voz da DURAR Consultoria de Felipe Casa Nova em Recife. Responda em no máximo 2 frases curtas e naturais para voz. Sem listas, sem asteriscos, linguagem falada em português brasileiro.',
      messages: [{ role: 'user', content: prompt }],
    });
    return res.content[0]?.text || 'Não consegui processar agora.';
  } catch { return 'Estou com dificuldades técnicas no momento.'; }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const requestType = body.request?.type;
    const intentName = body.request?.intent?.name;

    if (requestType === 'LaunchRequest') {
      const hora = new Date().toLocaleString('pt-BR', { timeZone: 'America/Recife', hour: '2-digit', minute: '2-digit' });
      return alexaResponse(`Olá Felipe! Aqui é a DURABEL. São ${hora} em Recife. O que posso fazer por você?`, false, 'Pode perguntar sobre agenda, tarefas, clientes ou pedir um resumo do dia.');
    }

    if (requestType === 'SessionEndedRequest') {
      return new Response(JSON.stringify({ version: '1.0', response: {} }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (intentName === 'AgendaHojeIntent') {
      const events = await getKVData('durabel_calendar') || [];
      const hoje = eventosHoje(events);
      if (!hoje.length) return alexaResponse('Sua agenda está livre hoje!');
      if (hoje.length === 1) return alexaResponse(`Você tem um compromisso hoje: ${hoje[0].summary}${hoje[0].start?.dateTime ? ' às ' + fmtHora(hoje[0].start.dateTime) : ''}.`);
      return alexaResponse(`Você tem ${hoje.length} compromissos hoje. O primeiro é ${hoje[0].summary}${hoje[0].start?.dateTime ? ' às ' + fmtHora(hoje[0].start.dateTime) : ''}.`);
    }

    if (intentName === 'ProximoEventoIntent') {
      const events = await getKVData('durabel_calendar') || [];
      const proximo = events.find(ev => new Date(ev.start?.dateTime || ev.start?.date) > new Date());
      if (!proximo) return alexaResponse('Não há próximos compromissos na agenda.');
      const dia = new Date(proximo.start?.dateTime || proximo.start?.date).toLocaleDateString('pt-BR', { timeZone: 'America/Recife', weekday: 'long', day: '2-digit', month: 'long' });
      return alexaResponse(`Seu próximo compromisso é ${proximo.summary}, ${dia}${proximo.start?.dateTime ? ' às ' + fmtHora(proximo.start.dateTime) : ''}.`);
    }

    if (intentName === 'TarefasIntent') {
      const tasks = await getKVData('durabel_tasks') || [];
      const pending = tasks.filter(t => !t.completed).slice(0,3);
      if (!pending.length) return alexaResponse('Não há tarefas pendentes no momento.');
      return alexaResponse(`Você tem ${pending.length} tarefas pendentes: ${pending.map(t => t.title).join(', ')}.`);
    }

    if (intentName === 'ClientesIntent') {
      const clients = await getKVData('durabel_clients') || [];
      if (!clients.length) return alexaResponse('O CRM ainda não foi sincronizado. Abra o app DURABEL e salve um cliente para sincronizar.');
      const fechados = clients.filter(c => c.status === 'fechado').length;
      const pipeline = clients.filter(c => ['proposta','negociacao'].includes(c.status)).length;
      return alexaResponse(`Você tem ${clients.length} clientes: ${fechados} fechados e ${pipeline} em negociação.`);
    }

    if (intentName === 'FollowupIntent') {
      const clients = await getKVData('durabel_clients') || [];
      if (!clients.length) return alexaResponse('Abra o app DURABEL para sincronizar os clientes.');
      const pendentes = clients.filter(c => ['proposta','negociacao'].includes(c.status) && (Date.now() - new Date(c.lastContact || c.createdAt || 0)) / 86400000 >= 7);
      if (!pendentes.length) return alexaResponse('Nenhum cliente aguardando follow-up. Comunicação em dia!');
      return alexaResponse(`${pendentes.length} cliente${pendentes.length > 1 ? 's precisam' : ' precisa'} de follow-up: ${pendentes.slice(0,2).map(c => c.name).join(' e ')}.`);
    }

    if (intentName === 'ResumoDiaIntent') {
      const [events, clients, tasks] = await Promise.all([
        getKVData('durabel_calendar'),
        getKVData('durabel_clients'),
        getKVData('durabel_tasks'),
      ]);
      const hoje = eventosHoje(events || []);
      const followups = (clients || []).filter(c => ['proposta','negociacao'].includes(c.status) && (Date.now() - new Date(c.lastContact || c.createdAt || 0)) / 86400000 >= 7);
      const pendentes = (tasks || []).filter(t => !t.completed);
      const resposta = await gerarRespostaIA(`Felipe tem hoje: ${hoje.length} compromisso${hoje.length !== 1 ? 's' : ''}${hoje.length > 0 ? ' (' + hoje.map(e => e.summary).join(', ') + ')' : ''}, ${pendentes.length} tarefa${pendentes.length !== 1 ? 's' : ''} pendente${pendentes.length !== 1 ? 's' : ''} e ${followups.length} cliente${followups.length !== 1 ? 's' : ''} aguardando follow-up. Dê um resumo motivador em 2 frases para voz.`);
      return alexaResponse(resposta);
    }

    if (intentName === 'AMAZON.HelpIntent') {
      return alexaResponse('Posso te ajudar com agenda, tarefas, clientes, follow-ups ou resumo do dia.', false, 'O que deseja saber?');
    }

    if (['AMAZON.CancelIntent','AMAZON.StopIntent'].includes(intentName)) {
      return alexaResponse('Até logo, Felipe! Estarei aqui quando precisar.', true);
    }

    return alexaResponse('Não entendi. Pode repetir de outra forma?', false, 'O que deseja saber?');

  } catch (e) {
    console.error('Alexa error:', e);
    return alexaResponse('Tive um problema técnico. Tente novamente.');
  }
}
