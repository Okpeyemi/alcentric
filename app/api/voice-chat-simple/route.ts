import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Configuration ElevenLabs
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || 'sk_cd87bf204aaea78b5c7b60a4987d41b0af06c35d2b72f5ba'
const ELEVENLABS_VOICE_ID = '21m00Tcm4TlvDq8ikWAM' // Rachel - voix par défaut

// Configuration Google AI
const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY || ''

// Initialiser Google Generative AI
const genAI = new GoogleGenerativeAI(GOOGLE_AI_API_KEY)
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

// Interface pour le contexte de page (identique au chat principal)
interface PageContext {
  metadata?: {
    url: string
    title: string
    description: string
    keywords: string
    language: string
    domain: string
  }
  content?: string
  formFields?: Array<{
    index: number
    type: string
    label: string
    id?: string
    name?: string
    placeholder?: string
  }>
  images?: Array<{
    alt: string
    src: string
    type?: string
  }>
  videos?: Array<{
    type: string
    src?: string
    videoId?: string
  }>
  pdfInfo?: {
    isPdfPage: boolean
    numPages?: number
    extractedPages?: number
    textLength?: number
    extractionFailed?: boolean
    error?: string
    metadata?: {
      title?: string
      author?: string
      subject?: string
    }
  }
  mediaLinks?: {
    documents: Array<{ type: string; href: string; text: string }>
  }
}

interface RequestContext {
  pageContext?: PageContext
  selectedText?: string
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

// Construire l'instruction système avec le contexte complet de la page
function buildSystemInstruction(context?: RequestContext): string {
  const isPdf = context?.pageContext?.pdfInfo?.isPdfPage === true
  
  let instruction = `Tu es Alcentric, un assistant IA VOCAL intelligent et sympathique.

RÈGLES IMPORTANTES POUR LE MODE VOCAL:
- Réponds de manière NATURELLE et CONVERSATIONNELLE, comme dans une vraie discussion orale
- Tes réponses doivent être CONCISES et adaptées à l'oral (2-4 phrases pour les questions simples)
- Pour les résumés ou analyses, tu peux être plus détaillé mais reste fluide
- ÉVITE les listes à puces, numéros et formatage Markdown - parle naturellement
- N'utilise PAS d'émojis ni de caractères spéciaux
- Réponds toujours en français

MISSION:
Tu es un assistant contextuel. Par défaut, tu prends en compte la page web sur laquelle l'utilisateur se trouve.
`

  // Instructions spéciales pour les PDFs
  if (isPdf) {
    instruction += `
DOCUMENT PDF DÉTECTÉ:
Tu analyses actuellement un document PDF. Quand on te demande de résumer ou expliquer :
- Fournis un résumé DÉTAILLÉ et SUBSTANTIEL, pas juste les titres
- Explique le CONTENU de chaque section
- Mentionne les points clés, données importantes, conclusions
- Adapte ta réponse pour l'oral (pas de listes, phrases fluides)
`
  }

  instruction += `
CAPACITÉS:
- Analyse de contenu textuel de pages web
- Lecture et résumé de documents PDF
- Analyse d'images (descriptions)
- Information sur les vidéos présentes
- Aide sur les formulaires
`

  // Ajouter le contexte de la page
  if (context?.pageContext?.metadata) {
    instruction += `
═══ PAGE ACTUELLE ═══
URL: ${context.pageContext.metadata.url}
Titre: ${context.pageContext.metadata.title}
`
    if (context.pageContext.metadata.description) {
      instruction += `Description: ${context.pageContext.metadata.description}\n`
    }
  }

  // Ajouter le contenu de la page (plus de contenu pour les PDFs)
  if (context?.pageContext?.content) {
    const maxLength = isPdf ? 30000 : 8000
    const contentPreview = context.pageContext.content.substring(0, maxLength)
    
    if (isPdf) {
      instruction += `
═══ CONTENU DU DOCUMENT PDF ═══
${contentPreview}${context.pageContext.content.length > maxLength ? '\n[...document tronqué...]' : ''}
═══ FIN DU CONTENU PDF ═══
`
    } else {
      instruction += `
CONTENU DE LA PAGE:
${contentPreview}${context.pageContext.content.length > maxLength ? '\n[...contenu tronqué...]' : ''}
`
    }
  }

  // Ajouter les informations PDF
  if (context?.pageContext?.pdfInfo?.isPdfPage) {
    const pdf = context.pageContext.pdfInfo
    instruction += `
INFO PDF: ${pdf.numPages || '?'} pages`
    if (pdf.metadata?.title) instruction += `, Titre: ${pdf.metadata.title}`
    if (pdf.metadata?.author) instruction += `, Auteur: ${pdf.metadata.author}`
    instruction += '\n'
  }

  // Ajouter les champs de formulaire
  if (context?.pageContext?.formFields && context.pageContext.formFields.length > 0) {
    instruction += `
FORMULAIRE DÉTECTÉ (${context.pageContext.formFields.length} champs):
`
    context.pageContext.formFields.slice(0, 10).forEach((field, i) => {
      instruction += `- ${field.label || field.name || field.id || 'Champ'} [${field.type}]\n`
    })
  }

  // Ajouter les images
  if (context?.pageContext?.images && context.pageContext.images.length > 0) {
    instruction += `
IMAGES (${context.pageContext.images.length}):
`
    context.pageContext.images.slice(0, 5).forEach((img) => {
      instruction += `- ${img.alt || 'Image sans description'}\n`
    })
  }

  // Ajouter les vidéos
  if (context?.pageContext?.videos && context.pageContext.videos.length > 0) {
    instruction += `
VIDÉOS (${context.pageContext.videos.length}):
`
    context.pageContext.videos.slice(0, 3).forEach((video) => {
      if (video.type === 'youtube') {
        instruction += `- YouTube: https://youtube.com/watch?v=${video.videoId}\n`
      } else {
        instruction += `- Vidéo ${video.type}\n`
      }
    })
  }

  // Ajouter les documents liés
  if (context?.pageContext?.mediaLinks?.documents && context.pageContext.mediaLinks.documents.length > 0) {
    instruction += `
DOCUMENTS LIÉS:
`
    context.pageContext.mediaLinks.documents.slice(0, 5).forEach((doc) => {
      instruction += `- [${doc.type.toUpperCase()}] ${doc.text || doc.href}\n`
    })
  }

  // Texte sélectionné
  if (context?.selectedText) {
    instruction += `
═══ TEXTE SÉLECTIONNÉ ═══
"${context.selectedText.substring(0, 1000)}"
`
  }

  return instruction
}

// Générer la réponse IA avec Gemini
async function generateAIResponse(
  userText: string,
  conversationHistory: Array<{ role: string; content: string }>,
  context?: RequestContext
): Promise<string> {
  try {
    const systemInstruction = buildSystemInstruction(context)

    // Construire le prompt complet avec l'historique
    let fullPrompt = systemInstruction + '\n\n'
    
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
