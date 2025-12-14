import { extractText, getDocumentProxy } from 'unpdf'

export async function POST(request: Request) {
  try {
    const { url } = await request.json()
    
    if (!url) {
      return Response.json({ success: false, error: 'URL requise' }, { status: 400 })
    }
    
    console.log('[PDF Extract] Fetching PDF from:', url)
    
    // Télécharger le PDF
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    if (!response.ok) {
      return Response.json({ 
        success: false, 
        error: `Impossible de télécharger le PDF: ${response.status}` 
      }, { status: 400 })
    }
    
    const arrayBuffer = await response.arrayBuffer()
    console.log('[PDF Extract] PDF downloaded, size:', arrayBuffer.byteLength, 'bytes')
    
    // Extraire le texte avec unpdf
    const pdf = await getDocumentProxy(new Uint8Array(arrayBuffer))
    const { text, totalPages } = await extractText(pdf, { mergePages: true })
    
    console.log('[PDF Extract] PDF parsed, pages:', totalPages)
    
    // Récupérer les métadonnées
    let metadata = {}
    try {
      const meta = await pdf.getMetadata()
      const info = (meta?.info || {}) as Record<string, unknown>
      metadata = {
        title: String(info.Title || ''),
        author: String(info.Author || ''),
        subject: String(info.Subject || ''),
        creator: String(info.Creator || ''),
        producer: String(info.Producer || '')
      }
    } catch {
      // Ignorer les erreurs de métadonnées
    }
    
    const fullText = Array.isArray(text) ? text.join('\n\n') : text
    
    const result = {
      success: true,
      url,
      numPages: totalPages,
      extractedPages: totalPages,
      metadata,
      fullText: fullText.trim(),
      textLength: fullText.length
    }
    
    console.log('[PDF Extract] Extraction complete:', result.textLength, 'characters')
    
    return Response.json(result)
    
  } catch (error) {
    console.error('[PDF Extract] Error:', error)
    return Response.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}
