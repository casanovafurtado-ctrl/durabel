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
      system: 'Você é a DURABEL, assistente de voz da DURAR Consultoria de Felipe Casa Nova. Responda em no máximo 2 frases curtas e naturais para voz. Sem listas, sem asteriscos, linguagem falada em português brasileiro.',
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

    // ─── LAUNCH ────────────────────────────────────────────
    if (requestType === 'LaunchRequest') {
      const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Recife' }));
      const hora = now.getHours();
      const dia = now.getDay();
      const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

      // Localização do dispositivo (com fallback para Barra de São Miguel)
      let cidade = 'Barra de São Miguel';
      try {
        const deviceId = body.context?.System?.device?.deviceId;
        const apiEndpoint = body.context?.System?.apiEndpoint;
        const apiToken = body.context?.System?.apiAccessToken;
        if (deviceId && apiEndpoint && apiToken) {
          const locRes = await fetch(
            `${apiEndpoint}/v1/devices/${deviceId}/settings/address`,
            { headers: { 'Authorization': `Bearer ${apiToken}` } }
          );
          if (locRes.ok) {
            const locData = await locRes.json();
            if (locData.city) cidade = locData.city;
          }
        }
      } catch {}

      // Clima em tempo real
      let climaFrase = '';
      try {
        const climaRes = await fetch(`https://wttr.in/${encodeURIComponent(cidade)}?format=j1`);
        if (climaRes.ok) {
          const climaData = await climaRes.json();
          const temp = climaData.current_condition[0].temp_C;
          const desc = climaData.current_condition[0].weatherDesc[0].value.toLowerCase();
          const uv = parseInt(climaData.current_condition[0].uvIndex);

          if (desc.includes('sun') || desc.includes('clear')) {
            climaFrase = rand([
              `Sol forte em ${cidade}, ${temp} graus. Protetor solar no bolso e bora!`,
              `${temp} graus e sol abrasador em ${cidade}. Pelo menos o laudo não derrete.`,
              `Calorzão de ${temp} graus. Dia perfeito para vistoria de fachada às duas da tarde. Brincadeira!`,
            ]);
          } else if (desc.includes('rain') || desc.includes('drizzle')) {
            climaFrase = rand([
              `Chovendo em ${cidade}, ${temp} graus. Perfeito para ficar no escritório fazendo laudo.`,
              `${temp} graus e chuva. Aquela chuva que aparece na vistoria de cobertura exatamente quando você menos quer.`,
              `Chuva lá fora! Ótimo dia para auditar aquela impermeabilização que o síndico disse que estava ótima.`,
            ]);
          } else if (desc.includes('cloud')) {
            climaFrase = rand([
              `${temp} graus e nublado em ${cidade}. Aquela fresquinha que engana e você sai sem protetor.`,
              `Céu nublado e ${temp} graus. O céu tendo pena de você hoje.`,
            ]);
          } else {
            climaFrase = `${temp} graus em ${cidade} agora.`;
          }
          if (uv >= 8 && hora >= 10 && hora <= 15) climaFrase += ' UV altíssimo, coloca boné se for a campo!';
        }
      } catch {}

      // Tarefas urgentes do KV
      let tarefaFrase = '';
      try {
        const tasks = await getKVData('durabel_tasks') || [];
        const pending = tasks.filter(t => !t.completed);
        const urgentes = pending.filter(t => {
          if (!t.due) return false;
          const diff = (new Date(t.due) - now) / 86400000;
          return diff >= 0 && diff <= 2;
        });
        if (urgentes.length > 0) {
          tarefaFrase = rand([
            `Tem ${urgentes.length} tarefa${urgentes.length > 1 ? 's' : ''} com prazo chegando, viu!`,
            `Atenção: ${urgentes.length} tarefa${urgentes.length > 1 ? 's urgentes' : ' urgente'} no radar.`,
          ]);
        } else if (pending.length > 0) {
          tarefaFrase = rand([
            `Você tem ${pending.length} tarefa${pending.length > 1 ? 's' : ''} pendente${pending.length > 1 ? 's' : ''}.`,
            `Ainda tem ${pending.length} item${pending.length > 1 ? 'ns' : ''} na lista.`,
          ]);
        } else {
          tarefaFrase = rand([
            'Lista de tarefas zerada! Raro como fachada sem patologia.',
            'Sem tarefas pendentes. Aproveita, que isso não dura.',
          ]);
        }
      } catch {}

      // Saudação por horário
      const saudacoes = {
        manha: ['Bom dia meu querido!','Bom dia! Café na mão?','Bom dia! Vamos dominar o dia?','Eita, tá cedo! Bom dia!','Bom dia! O laudo não vai escrever sozinho.'],
        tarde: ['Boa tarde!','Boa tarde, meu caro!','Boa tarde! Almoçou?','Boa tarde! Ainda de pé?','Boa tarde, engenheiro!'],
        noite: ['Boa noite!','Boa noite! Ainda trabalhando?','Boa noite, meu querido!','Isso é dedicação ou workaholismo?','Boa noite! Vai descansar logo.'],
      };
      const saudacao = hora < 12 ? rand(saudacoes.manha) : hora < 18 ? rand(saudacoes.tarde) : rand(saudacoes.noite);

      // Pérolas por dia da semana
      const perolas = {
        0: ['Domingo! Se você está aqui é pq não consegue largar o trabalho. Respeito.','Domingo! Deus descansou, mas o síndico não para de ligar.','É domingo, meu caro. O app pode esperar. Ou não.','Domingo! Dia de família, churrasco e... relatório técnico?'],
        1: ['Segunda-feira. O café ainda não fez efeito mas a lista de tarefas já começa.','Segunda! Vamos lá, que o condomínio não vistoria sozinho.','Bora que o laudo não escreve sozinho!','Segunda! Aquele dia que todo mundo odeia mas a DURAR precisa.','O fim de semana acabou mais rápido que proposta sem contraproposta.','Segunda-feira: o chefe chegou. Brincadeira, você é o chefe.'],
        2: ['Terça-feira! Ainda não é quarta mas já passou da segunda. Progresso.','Terça! Aquele dia discreto que ninguém faz meme mas existe.','Terça-feira. O dia mais sem graça da semana. Mas a DURAR brilha todo dia.','Terça! Nem o calorão te segura hoje.'],
        3: ['Quarta-feira! Metade da semana. Meio cheio ou meio vazio? Depende do laudo.','Quarta! Já passou da metade, a vitória está perto.','Quarta-feira! O camelo agradece por você não ter desistido.','Hump day! Downhill a partir de agora.','Quarta! Se você chegou até aqui, o resto é moleza.'],
        4: ['Quinta-feira! A sexta tá logo ali. Força!','Quinta! A véspera da véspera do fim de semana.','Quinta-feira. O dia em que você já começa a planejar o fim de semana.','Quinta! Falta pouco. O laudo de amanhã agradece o esforço de hoje.'],
        5: ['Sextou! Dia de mandar e-mail sem o anexo e dizer: segue o anexo.','Sextou! A semana acabou... ou pelo menos deveria.','Sexta-feira! O dia em que a produtividade vai de férias antes de você.','Sextou meu querido! Última força antes do merecido descanso.','Sexta! Aquele dia em que qualquer reunião deveria ser e-mail.','Sextou! Se tiver vistoria hoje, vai com sorriso que é o último esforço da semana.','Sexta-feira! Aquele relatório pode esperar segunda. Ou pode?'],
        6: ['Sábado! Dia de descansar... ou não, né Felipe?','É sábado! Se estiver remando, pode me consultar do caiaque também.','Sábado! Workaholic assumido ou urgência real? Estou aqui de qualquer forma.','Sábado! O síndico não respeita fim de semana. Mas você poderia.','Sábadou! Cadê o caiaque?'],
      };
      const perola = rand(perolas[dia] || perolas[0]);

      let resposta = `${saudacao} Aqui é a DURABEL. ${perola}`;
      if (climaFrase) resposta += ` ${climaFrase}`;
      if (tarefaFrase) resposta += ` ${tarefaFrase}`;
      resposta += ' O que posso fazer por você?';

      return alexaResponse(resposta, false, 'O que posso fazer por você?');
    }

    if (requestType === 'SessionEndedRequest') {
      return new Response(JSON.stringify({ version: '1.0', response: {} }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // ─── INTENTS ───────────────────────────────────────────

    if (intentName === 'AgendaHojeIntent') {
      const events = await getKVData('durabel_calendar') || [];
      const hoje = eventosHoje(events);
      if (!hoje.length) return alexaResponse('Sua agenda está livre hoje!');
      if (hoje.length === 1) return alexaResponse(`Você tem um compromisso hoje: ${hoje[0].summary}${hoje[0].start?.dateTime ? ' às ' + fmtHora(hoje[0].start.dateTime) : ''}.`);
      return alexaResponse(`Você tem ${hoje.length} compromissos hoje. O primeiro é ${hoje[0].summary}${hoje[0].start?.dateTime ? ' às ' + fmtHora(hoje[0].start.dateTime) : ''}.`);
    }

    if (intentName === 'AgendaSemanaIntent') {
      const events = await getKVData('durabel_calendar') || [];
      const agora = new Date();
      const em7dias = new Date(agora.getTime() + 7 * 86400000);
      const proximos = events.filter(ev => {
        try {
          const dt = new Date(ev.start?.dateTime || ev.start?.date);
          return dt >= agora && dt <= em7dias;
        } catch { return false; }
      });
      if (!proximos.length) return alexaResponse('Você não tem compromissos nos próximos 7 dias.');
      if (proximos.length === 1) {
        const dia = new Date(proximos[0].start?.dateTime || proximos[0].start?.date).toLocaleDateString('pt-BR', { timeZone: 'America/Recife', weekday: 'long', day: '2-digit', month: 'long' });
        return alexaResponse(`Você tem um compromisso: ${proximos[0].summary || proximos[0].title} ${dia}.`);
      }
      const lista = proximos.slice(0,3).map(ev => {
        const dia = new Date(ev.start?.dateTime || ev.start?.date).toLocaleDateString('pt-BR', { timeZone: 'America/Recife', weekday: 'short', day: '2-digit', month: 'short' });
        return `${ev.summary || ev.title} no dia ${dia}`;
      }).join(', ');
      return alexaResponse(`Você tem ${proximos.length} compromissos essa semana: ${lista}.`);
    }

    if (intentName === 'ProximoEventoIntent') {
      const events = await getKVData('durabel_calendar') || [];
      const proximo = events.find(ev => new Date(ev.start?.dateTime || ev.start?.date) > new Date());
      if (!proximo) return alexaResponse('Não há próximos compromissos na agenda.');
      const dia = new Date(proximo.start?.dateTime || proximo.start?.date).toLocaleDateString('pt-BR', { timeZone: 'America/Recife', weekday: 'long', day: '2-digit', month: 'long' });
      return alexaResponse(`Seu próximo compromisso é ${proximo.summary || proximo.title}, ${dia}${proximo.start?.dateTime ? ' às ' + fmtHora(proximo.start.dateTime) : ''}.`);
    }

    if (intentName === 'TarefasIntent') {
      const tasks = await getKVData('durabel_tasks') || [];
      const pending = tasks.filter(t => !t.completed).slice(0,3);
      if (!pending.length) return alexaResponse('Não há tarefas pendentes no momento.');
      return alexaResponse(`Você tem ${pending.length} tarefas pendentes: ${pending.map(t => t.title).join(', ')}.`);
    }

    if (intentName === 'ClientesIntent') {
      const clients = await getKVData('durabel_clients') || [];
      if (!clients.length) return alexaResponse('O CRM ainda não foi sincronizado. Abra o app DURABEL e salve um cliente.');
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

    if (intentName === 'FinanceiroIntent') {
      const clients = await getKVData('durabel_clients') || [];
      const proposals = await getKVData('durabel_proposals') || [];
      const parseCurr = (v) => parseFloat(String(v||'').replace(/[.]/g,'').replace(',','.'))||0;
      let faturado = 0, pipeline = 0, fechados = 0, emNegociacao = 0, perdidasCount = 0;
      clients.forEach(cl => {
        const total = (cl.serviceItems||[]).reduce((s,i) => s + parseCurr(i.value), 0) || parseCurr(cl.value||'');
        if (cl.status === 'fechado') { faturado += total; fechados++; }
        else if (['proposta','negociacao'].includes(cl.status)) { pipeline += total; emNegociacao++; }
        else if (cl.status === 'perdido') perdidasCount++;
      });
      proposals.forEach(p => {
        const v = parseCurr(p.value);
        if (p.status === 'fechada') { faturado += v; fechados++; }
        else if (p.status === 'enviada') { pipeline += v; emNegociacao++; }
        else if (p.status === 'perdida') perdidasCount++;
      });
      const total = fechados + emNegociacao + perdidasCount;
      const conversao = total > 0 ? Math.round((fechados/total)*100) : 0;
      const ticketMedio = fechados > 0 ? faturado/fechados : 0;
      const fmtR = (v) => v >= 1000 ? `${(v/1000).toFixed(1)} mil reais` : `${Math.round(v)} reais`;
      if (total === 0) return alexaResponse('Ainda não há dados financeiros. Abra o app DURABEL e salve um cliente.');
      return alexaResponse(`Resumo financeiro: ${fmtR(faturado)} em contratos fechados e ${fmtR(pipeline)} em pipeline, com ${emNegociacao} proposta${emNegociacao !== 1 ? 's' : ''} em aberto. Conversão de ${conversao}% e ticket médio de ${fmtR(ticketMedio)}.`);
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
      const resposta = await gerarRespostaIA(`Felipe tem hoje: ${hoje.length} compromisso${hoje.length !== 1 ? 's' : ''}${hoje.length > 0 ? ' (' + hoje.map(e => e.summary).join(', ') + ')' : ''}, ${pendentes.length} tarefa${pendentes.length !== 1 ? 's' : ''} pendente${pendentes.length !== 1 ? 's' : ''} e ${followups.length} cliente${followups.length !== 1 ? 's' : ''} aguardando follow-up. Dê um resumo motivador em 2 frases curtas para voz.`);
      return alexaResponse(resposta);
    }

    if (intentName === 'AMAZON.HelpIntent') {
      return alexaResponse('Posso te ajudar com agenda, tarefas, clientes, resultados financeiros, follow-ups ou resumo do dia.', false, 'O que deseja saber?');
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
