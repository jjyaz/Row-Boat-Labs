import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { GitBranch } from "lucide-react";

interface GraphNode {
  id: string;
  title: string;
  backlinks: string[];
  x: number;
  y: number;
}

const Graph = () => {
  const { user } = useAuth();
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!user) return;
    const fetchNotes = async () => {
      const { data } = await supabase
        .from("notes")
        .select("id, title, backlinks")
        .eq("user_id", user.id);
      if (data) {
        const positioned = (data as any[]).map((n, i) => ({
          ...n,
          backlinks: n.backlinks || [],
          x: 200 + Math.cos((i * 2 * Math.PI) / data.length) * 180,
          y: 200 + Math.sin((i * 2 * Math.PI) / data.length) * 180,
        }));
        setNodes(positioned);
      }
    };
    fetchNotes();
  }, [user]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || nodes.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

    // Draw edges
    ctx.strokeStyle = "hsl(210 50% 68% / 0.3)";
    ctx.lineWidth = 1;
    nodes.forEach((node) => {
      node.backlinks.forEach((link) => {
        const target = nodes.find((n) => n.title === link);
        if (target) {
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(target.x, target.y);
          ctx.stroke();
        }
      });
    });

    // Draw nodes
    nodes.forEach((node) => {
      ctx.beginPath();
      ctx.arc(node.x, node.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = "hsl(24 60% 52%)";
      ctx.fill();
      ctx.fillStyle = "hsl(215 50% 12%)";
      ctx.font = "11px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(node.title, node.x, node.y + 20);
    });
  }, [nodes]);

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-foreground">Knowledge Graph</h1>
        <p className="text-sm text-muted-foreground">Visualize connections between your notes</p>
      </div>
      {nodes.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <GitBranch className="w-12 h-12 mx-auto opacity-40 mb-3" />
            <p className="text-sm">No notes with backlinks yet. Create notes and use [[backlinks]].</p>
          </div>
        </div>
      ) : (
        <Card className="flex-1 relative overflow-hidden border-border/50">
          <canvas ref={canvasRef} className="w-full h-full" style={{ minHeight: 400 }} />
        </Card>
      )}
    </div>
  );
};

export default Graph;
