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

    // Atualiza data/hora — trata como horário local de Recife (UTC-3)
    if (date && time) {
      // Monta string sem Z para evitar interpretação UTC
      const startStr = `${date}T${time}:00`;
      const endStr = endTime ? `${date}T${endTime}:00` : null;

      resource.start = { 
        dateTime: startStr,
        timeZone: 'America/Recife'
      };
      resource.end = endStr
        ? { dateTime: endStr, timeZone: 'America/Recife' }
        : { 
            dateTime: `${date}T${String(parseInt(time.split(':')[0]) + 1).padStart(2,'0')}:${time.split(':')[1]}:00`,
            timeZone: 'America/Recife'
          };
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
