import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, RotateCw, Check, Upload, Move, AlertCircle } from 'lucide-react';

export default function ImageCropModal({
  isOpen,
  imageSrc,
  onClose,
  onCropComplete,
  title = 'Crop Player Photo',
}) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState('');

  const imageRef = useRef(null);
  const canvasRef = useRef(null);

  // Reset parameters when a new image is loaded
  useEffect(() => {
    if (imageSrc) {
      setZoom(1);
      setRotation(0);
      setOffset({ x: 0, y: 0 });
      setImageLoaded(false);
    }
  }, [imageSrc]);

  // Generate real-time preview on offscreen canvas
  const generateCroppedCanvas = useCallback((targetSize = 256) => {
    const img = imageRef.current;
    if (!img || !imageLoaded) return null;

    const canvas = document.createElement('canvas');
    canvas.width = targetSize;
    canvas.height = targetSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = '#020817';
    ctx.fillRect(0, 0, targetSize, targetSize);

    ctx.save();
    // Move to center of target
    ctx.translate(targetSize / 2, targetSize / 2);
    ctx.rotate((rotation * Math.PI) / 180);

    // Calculate scaling to fill the target square box
    const minDim = Math.min(img.naturalWidth, img.naturalHeight);
    const baseScale = targetSize / minDim;
    const currentScale = baseScale * zoom;

    // Apply drag offset scaled to target size
    // Viewport box is 260px
    const viewportBoxSize = 260;
    const scaleFactor = targetSize / viewportBoxSize;
    ctx.translate(offset.x * scaleFactor, offset.y * scaleFactor);

    ctx.drawImage(
      img,
      (-img.naturalWidth * currentScale) / 2,
      (-img.naturalHeight * currentScale) / 2,
      img.naturalWidth * currentScale,
      img.naturalHeight * currentScale
    );

    ctx.restore();
    return canvas;
  }, [imageLoaded, zoom, rotation, offset]);

  // Update preview thumbnail
  useEffect(() => {
    if (!imageLoaded) return;
    const canvas = generateCroppedCanvas(128);
    if (canvas) {
      setPreviewDataUrl(canvas.toDataURL('image/jpeg', 0.85));
    }
  }, [generateCroppedCanvas, imageLoaded]);

  // Mouse / Touch Dragging
  const handlePointerDown = (e) => {
    setIsDragging(true);
    const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
    setDragStart({ x: clientX - offset.x, y: clientY - offset.y });
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
    setOffset({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y,
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handleSaveCrop = () => {
    const canvas = generateCroppedCanvas(256);
    if (canvas) {
      const croppedUrl = canvas.toDataURL('image/jpeg', 0.88);
      onCropComplete(croppedUrl);
      onClose();
    }
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-md bg-[#0a1428] border border-cyan-500/30 rounded-2xl p-5 shadow-2xl text-slate-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>{title}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  1:1 Square
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Drag to position and use the slider to zoom
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Interactive Crop Viewport Area */}
          <div className="mt-4 flex flex-col items-center">
            <div
              className="relative w-[260px] h-[260px] rounded-2xl overflow-hidden bg-slate-950 border-2 border-cyan-400 shadow-2xl shadow-cyan-500/20 cursor-move touch-none select-none flex items-center justify-center"
              onMouseDown={handlePointerDown}
              onMouseMove={handlePointerMove}
              onMouseUp={handlePointerUp}
              onMouseLeave={handlePointerUp}
              onTouchStart={handlePointerDown}
              onTouchMove={handlePointerMove}
              onTouchEnd={handlePointerUp}
            >
              {/* Invisible hidden image element to get natural dimensions */}
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Source Crop"
                className="pointer-events-none absolute transition-transform duration-75"
                onLoad={() => setImageLoaded(true)}
                style={{
                  transform: `translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg) scale(${zoom})`,
                  maxWidth: 'none',
                  maxHeight: 'none',
                  transformOrigin: 'center center',
                }}
              />

              {/* Viewport Grid Guides */}
              <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 border border-cyan-400/30 divide-x divide-y divide-cyan-400/20">
                <div />
                <div />
                <div />
                <div />
                <div />
                <div />
                <div />
                <div />
                <div />
              </div>

              {/* Center crosshair */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-4 h-4 border-t border-b border-cyan-400/40" />
                <div className="w-4 h-4 border-l border-r border-cyan-400/40 absolute" />
              </div>

              {/* Drag indicator hint on load */}
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[10px] text-slate-300 pointer-events-none flex items-center gap-1">
                <Move className="w-3 h-3 text-cyan-400" /> Drag to adjust
              </div>
            </div>

            {/* Controls: Zoom & Rotate */}
            <div className="w-full mt-4 space-y-3">
              {/* Zoom Slider */}
              <div className="flex items-center gap-3 px-2">
                <ZoomOut className="w-4 h-4 text-slate-400" />
                <input
                  type="range"
                  min="0.8"
                  max="3.0"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <ZoomIn className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono text-cyan-300 w-9 text-right font-bold">
                  {zoom.toFixed(1)}x
                </span>
              </div>

              {/* Rotate & Reset Buttons */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setRotation((prev) => (prev + 90) % 360)}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-white flex items-center gap-1.5 transition font-semibold"
                >
                  <RotateCw className="w-3.5 h-3.5 text-cyan-400" /> Rotate 90°
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setZoom(1);
                    setRotation(0);
                    setOffset({ x: 0, y: 0 });
                  }}
                  className="text-xs text-slate-400 hover:text-cyan-400 underline"
                >
                  Reset Positioning
                </button>

                {/* Live Preview Avatar */}
                {previewDataUrl && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Preview:</span>
                    <div className="w-8 h-8 rounded-xl overflow-hidden border border-cyan-400/60 shadow-md">
                      <img src={previewDataUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveCrop}
              className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 hover:brightness-110 shadow-lg shadow-cyan-500/20 flex items-center gap-1.5 transition"
            >
              <Check className="w-4 h-4" /> Save Square Photo
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
