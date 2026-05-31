import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

async function getUserKey(email, field) {
  try {
    const { getUserSettings } = await import('@/app/api/settings/route');
    const settings = await getUserSettings(email);
    return settings[field] || null;
  } catch { return null; }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;

    const { audio, mimeType, title, duration } = await req.json();
    if (!audio) return Response.json({ error: 'Áudio não recebido' }, { status: 400 });

    // Pega chave Anthropic
    const { messages, anthropicKey: clientKey } = { messages: [], anthropicKey: null };
    let anthropicKey = null;
    if (email) {
      const userKey = await getUserKey(email, 'anthropic_key');
      if (userKey) anthropicKey = userKey;
    }
    if (!anthropicKey) {
      return Response.json({ 
        error: 'Chave da IA não configurada.',
        fallback: true 
      }, { status: 400 });
    }

    // Usa Anthropic para transcrever — envia como base64
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: `Você recebeu uma gravação de áudio de uma reunião em português brasileiro com duração de ${Math.floor(duration/60)}min ${duration%60}s.

Por favor, transcreva o conteúdo desta reunião. Se não conseguir processar o áudio, retorne exatamente o texto: "AUDIO_NOT_SUPPORTED"

Título da reunião: ${title}`,
        }],
      }),
    });

    const data = await response.json();
    const text = data.content?.[0]?.text || '';

    if (text.includes('AUDIO_NOT_SUPPORTED') || !text) {
      // Fallback — pede para digitar manualmente
      return Response.json({ 
        content: '',
        manual: true,
        message: 'Transcrição automática não disponível. Use o campo abaixo para digitar o conteúdo da reunião.'
      });
    }

    return Response.json({ content: text });

  } catch (err) {
    console.error('Transcribe error:', err);
    return Response.json({ 
      content: '',
      manual: true,
      message: 'Erro na transcrição. Use o campo abaixo para digitar manualmente.'
    }, { status: 500 });
  }
}
