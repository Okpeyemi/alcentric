import { NextRequest, NextResponse } from 'next/server'
import { VertexAI } from '@google-cloud/vertexai'

// Configuration ElevenLabs
const ELEVENLABS_API_KEY = 'sk_cd87bf204aaea78b5c7b60a4987d41b0af06c35d2b72f5ba'
const ELEVENLABS_VOICE_ID = '21m00Tcm4TlvDq8ikWAM' // Rachel - voix par défaut

// Configuration Vertex AI
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'feedhawk'
const LOCATION = process.env.GOOGLE_CLOUD_LOCATION || 'europe-central2'

// Initialiser Vertex AI
const vertexAI = new VertexAI({
  project: PROJECT_ID,
  location: LOCATION,
})

const generativeModel = vertexAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
})

// Transcription audio avec ElevenLabs Scribe
async function transcribeAudio(audioBase64: string): Promise<string> {
  try {
    // Nettoyer le base64 si nécessaire (retirer le préfixe data URL)
    const cleanBase64 = audioBase64.includes(',') 
      ? audioBase64.split(',')[1] 
      : audioBase64
    
    // Convertir base64 en Uint8Array (plus compatible)
    const binaryString = atob(cleanBase64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    
    console.log('[Voice Chat] Audio buffer size:', bytes.length, 'bytes')
    
    // Créer un File object pour l'upload
    const audioFile = new File([bytes], 'recording.webm', { type: 'audio/webm' })
    
    // Créer un FormData pour l'upload
    const formData = new FormData()
    formData.append('file', audioFile)
    formData.append('model_id', 'scribe_v1')
    
    const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: formData,
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Voice Chat] Transcription error:', errorText)
      throw new Error(`Transcription failed: ${response.status}`)
    }
    
    const result = await response.json()
    return result.text || ''
  } catch (error) {
    console.error('[Voice Chat] Transcription error:', error)
    throw error
  }
}

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
    // Construire le système d'instructions pour le mode vocal
    let systemInstruction = `Tu es Alcentric, un assistant IA vocal intelligent et sympathique. 
Tu réponds de manière naturelle et conversationnelle, comme dans une vraie discussion.
Tes réponses doivent être concises et adaptées à l'oral (2-4 phrases maximum sauf si l'utilisateur demande des détails).
Évite les listes à puces et le formatage Markdown - parle naturellement.`

    // Ajouter le contexte de la page si disponible
    if (context?.pageContext) {
      const pageContent = context.pageContext.content?.substring(0, 10000) || ''
      const metadata = context.pageContext.metadata || {}
      
      systemInstruction += `

L'utilisateur navigue actuellement sur cette page web :
- URL: ${metadata.url || 'Non disponible'}
- Titre: ${metadata.title || 'Non disponible'}
- Description: ${metadata.description || 'Non disponible'}

Contenu de la page :
${pageContent}

Tu peux répondre à des questions sur cette page et aider l'utilisateur avec son contenu.`
    }

    // Construire l'historique de conversation pour Gemini
    const contents = conversationHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }))

    // Ajouter le nouveau message utilisateur
    contents.push({
      role: 'user',
      parts: [{ text: userText }],
    })

    const result = await generativeModel.generateContent({
      systemInstruction,
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500, // Réponses courtes pour le vocal
        topP: 0.9,
      },
    })

    const response = result.response
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || ''
    
    return text.trim()
  } catch (error) {
    console.error('[Voice Chat] AI generation error:', error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { audio, conversationHistory = [], context } = body

    if (!audio) {
      return NextResponse.json(
        { success: false, error: 'Audio manquant' },
        { status: 400 }
      )
    }

    console.log('[Voice Chat] Processing voice input...')

    // 1. Transcrire l'audio en texte
    let userText: string
    try {
      userText = await transcribeAudio(audio)
      console.log('[Voice Chat] Transcription:', userText)
    } catch (error) {
      // Fallback si la transcription échoue - utiliser Gemini pour un message d'erreur
      return NextResponse.json({
        success: true,
        userText: '[Transcription échouée]',
        assistantText: "Désolé, je n'ai pas pu comprendre ce que vous avez dit. Pouvez-vous répéter ?",
        audioResponse: await textToSpeech("Désolé, je n'ai pas pu comprendre ce que vous avez dit. Pouvez-vous répéter ?"),
      })
    }

    if (!userText || userText.trim().length === 0) {
      const noInputMessage = "Je n'ai pas entendu ce que vous avez dit. Pouvez-vous répéter ?"
      return NextResponse.json({
        success: true,
        userText: '[Silence]',
        assistantText: noInputMessage,
        audioResponse: await textToSpeech(noInputMessage),
      })
    }

    // 2. Générer la réponse IA avec Gemini
    console.log('[Voice Chat] Generating AI response...')
    const assistantText = await generateAIResponse(userText, conversationHistory, context)
    console.log('[Voice Chat] AI Response:', assistantText)

    // 3. Convertir la réponse en audio avec ElevenLabs
    console.log('[Voice Chat] Converting to speech...')
    const audioResponse = await textToSpeech(assistantText)

    return NextResponse.json({
      success: true,
      userText,
      assistantText,
      audioResponse,
    })

  } catch (error) {
    console.error('[Voice Chat] Error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur interne' 
      },
      { status: 500 }
    )
  }
}
