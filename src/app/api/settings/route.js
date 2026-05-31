import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Armazenamento temporário no servidor — usado só como cache
const serverCache = new Map();

const SENSITIVE = ['anthropic_key', 'elevenlabs_key', 'zapi_token', 'smtp_password'];
const ALL_FIELDS = [
  'anthropic_key', 'elevenlabs_key', 'elevenlabs_voice_id',
  'zapi_instance', 'zapi_token',
  'smtp_host', 'smtp_port', 'smtp_email', 'smtp_password',
  'pref_name', 'pref_company', 'pref_role', 'pref_phone', 'pref_city',
  'pref_workstart', 'pref_workend', 'pref_focustime', 'pref_meetingdays', 'pref_lunchbreak',
  'pref_remindermin', 'pref_followupdays', 'pref_dailybriefing',
  'pref_aitone', 'pref_language', 'pref_currency', 'pref_dateformat',
  'comp_cnpj', 'comp_address', 'comp_crea', 'comp_website', 'comp_specialties',
];

function encode(val) { return Buffer.from(val).toString('base64'); }
function decode(val) { try { return Buffer.from(val, 'base64').toString('utf8'); } catch { return val; } }

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return Response.json({ settings: {} });

    const cached = serverCache.get(session.user.email) || {};
    const safe = {};
    for (const [k, v] of Object.entries(cached)) {
      if (v) safe[k] = SENSITIVE.includes(k) ? '••••••••••••' : decode(v);
    }
    return Response.json({ settings: safe });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return Response.json({ error: 'Não autenticado' }, { status: 401 });

    const { fields } = await req.json();
    const email = session.user.email;
    const existing = serverCache.get(email) || {};

    for (const [k, v] of Object.entries(fields)) {
      if (v && !v.includes('•') && ALL_FIELDS.includes(k)) {
        existing[k] = encode(v);
      }
    }

    serverCache.set(email, existing);
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function getUserSettings(email) {
  const data = serverCache.get(email) || {};
  const decoded = {};
  for (const [k, v] of Object.entries(data)) {
    decoded[k] = decode(v);
  }
  return decoded;
}
