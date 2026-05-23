import { BookOpen, Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { getEvidence } from "@/domain/constants/evidence";

interface EvidenceTooltipProps {
  factorId: string;
  children: React.ReactNode;
}

export function EvidenceTooltip({ factorId, children }: EvidenceTooltipProps) {
  const evidence = getEvidence(factorId);

  if (!evidence) return <>{children}</>;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
          aria-label={`Evidence for ${factorId}`}
        >
          {children}
          <Info className="w-3 h-3 opacity-60" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 velar-card border-primary/30" side="top">
        <div className="space-y-3">
          <p className="text-sm text-foreground leading-relaxed">{evidence.summary}</p>
          {evidence.sources.length > 0 && (
            <div className="border-t border-border/50 pt-3 space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <BookOpen className="w-3 h-3" />
                Evidence
              </div>
              {evidence.sources.map((src, idx) => (
                <div key={idx} className="text-xs text-muted-foreground">
                  <div className="font-medium text-foreground/90">{src.title}</div>
                  {src.url ? (
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {src.citation}
                    </a>
                  ) : (
                    <span>{src.citation}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
