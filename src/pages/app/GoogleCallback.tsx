import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

const GoogleCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      setStatus("error");
      setErrorMsg(searchParams.get("error_description") || error);
      return;
    }

    if (!code || !state) {
      setStatus("error");
      setErrorMsg("Missing authorization code or state");
      return;
    }

    const exchangeCode = async () => {
      try {
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/google-auth-callback`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              code,
              state,
              redirect_uri: `${window.location.origin}/auth/callback`,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok || data.error) {
          setStatus("error");
          setErrorMsg(data.details || data.error || "Token exchange failed");
          return;
        }

        setStatus("success");
        setTimeout(() => navigate("/app/settings"), 2000);
      } catch (err: any) {
        setStatus("error");
        setErrorMsg(err.message || "Unknown error");
      }
    };

    exchangeCode();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 p-8">
        {status === "loading" && (
          <>
            <Loader2 className="w-10 h-10 mx-auto animate-spin text-primary" />
            <p className="text-muted-foreground">Connecting your Google account...</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle className="w-10 h-10 mx-auto text-primary" />
            <p className="text-foreground font-medium">Google connected successfully!</p>
            <p className="text-sm text-muted-foreground">Redirecting to settings...</p>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="w-10 h-10 mx-auto text-destructive" />
            <p className="text-foreground font-medium">Connection failed</p>
            <p className="text-sm text-muted-foreground">{errorMsg}</p>
            <button
              onClick={() => navigate("/app/settings")}
              className="text-sm text-primary hover:underline mt-2"
            >
              Back to Settings
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default GoogleCallback;
