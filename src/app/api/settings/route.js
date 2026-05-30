import { getServerSession } from 'next-auth';

// Simple in-memory store for demo - in production use Vercel KV or similar
// For now stores in process memory (resets on redeploy, but works for testing)
const userSettings = new Map();

function getKey(email, field) {
  return `${email}:${field}`;
}

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return Response.json({ settings: {} });
    }

    const email = session.user.email;
    const FIELDS = [
      'anthropic_key', 'elevenlabs_key', 'elevenlabs_voice_id',
      'zapi_instance', 'zapi_token',
      'smtp_host', 'smtp_port', 'smtp_email', 'smtp_password'
    ];

    const settings = {};
    for (const field of FIELDS) {
      const val = userSettings.get(getKey(email, field));
      if (val) settings[field] = '••••••••••••'; // mask sensitive
    }

    return Response.json({ settings });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { fields } = await req.json();
    const email = session.user.email;

    for (const [k, v] of Object.entries(fields)) {
      if (v && !v.includes('•')) {
        userSettings.set(getKey(email, k), v);
      }
    }

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
