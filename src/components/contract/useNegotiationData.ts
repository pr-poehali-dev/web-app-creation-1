import { useState, useRef, useCallback, useEffect } from 'react';
import func2url from '../../../backend/func2url.json';
import { ResponseStatus, ChatMessage } from './NegotiationTypes';

const CHAT_API = (func2url as Record<string, string>)['contract-chat'];

interface UseNegotiationDataProps {
  isOpen: boolean;
  responseId: number;
  userId: string;
}

export function useNegotiationData({ isOpen, responseId, userId }: UseNegotiationDataProps) {
  const [status, setStatus] = useState<ResponseStatus | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const loadStatus = useCallback(async () => {
    if (!responseId) return;
    try {
      const res = await fetch(`${CHAT_API}?action=status&responseId=${responseId}`, {
        headers: { 'X-User-Id': userId },
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (e) { console.error(e); }
  }, [responseId, userId]);

  const loadMessages = useCallback(async () => {
    if (!responseId) return;
    try {
      const res = await fetch(`${CHAT_API}?action=messages&responseId=${responseId}`, {
        headers: { 'X-User-Id': userId },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setTimeout(scrollToBottom, 50);
      }
    } catch (e) { console.error(e); }
  }, [responseId, userId]);

  useEffect(() => {
    if (!isOpen || !responseId) return;
    setIsLoading(true);
    Promise.all([loadStatus(), loadMessages()]).finally(() => setIsLoading(false));
    pollRef.current = setInterval(loadMessages, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [isOpen, responseId, loadStatus, loadMessages]);

  return { status, messages, isLoading, scrollRef, loadStatus, loadMessages };
}
