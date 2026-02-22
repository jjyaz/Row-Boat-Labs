import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CheckCircle, XCircle, ExternalLink, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SettingsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [googleStatus, setGoogleStatus] = useState<string>("disconnected");
  const [googleLastSync, setGoogleLastSync] = useState<string | null>(null);
  const [openaiKey, setOpenaiKey] = useState("");
  const [openaiSaved, setOpenaiSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchIntegrations = async () => {
      const { data } = await supabase
        .from("integrations")
        .select("*")
        .eq("user_id", user.id)
        .eq("provider", "google")
        .maybeSingle();
      if (data) {
        setGoogleStatus((data as any).status);
        setGoogleLastSync((data as any).last_sync_at);
      }
    };
    fetchIntegrations();
  }, [user]);

  const handleConnectGoogle = () => {
    toast({
      title: "Google OAuth Setup Required",
      description:
        "You need to configure a Google OAuth Client ID first. See the setup guide below.",
    });
  };

  const handleSaveOpenAI = async () => {
    if (!openaiKey.trim()) return;
    // Store in integrations as a provider entry
    if (!user) return;
    await supabase.from("integrations").upsert(
      {
        user_id: user.id,
        provider: "openai",
        status: "connected",
        access_token: openaiKey,
      },
      { onConflict: "user_id,provider" }
    );
    setOpenaiSaved(true);
    toast({ title: "OpenAI key saved" });
  };

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage integrations and AI providers</p>
      </div>

      <div className="space-y-6">
        {/* Google Integration */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              Google Integration
              {googleStatus === "connected" ? (
                <CheckCircle className="w-4 h-4 text-primary" />
              ) : (
                <XCircle className="w-4 h-4 text-muted-foreground" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              {googleStatus === "connected" ? (
                <p>
                  Connected. Last sync:{" "}
                  {googleLastSync
                    ? new Date(googleLastSync).toLocaleString()
                    : "Never"}
                </p>
              ) : (
                <p>Not connected. Gmail, Calendar & Drive access requires Google OAuth.</p>
              )}
            </div>
            <Button onClick={handleConnectGoogle} variant={googleStatus === "connected" ? "outline" : "default"} size="sm">
              {googleStatus === "connected" ? "Reconnect" : "Connect Google"}
            </Button>

            {/* Setup Guide */}
            <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border text-sm space-y-2">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <AlertTriangle className="w-4 h-4 text-primary" />
                Google OAuth Setup Guide
              </div>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-xs">
                <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="underline text-primary">Google Cloud Console</a></li>
                <li>Create a project or select an existing one</li>
                <li>Enable Gmail API, Calendar API, and Drive API</li>
                <li>Go to Credentials → Create OAuth 2.0 Client ID (Web application)</li>
                <li>Add authorized redirect URI: <code className="bg-muted px-1 rounded text-foreground">{window.location.origin}/auth/callback</code></li>
                <li>Copy Client ID and Client Secret</li>
                <li>Add them as secrets in the app settings (coming soon via edge function)</li>
              </ol>
              <a
                href="https://github.com/rowboatlabs/rowboat"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
              >
                <ExternalLink className="w-3 h-3" /> Rowboat docs
              </a>
            </div>
          </CardContent>
        </Card>

        {/* OpenAI Key */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              AI Model Provider
              {openaiSaved && <CheckCircle className="w-4 h-4 text-primary" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              An OpenAI API key is required for the AI coworker to function.
            </p>
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="sk-..."
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
              />
              <Button onClick={handleSaveOpenAI} size="sm">
                Save
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
