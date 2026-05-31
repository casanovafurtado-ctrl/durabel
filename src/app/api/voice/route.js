import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const DEFAULT_VOICE_ID = 'd25LrBWnB8S26i3kp9se';

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

    const { text, voiceId } = await req.json();
    if (!text) return Response.json({ error: 'Texto vazio' }, { status: 400 });

    // Pega chave ElevenLabs — primeiro do usuário, depois do env
    let apiKey = process.env.ELEVENLABS_API_KEY;
    let userVoiceId = DEFAULT_VOICE_ID;

    if (email) {
      const userKey = await getUserKey(email, 'elevenlabs_key');
      if (userKey) apiKey = userKey;
      const uvid = await getUserKey(email, 'elevenlabs_voice_id');
      if (uvid) userVoiceId = uvid;
    }

    if (!apiKey) return Response.json({ error: 'Chave ElevenLabs não configurada' }, { status: 400 });

    const voice = voiceId || userVoiceId;

    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.3, use_speaker_boost: true },
      }),
    });

    if (!res.ok) return Response.json({ error: 'Erro ElevenLabs' }, { status: res.status });

    const audioBuffer = await res.arrayBuffer();
    return new Response(audioBuffer, {
      headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
