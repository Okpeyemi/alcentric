import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    // Vérifier la clé API
    if (!process.env.OPENROUTER_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'OPENROUTER_API_KEY not configured' }), 
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
    });

    const { messages } = await req.json();

    const result = streamText({
      model: openrouter('openai/gpt-oss-20b:free'),
      messages,
      system: 'Tu es un assistant de développement intelligent et utile. Tu aides les développeurs à écrire du code, résoudre des problèmes et apprendre de nouvelles technologies.',
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Chat API Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
