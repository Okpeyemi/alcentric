import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Configuration ElevenLabs
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || 'sk_cd87bf204aaea78b5c7b60a4987d41b0af06c35d2b72f5ba'
const ELEVENLABS_VOICE_ID = '21m00Tcm4TlvDq8ikWAM' // Rachel - voix par défaut

// Configuration Google AI - utiliser une clé API Gemini
const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY || ''

// Initialiser Google Generative AI
const genAI = new GoogleGenerativeAI(GOOGLE_AI_API_KEY)
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

// Synthèse vocale avec ElevenLabs
async function textToSpeech(text: string): Promise<string> {
  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.5,
          use_speaker_boost: true,
        },
      }),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Voice Chat] TTS error:', errorText)
      throw new Error(`TTS failed: ${response.status}`)
    }
    
    const audioBuffer = await response.arrayBuffer()
    return Buffer.from(audioBuffer).toString('base64')
  } catch (error) {
    console.error('[Voice Chat] TTS error:', error)
    throw error
  }
}

// Générer la réponse IA avec Gemini
async function generateAIResponse(
  userText: string,
  conversationHistory: Array<{ role: string; content: string }>,
  context: any
): Promise<string> {
  try {
    let systemPrompt = `Tu es Alcentric, un assistant IA vocal intelligent et sympathique. 
Tu réponds de manière naturelle et conversationnelle, comme dans une vraie discussion.
Tes réponses doivent être concises et adaptées à l'oral (2-4 phrases maximum sauf si l'utilisateur demande des détails).
Évite les listes à puces et le formatage Markdown - parle naturellement.`

    // Ajouter le contexte de la page si disponible
    if (context?.pageContext) {
      const pageContent = context.pageContext.content?.substring(0, 5000) || ''
      const metadata = context.pageContext.metadata || {}
      
      systemPrompt += `

L'utilisateur navigue actuellement sur cette page web :
- URL: ${metadata.url || 'Non disponible'}
- Titre: ${metadata.title || 'Non disponible'}

Contenu de la page (extrait) :
${pageContent}

Tu peux répondre à des questions sur cette page et aider l'utilisateur avec son contenu.`
    }

    // Construire le prompt complet avec l'historique
    let fullPrompt = systemPrompt + '\n\n'
    
    for (const msg of conversationHistory) {
      const role = msg.role === 'user' ? 'Utilisateur' : 'Assistant'
      fullPrompt += `${role}: ${msg.content}\n`
    }
    
    fullPrompt += `Utilisateur: ${userText}\nAssistant:`

    const result = await model.generateContent(fullPrompt)
    const response = result.response
    const text = response.text()
    
    return text.trim()
  } catch (error) {
    console.error('[Voice Chat] AI generation error:', error)
    throw error
  }
}

// Headers CORS pour les extensions Chrome
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

// Gérer les requêtes OPTIONS (preflight CORS)
export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, conversationHistory = [], context } = body

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Texte manquant' },
        { status: 400, headers: corsHeaders }
      )
    }

    console.log('[Voice Chat Simple] User text:', text)

    // 1. Générer la réponse IA avec Gemini
    console.log('[Voice Chat Simple] Generating AI response...')
    const assistantText = await generateAIResponse(text, conversationHistory, context)
    console.log('[Voice Chat Simple] AI Response:', assistantText)

    // 2. Convertir la réponse en audio avec ElevenLabs
    console.log('[Voice Chat Simple] Converting to speech...')
    const audioResponse = await textToSpeech(assistantText)

    return NextResponse.json({
      success: true,
      assistantText,
      audioResponse,
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('[Voice Chat Simple] Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur interne' 
      },
      { status: 500, headers: corsHeaders }
    )
  }
}
