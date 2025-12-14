import { VertexAI, type Tool, type Content, SchemaType } from '@google-cloud/vertexai'

// Initialiser Vertex AI
const vertexAI = new VertexAI({
  project: process.env.GOOGLE_CLOUD_PROJECT!,
  location: process.env.GOOGLE_CLOUD_LOCATION!,
})

// Définition des tools disponibles
const tools: Tool[] = [
  {
    functionDeclarations: [
      {
        name: 'get_current_time',
        description: 'Obtenir la date et l\'heure actuelle',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            timezone: {
              type: SchemaType.STRING,
              description: 'Le fuseau horaire (ex: Europe/Paris, Africa/Johannesburg)',
            },
          },
        },
      },
      {
        name: 'analyze_current_page',
        description: 'Analyser le contenu de la page web actuelle sur laquelle l\'utilisateur navigue. Utilise cette fonction quand l\'utilisateur demande des informations sur la page, veut un résumé, ou pose des questions sur le contenu visible.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            analysis_type: {
              type: SchemaType.STRING,
              description: 'Type d\'analyse: "summary" pour résumé, "details" pour détails complets, "links" pour les liens, "forms" pour les formulaires',
            },
          },
        },
      },
      {
        name: 'get_selected_text',
        description: 'Obtenir le texte actuellement sélectionné par l\'utilisateur sur la page. Utilise cette fonction quand l\'utilisateur fait référence à "ce texte", "la sélection", ou demande d\'analyser quelque chose de spécifique.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {},
        },
      },
    ],
  },
]

// Interface pour le contexte de page
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
  interactiveElements?: Array<{
    type: string
    text?: string
    href?: string
    inputType?: string
    placeholder?: string
    label?: string
  }>
  images?: Array<{
    alt: string
    src: string
  }>
  timestamp?: string
}

interface RequestContext {
  pageContext?: PageContext
  selectedText?: string
}

// Exécution des tools
function executeTool(name: string, args: Record<string, unknown>, context?: RequestContext) {
  switch (name) {
    case 'get_current_time': {
      const timezone = (args.timezone as string) || 'Africa/Johannesburg'
      return {
        datetime: new Date().toLocaleString('fr-FR', { timeZone: timezone }),
        timezone,
      }
    }
    
    case 'analyze_current_page': {
      const pageContext = context?.pageContext
      if (!pageContext) {
        return { 
          error: 'Aucune page détectée. L\'utilisateur doit être sur une page web pour utiliser cette fonction.' 
        }
      }
      
      const analysisType = (args.analysis_type as string) || 'summary'
      
      if (analysisType === 'summary') {
        return {
          url: pageContext.metadata?.url || 'URL non disponible',
          title: pageContext.metadata?.title || 'Titre non disponible',
          description: pageContext.metadata?.description || 'Pas de description',
          language: pageContext.metadata?.language || 'Langue inconnue',
          contentPreview: pageContext.content?.substring(0, 2000) || 'Contenu non disponible',
          numberOfLinks: pageContext.interactiveElements?.filter(e => e.type === 'link').length || 0,
          numberOfButtons: pageContext.interactiveElements?.filter(e => e.type === 'button').length || 0,
          numberOfImages: pageContext.images?.length || 0,
        }
      }
      
      if (analysisType === 'details') {
        return {
          metadata: pageContext.metadata,
          fullContent: pageContext.content,
          imagesWithAlt: pageContext.images,
        }
      }
      
      if (analysisType === 'links') {
        const links = pageContext.interactiveElements?.filter(e => e.type === 'link') || []
        return {
          totalLinks: links.length,
          links: links.slice(0, 30).map(l => ({ text: l.text, href: l.href })),
        }
      }
      
      if (analysisType === 'forms') {
        const inputs = pageContext.interactiveElements?.filter(e => e.type === 'input') || []
        const buttons = pageContext.interactiveElements?.filter(e => e.type === 'button') || []
        return {
          inputFields: inputs,
          buttons: buttons.slice(0, 20),
        }
      }
      
      return { 
        url: pageContext.metadata?.url,
        title: pageContext.metadata?.title,
        content: pageContext.content,
      }
    }
    
    case 'get_selected_text': {
      const selectedText = context?.selectedText
      if (!selectedText || selectedText.trim() === '') {
        return { 
          message: 'Aucun texte sélectionné sur la page.',
          suggestion: 'L\'utilisateur doit sélectionner du texte sur la page pour utiliser cette fonction.' 
        }
      }
      return {
        selectedText: selectedText,
        length: selectedText.length,
      }
    }
    
    default:
      return { error: 'Tool non reconnu' }
  }
}

