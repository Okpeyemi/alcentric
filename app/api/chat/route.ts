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
        name: 'get_page_info',
        description: 'Obtenir des informations sur la page web actuelle de l\'utilisateur',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            dummy: {
              type: SchemaType.STRING,
              description: 'Paramètre non utilisé',
            },
          },
        },
      },
    ],
  },
]

// Exécution des tools
function executeTool(name: string, args: Record<string, unknown>, context?: Record<string, unknown>) {
  switch (name) {
    case 'get_current_time':
      const timezone = (args.timezone as string) || 'Africa/Johannesburg'
      return {
        datetime: new Date().toLocaleString('fr-FR', { timeZone: timezone }),
        timezone,
      }
    case 'get_page_info':
      return {
        url: context?.pageUrl || 'Non disponible',
        title: context?.pageTitle || 'Non disponible',
      }
    default:
      return { error: 'Tool non reconnu' }
  }
}

const systemInstruction = `Tu es Alcentric, un assistant IA intelligent et serviable intégré dans une extension Chrome. 
Tu aides les utilisateurs avec leurs questions et tâches.
Tu réponds toujours en français de manière concise et utile.
Tu peux utiliser des outils pour obtenir des informations contextuelles.`

export async function POST(request: Request) {
  try {
    const { messages, context } = await request.json()

    const model = vertexAI.getGenerativeModel({
      model: 'gemini-1.5-flash-001',
      systemInstruction,
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7,
      },
      tools,
    })

    // Convertir les messages au format Vertex AI
    const history: Content[] = messages.slice(0, -1).map((msg: { role: string; content: string }) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }))

    const chat = model.startChat({ history })
    const lastMessage = messages[messages.length - 1].content

    // Créer un stream de réponse
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const result = await chat.sendMessageStream(lastMessage)

          for await (const chunk of result.stream) {
            // Vérifier si c'est un appel de fonction
            const functionCall = chunk.candidates?.[0]?.content?.parts?.[0]?.functionCall
            if (functionCall) {
              const toolResult = executeTool(
                functionCall.name, 
                (functionCall.args as Record<string, unknown>) || {}, 
                context
              )
              
              // Envoyer le résultat du tool au modèle
              const toolResponse = await chat.sendMessageStream([{
                functionResponse: {
                  name: functionCall.name,
                  response: toolResult,
                }
              }])
              
              for await (const toolChunk of toolResponse.stream) {
                const text = toolChunk.candidates?.[0]?.content?.parts?.[0]?.text
                if (text) {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ type: 'text', content: text })}\n\n`)
                  )
                }
              }
            } else {
              const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text
              if (text) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: 'text', content: text })}\n\n`)
                )
              }
            }
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`))
          controller.close()
        } catch (error) {
          console.error('Stream error:', error)
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'error', content: 'Une erreur est survenue' })}\n\n`
            )
          )
          controller.close()
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
