import { Redis } from '@upstash/redis';
import webpush from 'web-push';

function getRedis() {
  try { return Redis.fromEnv(); } catch { return null; }
}

webpush.setVapidDetails(
  'mailto:felipe@durar.com.br',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

async function enviarNotificacao(subscription, title, body) {
  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify({ title, body, icon: '/icons/icon-192.png' })
    );
  } catch {}
}

export async function GET(req) {
  // Verifica se é chamada autorizada do Vercel Cron
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const redis = getRedis();
  if (!redis) return Response.json({ ok: true });

  // Lista todos os usuários com push ativo
  const keys = await redis.keys('durabel_push_*');

  for (const key of keys) {
    const email = key.replace('durabel_push_', '');
    const subRaw = await redis.get(key);
    if (!subRaw) continue;
    const subscription = typeof subRaw === 'string' ? JSON.parse(subRaw) : subRaw;

    const settings = await redis.get(`durabel_settings_${email}`) || {};

    // Verifica tarefas vencendo
    const tasks = await redis.get(`durabel_tasks_${email}`) || [];
    const hoje = new Date();
    const amanha = new Date(hoje.getTime() + 86400000);
    const urgentes = (tasks || []).filter(t => {
      if (!t.due || t.completed) return false;
      const due = new Date(t.due);
      return due <= amanha && due >= hoje;
    });
    if (urgentes.length > 0) {
      await enviarNotificacao(subscription,
        '📋 DURABEL — Tarefas vencendo',
        `${urgentes.length} tarefa${urgentes.length > 1 ? 's vencem' : ' vence'} amanhã: ${urgentes.slice(0,2).map(t => t.title).join(', ')}`
      );
    }

    // Verifica follow-ups pendentes
    const clients = await redis.get(`durabel_clients_${email}`) || [];
    const diasConfig = parseInt((settings.pref_followupdays || '7 dias').split(' ')[0]);
    const followups = (clients || []).filter(c =>
      ['proposta','negociacao'].includes(c.status) &&
      (Date.now() - new Date(c.lastContact || c.createdAt || 0)) / 86400000 >= diasConfig
    );
    if (followups.length > 0) {
      await enviarNotificacao(subscription,
        '🔔 DURABEL — Follow-up pendente',
        `${followups.length} cliente${followups.length > 1 ? 's aguardam' : ' aguarda'} retorno: ${followups.slice(0,2).map(c => c.name).join(', ')}`
      );
    }
  }

  return Response.json({ ok: true, users: keys.length });
}
