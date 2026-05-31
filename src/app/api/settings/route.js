import { getServerSession } from 'next-auth';

// Vercel KV para persistência real por usuário
// Fallback para memory se KV não estiver configurado
let kv = null;
async function getKV() {
  if (kv) return kv;
  try {
    const mod = await import('@vercel/kv');
    kv = mod.kv;
    return kv;
  } catch {
    return null;
  }
}

// Fallback em memória (temporário, reseta no redeploy)
const memStore = new Map();

const SENSITIVE = ['anthropic_key', 'elevenlabs_key', 'zapi_token', 'smtp_password'];
const ALL_FIELDS = [
  'anthropic_key', 'elevenlabs_key', 'elevenlabs_voice_id',
  'zapi_instance', 'zapi_token',
  'smtp_host', 'smtp_port', 'smtp_email', 'smtp_password'
];

function encodeValue(val) {
  return Buffer.from(val).toString('base64');
}

function decodeValue(val) {
  try { return Buffer.from(val, 'base64').toString('utf8'); }
  catch { return val; }
}

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) return Response.json({ settings: {} });

    const email = session.user.email;
    const store = await getKV();
    let data = {};

    if (store) {
      data = await store.get(`settings:${email}`) || {};
    } else {
      data = memStore.get(email) || {};
    }

    // Retorna mascarado para o frontend
    const safe = {};
    for (const field of ALL_FIELDS) {
      if (data[field]) {
        safe[field] = SENSITIVE.includes(field) ? '••••••••••••' : decodeValue(data[field]);
      }
    }

    return Response.json({ settings: safe });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) return Response.json({ error: 'Não autenticado' }, { status: 401 });

    const { fields } = await req.json();
    const email = session.user.email;
    const store = await getKV();

    // Carrega existentes
    let data = {};
    if (store) {
      data = await store.get(`settings:${email}`) || {};
    } else {
      data = memStore.get(email) || {};
    }

    // Atualiza campos
    for (const [k, v] of Object.entries(fields)) {
      if (v && !v.includes('•') && ALL_FIELDS.includes(k)) {
        data[k] = encodeValue(v);
      }
    }

    // Salva
    if (store) {
      await store.set(`settings:${email}`, data);
    } else {
      memStore.set(email, data);
    }

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// Função utilitária para outras rotas pegarem as chaves do usuário
export async function getUserSettings(email) {
  const store = await getKV();
  let data = {};
  if (store) {
    data = await store.get(`settings:${email}`) || {};
  } else {
    data = memStore.get(email) || {};
  }
  const decoded = {};
  for (const [k, v] of Object.entries(data)) {
    decoded[k] = decodeValue(v);
  }
  return decoded;
}
