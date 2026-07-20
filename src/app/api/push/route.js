import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Redis } from '@upstash/redis';

function getRedis() {
  try { return Redis.fromEnv(); } catch { return null; }
}

// Salva o token de push do usuário no KV
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return Response.json({ error: 'Não autenticado' }, { status: 401 });
    const { subscription } = await req.json();
    const redis = getRedis();
    if (!redis) return Response.json({ error: 'KV indisponível' }, { status: 500 });
    await redis.set(`durabel_push_${session.user.email}`, JSON.stringify(subscription));
    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// Remove o token (desativar notificações)
export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return Response.json({ error: 'Não autenticado' }, { status: 401 });
    const redis = getRedis();
    if (redis) await redis.del(`durabel_push_${session.user.email}`);
    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
