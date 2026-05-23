export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

const STORAGE_KEY = 'hc_chat_history';

function getUserKey(userId?: string | null): string {
  return userId ? `${STORAGE_KEY}:${userId}` : STORAGE_KEY;
}

export function loadChatHistory(userId?: string | null): ChatMessage[] {
  try {
    const raw = localStorage.getItem(getUserKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveChatHistory(messages: ChatMessage[], userId?: string | null): void {
  try {
    localStorage.setItem(getUserKey(userId), JSON.stringify(messages));
  } catch {
    // ignore
  }
}

export function appendMessage(message: ChatMessage, userId?: string | null): ChatMessage[] {
  const history = loadChatHistory(userId);
  const updated = [...history, message];
  saveChatHistory(updated, userId);
  return updated;
}

export function clearChatHistory(userId?: string | null): void {
  try {
    localStorage.removeItem(getUserKey(userId));
  } catch {
    // ignore
  }
}

function getOrCreateSessionId(userId?: string | null): string {
  const key = userId ? `hc_session:${userId}` : 'hc_session:anon';
  let sid = localStorage.getItem(key);
  if (!sid) {
    sid = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(key, sid);
  }
  return sid;
}

export async function callChatbotService(message: string, hfToken?: string, userId?: string | null): Promise<string> {
  const base = import.meta.env.VITE_CHATBOT_SERVICE_URL || 'http://localhost:8002';
  const sessionId = getOrCreateSessionId(userId);
  const resp = await fetch(`${base}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, hfToken, sessionId, userId: userId || undefined })
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data?.error || 'Chatbot service error');
  return data.reply as string;
}

export async function healthCheckChatbot(): Promise<boolean> {
  try {
    const base = import.meta.env.VITE_CHATBOT_SERVICE_URL || 'http://localhost:8002';
    const resp = await fetch(`${base}/api/health`);
    const data = await resp.json();
    return !!data?.ok;
  } catch {
    return false;
  }
}




