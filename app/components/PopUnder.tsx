'use client';
import { useRef } from 'react';

export default function PopUnder() {
  const hasTriggered = useRef(false);

  const triggerPopUnder = () => {
    if (process.env.NODE_ENV !== 'production') return;
    if (hasTriggered.current) return;
    
    hasTriggered.current = true;
    
    // Create a hidden anchor element
    const link = document.createElement('a');
    link.href = 'https://pl29158117.profitablecpmratenetwork.com/00/13/1c/00131cbdab924a2216b4d323b9872f62.js';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    
    // Trigger click
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Try to move it behind
    setTimeout(() => {
      window.focus();
    }, 100);
  };

  return { triggerPopUnder };
}