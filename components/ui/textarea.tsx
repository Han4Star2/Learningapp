import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-20 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm shadow-sm",
      "transition-colors duration-150 placeholder:text-muted-foreground/60 leading-relaxed",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:border-ring/50",
      "disabled:cursor-not-allowed disabled:opacity-50 resize-y",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export { Textarea };
