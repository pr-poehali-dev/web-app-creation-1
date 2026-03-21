const MULTIPART_URL = 'https://functions.poehali.dev/0337d155-71d5-48b2-995c-be83c3469396';

const CHUNK_SIZE = 4 * 1024 * 1024; // 4 MB

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function uploadVideoMultipart(
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  const contentType = file.type || 'video/mp4';
  const filename = file.name || 'video.mp4';

  // 1. Init
  onProgress?.(5);
  const initRes = await fetch(`${MULTIPART_URL}?action=init`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, contentType, folder: 'offer-videos' }),
  });
  if (!initRes.ok) {
    const err = await initRes.json().catch(() => ({}));
    throw new Error(err.error || 'Ошибка инициализации загрузки');
  }
  const { uploadId, key, fileUrl } = await initRes.json();

  // 2. Upload parts
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  const parts: { partNumber: number; etag: string }[] = [];

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);
    const buffer = await chunk.arrayBuffer();
    const chunkB64 = toBase64(buffer);

    const partRes = await fetch(`${MULTIPART_URL}?action=part`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key,
        uploadId,
        partNumber: i + 1,
        chunk: chunkB64,
      }),
    });

    if (!partRes.ok) {
      // Abort on failure
      await fetch(`${MULTIPART_URL}?action=abort`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, uploadId }),
      }).catch(() => {});
      const err = await partRes.json().catch(() => ({}));
      throw new Error(err.error || `Ошибка загрузки части ${i + 1}`);
    }

    const { etag } = await partRes.json();
    parts.push({ partNumber: i + 1, etag });

    // Progress: 5% init + 90% upload + 5% complete
    const uploadPercent = Math.round(((i + 1) / totalChunks) * 90);
    onProgress?.(5 + uploadPercent);
  }

  // 3. Complete
  const completeRes = await fetch(`${MULTIPART_URL}?action=complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, uploadId, parts, fileUrl }),
  });

  if (!completeRes.ok) {
    const err = await completeRes.json().catch(() => ({}));
    throw new Error(err.error || 'Ошибка завершения загрузки');
  }

  const result = await completeRes.json();
  onProgress?.(100);
  return result.url;
}
