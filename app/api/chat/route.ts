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
        description: 'Analyser le contenu de la page web actuelle. Utilise cette fonction pour voir les informations de la page, les champs de formulaire disponibles, etc.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            analysis_type: {
              type: SchemaType.STRING,
              description: 'Type d\'analyse: "summary" pour résumé, "details" pour détails complets, "links" pour les liens, "forms" pour voir les champs de formulaire',
            },
          },
        },
      },
      {
        name: 'get_selected_text',
        description: 'Obtenir le texte sélectionné par l\'utilisateur sur la page.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {},
        },
      },
      {
        name: 'fill_input',
        description: 'Remplir un champ de formulaire sur la page. Utilise cette fonction quand l\'utilisateur demande de remplir un champ spécifique.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            selector: {
              type: SchemaType.STRING,
              description: 'Le sélecteur du champ à remplir. Peut être: un ID, un name, un placeholder, le texte du label, ou un sélecteur CSS.',
            },
            value: {
              type: SchemaType.STRING,
              description: 'La valeur à mettre dans le champ.',
            },
          },
          required: ['selector', 'value'],
        },
      },
      {
        name: 'fill_form',
        description: 'Remplir plusieurs champs de formulaire en une seule fois. Utilise cette fonction quand l\'utilisateur demande de remplir un formulaire complet ou plusieurs champs.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            fields: {
              type: SchemaType.ARRAY,
              description: 'Liste des champs à remplir',
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  selector: {
                    type: SchemaType.STRING,
                    description: 'Le sélecteur du champ (ID, name, placeholder, label, ou CSS)',
                  },
                  value: {
                    type: SchemaType.STRING,
                    description: 'La valeur à mettre dans le champ',
                  },
                },
                required: ['selector', 'value'],
              },
            },
          },
          required: ['fields'],
        },
      },
      {
        name: 'click_element',
        description: 'Cliquer sur un élément de la page (bouton, lien, etc.). Utilise cette fonction quand l\'utilisateur demande de cliquer quelque part.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            selector: {
              type: SchemaType.STRING,
              description: 'Le sélecteur de l\'élément à cliquer. Peut être: un ID, le texte du bouton/lien, ou un sélecteur CSS.',
            },
          },
          required: ['selector'],
        },
      },
      {
        name: 'submit_form',
        description: 'Soumettre le formulaire de la page. Utilise après avoir rempli les champs.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            form_selector: {
              type: SchemaType.STRING,
              description: 'Optionnel: le sélecteur du formulaire à soumettre. Si non spécifié, soumet le premier formulaire trouvé.',
            },
          },
        },
      },
      {
        name: 'toggle_checkbox',
        description: 'Cocher ou décocher une case à cocher ou un bouton radio.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            selector: {
              type: SchemaType.STRING,
              description: 'Le sélecteur de la checkbox/radio.',
            },
            checked: {
              type: SchemaType.BOOLEAN,
              description: 'true pour cocher, false pour décocher.',
            },
          },
          required: ['selector', 'checked'],
        },
      },
      {
        name: 'scroll_page',
        description: 'Faire défiler la page.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            direction: {
              type: SchemaType.STRING,
              description: 'Direction: "up", "down", "top" (haut de page), "bottom" (bas de page)',
            },
            amount: {
              type: SchemaType.NUMBER,
              description: 'Optionnel: nombre de pixels à défiler (par défaut 500)',
            },
          },
          required: ['direction'],
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
  formFields?: Array<{
    index: number
    type: string
    label: string
    id?: string
    name?: string
    placeholder?: string
    value?: string
    required?: boolean
    disabled?: boolean
    options?: Array<{ value: string; text: string }>
  }>
  images?: Array<{
    alt: string
    src: string
    type?: string // 'img', 'background', 'svg'
    dimensions?: string
  }>
  videos?: Array<{
    type: string // 'html5', 'youtube', 'vimeo'
    src?: string
    videoId?: string
    poster?: string
    dimensions?: string
  }>
  pdfInfo?: {
    isPdfPage: boolean
    embeddedPdfs: Array<{
      type: string
      src: string
    }>
  }
  mediaLinks?: {
    documents: Array<{
      type: string
      href: string
      text: string
    }>
    imageLinks: Array<{
      type: string
      href: string
      text: string
    }>
    mediaLinks: Array<{
      type: string
      href: string
      text: string
    }>
  }
  timestamp?: string
}

