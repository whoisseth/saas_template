"use client";

import React, { useRef, useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { Sparkles, Trophy, X, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface ScratchCardModalProps {
  cardId: string;
  title?: string;
  expectedAmount?: number;
  onClaimed?: (amount: number) => void;
  onClose?: () => void;
}

export function ScratchCardModal({
  cardId,
  title = "Shopping Reward",
  expectedAmount = 14,
  onClaimed,
  onClose,
}: ScratchCardModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [revealedAmount, setRevealedAmount] = useState<number | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Draw silver gradient overlay
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#cbd5e1");
    gradient.addColorStop(0.5, "#94a3b8");
    gradient.addColorStop(1, "#64748b");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Decorative scratch pattern text
    ctx.font = "bold 16px sans-serif";
    ctx.fillStyle = "#475569";
    ctx.textAlign = "center";
    ctx.fillText("✨ Scratch with finger or mouse ✨", width / 2, height / 2);

    let isDrawing = false;
    let scratchedPixels = 0;

    function scratch(e: MouseEvent | TouchEvent) {
      if (!isDrawing || !ctx || !canvas) return;
      const rect = canvas.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      const x = clientX - rect.left;
      const y = clientY - rect.top;

      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(x, y, 22, 0, Math.PI * 2);
      ctx.fill();

      scratchedPixels++;
      if (scratchedPixels > 25 && !isRevealed) {
        handleReveal();
      }
    }

    function handleReveal() {
      setIsRevealed(true);
      // Trigger Confetti!
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#10b981", "#3b82f6", "#f59e0b", "#ec4899"],
        });
      } catch {
        // Fallback
      }

      // Claim reward on server
      claimReward();
    }

    async function claimReward() {
      setIsClaiming(true);
      try {
        const res = await fetch("/api/scratch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scratchCardId: cardId }),
        });
        const data = (await res.json()) as { success?: boolean; amount: number; message: string };
        if (data.success) {
          setRevealedAmount(data.amount);
          toast.success(data.message);
          if (onClaimed) onClaimed(data.amount);
        } else {
          // If already claimed or demo, fallback to expected amount
          setRevealedAmount(expectedAmount);
        }
      } catch {
        setRevealedAmount(expectedAmount);
      } finally {
        setIsClaiming(false);
      }
    }

    const start = () => (isDrawing = true);
    const end = () => (isDrawing = false);

    canvas.addEventListener("mousedown", start);
    window.addEventListener("mouseup", end);
    canvas.addEventListener("mousemove", scratch);

    canvas.addEventListener("touchstart", start);
    window.addEventListener("touchend", end);
    canvas.addEventListener("touchmove", scratch);

    return () => {
      canvas.removeEventListener("mousedown", start);
      window.removeEventListener("mouseup", end);
      canvas.removeEventListener("mousemove", scratch);

      canvas.removeEventListener("touchstart", start);
      window.removeEventListener("touchend", end);
      canvas.removeEventListener("touchmove", scratch);
    };
  }, [cardId, expectedAmount, isRevealed, onClaimed]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl bg-card border border-border p-6 shadow-2xl text-center">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        <div className="flex justify-center mb-3">
          <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Trophy className="h-6 w-6" />
          </div>
        </div>

        <h3 className="text-xl font-bold tracking-tight">{title}</h3>
        <p className="text-xs text-muted-foreground mt-1 mb-5">
          Scratch below to reveal your guaranteed instant cash reward!
        </p>

        {/* Scratch Card Canvas Container */}
        <div className="relative mx-auto h-48 w-64 rounded-2xl overflow-hidden border-2 border-dashed border-emerald-500/50 bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-950/40 dark:to-teal-900/30 flex flex-col items-center justify-center p-4 shadow-inner">
          {/* Reward Hidden Underneath */}
          <div className="flex flex-col items-center justify-center">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
              You Have Won
            </span>
            <span className="text-4xl font-extrabold text-foreground mt-1">
              ₹{revealedAmount ?? expectedAmount}
            </span>
            <span className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1 font-medium">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              Credited to Confirmed Wallet
            </span>
          </div>

          {/* Canvas Scratch Layer */}
          <canvas
            ref={canvasRef}
            width={256}
            height={192}
            className={`absolute inset-0 cursor-pointer touch-none transition-opacity duration-500 ${
              isRevealed ? "pointer-events-none opacity-0" : "opacity-100"
            }`}
          />
        </div>

        {isRevealed && (
          <div className="mt-5 space-y-2 animate-in slide-in-from-bottom-2 duration-300">
            <button
              onClick={onClose}
              className="w-full py-3 px-4 rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
            >
              Collect & View Wallet
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
