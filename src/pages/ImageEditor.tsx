import { useRef, useState, useCallback, useEffect } from "react";

interface Settings {
  // Обрезка
  cropTop: number;
  cropBottom: number;
  cropLeft: number;
  cropRight: number;
  // Скругление
  borderRadius: number;
  // Размер вывода
  outputSize: number;
  // Отступ внутри
  padding: number;
  // Масштаб иконки внутри рамки
  iconScale: number;
  // Режим вписывания
  fitMode: "stretch" | "fit" | "fill";
  // Цвет фона
  bgColor: string;
  bgTransparent: boolean;
  // Коррекция
  brightness: number;
  contrast: number;
  saturation: number;
  sharpness: number;
}

const DEFAULT: Settings = {
  cropTop: 0,
  cropBottom: 0,
  cropLeft: 0,
  cropRight: 0,
  borderRadius: 22,
  outputSize: 512,
  padding: 0,
  iconScale: 100,
  fitMode: "fit",
  bgColor: "#ffffff",
  bgTransparent: true,
  brightness: 100,
  contrast: 100,
  saturation: 100,
  sharpness: 0,
};

const Slider = ({
  label, value, min, max, step = 1, unit = "", onChange,
}: {
  label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (v: number) => void;
}) => (
  <div className="flex flex-col gap-1">
    <div className="flex justify-between items-center">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-xs font-mono text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">{value}{unit}</span>
    </div>
    <input
      type="range" min={min} max={max} step={step} value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full h-1.5 accent-blue-600 cursor-pointer"
    />
  </div>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">{title}</h3>
    <div className="flex flex-col gap-3">{children}</div>
  </div>
);

