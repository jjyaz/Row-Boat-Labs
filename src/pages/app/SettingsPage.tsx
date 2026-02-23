import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CheckCircle, XCircle, ExternalLink, AlertTriangle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SettingsPage = () => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [googleStatus, setGoogleStatus] = useState<string>("disconnected");
  const [googleLastSync, setGoogleLastSync] = useState<string | null>(null);
  const [googleScopes, setGoogleScopes] = useState<string[]>([]);
  const [openaiKey, setOpenaiKey] = useState("");
  const [openaiSaved, setOpenaiSaved] = useState(false);
  const [connecting, setConnecting] = useState(false);

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
        setGoogleStatus(data.status);
        setGoogleLastSync(data.last_sync_at);
        setGoogleScopes(data.scopes || []);
      }
    };
    fetchIntegrations();
  }, [user]);

  const handleConnectGoogle = async () => {
    if (!session?.access_token) {
      toast({ title: "Please sign in first", variant: "destructive" });
      return;
    }

    setConnecting(true);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/google-auth-url`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            redirect_uri: `${window.location.origin}/auth/callback`,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || data.error) {
        toast({
          title: "Failed to start Google OAuth",
          description: data.error || "Unknown error",
          variant: "destructive",
        });
        return;
      }

      // Redirect to Google consent screen
      window.location.href = data.url;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    if (!user) return;
    await supabase
      .from("integrations")
      .update({ status: "disconnected", access_token: null, refresh_token: null })
      .eq("user_id", user.id)
      .eq("provider", "google");
    setGoogleStatus("disconnected");
    setGoogleScopes([]);
    setGoogleLastSync(null);
    toast({ title: "Google disconnected" });
  };

  const handleSaveOpenAI = async () => {
    if (!openaiKey.trim() || !user) return;
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

  const scopeLabels: Record<string, string> = {
    "https://www.googleapis.com/auth/gmail.readonly": "Gmail (read)",
    "https://www.googleapis.com/auth/calendar.readonly": "Calendar (read)",
    "https://www.googleapis.com/auth/drive.metadata.readonly": "Drive metadata",
    "https://www.googleapis.com/auth/drive.readonly": "Drive (read)",
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
                <div className="space-y-2">
                  <p>
                    Connected. Last sync:{" "}
                    {googleLastSync
                      ? new Date(googleLastSync).toLocaleString()
                      : "Never"}
                  </p>
                  {googleScopes.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {googleScopes.map((s) => (
                        <span key={s} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                          {scopeLabels[s] || s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p>Not connected. Gmail, Calendar & Drive access requires Google OAuth.</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleConnectGoogle}
                variant={googleStatus === "connected" ? "outline" : "default"}
                size="sm"
                disabled={connecting}
              >
                {connecting && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                {googleStatus === "connected" ? "Reconnect" : "Connect Google"}
              </Button>
              {googleStatus === "connected" && (
                <Button onClick={handleDisconnectGoogle} variant="ghost" size="sm" className="text-destructive">
                  Disconnect
                </Button>
              )}
            </div>

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
                <li>Add them as GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET secrets in your Lovable project settings</li>
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
