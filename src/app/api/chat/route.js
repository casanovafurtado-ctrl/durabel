import { getServerSession } from 'next-auth';
import Anthropic from '@anthropic-ai/sdk';
import { listEvents, createEvent, listTasks, createTask, completeTask } from '@/lib/google';
import { DURABEL_SYSTEM_PROMPT } from '@/lib/prompts';

// Importa helper de settings
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
    input_schema: {
      type: 'object',
      properties: {
        days_ahead: { type: 'number', description: 'Quantos dias à frente verificar (padrão: 7)' },
      },
    },
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
      properties: {
        task_id: { type: 'string' },
        list_id: { type: 'string' },
      },
      required: ['task_id'],
    },
  },
];

export async function POST(req) {
  try {
    const session = await getServerSession();
    const accessToken = session?.access_token;
    const email = session?.user?.email;

    // Pega chave Anthropic — primeiro do usuário, depois do env
    let anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (email) {
      const userKey = await getUserKey(email, 'anthropic_key');
      if (userKey) anthropicKey = userKey;
    }

    if (!anthropicKey) {
      return Response.json({
        content: 'Chave da IA não configurada. Vá em Config → Claude AI e adicione sua chave Anthropic.'
      });
    }

    const client = new Anthropic({ apiKey: anthropicKey });
    const { messages } = await req.json();

    const contextMessage = {
      role: 'user',
      content: `[Contexto: Data e hora atual: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Recife' })}. Usuário: ${session?.user?.name || 'Felipe'}]`,
    };

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: DURABEL_SYSTEM_PROMPT,
      tools: accessToken ? TOOLS : [],
      messages: [contextMessage, ...messages.map(m => ({ role: m.role, content: m.content }))],
    });

    let finalContent = '';
    let toolResults = [];

    for (const block of response.content) {
      if (block.type === 'text') {
        finalContent += block.text;
      } else if (block.type === 'tool_use' && accessToken) {
        const { name, input, id } = block;
        let result;
        try {
          if (name === 'get_calendar_events') {
            const events = await listEvents(accessToken, input.days_ahead || 7);
            result = events.length > 0 ? JSON.stringify(events) : 'Nenhum evento encontrado.';
          } else if (name === 'create_calendar_event') {
            await createEvent(accessToken, { title: input.title, date: input.date, time: input.time, endTime: input.end_time, location: input.location, description: input.description, attendees: input.attendees });
            result = `Evento "${input.title}" criado no Google Calendar!`;
          } else if (name === 'get_tasks') {
            const tasks = await listTasks(accessToken);
            result = tasks.length > 0 ? JSON.stringify(tasks) : 'Nenhuma tarefa pendente.';
          } else if (name === 'create_task') {
            await createTask(accessToken, { title: input.title, notes: input.notes, due: input.due });
            result = `Tarefa "${input.title}" criada no Google Tasks!`;
          } else if (name === 'complete_task') {
            await completeTask(accessToken, input.task_id, input.list_id);
            result = 'Tarefa concluída!';
          }
        } catch (e) { result = `Erro: ${e.message}`; }
        toolResults.push({ tool_use_id: id, content: result });
      }
    }

    if (toolResults.length > 0) {
      const followUp = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: DURABEL_SYSTEM_PROMPT,
        messages: [
          contextMessage,
          ...messages.map(m => ({ role: m.role, content: m.content })),
          { role: 'assistant', content: response.content },
          { role: 'user', content: toolResults.map(r => ({ type: 'tool_result', tool_use_id: r.tool_use_id, content: r.content })) },
        ],
      });
      finalContent = followUp.content.filter(b => b.type === 'text').map(b => b.text).join('');
    }

    return Response.json({ content: finalContent });
  } catch (err) {
    console.error('Chat error:', err);
    return Response.json({ content: 'Erro de conexão. Tente novamente.' }, { status: 500 });
  }
}
