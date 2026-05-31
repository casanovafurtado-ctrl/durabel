import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { listEvents, createEvent } from '@/lib/google';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.access_token) return Response.json({ error: 'Não autenticado' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '14');

    const events = await listEvents(session.access_token, days);
    return Response.json({ events });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.access_token) return Response.json({ error: 'Não autenticado' }, { status: 401 });

    const body = await req.json();
    const event = await createEvent(session.access_token, body);
    return Response.json({ event });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