interface RequestContext {
  pageContext?: PageContext
  selectedText?: string
}

// Interface pour les actions à exécuter côté client
interface PageAction {
  actionType: string
  params: Record<string, unknown>
}

// Exécution des tools - retourne soit un résultat direct, soit une action à exécuter
function executeTool(name: string, args: Record<string, unknown>, context?: RequestContext): { result?: unknown; action?: PageAction } {
  switch (name) {
    case 'get_current_time': {
      const timezone = (args.timezone as string) || 'Africa/Johannesburg'
      return {
        result: {
          datetime: new Date().toLocaleString('fr-FR', { timeZone: timezone }),
          timezone,
        }
      }
    }
    
    case 'analyze_current_page': {
      const pageContext = context?.pageContext
      if (!pageContext) {
        return { 
          result: { error: 'Aucune page détectée. L\'utilisateur doit être sur une page web.' }
        }
      }
      
      const analysisType = (args.analysis_type as string) || 'summary'
      
      if (analysisType === 'forms') {
        // Retourner les champs de formulaire détaillés
        return {
          result: {
            url: pageContext.metadata?.url,
            title: pageContext.metadata?.title,
            formFields: pageContext.formFields || [],
            message: pageContext.formFields?.length 
              ? `${pageContext.formFields.length} champs de formulaire trouvés`
              : 'Aucun champ de formulaire trouvé sur cette page'
          }
        }
      }
      
      if (analysisType === 'summary') {
        return {
          result: {
            url: pageContext.metadata?.url || 'URL non disponible',
            title: pageContext.metadata?.title || 'Titre non disponible',
            description: pageContext.metadata?.description || 'Pas de description',
            contentPreview: pageContext.content?.substring(0, 2000) || 'Contenu non disponible',
            numberOfFormFields: pageContext.formFields?.length || 0,
            numberOfLinks: pageContext.interactiveElements?.filter(e => e.type === 'link').length || 0,
            numberOfButtons: pageContext.interactiveElements?.filter(e => e.type === 'button').length || 0,
          }
        }
      }
      
      if (analysisType === 'details') {
        return {
          result: {
            metadata: pageContext.metadata,
            fullContent: pageContext.content,
            formFields: pageContext.formFields,
            imagesWithAlt: pageContext.images,
          }
        }
      }
      
      if (analysisType === 'links') {
        const links = pageContext.interactiveElements?.filter(e => e.type === 'link') || []
        return {
          result: {
            totalLinks: links.length,
            links: links.slice(0, 30).map(l => ({ text: l.text, href: l.href })),
          }
        }
      }
      
      return { 
        result: {
          url: pageContext.metadata?.url,
          title: pageContext.metadata?.title,
          content: pageContext.content,
          formFields: pageContext.formFields,
        }
      }
    }
    
    case 'get_selected_text': {
      const selectedText = context?.selectedText
      if (!selectedText || selectedText.trim() === '') {
        return { 
          result: {
            message: 'Aucun texte sélectionné sur la page.',
          }
        }
      }
      return {
        result: {
          selectedText: selectedText,
          length: selectedText.length,
        }
      }
    }
    
    // ===== ACTIONS SUR LA PAGE =====
    
    case 'fill_input': {
      const selector = args.selector as string
      const value = args.value as string
      if (!selector || value === undefined) {
        return { result: { error: 'Sélecteur et valeur requis' } }
      }
      return {
        action: {
          actionType: 'FILL_INPUT',
          params: { selector, value }
        }
      }
    }
    
    case 'fill_form': {
      const fields = args.fields as Array<{ selector: string; value: string }>
      if (!fields || !Array.isArray(fields) || fields.length === 0) {
        return { result: { error: 'Liste de champs requise' } }
      }
      return {
        action: {
          actionType: 'FILL_MULTIPLE_INPUTS',
          params: { fields }
        }
      }
    }
    
    case 'click_element': {
      const selector = args.selector as string
      if (!selector) {
        return { result: { error: 'Sélecteur requis' } }
      }
      return {
        action: {
          actionType: 'CLICK_ELEMENT',
          params: { selector }
        }
      }
    }
    
    case 'submit_form': {
      return {
        action: {
          actionType: 'SUBMIT_FORM',
          params: { formSelector: args.form_selector as string || null }
        }
      }
    }
    
    case 'toggle_checkbox': {
      const selector = args.selector as string
      const checked = args.checked as boolean
      if (!selector || checked === undefined) {
        return { result: { error: 'Sélecteur et état requis' } }
      }
      return {
        action: {
          actionType: 'TOGGLE_CHECKBOX',
          params: { selector, checked }
        }
      }
    }
    
    case 'scroll_page': {
      const direction = args.direction as string
      if (!direction) {
        return { result: { error: 'Direction requise' } }
      }
      return {
        action: {
          actionType: 'SCROLL_PAGE',
          params: { direction, amount: args.amount as number || 500 }
        }
      }
    }
    
    default:
      return { result: { error: 'Tool non reconnu' } }
  }
}

