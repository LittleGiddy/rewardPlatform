'use client';
import { useState, useEffect } from 'react';

interface Props {
  targetDate?: number;
  onComplete?: () => void;
}

export default function CountdownTimer({ targetDate, onComplete }: Props) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Initialize timeLeft after mount
  useEffect(() => {
    if (!targetDate || isNaN(targetDate)) {
      setTimeLeft(0);
      return;
    }
    setTimeLeft(Math.max(0, targetDate - Date.now()));
  }, [targetDate]);

  // Update every second
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

  // Show placeholder while not ready
  if (timeLeft === null || isNaN(timeLeft)) {
    return <span className="font-mono">--:--:--</span>;
  }

  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  return (
    <span className="font-mono">
      {hours.toString().padStart(2, '0')}:
      {minutes.toString().padStart(2, '0')}:
      {seconds.toString().padStart(2, '0')}
    </span>
  );
}