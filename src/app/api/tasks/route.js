import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { listTasks, createTask, completeTask } from '@/lib/google';
import { google } from 'googleapis';
import { getGoogleClient } from '@/lib/google';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.access_token) return Response.json({ error: 'Não autenticado' }, { status: 401 });
    const tasks = await listTasks(session.access_token);
    return Response.json({ tasks });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.access_token) return Response.json({ error: 'Não autenticado' }, { status: 401 });

    const body = await req.json();
    const auth = getGoogleClient(session.access_token);
    const tasks = google.tasks({ version: 'v1', auth });

    if (body.action === 'complete') {
      const task = await completeTask(session.access_token, body.taskId, body.listId);
      return Response.json({ task });
    }

    if (body.action === 'delete') {
      await tasks.tasks.delete({
        tasklist: body.listId || '@default',
        task: body.taskId,
      });
      return Response.json({ success: true });
    }

    if (body.action === 'update') {
      const task = await tasks.tasks.patch({
        tasklist: body.listId || '@default',
        task: body.taskId,
        resource: { title: body.title, notes: body.notes },
      });
      return Response.json({ task: task.data });
    }

    // Criar nova tarefa
    const task = await createTask(session.access_token, body);
    return Response.json({ task });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
