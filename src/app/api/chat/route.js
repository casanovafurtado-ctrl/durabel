import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Anthropic from '@anthropic-ai/sdk';
import { listEvents, createEvent, listTasks, createTask, completeTask } from '@/lib/google';
import { DURABEL_SYSTEM_PROMPT } from '@/lib/prompts';

async function getUserKey(email, field) {
  try {
    const { getUserSettings } = await import('@/app/api/settings/route');
    const settings = await getUserSettings(email);
    return settings[field] || null;
  } catch { return null; }
}

const TOOLS = [
  {
    name: 'get_calendar_events',
    description: 'Lista os próximos eventos do Google Calendar do usuário',
    input_schema: { type: 'object', properties: { days_ahead: { type: 'number' } } },
  },
  {
    name: 'create_calendar_event',
    description: 'Cria um novo evento no Google Calendar',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        date: { type: 'string', description: 'YYYY-MM-DD' },
        time: { type: 'string', description: 'HH:MM' },
        end_time: { type: 'string' },
        location: { type: 'string' },
        description: { type: 'string' },
        attendees: { type: 'string' },
      },
      required: ['title', 'date'],
    },
  },
  {
    name: 'get_tasks',
    description: 'Lista as tarefas pendentes do Google Tasks',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'create_task',
    description: 'Cria uma nova tarefa no Google Tasks',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        notes: { type: 'string' },
        due: { type: 'string', description: 'YYYY-MM-DD' },
      },
      required: ['title'],
    },
  },
  {
    name: 'complete_task',
    description: 'Marca uma tarefa como concluída',
    input_schema: {
      type: 'object',
      properties: { task_id: { type: 'string' }, list_id: { type: 'string' } },
      required: ['task_id'],
    },
  },
];

export async function POST(req) {
  try {
    // ✅ Passa authOptions para funcionar no Next.js 15
    const session = await getServerSession(authOptions);
    const accessToken = session?.access_token;
    const email = session?.user?.email;

    // Lê o body com crmData incluído
    const { messages, anthropicKey: clientKey, crmData, systemOverride } = await req.json();

    // Pega chave Anthropic — prioridade: enviada pelo cliente (localStorage) > servidor > env dev
    let anthropicKey = clientKey || null;
    if (!anthropicKey && email) {
      const userKey = await getUserKey(email, 'anthropic_key');
      if (userKey) anthropicKey = userKey;
    }
    if (!anthropicKey && process.env.NODE_ENV === 'development') {
      anthropicKey = process.env.ANTHROPIC_API_KEY;
    }

    if (!anthropicKey) {
      return Response.json({
        content: '⚠️ Chave da IA não configurada. Vá em Config → Chaves API → Claude AI e adicione sua chave Anthropic.',
      });
    }

    // Se vier systemOverride (ex: gerador de relatório), usa prompt simples sem tools
    if (systemOverride) {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        system: systemOverride,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
      });
      const content = response.content.find(b => b.type === 'text')?.text || '';
      return Response.json({ content });
    }

    // Monta contexto com dados do CRM
    let crmContext = '';
    if (crmData?.clients?.length > 0) {
      const clientList = crmData.clients.map(c => {
        const items = (c.serviceItems || []).map(s => s.name + (s.value ? ` R$${s.value}` : '')).filter(Boolean).join(', ');
        return `- ${c.name}${c.building ? ` (${c.building})` : ''} [${c.status}]${items ? ' | ' + items : ''}${c.phone ? ' | ' + c.phone : ''}${c.notes ? ' | Obs: ' + c.notes : ''}`;
      }).join('\n');
      crmContext += `\n\nCLIENTES NO CRM (${crmData.clients.length}):\n${clientList}`;
    }
    if (crmData?.proposals?.length > 0) {
      crmContext += `\n\nPROPOSTAS: ${crmData.proposals.map(p => `${p.client} R$${p.value || '0'} (${p.status})`).join(', ')}`;
    }
    if (crmData?.minutes?.length > 0) {
      crmContext += `\n\nATAS SALVAS: ${crmData.minutes.map(m => m.title).join(', ')}`;
    }

    const contextMessage = {
      role: 'user',
      content: `[Data/hora: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Recife' })}. Usuário: ${session?.user?.name || 'Felipe'}.${crmContext}]`,
    };

    const apiMessages = [
      contextMessage,
      ...messages.map(m => ({ role: m.role, content: m.content }))
    ];

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: DURABEL_SYSTEM_PROMPT,
      tools: accessToken ? TOOLS : [],
      messages: apiMessages,
    });

    let finalContent = '';
    const toolResults = [];

    for (const block of response.content) {
      if (block.type === 'text') {
        finalContent += block.text;
      } else if (block.type === 'tool_use' && accessToken) {
        const { name, input, id } = block;
        let result = 'Ação executada.';
        try {
          if (name === 'get_calendar_events') {
            const events = await listEvents(accessToken, input.days_ahead || 7);
            result = events.length > 0 ? JSON.stringify(events) : 'Nenhum evento encontrado no período.';
          } else if (name === 'create_calendar_event') {
            await createEvent(accessToken, {
              title: input.title, date: input.date, time: input.time,
              endTime: input.end_time, location: input.location,
              description: input.description, attendees: input.attendees,
            });
            result = `Evento "${input.title}" criado com sucesso no Google Calendar!`;
          } else if (name === 'get_tasks') {
            const tasks = await listTasks(accessToken);
            result = tasks.length > 0 ? JSON.stringify(tasks) : 'Nenhuma tarefa pendente.';
          } else if (name === 'create_task') {
            await createTask(accessToken, { title: input.title, notes: input.notes, due: input.due });
            result = `Tarefa "${input.title}" criada no Google Tasks!`;
          } else if (name === 'complete_task') {
            await completeTask(accessToken, input.task_id, input.list_id);
            result = 'Tarefa marcada como concluída!';
          }
        } catch (toolErr) {
          result = `Erro na ferramenta ${name}: ${toolErr.message}`;
        }
        toolResults.push({ tool_use_id: id, content: result });
      }
    }

    if (toolResults.length > 0) {
      const followUp = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        system: DURABEL_SYSTEM_PROMPT,
        messages: [
          ...apiMessages,
          { role: 'assistant', content: response.content },
          {
            role: 'user',
            content: toolResults.map(r => ({
              type: 'tool_result',
              tool_use_id: r.tool_use_id,
              content: r.content,
            })),
          },
        ],
      });
      finalContent = followUp.content
        .filter(b => b.type === 'text')
        .map(b => b.text)
        .join('');
    }

    return Response.json({ content: finalContent || 'Pronto!' });

  } catch (err) {
    console.error('Chat API error:', err?.message, err?.status);
    const msg = err?.status === 401
      ? '🔑 Chave Anthropic inválida. Verifique em Config → Chaves API.'
      : err?.status === 429
        ? '⏳ Limite de requisições atingido. Aguarde um momento.'
        : `Erro de conexão: ${err?.message || 'Tente novamente.'}`;
    return Response.json({ content: msg }, { status: 500 });
  }
}
