'use client';
import { useState, useRef, useCallback, useEffect } from 'react';

interface VoucherScannerProps {
  onCodesScanned: (codes: string[]) => void;
}

export default function VoucherScanner({ onCodesScanned }: VoucherScannerProps) {
  const [open, setOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<string[]>([]);
  const [error, setError] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(false);

  // crop selection (in displayed percentage coords)
  const [crop, setCrop] = useState({ x: 10, y: 30, w: 80, h: 25 });
  const imgRef = useRef<HTMLImageElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; mode: string; box: typeof crop } | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraOn(false);
  }, []);

  const close = useCallback(() => {
    stopCamera();
    setOpen(false);
    setImageSrc(null);
    setProcessing(false);
    setProgress(0);
    setResult([]);
    setError('');
  }, [stopCamera]);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const startCamera = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOn(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      setError('Cannot access camera. Please allow camera permission or upload a photo instead.');
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setImageSrc(canvas.toDataURL('image/jpeg', 0.95));
    stopCamera();
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageSrc(reader.result as string);
    reader.readAsDataURL(file);
  };

  // Crop selection drag handlers
  const beginDrag = (mode: string) => (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const point = 'touches' in e ? (e as React.TouchEvent).touches[0] : (e as React.MouseEvent);
    dragRef.current = { startX: point.clientX, startY: point.clientY, mode, box: { ...crop } };
  };

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      const drag = dragRef.current;
      const img = imgRef.current;
      if (!drag || !img) return;
      const point = 'touches' in e ? (e as TouchEvent).touches[0] : (e as MouseEvent);
      const rect = img.getBoundingClientRect();
      const dx = ((point.clientX - drag.startX) / rect.width) * 100;
      const dy = ((point.clientY - drag.startY) / rect.height) * 100;
      const b = drag.box;
      const next = { ...b };
      if (drag.mode === 'move') {
        next.x = Math.min(Math.max(0, b.x + dx), 100 - b.w);
        next.y = Math.min(Math.max(0, b.y + dy), 100 - b.h);
      } else if (drag.mode === 'se') {
        next.w = Math.min(Math.max(5, b.w + dx), 100 - b.x);
        next.h = Math.min(Math.max(5, b.h + dy), 100 - b.y);
      } else if (drag.mode === 'sw') {
        const newW = Math.min(Math.max(5, b.w - dx), b.x + b.w);
        next.x = b.x + b.w - newW;
        next.w = newW;
        next.h = Math.min(Math.max(5, b.h + dy), 100 - b.y);
      } else if (drag.mode === 'ne') {
        const newH = Math.min(Math.max(5, b.h - dy), b.y + b.h);
        next.y = b.y + b.h - newH;
        next.h = newH;
        next.w = Math.min(Math.max(5, b.w + dx), 100 - b.x);
      } else if (drag.mode === 'nw') {
        const newW = Math.min(Math.max(5, b.w - dx), b.x + b.w);
        const newH = Math.min(Math.max(5, b.h - dy), b.y + b.h);
        next.x = b.x + b.w - newW;
        next.y = b.y + b.h - newH;
        next.w = newW;
        next.h = newH;
      }
      setCrop(next);
    };
    const onUp = () => { dragRef.current = null; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, []);

  const extractCodes = (text: string): string[] => {
    const cleaned = text.toUpperCase();
    // split into lines and words
    const tokens = cleaned.split(/[\n\r]+| {2,}/).map((t) => t.trim()).filter(Boolean);
    const codes: string[] = [];
    for (const token of tokens) {
      // keep alphanumerics and dashes
      const candidate = token.replace(/[^A-Z0-9-]/g, '');
      const digits = candidate.replace(/[^0-9]/g, '');
      // Voucher numbers are numeric-only: accept tokens with >= 6 digits
      if (digits.length >= 6) {
        codes.push(digits);
      } else if (candidate.length >= 8 && candidate.replace(/[^A-Z]/g, '').length > 0 && digits.length >= 4) {
        // mixed alphanumeric voucher codes
        codes.push(candidate);
      }
    }
    // also scan for long digit runs anywhere
    const digitRuns = cleaned.match(/\d[\d\s-]{5,}\d/g) || [];
    for (const run of digitRuns) {
      const d = run.replace(/[^0-9]/g, '');
      if (d.length >= 6) codes.push(d);
    }
    return Array.from(new Set(codes));
  };

  const scan = async () => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;
    setProcessing(true);
    setProgress(0);
    setError('');
    setResult([]);
    try {
      // Crop region on canvas
      const naturalW = img.naturalWidth;
      const naturalH = img.naturalHeight;
      const sx = (crop.x / 100) * naturalW;
      const sy = (crop.y / 100) * naturalH;
      const sw = (crop.w / 100) * naturalW;
      const sh = (crop.h / 100) * naturalH;
      canvas.width = Math.max(1, Math.round(sw));
      canvas.height = Math.max(1, Math.round(sh));
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

      // Preprocess: grayscale + threshold to improve OCR
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imgData.data;
      for (let i = 0; i < d.length; i += 4) {
        const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        const val = gray > 140 ? 255 : 0;
        d[i] = d[i + 1] = d[i + 2] = val;
      }
      ctx.putImageData(imgData, 0, 0);

      const croppedDataUrl = canvas.toDataURL('image/png');

      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng', 1, {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === 'recognizing text') setProgress(Math.round(m.progress * 100));
        },
      });
      await worker.setParameters({
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-',
      });
      const { data } = await worker.recognize(croppedDataUrl);
      await worker.terminate();

      const codes = extractCodes(data.text || '');
      if (codes.length === 0) {
        setError('No voucher number detected. Try cropping tighter around the number and rescan.');
      } else {
        setResult(codes);
      }
    } catch (err) {
      console.error('Scan failed:', err);
      setError('Scanning failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const addResults = () => {
    if (result.length === 0) return;
    onCodesScanned(result);
    close();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-emerald-700 hover:to-teal-700 transition text-sm"
      >
        📷 Scan Voucher
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
              <h2 className="text-lg font-bold text-gray-800">Scan Voucher Number</h2>
              <button onClick={close} className="text-gray-500 hover:text-gray-800 text-2xl leading-none" aria-label="Close">×</button>
            </div>

            <div className="p-4 space-y-4">
              <canvas ref={canvasRef} className="hidden" />

              {!imageSrc && !cameraOn && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Take a photo of the voucher and crop the area with the voucher number. Images are
                    processed on your device and are never uploaded or stored.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={startCamera}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                    >
                      📷 Use Camera
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full bg-gray-700 text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition"
                    >
                      🖼️ Upload Photo
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={onFile}
                    className="hidden"
                  />
                </div>
              )}

              {cameraOn && (
                <div className="space-y-3">
                  <video ref={videoRef} className="w-full rounded-lg bg-black" playsInline muted />
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition"
                    >
                      ✅ Capture
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="w-full bg-gray-300 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-400 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {imageSrc && (
                <div className="space-y-3">
                  <p className="text-xs text-gray-500">
                    Drag inside the box to move it, or drag the corners to resize. Fit it around the voucher number only.
                  </p>
                  <div className="relative select-none touch-none">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      ref={imgRef}
                      src={imageSrc}
                      alt="Voucher"
                      className="w-full rounded-lg border"
                      draggable={false}
                    />
                    <div
                      className="absolute border-2 border-emerald-500 bg-emerald-500/20 cursor-move"
                      style={{
                        left: `${crop.x}%`,
                        top: `${crop.y}%`,
                        width: `${crop.w}%`,
                        height: `${crop.h}%`,
                      }}
                      onMouseDown={beginDrag('move')}
                      onTouchStart={beginDrag('move')}
                    >
                      <span
                        className="absolute -bottom-3 -right-3 w-4 h-4 bg-emerald-600 rounded-full cursor-se-resize"
                        onMouseDown={beginDrag('se')}
                        onTouchStart={beginDrag('se')}
                      />
                      <span
                        className="absolute -bottom-3 -left-3 w-4 h-4 bg-emerald-600 rounded-full cursor-sw-resize"
                        onMouseDown={beginDrag('sw')}
                        onTouchStart={beginDrag('sw')}
                      />
                      <span
                        className="absolute -top-3 -right-3 w-4 h-4 bg-emerald-600 rounded-full cursor-ne-resize"
                        onMouseDown={beginDrag('ne')}
                        onTouchStart={beginDrag('ne')}
                      />
                      <span
                        className="absolute -top-3 -left-3 w-4 h-4 bg-emerald-600 rounded-full cursor-nw-resize"
                        onMouseDown={beginDrag('nw')}
                        onTouchStart={beginDrag('nw')}
                      />
                    </div>
                  </div>

                  {processing && (
                    <div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-emerald-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
                      </div>
                      <p className="text-xs text-gray-500 mt-1 text-center">Reading… {progress}%</p>
                    </div>
                  )}

                  {error && <p className="text-sm text-red-600">{error}</p>}

                  {result.length > 0 && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                      <p className="text-sm font-semibold text-emerald-800 mb-2">Detected {result.length} code(s):</p>
                      <ul className="space-y-1 max-h-32 overflow-y-auto">
                        {result.map((c, i) => (
                          <li key={i} className="font-mono text-sm text-gray-800 bg-white rounded px-2 py-1">{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={scan}
                      disabled={processing}
                      className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
                    >
                      {processing ? 'Scanning…' : result.length > 0 ? '🔁 Rescan' : '🔍 Scan Number'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setImageSrc(null); setResult([]); setError(''); setProgress(0); }}
                      className="w-full bg-gray-300 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-400 transition"
                    >
                      Retake
                    </button>
                  </div>

                  {result.length > 0 && (
                    <button
                      type="button"
                      onClick={addResults}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition"
                    >
                      ➕ Add {result.length} Code(s) to List
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
