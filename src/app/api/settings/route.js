import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { put, list, del } from '@vercel/blob';

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

function getBlobPrefix(email) {
  return `settings/${email.replace(/[^a-z0-9]/gi, '_')}`;
}

async function loadSettings(email) {
  try {
    const prefix = getBlobPrefix(email);
    const { blobs } = await list({ prefix });
    if (blobs.length > 0) {
      // Pega o mais recente
      const latest = blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))[0];
      const res = await fetch(latest.url);
      if (res.ok) return await res.json();
    }
  } catch (e) {
    console.error('Blob load error:', e);
  }
  return {};
}

async function saveSettings(email, data) {
  try {
    const prefix = getBlobPrefix(email);

    // Remove blobs antigos primeiro
    const { blobs } = await list({ prefix });
    for (const blob of blobs) {
      await del(blob.url);
    }

    // Salva novo
    await put(`${prefix}.json`, JSON.stringify(data), {
      access: 'public',
      addRandomSuffix: false,
    });
    return true;
  } catch (e) {
    console.error('Blob save error:', e);
    return false;
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return Response.json({ settings: {} });

    const data = await loadSettings(session.user.email);
    const safe = {};
    for (const [k, v] of Object.entries(data)) {
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

    const data = await loadSettings(email);

    for (const [k, v] of Object.entries(fields)) {
      if (v && !v.includes('•') && ALL_FIELDS.includes(k)) {
        data[k] = encode(v);
      }
    }

    const ok = await saveSettings(email, data);
    if (!ok) return Response.json({ error: 'Erro ao salvar' }, { status: 500 });

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function getUserSettings(email) {
  const data = await loadSettings(email);
  const decoded = {};
  for (const [k, v] of Object.entries(data)) {
    decoded[k] = decode(v);
  }
  return decoded;
}
