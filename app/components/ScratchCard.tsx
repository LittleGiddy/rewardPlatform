'use client';
import { useRef, useEffect, useState } from 'react';

interface ScratchCardProps {
  amount: number;
  onReveal: () => void;
}

export default function ScratchCard({ amount, onReveal }: ScratchCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [revealed, setRevealed] = useState(false);
  const isDrawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw scratch card cover
    ctx.fillStyle = '#C0C0C0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add scratch pattern
    ctx.fillStyle = '#A0A0A0';
    for (let i = 0; i < 200; i++) {
      ctx.fillRect(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        3,
        3
      );
    }
    
    // Add text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('BONYEZA HAPA', 90, 75);
    ctx.font = '12px sans-serif';
    ctx.fillText('kufungua zawadi yako', 80, 100);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing.current || revealed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  };

  const handleReveal = () => {
    if (revealed) return;
    setRevealed(true);
    onReveal();
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={300}
        height={150}
        className="border-4 border-yellow-500 rounded-lg cursor-pointer shadow-lg"
        onMouseDown={() => (isDrawing.current = true)}
        onMouseUp={() => (isDrawing.current = false)}
        onMouseLeave={() => (isDrawing.current = false)}
        onMouseMove={handleMouseMove}
        onClick={handleReveal}
      />
      {revealed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg shadow-inner">
          <div className="text-center">
            <p className="text-white text-sm mb-1">🎉 POTENTIAL PRIZE 🎉</p>
            <p className="text-3xl font-bold text-white">TSH {amount}</p>
            <p className="text-yellow-100 text-xs mt-2">Share to unlock your chance to win!</p>
          </div>
        </div>
      )}
    </div>
  );
}