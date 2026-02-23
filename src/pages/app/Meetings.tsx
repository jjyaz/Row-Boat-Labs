import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface Source {
  id: string;
  title: string | null;
  summary: string | null;
  raw_data: any;
  ingested_at: string;
}

const Meetings = () => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchEvents = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("sources")
      .select("*")
      .eq("user_id", user.id)
      .eq("source_type", "calendar_event")
      .order("ingested_at", { ascending: false })
      .limit(50);
    if (data) setEvents(data as Source[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, [user]);

  const handleSync = async () => {
    if (!user || !session?.access_token) return;
    setSyncing(true);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/google-sync`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ types: ["calendar_event"] }),
        }
      );
      const data = await res.json();
      if (!res.ok || data.error) {
        toast({ title: "Sync failed", description: data.error, variant: "destructive" });
      } else {
        toast({ title: "Sync complete", description: `${data.items_processed} events ingested` });
        fetchEvents();
      }
    } catch (err: any) {
      toast({ title: "Sync error", description: err.message, variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Meetings</h1>
          <p className="text-sm text-muted-foreground">Calendar events from your connected integrations</p>
        </div>
        <Button onClick={handleSync} disabled={syncing} size="sm" variant="outline">
          <RefreshCw className={`w-4 h-4 mr-1 ${syncing ? "animate-spin" : ""}`} />
          Sync Now
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-muted-foreground text-sm">Loading...</div>
      ) : events.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Calendar className="w-12 h-12 mx-auto opacity-40 mb-3" />
          <p className="text-sm">No meetings ingested yet. Connect Google Calendar and click Sync Now.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((e, i) => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="p-4 border-border/50 hover:shadow-paper transition-shadow">
                <h3 className="font-medium text-sm text-foreground">{e.title || "Untitled event"}</h3>
                {e.summary && <p className="text-xs text-muted-foreground mt-1">{e.summary}</p>}
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(e.ingested_at).toLocaleDateString()}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Meetings;
