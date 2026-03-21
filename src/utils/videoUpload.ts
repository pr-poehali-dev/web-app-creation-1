const UPLOAD_VIDEO_URL = 'https://functions.poehali.dev/9999daf2-27bb-4ac4-a09e-001928741e24';

const CHUNK_SIZE = 3 * 1024 * 1024; // 3 MB на чанк

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  // Безопасная конвертация через батчи — избегаем лимита стека на больших файлах
  const BATCH = 8192;
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i += BATCH) {
    binary += String.fromCharCode(...bytes.subarray(i, i + BATCH));
  }
  return btoa(binary);
}

export async function uploadVideoMultipart(
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  const contentType = file.type || 'video/mp4';
  const filename = file.name || 'video.mp4';

  onProgress?.(2);

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);
    const buffer = await chunk.arrayBuffer();
    const chunkB64 = toBase64(buffer);

    const resp = await fetch(
      `${UPLOAD_VIDEO_URL}?action=chunk&uploadId=${uploadId}&part=${i}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chunk: chunkB64 }),
      }
    );

    if (!resp.ok) {
      let msg = `Ошибка загрузки части ${i + 1}`;
      try { const e = await resp.json(); msg = e.error || msg; } catch (_) { /* ignore */ }
      throw new Error(msg);
    }

    onProgress?.(2 + Math.round(((i + 1) / totalChunks) * 88));
  }

  const completeResp = await fetch(
    `${UPLOAD_VIDEO_URL}?action=complete`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uploadId, filename, contentType, totalParts: totalChunks }),
    }
  );

  if (!completeResp.ok) {
    let msg = 'Ошибка финализации загрузки';
    try { const e = await completeResp.json(); msg = e.error || msg; } catch (_) { /* ignore */ }
    throw new Error(msg);
  }

  const result = await completeResp.json();
  if (!result.url) throw new Error('Нет URL в ответе');

  onProgress?.(100);
  return result.url;
}