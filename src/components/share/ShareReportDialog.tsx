import { useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Share2, Copy, Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  /** Optional trigger button label. */
  label?: string;
}

export function ShareReportDialog({ label = "Share with care team" }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("Clinical summary");
  const [daysBack, setDaysBack] = useState(90);
  const [expiresInDays, setExpiresInDays] = useState(30);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-share-link", {
        body: { title, daysBack, expiresInDays },
      });
      if (error) throw error;
      const token = (data as any)?.token as string | undefined;
      if (!token) throw new Error("No token returned");
      const url = `${window.location.origin}/share/${token}`;
      setShareUrl(url);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not create share link");
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setShareUrl(null); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="w-4 h-4 mr-2" />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create shareable report link</DialogTitle>
          <DialogDescription>
            Generates a read-only link that expires automatically. No login required to view.
          </DialogDescription>
        </DialogHeader>
        {!shareUrl ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Report title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="days">Days of history</Label>
                <Input id="days" type="number" min={1} max={365}
                  value={daysBack} onChange={(e) => setDaysBack(Number(e.target.value))} />
              </div>
              <div>
                <Label htmlFor="exp">Expires in (days)</Label>
                <Input id="exp" type="number" min={1} max={180}
                  value={expiresInDays} onChange={(e) => setExpiresInDays(Number(e.target.value))} />
              </div>
            </div>
            <Button className="w-full" onClick={generate} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Generate secure link
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <Label>Shareable link</Label>
            <div className="flex gap-2">
              <Input readOnly value={shareUrl} />
              <Button variant="outline" size="icon" onClick={copy}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Anyone with this link can view the report until it expires. Revoke from your account if
              needed.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
