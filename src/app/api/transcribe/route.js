import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Anthropic from '@anthropic-ai/sdk';

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

    let anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (email) {
      const userKey = await getUserKey(email, 'anthropic_key');
      if (userKey) anthropicKey = userKey;
    }

    if (!anthropicKey) {
      return Response.json({ error: 'Chave não configurada' }, { status: 400 });
    }

    const { audio, mimeType, title, duration } = await req.json();

    const client = new Anthropic({ apiKey: anthropicKey });

    // Usa Claude para transcrever o áudio
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Transcreva este áudio de reunião em português brasileiro. 
Identifique os participantes quando possível (ex: "Participante 1:", "Felipe:").
Corrija erros de fala naturais. Mantenha o conteúdo fiel ao que foi dito.
Duração do áudio: ${Math.floor(duration / 60)}min ${duration % 60}s.
Retorne apenas a transcrição, sem comentários adicionais.`,
          },
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: mimeType.includes('mp4') ? 'audio/mp4' : 'audio/webm',
              data: audio,
            },
          },
        ],
      }],
    });

    const content = response.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('');

    return Response.json({ content });
  } catch (err) {
    console.error('Transcribe error:', err);
    // Fallback: retorna mensagem para o usuário digitar manualmente
    return Response.json({
      content: '',
      error: 'Transcrição automática não disponível. Digite o conteúdo manualmente.',
    }, { status: 500 });
  }
}
