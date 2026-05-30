import { getServerSession } from 'next-auth';
import Anthropic from '@anthropic-ai/sdk';
import { listEvents, createEvent, listTasks, createTask, completeTask } from '@/lib/google';
import { DURABEL_SYSTEM_PROMPT } from '@/lib/prompts';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Definição das ferramentas disponíveis para DURABEL
const TOOLS = [
  {
    name: 'get_calendar_events',
    description: 'Lista os próximos eventos do Google Calendar do usuário',
    input_schema: {
      type: 'object',
      properties: {
        days_ahead: {
          type: 'number',
          description: 'Quantos dias à frente verificar (padrão: 7)',
        },
      },
    },
  },
  {
    name: 'create_calendar_event',
    description: 'Cria um novo evento no Google Calendar',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Título do evento' },
        date: { type: 'string', description: 'Data no formato YYYY-MM-DD' },
        time: { type: 'string', description: 'Hora no formato HH:MM (24h)' },
        end_time: { type: 'string', description: 'Hora de término HH:MM (opcional)' },
        location: { type: 'string', description: 'Local do evento' },
        description: { type: 'string', description: 'Descrição ou pauta' },
        attendees: { type: 'string', description: 'E-mails dos participantes separados por vírgula' },
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
        title: { type: 'string', description: 'Título da tarefa' },
        notes: { type: 'string', description: 'Detalhes ou notas da tarefa' },
        due: { type: 'string', description: 'Data de vencimento YYYY-MM-DD (opcional)' },
      },
      required: ['title'],
    },
  },
  {
    name: 'complete_task',
    description: 'Marca uma tarefa como concluída no Google Tasks',
    input_schema: {
      type: 'object',
      properties: {
        task_id: { type: 'string', description: 'ID da tarefa' },
        list_id: { type: 'string', description: 'ID da lista (opcional, padrão: @default)' },
      },
      required: ['task_id'],
    },
  },
];

export async function POST(req) {
  try {
    const session = await getServerSession();

    // Em desenvolvimento, permite sem sessão para testar
    const accessToken = session?.access_token;

    const { messages } = await req.json();

    // Monta histórico de mensagens para Claude
    const apiMessages = messages.map(m => ({
      role: m.role,
      content: m.content,
    }));

    // Adiciona contexto da data/hora atual
    const contextMessage = {
      role: 'user',
      content: `[Contexto: Data e hora atual: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Recife' })}. Fuso: America/Recife (Recife/AL)]`,
    };

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: DURABEL_SYSTEM_PROMPT,
      tools: accessToken ? TOOLS : [],
      messages: [contextMessage, ...apiMessages],
    });

    // Processa tool_use se necessário
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
            result = events.length > 0
              ? JSON.stringify(events)
              : 'Nenhum evento encontrado no período.';
          } else if (name === 'create_calendar_event') {
            await createEvent(accessToken, {
              title: input.title,
              date: input.date,
              time: input.time,
              endTime: input.end_time,
              location: input.location,
              description: input.description,
              attendees: input.attendees,
            });
            result = `Evento "${input.title}" criado com sucesso no Google Calendar!`;
          } else if (name === 'get_tasks') {
            const tasks = await listTasks(accessToken);
            result = tasks.length > 0
              ? JSON.stringify(tasks)
              : 'Nenhuma tarefa pendente.';
          } else if (name === 'create_task') {
            await createTask(accessToken, {
              title: input.title,
              notes: input.notes,
              due: input.due,
            });
            result = `Tarefa "${input.title}" criada no Google Tasks!`;
          } else if (name === 'complete_task') {
            await completeTask(accessToken, input.task_id, input.list_id);
            result = 'Tarefa marcada como concluída!';
          }
        } catch (toolErr) {
          result = `Erro ao executar ${name}: ${toolErr.message}`;
        }

        toolResults.push({ tool_use_id: id, content: result });
      }
    }

    // Se teve tool_use, faz segunda chamada com os resultados
    if (toolResults.length > 0) {
      const followUp = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: DURABEL_SYSTEM_PROMPT,
        messages: [
          contextMessage,
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

    return Response.json({ content: finalContent });
  } catch (err) {
    console.error('Chat API error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
