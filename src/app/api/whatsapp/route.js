import { getServerSession } from 'next-auth';

export async function POST(req) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) return Response.json({ error: 'Não autenticado' }, { status: 401 });

    const { phone, message } = await req.json();
    if (!phone || !message) return Response.json({ error: 'Telefone e mensagem obrigatórios' }, { status: 400 });

    const instanceId = process.env.ZAPI_INSTANCE_ID;
    const token = process.env.ZAPI_TOKEN;

    if (!instanceId || !token) {
      return Response.json({ error: 'Z-API não configurado. Adicione as credenciais em Configurações.' }, { status: 400 });
    }

    // Formata número: remove tudo que não é dígito, garante DDI 55
    const cleaned = phone.replace(/\D/g, '');
    const formatted = cleaned.startsWith('55') ? cleaned : `55${cleaned}`;

    const res = await fetch(`https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: formatted, message }),
    });

    const data = await res.json();

    if (!res.ok) {
      return Response.json({ error: data.message || 'Erro ao enviar mensagem' }, { status: res.status });
    }

    return Response.json({ success: true, data });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
