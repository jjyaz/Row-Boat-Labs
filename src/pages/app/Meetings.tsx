import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { motion } from "framer-motion";

interface Source {
  id: string;
  title: string | null;
  summary: string | null;
  raw_data: any;
  ingested_at: string;
}

const Meetings = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
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
    fetch();
  }, [user]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-foreground">Meetings</h1>
        <p className="text-sm text-muted-foreground">Calendar events from your connected integrations</p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-muted-foreground text-sm">Loading...</div>
      ) : events.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Calendar className="w-12 h-12 mx-auto opacity-40 mb-3" />
          <p className="text-sm">No meetings ingested yet. Connect Google Calendar and sync.</p>
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
