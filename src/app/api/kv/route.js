import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

async function getKV() {
  try {
    const { kv } = await import('@vercel/kv');
    return kv;
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

    const kv = await getKV();
    if (!kv) return Response.json({ error: 'KV not configured' }, { status: 503 });

    const data = await kv.get(key);
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
    const kv = await getKV();
    if (!kv) return Response.json({ ok: false, reason: 'KV not configured' });

    await kv.set(key || 'durabel_clients', data);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
