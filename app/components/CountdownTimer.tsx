'use client';
import { useState, useEffect } from 'react';

interface Props {
  targetDate?: number;
  onComplete?: () => void;
  className?: string; // 👈 add this
}

export default function CountdownTimer({ targetDate, onComplete, className }: Props) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!targetDate || isNaN(targetDate)) {
      setTimeLeft(0);
      return;
    }
    setTimeLeft(Math.max(0, targetDate - Date.now()));
  }, [targetDate]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;

    const interval = setInterval(() => {
      if (!targetDate) return;
      const diff = targetDate - Date.now();
      if (diff <= 0) {
        setTimeLeft(0);
        clearInterval(interval);
        onComplete?.();
      } else {
        setTimeLeft(diff);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate, timeLeft, onComplete]);

  if (timeLeft === null || isNaN(timeLeft)) {
    return <span className={`font-mono ${className}`}>--:--:--</span>;
  }

  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  return (
    <span className={`font-mono ${className}`}>
      {hours.toString().padStart(2, '0')}:
      {minutes.toString().padStart(2, '0')}:
      {seconds.toString().padStart(2, '0')}
    </span>
  );
}