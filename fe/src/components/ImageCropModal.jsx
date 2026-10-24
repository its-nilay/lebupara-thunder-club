import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, RotateCw, Check, Move, Maximize2, Minimize2, RefreshCcw } from 'lucide-react';

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
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState('');

  const imageRef = useRef(null);
  const viewportRef = useRef(null);
  const touchDistanceRef = useRef(null);

  const CROP_SIZE = 260; // diameter of the crop circle in px

  // Reset parameters when a new image is loaded
  useEffect(() => {
    if (imageSrc) {
      setZoom(1);
      setRotation(0);
      setOffset({ x: 0, y: 0 });
      setImageLoaded(false);
      setDimensions({ width: 0, height: 0 });
    }
  }, [imageSrc]);

  // Generate real-time preview on offscreen canvas
  const generateCroppedCanvas = useCallback((targetSize = 320) => {
    const img = imageRef.current;
    if (!img || !imageLoaded || !dimensions.width || !dimensions.height) return null;

    const canvas = document.createElement('canvas');
    canvas.width = targetSize;
    canvas.height = targetSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Dark club-themed background for any empty space if zoomed out
    ctx.fillStyle = '#020817';
    ctx.fillRect(0, 0, targetSize, targetSize);

    ctx.save();
    // Move to center of target canvas
    ctx.translate(targetSize / 2, targetSize / 2);

    // Apply offset scaled to target size
    const scaleFactor = targetSize / CROP_SIZE;
    ctx.translate(offset.x * scaleFactor, offset.y * scaleFactor);

    // Rotate
    ctx.rotate((rotation * Math.PI) / 180);

    // Scale
    const minDim = Math.min(dimensions.width, dimensions.height);
    const canvasScale = (targetSize / minDim) * zoom;

    ctx.drawImage(
      img,
      (-dimensions.width * canvasScale) / 2,
      (-dimensions.height * canvasScale) / 2,
      dimensions.width * canvasScale,
      dimensions.height * canvasScale
    );

    ctx.restore();
    return canvas;
  }, [imageLoaded, dimensions, zoom, rotation, offset]);

  // Update preview thumbnail
  useEffect(() => {
    if (!imageLoaded) return;
    const canvas = generateCroppedCanvas(128);
    if (canvas) {
      setPreviewDataUrl(canvas.toDataURL('image/jpeg', 0.88));
    }
  }, [generateCroppedCanvas, imageLoaded]);

  // Handle image load to capture natural dimensions
  const handleImageLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    setDimensions({ width: naturalWidth, height: naturalHeight });
    setImageLoaded(true);

    // If image is very tall or very wide, default zoom to fit comfortably
    const minDim = Math.min(naturalWidth, naturalHeight);
    const maxDim = Math.max(naturalWidth, naturalHeight);
    if (maxDim / minDim > 1.4) {
      // Set initial zoom so the full photo is visible
      const fitZoom = minDim / maxDim;
      setZoom(Math.max(0.3, fitZoom));
    } else {
      setZoom(1);
    }
  };

  // Mouse / Touch Dragging
  const handlePointerDown = (e) => {
    if (e.touches && e.touches.length === 2) {
      // Start pinch zoom
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchDistanceRef.current = Math.hypot(dx, dy);
      setIsDragging(false);
      return;
    }

    setIsDragging(true);
    const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
    setDragStart({ x: clientX - offset.x, y: clientY - offset.y });
  };

  const handlePointerMove = (e) => {
    // Pinch zoom handling
    if (e.touches && e.touches.length === 2 && touchDistanceRef.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const factor = dist / touchDistanceRef.current;
      setZoom((prev) => Math.min(Math.max(0.1, prev * factor), 3.5));
      touchDistanceRef.current = dist;
      return;
    }

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
    touchDistanceRef.current = null;
  };

  // Mouse wheel zoom on viewport
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;

    const onWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY * -0.0015;
      setZoom((prev) => Math.min(Math.max(0.1, prev + delta), 3.5));
    };

    vp.addEventListener('wheel', onWheel, { passive: false });
    return () => vp.removeEventListener('wheel', onWheel);
  }, [isOpen]);

  const handleFitPhoto = () => {
    if (!dimensions.width || !dimensions.height) return;
    const minDim = Math.min(dimensions.width, dimensions.height);
    const maxDim = Math.max(dimensions.width, dimensions.height);
    const fitRatio = minDim / maxDim;
    setZoom(parseFloat(fitRatio.toFixed(3)));
    setOffset({ x: 0, y: 0 });
  };

  const handleFillCircle = () => {
    setZoom(1.0);
    setOffset({ x: 0, y: 0 });
  };

  const handleReset = () => {
    setZoom(1.0);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
  };

  const handleSaveCrop = () => {
    const canvas = generateCroppedCanvas(320);
    if (canvas) {
      const croppedUrl = canvas.toDataURL('image/jpeg', 0.9);
      onCropComplete(croppedUrl);
      onClose();
    }
  };

  if (!isOpen || !imageSrc) return null;

  const minDim = dimensions.width && dimensions.height ? Math.min(dimensions.width, dimensions.height) : 260;
  const domScale = (CROP_SIZE / minDim) * zoom;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-md bg-[#0a1428] border border-cyan-500/30 rounded-2xl p-4 sm:p-5 shadow-2xl text-slate-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>{title}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  Circle Avatar
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Drag to reposition • Scroll or use the slider to zoom in/out
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
              ref={viewportRef}
              className="relative w-[280px] h-[280px] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl cursor-move touch-none select-none flex items-center justify-center"
              onMouseDown={handlePointerDown}
              onMouseMove={handlePointerMove}
              onMouseUp={handlePointerUp}
              onMouseLeave={handlePointerUp}
              onTouchStart={handlePointerDown}
              onTouchMove={handlePointerMove}
              onTouchEnd={handlePointerUp}
            >
              {/* Image element */}
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Source Crop"
                onLoad={handleImageLoad}
                className="pointer-events-none absolute transition-transform duration-75"
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: dimensions.width ? `${dimensions.width}px` : 'auto',
                  height: dimensions.height ? `${dimensions.height}px` : 'auto',
                  maxWidth: 'none',
                  maxHeight: 'none',
                  transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg) scale(${domScale})`,
                  transformOrigin: 'center center',
                  opacity: imageLoaded ? 1 : 0,
                }}
              />

              {/* Circular Mask Vignette: highlights circle and dims everything outside */}
              <div
                className="absolute pointer-events-none rounded-full border-2 border-cyan-400 shadow-[0_0_20px_rgba(0,229,255,0.4)]"
                style={{
                  width: `${CROP_SIZE}px`,
                  height: `${CROP_SIZE}px`,
                  boxShadow: '0 0 0 9999px rgba(2, 8, 23, 0.72)',
                }}
              >
                {/* Circular Viewport Grid Guides */}
                <div className="w-full h-full rounded-full overflow-hidden grid grid-cols-3 grid-rows-3 divide-x divide-y divide-cyan-400/20">
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
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-4 h-4 border-t border-b border-cyan-400/50" />
                  <div className="w-4 h-4 border-l border-r border-cyan-400/50 absolute" />
                </div>
              </div>

              {/* Drag indicator hint */}
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-sm text-[10px] text-slate-300 pointer-events-none flex items-center gap-1 border border-slate-700">
                <Move className="w-3 h-3 text-cyan-400" /> Drag to adjust
              </div>
            </div>

            {/* Quick action buttons: Fit, Fill, Rotate, Reset */}
            <div className="w-full mt-3 flex items-center justify-between gap-1.5 text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={handleFitPhoto}
                  title="Zoom out completely so the entire photo fits into the circle"
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold transition text-[11px]"
                >
                  <Minimize2 className="w-3 h-3" /> Fit Full Photo
                </button>

                <button
                  type="button"
                  onClick={handleFillCircle}
                  title="Scale photo to completely fill the circular avatar"
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-white flex items-center gap-1 font-semibold transition text-[11px]"
                >
                  <Maximize2 className="w-3 h-3" /> Fill Circle
                </button>

                <button
                  type="button"
                  onClick={() => setRotation((prev) => (prev + 90) % 360)}
                  className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-white flex items-center gap-1 font-semibold transition text-[11px]"
                  title="Rotate image 90 degrees clockwise"
                >
                  <RotateCw className="w-3 h-3 text-cyan-400" /> 90°
                </button>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="text-[11px] text-slate-400 hover:text-cyan-400 underline flex items-center gap-0.5"
                title="Reset zoom and positioning"
              >
                <RefreshCcw className="w-2.5 h-2.5" /> Reset
              </button>
            </div>

            {/* Zoom Slider Control */}
            <div className="w-full mt-3 p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1 font-semibold text-slate-300">
                  <ZoomIn className="w-3.5 h-3.5 text-cyan-400" /> Zoom Level
                </span>
                <span className="font-mono text-cyan-300 font-bold">
                  {Math.round(zoom * 100)}%
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.1, z - 0.1))}
                  className="p-1 rounded text-slate-400 hover:text-white"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>

                <input
                  type="range"
                  min="0.1"
                  max="3.5"
                  step="0.01"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />

                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(3.5, z + 0.1))}
                  className="p-1 rounded text-slate-400 hover:text-white"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>

              {/* Live Preview Avatar */}
              {previewDataUrl && (
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    Live Circular Preview:
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-cyan-400 shadow-md flex-shrink-0">
                      <img src={previewDataUrl} alt="Preview" className="w-full h-full object-cover rounded-full" />
                    </div>
                    <span className="text-[11px] text-cyan-300 font-semibold">Perfect Circle</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
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
              className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 hover:brightness-110 shadow-lg shadow-cyan-500/20 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Check className="w-4 h-4" /> Save Circled Photo
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
