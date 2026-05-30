import { google } from 'googleapis';

/**
 * Cria um cliente OAuth2 autenticado com o token da sessão do usuário
 */
export function getGoogleClient(accessToken) {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );
  auth.setCredentials({ access_token: accessToken });
  return auth;
}

/**
 * Retorna instância do Google Calendar API
 */
export function getCalendar(accessToken) {
  const auth = getGoogleClient(accessToken);
  return google.calendar({ version: 'v3', auth });
}

/**
 * Retorna instância do Google Tasks API
 */
export function getTasks(accessToken) {
  const auth = getGoogleClient(accessToken);
  return google.tasks({ version: 'v1', auth });
}

/**
 * Lista próximos eventos do calendário
 */
export async function listEvents(accessToken, daysAhead = 7) {
  const calendar = getCalendar(accessToken);
  const timeMin = new Date().toISOString();
  const timeMax = new Date(Date.now() + daysAhead * 86400000).toISOString();

  const res = await calendar.events.list({
    calendarId: 'primary',
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 20,
  });

  return (res.data.items || []).map(e => ({
    id: e.id,
    title: e.summary || '(sem título)',
    start: e.start?.dateTime || e.start?.date,
    end: e.end?.dateTime || e.end?.date,
    location: e.location || null,
    description: e.description || null,
    attendees: (e.attendees || []).map(a => a.email).join(', ') || null,
  }));
}

/**
 * Cria um evento no Google Calendar
 */
export async function createEvent(accessToken, { title, date, time, endTime, location, description, attendees }) {
  const calendar = getCalendar(accessToken);

  // Monta datetime
  const startDateTime = time
    ? new Date(`${date}T${time}:00`).toISOString()
    : date;
  const endDateTime = endTime
    ? new Date(`${date}T${endTime}:00`).toISOString()
    : time
      ? new Date(`${date}T${time}:00`).getTime() + 3600000
      : date;

  const event = {
    summary: title,
    location: location || undefined,
    description: description || undefined,
    start: time
      ? { dateTime: startDateTime, timeZone: 'America/Recife' }
      : { date },
    end: time
      ? { dateTime: new Date(endDateTime).toISOString(), timeZone: 'America/Recife' }
      : { date },
    attendees: attendees
      ? attendees.split(',').map(e => ({ email: e.trim() })).filter(a => a.email.includes('@'))
      : undefined,
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 30 },
        { method: 'email', minutes: 60 },
      ],
    },
  };

  const res = await calendar.events.insert({ calendarId: 'primary', resource: event });
  return res.data;
}

/**
 * Lista tarefas do Google Tasks
 */
export async function listTasks(accessToken) {
  const tasks = getTasks(accessToken);

  // Pega todas as listas de tarefas
  const listsRes = await tasks.tasklists.list({ maxResults: 10 });
  const lists = listsRes.data.items || [];

  const allTasks = [];
  for (const list of lists) {
    const res = await tasks.tasks.list({
      tasklist: list.id,
      showCompleted: false,
      maxResults: 20,
    });
    const items = (res.data.items || []).map(t => ({
      id: t.id,
      listId: list.id,
      listTitle: list.title,
      title: t.title,
      notes: t.notes || null,
      due: t.due || null,
      status: t.status,
    }));
    allTasks.push(...items);
  }
  return allTasks;
}

/**
 * Cria uma tarefa no Google Tasks
 */
export async function createTask(accessToken, { title, notes, due }) {
  const tasks = getTasks(accessToken);

  // Usa a lista padrão "@default"
  const task = {
    title,
    notes: notes || undefined,
    due: due ? new Date(due).toISOString() : undefined,
  };

  const res = await tasks.tasks.insert({ tasklist: '@default', resource: task });
  return res.data;
}

/**
 * Marca uma tarefa como concluída
 */
export async function completeTask(accessToken, taskId, listId = '@default') {
  const tasks = getTasks(accessToken);
  const res = await tasks.tasks.patch({
    tasklist: listId,
    task: taskId,
    resource: { status: 'completed' },
  });
  return res.data;
}
