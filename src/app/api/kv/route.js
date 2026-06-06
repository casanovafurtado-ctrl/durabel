import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Redis } from '@upstash/redis';

function getRedis() {
  try {
    return Redis.fromEnv();
  } catch {
    return null;
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key') || 'durabel_clients';
    const token = searchParams.get('token');

    if (token !== process.env.ALEXA_SECRET) {
      const session = await getServerSession(authOptions);
      if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const redis = await getRedis();
    if (!redis) return Response.json({ error: 'Redis not configured' }, { status: 503 });

    const data = await redis.get(key);
    return Response.json({ data });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { key, data } = await req.json();
    const redis = await getRedis();
    if (!redis) return Response.json({ ok: false, reason: 'Redis not configured' });

    await redis.set(key || 'durabel_clients', data);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
