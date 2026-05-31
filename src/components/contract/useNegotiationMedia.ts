import { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import func2url from '../../../backend/func2url.json';

const CHAT_API = (func2url as Record<string, string>)['contract-chat'];
const UPLOAD_URL = (func2url as Record<string, string>)['get-upload-url'];

const MIME_EXT_MAP: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
  gif: 'image/gif', webp: 'image/webp', heic: 'image/heic', heif: 'image/heif',
  mp4: 'video/mp4', mov: 'video/quicktime', m4v: 'video/x-m4v',
  avi: 'video/avi', webm: 'video/webm',
  pdf: 'application/pdf', doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

const resolveFileType = (file: File): string => {
  if (file.type) return file.type;
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  return MIME_EXT_MAP[ext] || 'application/octet-stream';
};

const blobChunkToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const buf = reader.result as ArrayBuffer;
      const bytes = new Uint8Array(buf);
      // Конвертируем по 8192 байта — apply с 4 млн аргументов вызывает stack overflow на iOS
      let binary = '';
      const STEP = 8192;
      for (let i = 0; i < bytes.length; i += STEP) {
        binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + STEP)));
      }
      resolve(btoa(binary));
    };
    reader.onerror = () => reject(new Error('Ошибка чтения файла'));
    reader.readAsArrayBuffer(blob);
  });
};

interface UseNegotiationMediaProps {
  userId: string;
  responseId: number;
  onMessageSent: () => Promise<void>;
}

export function useNegotiationMedia({ userId, responseId, onMessageSent }: UseNegotiationMediaProps) {
  const { toast } = useToast();

  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [pendingFile, setPendingFile] = useState<{ file: File; preview: string } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isCancelRecordingRef = useRef(false);

  const removePendingFile = () => {
    setPendingFile(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const MAX_SIZE = 500 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast({ title: 'Файл слишком большой', description: 'Максимальный размер — 500 МБ', variant: 'destructive' });
      e.target.value = '';
      return;
    }
    const fileType = resolveFileType(file);
    const isPdf = fileType === 'application/pdf';
    const preview = isPdf ? '' : URL.createObjectURL(file);
    setPendingFile({ file, preview });
    e.target.value = '';
  };

  const uploadFileMultipart = async (file: File): Promise<{ url: string; name: string; type: string }> => {
    const CHUNK = 4 * 1024 * 1024;
    const fileType = resolveFileType(file);

    const initRes = await fetch(`${UPLOAD_URL}?action=init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
      body: JSON.stringify({ filename: file.name || 'file', contentType: fileType, folder: 'contract-chat' }),
    });
    if (!initRes.ok) throw new Error('Не удалось начать загрузку файла');
    const { uploadId, key, fileUrl } = await initRes.json();

    const parts: { partNumber: number; etag: string }[] = [];
    const totalChunks = Math.ceil(file.size / CHUNK);

    for (let i = 0; i < totalChunks; i++) {
      const chunk = file.slice(i * CHUNK, Math.min((i + 1) * CHUNK, file.size));
      const chunkB64 = await blobChunkToBase64(chunk);
      const partRes = await fetch(`${UPLOAD_URL}?action=part`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
        body: JSON.stringify({ key, uploadId, partNumber: i + 1, chunk: chunkB64 }),
      });
      if (!partRes.ok) {
        fetch(`${UPLOAD_URL}?action=abort`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-User-Id': userId }, body: JSON.stringify({ key, uploadId }) });
        throw new Error(`Ошибка загрузки части ${i + 1}`);
      }
      const { etag } = await partRes.json();
      parts.push({ partNumber: i + 1, etag });
    }

    const completeRes = await fetch(`${UPLOAD_URL}?action=complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
      body: JSON.stringify({ key, uploadId, parts, fileUrl }),
    });
    if (!completeRes.ok) throw new Error('Не удалось завершить загрузку файла');

    return { url: fileUrl, name: file.name || 'file', type: fileType };
  };

  const sendVoiceBlob = async (blob: Blob, mimeType: string) => {
    if (!userId) return;
    const ext = mimeType.includes('ogg') ? 'ogg' : mimeType.includes('mp4') ? 'mp4' : 'webm';
    setIsSending(true);
    try {
      const reader = new FileReader();
      const fileData = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      const res = await fetch(CHAT_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
        body: JSON.stringify({
          responseId,
          text: '',
          fileData,
          fileName: `voice_${Date.now()}.${ext}`,
          fileType: mimeType,
        }),
      });
      if (res.ok) {
        await onMessageSent();
      } else {
        toast({ title: 'Ошибка отправки голосового', variant: 'destructive' });
      }
    } finally {
      setIsSending(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4']
        .find(t => MediaRecorder.isTypeSupported(t)) || '';
      const mr = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      const usedMime = mr.mimeType || mimeType || 'audio/webm';
      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        if (audioChunksRef.current.length === 0) return;
        const blob = new Blob(audioChunksRef.current, { type: usedMime });
        if (isCancelRecordingRef.current) {
          isCancelRecordingRef.current = false;
          return;
        }
        sendVoiceBlob(blob, usedMime);
      };
      mr.start();
      mediaRecorderRef.current = mr;
      isCancelRecordingRef.current = false;
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch {
      toast({ title: 'Нет доступа к микрофону', variant: 'destructive' });
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
  };

  const cancelRecording = () => {
    isCancelRecordingRef.current = true;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stream?.getTracks().forEach(t => t.stop());
      mediaRecorderRef.current.stop();
    }
    audioChunksRef.current = [];
    setIsRecording(false);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
  };

  const handleSend = async () => {
    if ((!text.trim() && !pendingFile) || isSending) return;
    if (!userId) {
      toast({ title: 'Ошибка', description: 'Не удалось определить пользователя. Обновите страницу и войдите снова.', variant: 'destructive' });
      return;
    }
    setIsSending(true);
    try {
      const payload: Record<string, unknown> = { responseId, text: text.trim() };
      if (pendingFile) {
        const { url, name, type } = await uploadFileMultipart(pendingFile.file);
        payload.fileUrl = url;
        payload.fileName = name;
        payload.fileType = type;
      }
      const res = await fetch(CHAT_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setText('');
        removePendingFile();
        await onMessageSent();
      } else {
        toast({ title: 'Ошибка', description: 'Не удалось отправить сообщение', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось загрузить файл. Проверьте соединение.', variant: 'destructive' });
    } finally {
      setIsSending(false);
    }
  };

  return {
    text, setText,
    isSending,
    pendingFile,
    handleFileSelect,
    removePendingFile,
    isRecording,
    recordingTime,
    startRecording,
    stopRecording,
    cancelRecording,
    handleSend,
  };
}