// Construire l'instruction système avec le contexte de la page
function buildSystemInstruction(context?: RequestContext): string {
  // Détecter si c'est un PDF
  const isPdf = context?.pageContext?.pdfInfo?.isPdfPage === true
  
  let instruction = `Tu es Alcentric, un assistant IA polyvalent intégré dans une extension Chrome.

MISSION PRINCIPALE:
Tu es un assistant contextuel intelligent. Par défaut, tu prends en compte la page web sur laquelle l'utilisateur se trouve pour enrichir tes réponses. Tu n'as PAS besoin qu'on te demande explicitement de regarder la page - tu le fais automatiquement quand c'est pertinent.

COMPORTEMENT:
1. QUESTIONS LIÉES À LA PAGE (par défaut): Si l'utilisateur pose une question qui pourrait être liée au contenu de la page (résumé, explication, formulaire, etc.), utilise le contexte de la page pour répondre.
2. QUESTIONS GÉNÉRALES: Si l'utilisateur pose une question du quotidien (date, calcul, définition, conseil, etc.) qui n'a clairement pas de rapport avec la page, réponds normalement sans forcer le contexte de la page.
3. SOIS INTELLIGENT: Détermine automatiquement si la question est contextuelle ou générale.
`

  // Instructions spéciales pour les PDFs
  if (isPdf) {
    instruction += `
═══ INSTRUCTIONS SPÉCIALES POUR LES DOCUMENTS PDF ═══

Tu analyses actuellement un document PDF. Voici comment tu dois te comporter :

RÉSUMÉS ET ANALYSES:
- Quand on te demande de "résumer" ou "expliquer" le document, fournis un résumé DÉTAILLÉ et SUBSTANTIEL, pas juste les titres
- Explique le CONTENU de chaque section, pas seulement leur existence
- Donne des informations concrètes : chiffres, concepts clés, conclusions
- Si le document est long, structure ta réponse par thèmes/sections MAIS en expliquant chacune

QUAND L'UTILISATEUR DEMANDE "RÉSUME LE DOCUMENT":
1. Commence par une phrase d'introduction sur le sujet général
2. Pour chaque partie importante, explique EN DÉTAIL ce qu'elle contient (2-3 phrases minimum par section)
3. Mentionne les points clés, données importantes, conclusions
4. Termine par une synthèse globale

QUAND L'UTILISATEUR DEMANDE DES DÉTAILS SUR UNE PARTIE:
- Donne TOUTES les informations disponibles sur cette partie
- Ne te contente pas de lister les sous-parties, explique leur contenu
- Cite des passages pertinents si disponibles

EXEMPLE DE MAUVAISE RÉPONSE (à éviter):
"Le document parle de : 1. Introduction 2. Méthodologie 3. Résultats 4. Conclusion"

EXEMPLE DE BONNE RÉPONSE:
"Ce document traite de [sujet]. L'introduction présente [contexte détaillé]. La méthodologie utilisée consiste à [explication]. Les résultats montrent que [données concrètes]. En conclusion, l'auteur affirme que [synthèse]."

`
  }

  instruction += `
CAPACITÉS D'ANALYSE:
- Contenu textuel de pages web
- Documents PDF (texte extrait complet)
- Images sur la page (descriptions et texte alternatif)
- Vidéos (titres, descriptions, sous-titres si disponibles)
- Formulaires et éléments interactifs
- Texte sélectionné par l'utilisateur

CAPACITÉS D'INTERACTION (modification de la page):
- Remplir des champs de formulaire (fill_input, fill_form)
- Cliquer sur des boutons et liens (click_element)
- Soumettre des formulaires (submit_form)
- Cocher/décocher des cases (toggle_checkbox)
- Faire défiler la page (scroll_page)

RÈGLES:
- Réponds toujours en français
- Sois DÉTAILLÉ et INFORMATIF dans tes réponses, surtout pour les documents
- Pour les actions sur la page, confirme ce que tu as fait
- Si tu ne peux pas faire quelque chose, explique pourquoi
- N'hésite pas à utiliser les outils d'analyse pour mieux répondre
`

  // Ajouter le contexte de la page automatiquement
  if (context?.pageContext?.metadata) {
    instruction += `\n═══ CONTEXTE DE LA PAGE ACTUELLE ═══
URL: ${context.pageContext.metadata.url}
Titre: ${context.pageContext.metadata.title}
Domaine: ${context.pageContext.metadata.domain}
Langue: ${context.pageContext.metadata.language || 'non spécifiée'}
`
    // Ajouter la description si disponible
    if (context.pageContext.metadata.description) {
      instruction += `Description: ${context.pageContext.metadata.description}\n`
    }
  }

  // Ajouter un aperçu du contenu de la page (plus de contenu pour les PDFs)
  if (context?.pageContext?.content) {
    const isPdfContent = context?.pageContext?.pdfInfo?.isPdfPage === true
    // Pour les PDFs, on envoie beaucoup plus de contenu (jusqu'à 50000 caractères)
    // Pour les pages web normales, on limite à 3000 caractères
    const maxLength = isPdfContent ? 50000 : 3000
    const contentPreview = context.pageContext.content.substring(0, maxLength)
    
    if (isPdfContent) {
      instruction += `\n═══ CONTENU COMPLET DU DOCUMENT PDF ═══\n${contentPreview}${context.pageContext.content.length > maxLength ? `\n[...document tronqué à ${maxLength} caractères sur ${context.pageContext.content.length} total...]` : ''}\n═══ FIN DU CONTENU PDF ═══\n`
    } else {
      instruction += `\nAPERÇU DU CONTENU:\n${contentPreview}${context.pageContext.content.length > maxLength ? '\n[...contenu tronqué...]' : ''}\n`
    }
  }
  
  // Ajouter les champs de formulaire disponibles
  if (context?.pageContext?.formFields && context.pageContext.formFields.length > 0) {
    instruction += `\nFORMULAIRES DÉTECTÉS (${context.pageContext.formFields.length} champs):\n`
    context.pageContext.formFields.slice(0, 15).forEach((field, i) => {
      instruction += `${i + 1}. ${field.label || field.name || field.id || 'Champ'} [${field.type}]${field.required ? ' *requis' : ''}${field.value ? ` = "${field.value}"` : ''}\n`
    })
    if (context.pageContext.formFields.length > 15) {
      instruction += `... et ${context.pageContext.formFields.length - 15} autres champs\n`
    }
  }

  // Ajouter les images détectées
  if (context?.pageContext?.images && context.pageContext.images.length > 0) {
    instruction += `\nIMAGES SUR LA PAGE (${context.pageContext.images.length}):\n`
    context.pageContext.images.slice(0, 10).forEach((img, i) => {
      const typeInfo = img.type ? ` [${img.type}]` : ''
      instruction += `${i + 1}. ${img.alt || 'Image sans description'}${typeInfo}\n`
    })
    if (context.pageContext.images.length > 10) {
      instruction += `... et ${context.pageContext.images.length - 10} autres images\n`
    }
  }

  // Ajouter les vidéos détectées
  if (context?.pageContext?.videos && context.pageContext.videos.length > 0) {
    instruction += `\nVIDÉOS SUR LA PAGE (${context.pageContext.videos.length}):\n`
    context.pageContext.videos.forEach((video, i) => {
      if (video.type === 'youtube') {
        instruction += `${i + 1}. YouTube: https://youtube.com/watch?v=${video.videoId}\n`
      } else if (video.type === 'vimeo') {
        instruction += `${i + 1}. Vimeo: ID ${video.videoId}\n`
      } else {
        instruction += `${i + 1}. Vidéo HTML5${video.dimensions ? ` (${video.dimensions})` : ''}\n`
      }
    })
  }

  // Ajouter les informations PDF
  if (context?.pageContext?.pdfInfo) {
    const pdf = context.pageContext.pdfInfo as {
      isPdfPage?: boolean
      numPages?: number
      extractedPages?: number
      textLength?: number
      extractionFailed?: boolean
      error?: string
      metadata?: {
        title?: string
        author?: string
        subject?: string
        creator?: string
      }
      embeddedPdfs?: Array<{ type: string; src: string }>
    }
    
    if (pdf.isPdfPage) {
      instruction += `\n═══ DOCUMENT PDF ═══\n`
      
      if (pdf.extractionFailed) {
        instruction += `⚠️ L'extraction du texte a échoué: ${pdf.error || 'erreur inconnue'}\n`
      } else {
        instruction += `📄 Pages: ${pdf.numPages || 'inconnues'}`
        if (pdf.extractedPages && pdf.numPages && pdf.extractedPages < pdf.numPages) {
          instruction += ` (${pdf.extractedPages} extraites)`
        }
        instruction += `\n`
        
        if (pdf.metadata) {
          if (pdf.metadata.title) instruction += `Titre: ${pdf.metadata.title}\n`
          if (pdf.metadata.author) instruction += `Auteur: ${pdf.metadata.author}\n`
          if (pdf.metadata.subject) instruction += `Sujet: ${pdf.metadata.subject}\n`
        }
        
        if (pdf.textLength) {
          instruction += `Caractères extraits: ${pdf.textLength}\n`
        }
      }
    }
    
    // PDFs intégrés dans une page normale
    if (pdf.embeddedPdfs && pdf.embeddedPdfs.length > 0) {
      instruction += `\nPDFs INTÉGRÉS (${pdf.embeddedPdfs.length}):\n`
      pdf.embeddedPdfs.forEach((p, i) => {
        instruction += `${i + 1}. ${p.type.toUpperCase()}: ${p.src}\n`
      })
    }
  }

  // Ajouter les liens vers documents et médias
  if (context?.pageContext?.mediaLinks) {
    const ml = context.pageContext.mediaLinks
    if (ml.documents && ml.documents.length > 0) {
      instruction += `\nDOCUMENTS LIÉS (${ml.documents.length}):\n`
      ml.documents.slice(0, 10).forEach((doc, i) => {
        instruction += `${i + 1}. [${doc.type.toUpperCase()}] ${doc.text || doc.href}\n`
      })
    }
    if (ml.mediaLinks && ml.mediaLinks.length > 0) {
      instruction += `\nMÉDIAS LIÉS (${ml.mediaLinks.length}):\n`
      ml.mediaLinks.slice(0, 5).forEach((media, i) => {
        instruction += `${i + 1}. [${media.type.toUpperCase()}] ${media.text || media.href}\n`
      })
    }
  }

  // Ajouter le texte sélectionné
  if (context?.selectedText) {
    instruction += `\n═══ TEXTE SÉLECTIONNÉ PAR L'UTILISATEUR ═══\n"${context.selectedText.substring(0, 500)}${context.selectedText.length > 500 ? '...' : ''}"\n`
  }

  instruction += `\n═══════════════════════════════════════\n`

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
        const pendingActions: PageAction[] = []
        
        const sendText = (text: string) => {
          if (text) {
            fullResponse += text
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'text', content: text })}\n\n`)
            )
          }
        }
        
        const sendAction = (action: PageAction) => {
          pendingActions.push(action)
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'action', action })}\n\n`)
          )
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
              const toolOutput = executeTool(
                part.functionCall.name,
                (part.functionCall.args as Record<string, unknown>) || {},
                context
              )
              
              // Si c'est une action à exécuter côté client
              if (toolOutput.action) {
                sendAction(toolOutput.action)
                // Simuler un résultat de succès pour le modèle
                const simulatedResult = { 
                  success: true, 
                  message: `Action ${toolOutput.action.actionType} envoyée pour exécution`,
                  actionSent: toolOutput.action
                }
                
                const toolResponse = await chat.sendMessage([{
                  functionResponse: {
                    name: part.functionCall.name,
                    response: simulatedResult,
                  }
                }])
                await processResponse(toolResponse)
              } 
              // Sinon c'est un résultat direct
              else if (toolOutput.result) {
                const toolResponse = await chat.sendMessage([{
                  functionResponse: {
                    name: part.functionCall.name,
                    response: toolOutput.result,
                  }
                }])
                await processResponse(toolResponse)
              }
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
