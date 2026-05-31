import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Usa Vercel Blob para persistência — já conectado no projeto
let blobModule = null;
async function getBlob() {
  if (blobModule) return blobModule;
  try {
    blobModule = await import('@vercel/blob');
    return blobModule;
  } catch { return null; }
}

// Fallback memória se Blob não disponível
const memStore = new Map();

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

function getBlobKey(email) {
  return `settings/${email.replace(/[^a-z0-9]/gi, '_')}.json`;
}

async function loadSettings(email) {
  const blob = await getBlob();
  if (blob) {
    try {
      const key = getBlobKey(email);
      const token = process.env.BLOB_READ_WRITE_TOKEN;
      // Lista blobs com esse prefixo
      const { blobs } = await blob.list({ prefix: `settings/${email.replace(/[^a-z0-9]/gi, '_')}`, token });
      if (blobs.length > 0) {
        const res = await fetch(blobs[0].url);
        if (res.ok) return await res.json();
      }
    } catch (e) { console.error('Blob load error:', e); }
  }
  return memStore.get(email) || {};
}

async function saveSettings(email, data) {
  const blob = await getBlob();
  if (blob) {
    try {
      const key = getBlobKey(email);
      const token = process.env.BLOB_READ_WRITE_TOKEN;
      await blob.put(key, JSON.stringify(data), {
        access: 'public',
        token,
        addRandomSuffix: false,
        allowOverwrite: true,
      });
      return true;
    } catch (e) { console.error('Blob save error:', e); }
  }
  memStore.set(email, data);
  return true;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return Response.json({ settings: {} });

    const data = await loadSettings(session.user.email);

    // Retorna mascarado para campos sensíveis
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

    // Carrega existentes
    const data = await loadSettings(email);

    // Atualiza campos
    for (const [k, v] of Object.entries(fields)) {
      if (v && !v.includes('•') && ALL_FIELDS.includes(k)) {
        data[k] = encode(v);
      }
    }

    await saveSettings(email, data);
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
