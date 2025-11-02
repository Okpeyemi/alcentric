"use client"

import { useState, useRef, useEffect } from "react";

interface ResizablePanelsProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  defaultLeftWidth?: number; // en pourcentage
  minLeftWidth?: number; // en pourcentage
  maxLeftWidth?: number; // en pourcentage
}

export function ResizablePanels({
  leftPanel,
  rightPanel,
  defaultLeftWidth = 30,
  minLeftWidth = 20,
  maxLeftWidth = 80,
}: ResizablePanelsProps) {
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

      // Limiter la largeur entre min et max
      const clampedWidth = Math.min(Math.max(newLeftWidth, minLeftWidth), maxLeftWidth);
      setLeftWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging, minLeftWidth, maxLeftWidth]);

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  return (
    <div ref={containerRef} className="flex flex-1">
      {/* Panneau gauche */}
      <div style={{ width: `${leftWidth}%` }} className="flex flex-col overflow-hidden">
        {leftPanel}
      </div>

      {/* Séparateur redimensionnable */}
      <div
        className="group relative flex w-1 cursor-col-resize items-center justify-center bg-zinc-200 transition-colors hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700"
        onMouseDown={handleMouseDown}
      >
        {/* Indicateur visuel au hover */}
        <div className="absolute h-12 w-1 rounded-full bg-zinc-400 opacity-0 transition-opacity group-hover:opacity-100 dark:bg-zinc-600" />
      </div>

      {/* Panneau droit */}
      <div style={{ width: `${100 - leftWidth}%` }} className="flex flex-col overflow-hidden">
        {rightPanel}
      </div>
    </div>
  );
}