// Construire l'instruction système avec le contexte de la page
function buildSystemInstruction(context?: RequestContext): string {
  let instruction = `Tu es Alcentric, un assistant IA intelligent et serviable intégré dans une extension Chrome. 
Tu aides les utilisateurs avec leurs questions et tâches.
Tu réponds toujours en français de manière concise et utile.
Tu as accès à des outils pour analyser la page web sur laquelle l'utilisateur se trouve.

CAPACITÉS:
- Tu peux lire et analyser le contenu de la page web actuelle de l'utilisateur
- Tu peux voir le texte sélectionné par l'utilisateur
- Tu peux voir les liens, boutons et formulaires présents sur la page
- Tu peux donner l'heure actuelle

INSTRUCTIONS:
- Quand l'utilisateur pose une question sur "cette page", "le site", "ce que je vois", utilise l'outil analyze_current_page
- Quand l'utilisateur mentionne "ce texte", "ma sélection", ou demande d'expliquer quelque chose de spécifique, utilise get_selected_text
- Sois proactif dans l'utilisation des outils pour fournir des réponses contextuelles
`

  // Ajouter le contexte de la page si disponible pour que le modèle ait une vue d'ensemble
  if (context?.pageContext?.metadata) {
    instruction += `\nCONTEXTE ACTUEL:
- L'utilisateur est sur: ${context.pageContext.metadata.url}
- Titre de la page: ${context.pageContext.metadata.title}
- Domaine: ${context.pageContext.metadata.domain}
`
  }

  if (context?.selectedText) {
    instruction += `- Texte actuellement sélectionné: "${context.selectedText.substring(0, 200)}${context.selectedText.length > 200 ? '...' : ''}"\n`
  }

  return instruction
}

export async function POST(request: Request) {
  try {
    const { messages, context } = await request.json() as { 
      messages: Array<{ role: string; content: string }>
      context?: RequestContext 
    }

    // Validation des messages
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Messages requis' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const systemInstruction = buildSystemInstruction(context)

    const model = vertexAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction,
      generationConfig: {
        maxOutputTokens: 4096,
        temperature: 0.7,
      },
      tools,
    })

    // Convertir les messages au format Vertex AI (tous sauf le dernier)
    const history: Content[] = messages.slice(0, -1).map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content || ' ' }],
    }))

    const chat = model.startChat({ history })
    const lastMessage = messages[messages.length - 1].content || 'Bonjour'

    // Créer un stream de réponse
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        let fullResponse = ''
        
        const sendText = (text: string) => {
          if (text) {
            fullResponse += text
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'text', content: text })}\n\n`)
            )
          }
        }
        
        const sendDone = () => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`))
          controller.close()
        }
        
        const sendError = (message: string) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', content: message })}\n\n`)
          )
          controller.close()
        }

        // Fonction récursive pour gérer les appels de fonction
        const processResponse = async (response: Awaited<ReturnType<typeof chat.sendMessage>>) => {
          const candidate = response.response.candidates?.[0]
          if (!candidate?.content?.parts) return
          
          for (const part of candidate.content.parts) {
            if (part.functionCall) {
              // Exécuter le tool
              const toolResult = executeTool(
                part.functionCall.name,
                (part.functionCall.args as Record<string, unknown>) || {},
                context
              )
              
              // Envoyer le résultat au modèle et traiter sa réponse
              const toolResponse = await chat.sendMessage([{
                functionResponse: {
                  name: part.functionCall.name,
                  response: toolResult,
                }
              }])
              
              // Traiter récursivement (au cas où il y aurait d'autres appels de fonction)
              await processResponse(toolResponse)
            } else if (part.text) {
              sendText(part.text)
            }
          }
        }
        
        try {
          // Utiliser sendMessage (non-stream) pour s'assurer d'avoir la réponse complète
          const result = await chat.sendMessage(lastMessage)
          await processResponse(result)
          
          // Si aucune réponse, essayer de récupérer le texte autrement
          if (!fullResponse.trim()) {
            const responseText = result.response.candidates?.[0]?.content?.parts
              ?.map(p => p.text)
              .filter(Boolean)
              .join('') || ''
            
            if (responseText) {
              sendText(responseText)
            }
          }
          
          sendDone()
        } catch (error) {
          console.error('Chat error:', error)
          sendError('Une erreur est survenue lors de la génération de la réponse.')
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return new Response(JSON.stringify({ error: 'Erreur serveur' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
