const UPLOAD_URL = 'https://functions.poehali.dev/b7dd4633-d02b-45c1-bef3-e42a0fbfa170';

export const uploadFile = async (
  file: File,
  fileType: string,
  userId: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = async () => {
      try {
        const base64String = reader.result?.toString().split(',')[1];
        
        if (!base64String) {
          reject(new Error('Failed to read file'));
          return;
        }

        const response = await fetch(UPLOAD_URL, {
          method: 'POST',
          headers: {
            'Content-Type': file.type || 'application/octet-stream',
            'X-User-Id': userId,
            'X-File-Type': fileType,
          },
          body: JSON.stringify({ file: base64String }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Upload failed');
        }

        const data = await response.json();
        resolve(data.url);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
};

export const uploadMultipleFiles = async (
  files: { file: File; type: string }[],
  userId: string,
  onProgress?: (current: number, total: number) => void
): Promise<Record<string, string>> => {
  const results: Record<string, string> = {};

  for (let i = 0; i < files.length; i++) {
    const { file, type } = files[i];
    
    if (onProgress) {
      onProgress(i + 1, files.length);
    }

    try {
      const url = await uploadFile(file, type, userId);
      results[type] = url;
    } catch (error) {
      console.error(`Failed to upload ${type}:`, error);
      throw error;
    }
  }

  return results;
};
