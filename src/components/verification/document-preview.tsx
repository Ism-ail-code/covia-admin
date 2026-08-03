import { useEffect, useState } from "react";
import { FileText, ImageOff, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  createVerificationSignedUrl,
  isPdfPath,
  isVerificationDocumentPath,
} from "@/lib/verificationDocs";

/**
 * Secure preview for one private verification document.
 *
 * - Signs the object path via the storage API (5-minute URLs).
 * - Renders images inline and PDFs in an embedded viewer.
 * - Regenerates the signed link just before it expires.
 * - Shows explicit loading / error / missing-file states.
 */
export function DocumentPreview({
  path,
  label,
  aspect = "aspect-video",
}: {
  path: string | null | undefined;
  label: string;
  aspect?: string;
}) {
  const [state, setState] = useState<{
    status: "loading" | "ready" | "error" | "missing";
    url: string | null;
    error?: string;
  }>({ status: "missing", url: null });
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!isVerificationDocumentPath(path)) {
      setState({ status: "missing", url: null });
      return;
    }

    let cancelled = false;
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;

    const sign = async () => {
      setState({ status: "loading", url: null });
      try {
        const { signedUrl, expiresAt } = await createVerificationSignedUrl(path);
        if (cancelled) return;
        setState({ status: "ready", url: signedUrl });

        // Regenerate shortly before the link expires (keep 30s of slack).
        const delay = Math.max(5_000, expiresAt - Date.now() - 30_000);
        refreshTimer = setTimeout(() => void sign(), delay);
      } catch (err) {
        if (cancelled) return;
        setState({
          status: "error",
          url: null,
          error: err instanceof Error ? err.message : "Couldn't load the document.",
        });
      }
    };

    void sign();

    return () => {
      cancelled = true;
      if (refreshTimer) clearTimeout(refreshTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, retryKey]);

  const retry = () => setRetryKey((k) => k + 1);

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className={`relative overflow-hidden rounded-lg border bg-muted/40 ${aspect}`}>
        {state.status === "loading" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <Skeleton className="h-full w-full" />
            <div className="absolute flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Opening document…
            </div>
          </div>
        )}

        {state.status === "ready" && state.url && (
          <>
            {isPdfPath(path) ? (
              <iframe
                src={`${state.url}#toolbar=0&view=FitH`}
                title={label}
                className="h-full w-full border-0 bg-white"
              />
            ) : (
              <img src={state.url} alt={label} className="h-full w-full object-contain" />
            )}
            <span className="pointer-events-none absolute bottom-2 right-2 rounded-full bg-background/90 px-2 py-0.5 text-[10px] text-muted-foreground">
              link refreshes automatically
            </span>
          </>
        )}

        {state.status === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
            <FileText className="size-6 text-muted-foreground/60" />
            <p className="text-xs text-muted-foreground">{state.error ?? "Couldn't load the document."}</p>
            <Button variant="outline" size="sm" onClick={retry}>
              <RefreshCw className="size-3.5" />
              Retry
            </Button>
          </div>
        )}

        {state.status === "missing" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
            <ImageOff className="size-6 text-muted-foreground/60" />
            <p className="text-xs text-muted-foreground">No {label.toLowerCase()} submitted.</p>
          </div>
        )}
      </div>
    </div>
  );
}