"use client";

import { useState, useTransition, useRef, useCallback } from "react";
import {
  Wand2, Loader2, Download, X, ImagePlus,
  AlertTriangle, RefreshCw, Expand,
} from "lucide-react";
import { generateStudioImage, type StudioResult } from "@/actions/generate-image-studio";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Size = "1024x1024" | "1536x1024" | "1024x1536";

const SIZES: { value: Size; label: string }[] = [
  { value: "1024x1024", label: "Quadrat (1:1)" },
  { value: "1536x1024", label: "Querformat (3:2)" },
  { value: "1024x1536", label: "Hochformat (2:3)" },
];

// ── Client-side image compression ─────────────────────────────────────────────

async function compressToBase64(file: File, maxPx = 768): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (ev) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(maxPx / img.width, maxPx / img.height, 1);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        // strip the "data:image/jpeg;base64," prefix
        resolve(canvas.toDataURL("image/jpeg", 0.88).split(",")[1]);
      };
      img.src = ev.target!.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function downloadPng(base64: string, index: number) {
  const a = document.createElement("a");
  a.href = `data:image/png;base64,${base64}`;
  a.download = `generated-${index + 1}.png`;
  a.click();
}

// ── Main component ────────────────────────────────────────────────────────────

export function ImageStudio() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [prompt, setPrompt]             = useState("");
  const [size, setSize]                 = useState<Size>("1024x1024");
  const [refPreview, setRefPreview]     = useState<string | null>(null);  // data URL for preview
  const [refBase64, setRefBase64]       = useState<string | null>(null);  // compressed b64
  const [error, setError]               = useState<string | null>(null);
  const [history, setHistory]           = useState<StudioResult[]>([]);
  const [activeIdx, setActiveIdx]       = useState<number | null>(null);
  const [pending, startTransition]      = useTransition();

  const active = activeIdx !== null ? history[activeIdx] : null;

  // ── Ref image handling ────────────────────────────────────────────────────

  const onRefFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setRefPreview(URL.createObjectURL(file));
    const b64 = await compressToBase64(file);
    setRefBase64(b64);
  }, []);

  function clearRef() {
    if (refPreview) URL.revokeObjectURL(refPreview);
    setRefPreview(null);
    setRefBase64(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // ── Generate ──────────────────────────────────────────────────────────────

  function generate() {
    if (!prompt.trim()) return;
    setError(null);
    startTransition(async () => {
      const res = await generateStudioImage({
        prompt: prompt.trim(),
        referenceBase64: refBase64 ?? undefined,
        size: refBase64 ? "1024x1024" : size, // edit endpoint forces square
      });
      if ("error" in res) {
        setError(res.error);
      } else {
        setHistory((prev) => {
          const next = [res, ...prev].slice(0, 12); // keep last 12
          setActiveIdx(0);
          return next;
        });
      }
    });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      generate();
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full flex-col gap-6 lg:flex-row">

      {/* ── Left panel: controls ─────────────────────────────────────────── */}
      <div className="flex w-full flex-col gap-4 lg:w-80 lg:shrink-0">

        {/* Prompt */}
        <div className="space-y-1.5">
          <Label htmlFor="studio-prompt">Prompt</Label>
          <textarea
            ref={textareaRef}
            id="studio-prompt"
            rows={6}
            placeholder="Describe what you want to create…"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={pending}
            className={cn(
              "w-full resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-sm shadow-sm",
              "placeholder:text-muted-foreground/50",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "transition-all duration-200"
            )}
          />
          <p className="text-[11px] text-muted-foreground/60">
            Ctrl+Enter to generate
          </p>
        </div>

        {/* Reference image */}
        <div className="space-y-1.5">
          <Label>Reference image <span className="font-normal text-muted-foreground">(optional)</span></Label>

          {refPreview ? (
            <div className="relative overflow-hidden rounded-xl border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={refPreview} alt="Reference" className="h-40 w-full object-cover" />
              <div className="absolute inset-0 flex items-end justify-between bg-gradient-to-t from-black/50 to-transparent p-2">
                <span className="text-[11px] text-white/70">Referenzbild</span>
                <button
                  type="button"
                  onClick={clearRef}
                  className="flex size-6 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-red-500 transition-colors"
                >
                  <X className="size-3.5" />
                </button>
              </div>
              {refBase64 && (
                <div className="absolute right-2 top-2 rounded-full bg-black/40 px-2 py-0.5 text-[10px] text-white/80 backdrop-blur-sm">
                  Nur 1:1 möglich
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDrop={(e) => { e.preventDefault(); onRefFile(e.dataTransfer.files[0]); }}
              onDragOver={(e) => e.preventDefault()}
              disabled={pending}
              className={cn(
                "flex h-28 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed",
                "text-muted-foreground transition-all duration-200",
                "hover:border-primary/50 hover:bg-primary/5 hover:text-primary",
                "disabled:pointer-events-none disabled:opacity-50"
              )}
            >
              <ImagePlus className="size-5" />
              <span className="text-xs">Bild hierher ziehen oder klicken</span>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && onRefFile(e.target.files[0])}
          />
        </div>

        {/* Size selector (only when no reference) */}
        {!refBase64 && (
          <div className="space-y-1.5">
            <Label htmlFor="studio-size">Format</Label>
            <Select
              id="studio-size"
              value={size}
              onChange={(e) => setSize(e.target.value as Size)}
              disabled={pending}
            >
              {SIZES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </Select>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Generate button */}
        <Button
          onClick={generate}
          disabled={pending || !prompt.trim()}
          size="lg"
          className="w-full"
        >
          {pending ? (
            <>
              <Loader2 className="animate-spin" />
              Generiere…
            </>
          ) : (
            <>
              <Wand2 />
              Generieren
            </>
          )}
        </Button>

        {pending && (
          <p className="animate-pulse text-center text-xs text-muted-foreground">
            Dieses dauert 10–30 Sekunden…
          </p>
        )}
      </div>

      {/* ── Right panel: result + history ────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-4">

        {/* Main result */}
        <div className={cn(
          "relative flex flex-1 min-h-64 items-center justify-center overflow-hidden rounded-2xl border bg-muted/30",
          active && "border-border bg-transparent"
        )}>
          {pending && (
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 className="size-8 animate-spin" />
              <p className="text-sm">Bild wird generiert…</p>
            </div>
          )}

          {!pending && !active && (
            <div className="flex flex-col items-center gap-3 text-muted-foreground/50 select-none">
              <Wand2 className="size-10" />
              <p className="text-sm">Dein Bild erscheint hier</p>
            </div>
          )}

          {!pending && active && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`data:image/png;base64,${active.imageBase64}`}
                alt={active.prompt}
                className="h-full w-full rounded-2xl object-contain"
                style={{ animation: "scale-in 0.3s cubic-bezier(0.4,0,0.2,1) forwards" }}
              />

              {/* Action buttons */}
              <div className="absolute bottom-3 right-3 flex gap-2">
                <button
                  type="button"
                  title="Erneut generieren"
                  onClick={() => { setPrompt(active.prompt); generate(); }}
                  className="flex size-9 items-center justify-center rounded-xl bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
                >
                  <RefreshCw className="size-4" />
                </button>
                <button
                  type="button"
                  title="Als PNG herunterladen"
                  onClick={() => downloadPng(active.imageBase64, activeIdx ?? 0)}
                  className="flex size-9 items-center justify-center rounded-xl bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-primary"
                >
                  <Download className="size-4" />
                </button>
              </div>

              {/* Prompt label */}
              <div className="absolute bottom-3 left-3 max-w-[60%] rounded-xl bg-black/40 px-2.5 py-1.5 backdrop-blur-sm">
                <p className="line-clamp-2 text-[11px] text-white/80">{active.prompt}</p>
              </div>
            </>
          )}
        </div>

        {/* History strip */}
        {history.length > 1 && (
          <div className="space-y-1.5">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground/50">
              Verlauf
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {history.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveIdx(i)}
                  className={cn(
                    "relative shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-150",
                    i === activeIdx
                      ? "border-primary shadow-md"
                      : "border-transparent opacity-60 hover:opacity-100"
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`data:image/png;base64,${item.imageBase64}`}
                    alt={item.prompt}
                    className="h-16 w-16 object-cover"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadPng(item.imageBase64, i);
                    }}
                    title="Download"
                    className="absolute bottom-0.5 right-0.5 flex size-5 items-center justify-center rounded-md bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:opacity-100"
                  >
                    <Download className="size-3" />
                  </button>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
