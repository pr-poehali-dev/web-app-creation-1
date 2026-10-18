import { useRef, useState } from 'react';
import Icon from '@/components/ui/icon';

interface ImageViewerProps {
  src: string;
  onClose: () => void;
}

const MIN_SCALE = 1;
const MAX_SCALE = 30;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export default function ImageViewer({ src, onClose }: ImageViewerProps) {
  const [view, setView] = useState({ s: 1, x: 0, y: 0 });
  const viewRef = useRef(view);
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchRef = useRef<{ dist: number; s: number; x: number; y: number; cx: number; cy: number } | null>(null);
  const panRef = useRef<{ px: number; py: number; x: number; y: number } | null>(null);
  const movedRef = useRef(false);
  const lastTapRef = useRef(0);
  const boxRef = useRef<HTMLDivElement>(null);

  const apply = (v: { s: number; x: number; y: number }) => {
    const next = v.s <= MIN_SCALE ? { s: MIN_SCALE, x: 0, y: 0 } : v;
    viewRef.current = next;
    setView(next);
  };

  const center = () => {
    const r = boxRef.current?.getBoundingClientRect();
    return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : { x: 0, y: 0 };
  };

  const zoomAt = (clientX: number, clientY: number, newScale: number) => {
    const c = center();
    const fx = clientX - c.x;
    const fy = clientY - c.y;
    const cur = viewRef.current;
    const s = clamp(newScale, MIN_SCALE, MAX_SCALE);
    const k = s / cur.s;
    apply({ s, x: fx - (fx - cur.x) * k, y: fy - (fy - cur.y) * k });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    if (pointers.current.size === 0) movedRef.current = false;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = Array.from(pointers.current.values());
    if (pts.length === 2) {
      movedRef.current = true;
      const cur = viewRef.current;
      pinchRef.current = {
        dist: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y),
        s: cur.s,
        x: cur.x,
        y: cur.y,
        cx: (pts[0].x + pts[1].x) / 2,
        cy: (pts[0].y + pts[1].y) / 2,
      };
      panRef.current = null;
    } else if (pts.length === 1) {
      const cur = viewRef.current;
      panRef.current = { px: e.clientX, py: e.clientY, x: cur.x, y: cur.y };
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = Array.from(pointers.current.values());
    if (pts.length >= 2 && pinchRef.current) {
      const p = pinchRef.current;
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const mx = (pts[0].x + pts[1].x) / 2;
      const my = (pts[0].y + pts[1].y) / 2;
      const s = clamp(p.s * (dist / p.dist), MIN_SCALE, MAX_SCALE);
      const c = center();
      const fx = p.cx - c.x;
      const fy = p.cy - c.y;
      const k = s / p.s;
      apply({ s, x: fx - (fx - p.x) * k + (mx - p.cx), y: fy - (fy - p.y) * k + (my - p.cy) });
    } else if (pts.length === 1 && panRef.current) {
      const p = panRef.current;
      const dx = e.clientX - p.px;
      const dy = e.clientY - p.py;
      if (Math.abs(dx) + Math.abs(dy) > 6) movedRef.current = true;
      if (viewRef.current.s > 1) apply({ s: viewRef.current.s, x: p.x + dx, y: p.y + dy });
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    pinchRef.current = null;
    const rest = Array.from(pointers.current.values());
    if (rest.length === 1) {
      const cur = viewRef.current;
      panRef.current = { px: rest[0].x, py: rest[0].y, x: cur.x, y: cur.y };
    } else {
      panRef.current = null;
    }
    if (pointers.current.size === 0 && !movedRef.current) {
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        lastTapRef.current = 0;
        if (viewRef.current.s > 1) apply({ s: 1, x: 0, y: 0 });
        else zoomAt(e.clientX, e.clientY, 3);
      } else {
        lastTapRef.current = now;
      }
    }
  };

  const onWheel = (e: React.WheelEvent) => {
    zoomAt(e.clientX, e.clientY, viewRef.current.s * (e.deltaY < 0 ? 1.2 : 1 / 1.2));
  };

  const onBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !movedRef.current && viewRef.current.s === 1) onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/95">
      <div
        ref={boxRef}
        className="absolute inset-0 flex items-center justify-center overflow-hidden select-none"
        style={{ touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        onClick={onBackgroundClick}
      >
        <img
          src={src}
          alt="Фото"
          draggable={false}
          className="max-w-full max-h-full object-contain pointer-events-none"
          style={{
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.s})`,
            transition: pointers.current.size === 0 ? 'transform 0.15s ease-out' : 'none',
          }}
        />
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Закрыть"
        className="absolute right-4 z-10 h-11 w-11 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg hover:bg-red-500"
        style={{ top: 'max(1rem, env(safe-area-inset-top))' }}
      >
        <Icon name="X" size={24} />
      </button>
    </div>
  );
}