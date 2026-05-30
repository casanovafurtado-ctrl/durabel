import { getServerSession } from 'next-auth';

const DEFAULT_VOICE_ID = 'd25LrBWnB8S26i3kp9se'; // Voz DURABEL

export async function POST(req) {
  try {
    const { text, voiceId } = await req.json();
    if (!text) return Response.json({ error: 'Texto vazio' }, { status: 400 });

    // Pega chave do env ou das configurações do usuário
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) return Response.json({ error: 'Chave ElevenLabs não configurada' }, { status: 400 });

    const voice = voiceId || DEFAULT_VOICE_ID;

    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.3,
          use_speaker_boost: true,
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return Response.json({ error: err }, { status: res.status });
    }

    const audioBuffer = await res.arrayBuffer();
    return new Response(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
