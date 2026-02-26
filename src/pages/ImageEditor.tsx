import { useRef, useState, useCallback } from "react";

const ImageEditor = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [processed, setProcessed] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [originalName, setOriginalName] = useState("image");

  const processImage = useCallback((file: File) => {
    setLoading(true);
    setProcessed(null);
    setOriginalName(file.name.replace(/\.[^.]+$/, ""));

    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Найти первую не-белую строку сверху
      let topCrop = 0;
      for (let y = 0; y < canvas.height; y++) {
        let isWhiteLine = true;
        for (let x = 0; x < canvas.width; x++) {
          const idx = (y * canvas.width + x) * 4;
          const r = data[idx], g = data[idx + 1], b = data[idx + 2], a = data[idx + 3];
          if (a < 10) continue;
          if (!(r > 240 && g > 240 && b > 240)) {
            isWhiteLine = false;
            break;
          }
        }
        if (!isWhiteLine) {
          topCrop = y;
          break;
        }
      }

      // Новый размер — квадрат на основе ширины
      const size = canvas.width;
      const srcHeight = canvas.height - topCrop;

      // Рисуем в новый квадратный canvas
      const outCanvas = document.createElement("canvas");
      outCanvas.width = size;
      outCanvas.height = size;
      const outCtx = outCanvas.getContext("2d")!;

      // Скругление углов
      const radius = size * 0.18;
      outCtx.beginPath();
      outCtx.moveTo(radius, 0);
      outCtx.lineTo(size - radius, 0);
      outCtx.quadraticCurveTo(size, 0, size, radius);
      outCtx.lineTo(size, size - radius);
      outCtx.quadraticCurveTo(size, size, size - radius, size);
      outCtx.lineTo(radius, size);
      outCtx.quadraticCurveTo(0, size, 0, size - radius);
      outCtx.lineTo(0, radius);
      outCtx.quadraticCurveTo(0, 0, radius, 0);
      outCtx.closePath();
      outCtx.clip();

      // Масштабируем обрезанную часть в квадрат
      outCtx.drawImage(img, 0, topCrop, canvas.width, srcHeight, 0, 0, size, size);

      const result = outCanvas.toDataURL("image/png");
      setProcessed(result);
      setLoading(false);
      URL.revokeObjectURL(url);
    };
    img.src = url;
    setPreview(url);
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImage(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) processImage(file);
  };

  const handleDownload = () => {
    if (!processed) return;
    const a = document.createElement("a");
    a.href = processed;
    a.download = `${originalName}_edited.png`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
      <canvas ref={canvasRef} className="hidden" />

      <div className="w-full max-w-lg">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Редактор иконок</h1>
        <p className="text-gray-500 text-sm mb-6">
          Убирает белую кантовку сверху и делает равномерно скруглённые углы
        </p>

        {/* Дроп-зона */}
        <label
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-blue-300 rounded-2xl bg-white cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
        >
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <svg className="w-10 h-10 text-blue-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          <span className="text-gray-500 text-sm">Перетащи изображение или нажми для выбора</span>
        </label>

        {/* Превью */}
        {(preview || processed) && (
          <div className="mt-8 flex gap-6 justify-center">
            {preview && (
              <div className="flex flex-col items-center gap-2">
                <span className="text-xs text-gray-400 uppercase tracking-wide">До</span>
                <img src={preview} alt="before" className="w-32 h-32 object-contain rounded-lg border border-gray-200 bg-white" />
              </div>
            )}
            {loading && (
              <div className="flex items-center justify-center w-32 h-32">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {processed && (
              <div className="flex flex-col items-center gap-2">
                <span className="text-xs text-gray-400 uppercase tracking-wide">После</span>
                <img src={processed} alt="after" className="w-32 h-32 object-contain" />
              </div>
            )}
          </div>
        )}

        {/* Кнопка скачать */}
        {processed && (
          <button
            onClick={handleDownload}
            className="mt-6 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
          >
            Скачать PNG
          </button>
        )}
      </div>
    </div>
  );
};

export default ImageEditor;
