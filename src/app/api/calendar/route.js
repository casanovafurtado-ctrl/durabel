import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { listEvents, createEvent } from '@/lib/google';
import { google } from 'googleapis';
import { getGoogleClient } from '@/lib/google';

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

export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.access_token) return Response.json({ error: 'Não autenticado' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');
    if (!eventId) return Response.json({ error: 'eventId obrigatório' }, { status: 400 });

    const auth = getGoogleClient(session.access_token);
    const calendar = google.calendar({ version: 'v3', auth });
    await calendar.events.delete({ calendarId: 'primary', eventId });

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.access_token) return Response.json({ error: 'Não autenticado' }, { status: 401 });

    const { eventId, title, location, description, date, time, endTime } = await req.json();
    if (!eventId) return Response.json({ error: 'eventId obrigatório' }, { status: 400 });

    const auth = getGoogleClient(session.access_token);
    const calendar = google.calendar({ version: 'v3', auth });

    const resource = { summary: title, location, description };

    // Atualiza data/hora se fornecidas
    if (date && time) {
      resource.start = { dateTime: new Date(`${date}T${time}:00`).toISOString(), timeZone: 'America/Recife' };
      resource.end = endTime
        ? { dateTime: new Date(`${date}T${endTime}:00`).toISOString(), timeZone: 'America/Recife' }
        : { dateTime: new Date(new Date(`${date}T${time}:00`).getTime() + 3600000).toISOString(), timeZone: 'America/Recife' };
    }

    const res = await calendar.events.patch({
      calendarId: 'primary',
      eventId,
      resource,
    });

    return Response.json({ event: res.data });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
