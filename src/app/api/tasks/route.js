import { getServerSession } from 'next-auth';
import { listTasks, createTask, completeTask } from '@/lib/google';

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.access_token) return Response.json({ error: 'Não autenticado' }, { status: 401 });

    const tasks = await listTasks(session.access_token);
    return Response.json({ tasks });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession();
    if (!session?.access_token) return Response.json({ error: 'Não autenticado' }, { status: 401 });

    const body = await req.json();

    if (body.action === 'complete') {
      const task = await completeTask(session.access_token, body.taskId, body.listId);
      return Response.json({ task });
    }

    const task = await createTask(session.access_token, body);
    return Response.json({ task });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
