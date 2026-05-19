import type {
    GraphOverview,
    NodeDetail,
    SearchRequest,
    SearchResult,
    ChatRequest,
    ParseRequest,
    ParseResponse,
    DocumentPreview,
    ConfirmImportRequest,
    UpdateDocumentRequest,
} from '@/types'

// API base can be configured via Vite env var `VITE_API_BASE` (e.g. in .env)
// Fallback to localhost when the env var is not provided.
const API_BASE = (import.meta.env.VITE_API_BASE as string) || 'http://127.0.0.1:8080/api'

// Graph API
export async function getGraphOverview(): Promise<GraphOverview> {
    const res = await fetch(`${API_BASE}/graph/overview`)
    if (!res.ok) throw new Error('Failed to fetch graph overview')
    return res.json()
}

export async function getNodeDetail(nodeId: string): Promise<NodeDetail> {
    const res = await fetch(`${API_BASE}/graph/node/${encodeURIComponent(nodeId)}`)
    if (!res.ok) throw new Error('Failed to fetch node detail')
    return res.json()
}

export async function searchGraph(request: SearchRequest): Promise<SearchResult> {
    const res = await fetch(`${API_BASE}/graph/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
    })
    if (!res.ok) throw new Error('Failed to search graph')
    return res.json()
}

import type { RecommendationRequest, RecommendationResponse } from '@/types'

// Chat API - returns a ReadableStream for streaming response
export async function chat(request: ChatRequest): Promise<Response> {
    const res = await fetch(`${API_BASE}/chat/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
    })
    if (!res.ok) throw new Error('Failed to send chat message')
    return res
}

export async function getRecommendations(request: RecommendationRequest): Promise<RecommendationResponse> {
    const res = await fetch(`${API_BASE}/chat/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
    })
    if (!res.ok) throw new Error('Failed to fetch recommendations')
    return res.json()
}

// Ingest API
export async function uploadDocument(
    file?: File | null,
    title?: string | null,
    content?: string | null,
    type: string = 'text',
    url?: string | null,
): Promise<unknown> {
    const formData = new FormData()
    if (file) formData.append('file', file)
    if (title) formData.append('title', title)
    if (content) formData.append('content', content)
    formData.append('type', type)
    if (url) formData.append('url', url)

    const res = await fetch(`${API_BASE}/ingest/upload`, {
        method: 'POST',
        body: formData,
    })
    if (!res.ok) throw new Error('Failed to upload document')
    return res.json()
}

export async function updateDocument(docId: string, request: UpdateDocumentRequest): Promise<unknown> {
    const res = await fetch(`${API_BASE}/ingest/documents/${encodeURIComponent(docId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
    })
    if (!res.ok) throw new Error('Failed to update document')
    return res.json()
}

export async function deleteDocument(docId: string): Promise<unknown> {
    const res = await fetch(`${API_BASE}/ingest/documents/${encodeURIComponent(docId)}`, {
        method: 'DELETE',
    })
    if (!res.ok) {
        throw new Error('Failed to delete document')
    }
    return res.json()
}

// Import API
export async function parseDocument(request: ParseRequest): Promise<ParseResponse> {
    const res = await fetch(`${API_BASE}/ingest/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
    })
    if (!res.ok) throw new Error('Failed to parse document')
    return res.json()
}

export async function previewDocument(
    title: string,
    content: string,
    type: string,
    url?: string | null,
): Promise<DocumentPreview> {
    const formData = new FormData()
    formData.append('title', title)
    formData.append('content', content)
    formData.append('type', type)
    if (url) formData.append('url', url)

    const res = await fetch(`${API_BASE}/ingest/preview`, {
        method: 'POST',
        body: formData,
    })
    if (!res.ok) throw new Error('Failed to preview document')
    return res.json()
}

export async function confirmImport(request: ConfirmImportRequest): Promise<unknown> {
    const res = await fetch(`${API_BASE}/ingest/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
    })
    if (!res.ok) throw new Error('Failed to confirm import')
    return res.json()
}

// Graph mutation API
export async function getNodeRelations(nodeId: string): Promise<unknown> {
    const res = await fetch(`${API_BASE}/graph/node/${encodeURIComponent(nodeId)}/relations`)
    if (!res.ok) throw new Error('Failed to fetch relations')
    return res.json()
}

export async function updateConcept(conceptId: string, name: string, desc: string): Promise<unknown> {
    const res = await fetch(`${API_BASE}/graph/concept/${encodeURIComponent(conceptId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, desc }),
    })
    if (!res.ok) throw new Error('Failed to update concept')
    return res.json()
}

export async function deleteConcept(conceptId: string): Promise<unknown> {
    const res = await fetch(`${API_BASE}/graph/concept/${encodeURIComponent(conceptId)}`, {
        method: 'DELETE',
    })
    if (!res.ok) throw new Error('Failed to delete concept')
    return res.json()
}

export async function deleteMention(docId: string, conceptId: string): Promise<unknown> {
    const url = `${API_BASE}/graph/relation/mention?doc_id=${encodeURIComponent(docId)}&concept_id=${encodeURIComponent(conceptId)}`
    const res = await fetch(url, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete mention')
    return res.json()
}

export async function deleteRelated(fromId: string, toId: string): Promise<unknown> {
    const url = `${API_BASE}/graph/relation/related?from_id=${encodeURIComponent(fromId)}&to_id=${encodeURIComponent(toId)}`
    const res = await fetch(url, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete relation')
    return res.json()
}

export async function createRelated(fromId: string, toId: string, desc: string): Promise<unknown> {
    const res = await fetch(`${API_BASE}/graph/relation/related`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from_id: fromId, to_id: toId, desc }),
    })
    if (!res.ok) throw new Error('Failed to create relation')
    return res.json()
}
