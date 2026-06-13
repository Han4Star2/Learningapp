import { ImageStudio } from "@/components/studio/image-studio";

export const maxDuration = 60;

export default function CreatePage() {
  return (
    <div className="flex h-full flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Bilder erstellen</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Generiere Bilder mit GPT Image 2 — mit oder ohne Referenzbild.
        </p>
      </div>
      <ImageStudio />
    </div>
  );
}
