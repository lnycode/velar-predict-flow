import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Lock, Database, Mail, Download, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { APP_NAME } from "@/domain/constants";

const Section = ({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-2">
    <h3 className="flex items-center gap-2 font-semibold text-foreground">
      <Icon className="w-4 h-4 text-primary" aria-hidden="true" />
      {title}
    </h3>
    <div className="text-sm text-muted-foreground leading-relaxed">{children}</div>
  </div>
);

export default function PrivacyPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleExport = async () => {
    if (!user) return;
    try {
      const [{ data: entries }, { data: profile }] = await Promise.all([
        supabase.from("migraine_entries").select("*").eq("user_id", user.id),
        supabase.from("profiles").select("*").eq("user_id", user.id).single(),
      ]);
      const blob = new Blob([JSON.stringify({ profile, entries }, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `velar-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Export ready", description: "Your data has been downloaded." });
    } catch (e: any) {
      toast({ title: "Export failed", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Shield className="w-8 h-8 text-primary" aria-hidden="true" />
          Privacy &amp; Data Protection
        </h1>
        <p className="text-muted-foreground">
          {APP_NAME} is built on the principle that your health data belongs to you.
        </p>
      </header>

      <Card className="velar-card">
        <CardHeader>
          <CardTitle>Our Commitments</CardTitle>
          <CardDescription>What we promise about your information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Section icon={Lock} title="We never sell your data">
            Your migraine logs, location, and personal triggers are never sold, rented, or shared
            with advertisers or data brokers.
          </Section>

          <Section icon={Database} title="GDPR &amp; data residency">
            We comply with the EU General Data Protection Regulation. Data is stored on EU-region
            infrastructure with encryption at rest (AES-256) and in transit (TLS 1.3). You may
            request access, correction, portability, or deletion at any time.
          </Section>

          <Section icon={Shield} title="Row-level security">
            Every database table enforces row-level security policies, meaning the platform itself
            cannot return another user's records to your session.
          </Section>

          <Section icon={Mail} title="Third-party services">
            Weather data (OpenWeatherMap), voice transcription (OpenAI Whisper) and text-to-speech
            (ElevenLabs) are called via secured server-side proxies — these providers never see your
            account identifier. Payments are processed by Stripe.
          </Section>
        </CardContent>
      </Card>

      <Card className="velar-card">
        <CardHeader>
          <CardTitle>Your Rights</CardTitle>
          <CardDescription>Exercise your data rights below.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" onClick={handleExport} disabled={!user} className="gap-2">
            <Download className="w-4 h-4" />
            Export my data (JSON)
          </Button>
          <Button
            variant="outline"
            disabled={!user}
            className="gap-2"
            onClick={() =>
              toast({
                title: "Deletion request",
                description: "Email privacy@velar.app to request full account deletion.",
              })
            }
          >
            <Trash2 className="w-4 h-4" />
            Request account deletion
          </Button>
          <p className="text-xs text-muted-foreground pt-2">
            For privacy inquiries, contact{" "}
            <a href="mailto:privacy@velar.app" className="text-primary hover:underline">
              privacy@velar.app
            </a>
            . Last updated: {new Date().toLocaleDateString()}.
          </p>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        {APP_NAME} is a decision-support tool and is not a substitute for professional medical
        advice, diagnosis, or treatment.
      </p>
    </div>
  );
}
