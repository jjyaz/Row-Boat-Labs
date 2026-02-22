import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Inbox, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

interface Source {
  id: string;
  source_type: string;
  external_id: string;
  title: string | null;
  summary: string | null;
  ingested_at: string;
}

const InboxPage = () => {
  const { user } = useAuth();
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchSources = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("sources")
      .select("*")
      .eq("user_id", user.id)
      .eq("source_type", "email")
      .order("ingested_at", { ascending: false })
      .limit(50);
    if (data) setSources(data as Source[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchSources();
  }, [user]);

  const handleSync = async () => {
    setSyncing(true);
    // Check if Google integration is connected
    if (!user) return;
    const { data: integration } = await supabase
      .from("integrations")
      .select("*")
      .eq("user_id", user.id)
      .eq("provider", "google")
      .maybeSingle();

    if (!integration || integration.status !== "connected") {
      alert("Please connect Google in Settings first.");
      setSyncing(false);
      return;
    }

    // TODO: Call sync edge function
    alert("Sync triggered. This will be wired to the ingestion pipeline.");
    setSyncing(false);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Inbox</h1>
          <p className="text-sm text-muted-foreground">Emails ingested from Gmail</p>
        </div>
        <Button onClick={handleSync} disabled={syncing} size="sm" variant="outline">
          <RefreshCw className={`w-4 h-4 mr-1 ${syncing ? "animate-spin" : ""}`} />
          Sync Now
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-muted-foreground text-sm">Loading...</div>
      ) : sources.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Inbox className="w-12 h-12 mx-auto opacity-40 mb-3" />
          <p className="text-sm">No emails ingested yet. Connect Google and click Sync Now.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sources.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="p-4 border-border/50 hover:shadow-paper transition-shadow">
                <h3 className="font-medium text-sm text-foreground">{s.title || s.external_id}</h3>
                {s.summary && <p className="text-xs text-muted-foreground mt-1">{s.summary}</p>}
                <p className="text-xs text-muted-foreground mt-2">
                  Ingested {new Date(s.ingested_at).toLocaleDateString()}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InboxPage;
