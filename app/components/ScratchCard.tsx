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

    // Draw gray cover
    ctx.fillStyle = '#888';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#666';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('Scratch here', 50, 100);
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
        className="border rounded cursor-pointer"
        onMouseDown={() => (isDrawing.current = true)}
        onMouseUp={() => (isDrawing.current = false)}
        onMouseLeave={() => (isDrawing.current = false)}
        onMouseMove={handleMouseMove}
        onClick={handleReveal}
      />
      {revealed && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 text-2xl font-bold">
          KSH {amount}
        </div>
      )}
    </div>
  );
}