export default function ImageEditor() {
  const [imgEl, setImgEl] = useState<HTMLImageElement | null>(null);
  const [originalName, setOriginalName] = useState("image");
  const [settings, setSettings] = useState<Settings>(DEFAULT);
  const [autoDetected, setAutoDetected] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);

  const set = (key: keyof Settings, val: number | string | boolean) =>
    setSettings((s) => ({ ...s, [key]: val }));

  // Автодетект белой кантовки
  const detectWhiteBorder = useCallback((img: HTMLImageElement) => {
    const tmp = document.createElement("canvas");
    tmp.width = img.width;
    tmp.height = img.height;
    const ctx = tmp.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(0, 0, tmp.width, tmp.height).data;
    const W = tmp.width, H = tmp.height;

    const isWhiteRow = (y: number) => {
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        if (d[i + 3] < 10) continue;
        if (!(d[i] > 235 && d[i + 1] > 235 && d[i + 2] > 235)) return false;
      }
      return true;
    };
    const isWhiteCol = (x: number) => {
      for (let y = 0; y < H; y++) {
        const i = (y * W + x) * 4;
        if (d[i + 3] < 10) continue;
        if (!(d[i] > 235 && d[i + 1] > 235 && d[i + 2] > 235)) return false;
      }
      return true;
    };

    let top = 0, bottom = 0, left = 0, right = 0;
    while (top < H && isWhiteRow(top)) top++;
    while (bottom < H - top && isWhiteRow(H - 1 - bottom)) bottom++;
    while (left < W && isWhiteCol(left)) left++;
    while (right < W - left && isWhiteCol(W - 1 - right)) right++;

    return { top, bottom, left, right };
  }, []);

  const loadFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setOriginalName(file.name.replace(/\.[^.]+$/, ""));
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const borders = detectWhiteBorder(img);
      setSettings({
        ...DEFAULT,
        cropTop: borders.top,
        cropBottom: borders.bottom,
        cropLeft: borders.left,
        cropRight: borders.right,
      });
      setAutoDetected(borders.top > 0 || borders.bottom > 0 || borders.left > 0 || borders.right > 0);
      setImgEl(img);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  // Рендер превью при изменении настроек
  useEffect(() => {
    if (!imgEl || !previewRef.current) return;
    renderToCanvas(previewRef.current, imgEl, settings, 300);
  }, [imgEl, settings]);

  const renderToCanvas = (
    canvas: HTMLCanvasElement,
    img: HTMLImageElement,
    s: Settings,
    size: number,
  ) => {
    const ctx = canvas.getContext("2d")!;
    canvas.width = size;
    canvas.height = size;
    ctx.clearRect(0, 0, size, size);

    // Скругление
    const r = (s.borderRadius / 100) * size * 0.5;
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(size - r, 0);
    ctx.quadraticCurveTo(size, 0, size, r);
    ctx.lineTo(size, size - r);
    ctx.quadraticCurveTo(size, size, size - r, size);
    ctx.lineTo(r, size);
    ctx.quadraticCurveTo(0, size, 0, size - r);
    ctx.lineTo(0, r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.closePath();
    ctx.clip();

    // Фон
    if (!s.bgTransparent) {
      ctx.fillStyle = s.bgColor;
      ctx.fillRect(0, 0, size, size);
    }

    // Исходный регион с учётом обрезки
    const srcX = s.cropLeft;
    const srcY = s.cropTop;
    const srcW = Math.max(1, img.width - s.cropLeft - s.cropRight);
    const srcH = Math.max(1, img.height - s.cropTop - s.cropBottom);

    const pad = (s.padding / 100) * size;
    const areaX = pad;
    const areaY = pad;
    const areaW = size - pad * 2;
    const areaH = size - pad * 2;

    // Режим вписывания
    let dstX: number, dstY: number, dstW: number, dstH: number;
    const scale = s.iconScale / 100;

    if (s.fitMode === "stretch") {
      dstW = areaW * scale;
      dstH = areaH * scale;
      dstX = areaX + (areaW - dstW) / 2;
      dstY = areaY + (areaH - dstH) / 2;
    } else if (s.fitMode === "fit") {
      const ratio = Math.min(areaW / srcW, areaH / srcH) * scale;
      dstW = srcW * ratio;
      dstH = srcH * ratio;
      dstX = areaX + (areaW - dstW) / 2;
      dstY = areaY + (areaH - dstH) / 2;
    } else {
      // fill — заполнить всю область
      const ratio = Math.max(areaW / srcW, areaH / srcH) * scale;
      dstW = srcW * ratio;
      dstH = srcH * ratio;
      dstX = areaX + (areaW - dstW) / 2;
      dstY = areaY + (areaH - dstH) / 2;
    }

    // Яркость / контраст / насыщенность через CSS filter
    ctx.filter = `brightness(${s.brightness}%) contrast(${s.contrast}%) saturate(${s.saturation}%)`;
    ctx.drawImage(img, srcX, srcY, srcW, srcH, dstX, dstY, dstW, dstH);
    ctx.filter = "none";

    // Резкость (unsharp mask упрощённый через повтор)
    if (s.sharpness > 0) {
      ctx.globalAlpha = s.sharpness / 200;
      ctx.drawImage(img, srcX, srcY, srcW, srcH, dstX - 1, dstY - 1, dstW + 2, dstH + 2);
      ctx.globalAlpha = 1;
    }
  };

  const handleDownload = () => {
    if (!imgEl || !canvasRef.current) return;
    renderToCanvas(canvasRef.current, imgEl, settings, settings.outputSize);
    const a = document.createElement("a");
    a.href = canvasRef.current.toDataURL("image/png");
    a.download = `${originalName}_edited.png`;
    a.click();
  };

  const handleReset = () => {
    if (!imgEl) return;
    const borders = detectWhiteBorder(imgEl);
    setSettings({
      ...DEFAULT,
      cropTop: borders.top,
      cropBottom: borders.bottom,
      cropLeft: borders.left,
      cropRight: borders.right,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <canvas ref={canvasRef} className="hidden" />

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Редактор иконок</h1>
          <p className="text-gray-500 text-sm mt-1">Обрезка, скругление, коррекция цвета и экспорт</p>
        </div>

        {!imgEl ? (
          <label
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) loadFile(f); }}
            onDragOver={(e) => e.preventDefault()}
            className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-blue-300 rounded-2xl bg-white cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) loadFile(f); }} />
            <svg className="w-12 h-12 text-blue-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span className="text-gray-600 font-medium">Перетащи изображение или нажми для выбора</span>
            <span className="text-gray-400 text-sm mt-1">PNG, JPG, WEBP</span>
          </label>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">

            {/* Превью */}
            <div className="flex flex-col items-center gap-4 lg:sticky lg:top-4 lg:self-start">
              {autoDetected && (
                <div className="w-full max-w-xs bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 text-xs text-blue-700">
                  Белая кантовка автоматически обнаружена и обрезана
                </div>
              )}

              {/* Шахматный фон для прозрачности */}
              <div className="relative rounded-2xl overflow-hidden shadow-lg"
                style={{
                  background: "repeating-conic-gradient(#ddd 0% 25%, #fff 0% 50%) 0 0 / 16px 16px",
                  width: 300, height: 300,
                }}>
                <canvas ref={previewRef} width={300} height={300} className="absolute inset-0" />
              </div>

              <div className="flex gap-2">
                <label className="flex-1 text-center py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg cursor-pointer transition-colors">
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) loadFile(f); }} />
                  Загрузить другое
                </label>
                <button onClick={handleReset} className="py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm rounded-lg transition-colors">
                  Сброс
                </button>
              </div>

              <button
                onClick={handleDownload}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-md"
              >
                Скачать PNG ({settings.outputSize}×{settings.outputSize})
              </button>
            </div>

            {/* Панель настроек */}
            <div className="flex-1 flex flex-col gap-4 min-w-0">

              <Section title="Обрезка краёв (px)">
                <Slider label="Сверху" value={settings.cropTop} min={0} max={200} onChange={(v) => set("cropTop", v)} unit="px" />
                <Slider label="Снизу" value={settings.cropBottom} min={0} max={200} onChange={(v) => set("cropBottom", v)} unit="px" />
                <Slider label="Слева" value={settings.cropLeft} min={0} max={200} onChange={(v) => set("cropLeft", v)} unit="px" />
                <Slider label="Справа" value={settings.cropRight} min={0} max={200} onChange={(v) => set("cropRight", v)} unit="px" />
              </Section>

              <Section title="Масштаб и расположение">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-gray-500 mb-1">Режим вписывания</span>
                  <div className="grid grid-cols-3 gap-2">
                    {(["fit", "fill", "stretch"] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => set("fitMode", mode)}
                        className={`py-1.5 rounded-lg text-xs font-medium transition-colors ${settings.fitMode === mode ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                      >
                        {mode === "fit" ? "Вписать" : mode === "fill" ? "Заполнить" : "Растянуть"}
                      </button>
                    ))}
                  </div>
                </div>
                <Slider label="Размер иконки" value={settings.iconScale} min={10} max={150} onChange={(v) => set("iconScale", v)} unit="%" />
              </Section>

              <Section title="Форма и отступы">
                <Slider label="Скругление углов" value={settings.borderRadius} min={0} max={100} onChange={(v) => set("borderRadius", v)} unit="%" />
                <Slider label="Внутренний отступ" value={settings.padding} min={0} max={40} onChange={(v) => set("padding", v)} unit="%" />
              </Section>

              <Section title="Фон">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={settings.bgTransparent}
                      onChange={(e) => set("bgTransparent", e.target.checked)}
                      className="w-4 h-4 accent-blue-600"
                    />
                    <span className="text-sm text-gray-600">Прозрачный фон</span>
                  </label>
                </div>
                {!settings.bgTransparent && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">Цвет фона</span>
                    <input
                      type="color"
                      value={settings.bgColor}
                      onChange={(e) => set("bgColor", e.target.value)}
                      className="w-10 h-8 rounded cursor-pointer border border-gray-200"
                    />
                    <span className="text-xs font-mono text-gray-500">{settings.bgColor}</span>
                  </div>
                )}
              </Section>

              <Section title="Коррекция цвета">
                <Slider label="Яркость" value={settings.brightness} min={20} max={200} onChange={(v) => set("brightness", v)} unit="%" />
                <Slider label="Контраст" value={settings.contrast} min={20} max={200} onChange={(v) => set("contrast", v)} unit="%" />
                <Slider label="Насыщенность" value={settings.saturation} min={0} max={200} onChange={(v) => set("saturation", v)} unit="%" />
                <Slider label="Резкость" value={settings.sharpness} min={0} max={100} onChange={(v) => set("sharpness", v)} unit="%" />
              </Section>

              <Section title="Размер экспорта">
                <div className="grid grid-cols-4 gap-2">
                  {[256, 512, 1024, 2048].map((s) => (
                    <button
                      key={s}
                      onClick={() => set("outputSize", s)}
                      className={`py-2 rounded-lg text-sm font-medium transition-colors ${settings.outputSize === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                    >
                      {s}px
                    </button>
                  ))}
                </div>
                <Slider label="Произвольный размер" value={settings.outputSize} min={64} max={2048} step={64} onChange={(v) => set("outputSize", v)} unit="px" />
              </Section>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}