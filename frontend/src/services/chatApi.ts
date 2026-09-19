const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

export interface SourceDTO {
  title: string;
  url: string;
  last_verified?: string;
}

export interface AssistantQueryResponseDTO {
  message: string;
  intent: string;
  schemes: any[];
  eligibility_results: any[];
  missing_information: string[];
  sources: SourceDTO[];
  requires_clarification: boolean;
  conversation_id?: string;
}

export interface ConversationDTO {
  id: string;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
  messages: Array<{
    id: string;
    role: 'USER' | 'ASSISTANT' | 'SYSTEM' | 'TOOL';
    content: string;
    metadata?: any;
    created_at: string;
  }>;
}

export async function sendAssistantQuery(
  query: string,
  conversationId?: string,
  profileOverride?: Record<string, any>
): Promise<AssistantQueryResponseDTO> {
  const res = await fetch(`${API_BASE_URL}/assistant/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      conversation_id: conversationId,
      profile_override: profileOverride
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to process AI assistant query');
  }

  return await res.json();
}

export async function fetchConversations(): Promise<ConversationDTO[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/conversations`, { cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.warn('Unable to fetch conversations list:', err);
    return [];
  }
}
