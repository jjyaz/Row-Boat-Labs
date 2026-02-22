import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FileText, Plus, ArrowLeft, Link as LinkIcon } from "lucide-react";
import { motion } from "framer-motion";

interface Note {
  id: string;
  path: string;
  title: string;
  content: string;
  backlinks: string[];
  updated_at: string;
}

const Vault = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchNotes = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    if (data) setNotes(data as Note[]);
  };

  useEffect(() => {
    fetchNotes();
  }, [user]);

  const createNote = async () => {
    if (!user) return;
    const path = `notes/${Date.now()}.md`;
    const { data } = await supabase
      .from("notes")
      .insert({ user_id: user.id, path, title: "Untitled", content: "" })
      .select()
      .single();
    if (data) {
      setNotes((prev) => [data as Note, ...prev]);
      setSelectedNote(data as Note);
      setEditTitle("Untitled");
      setEditContent("");
    }
  };

  const saveNote = async () => {
    if (!selectedNote) return;
    setSaving(true);
    // Extract backlinks from content
    const backlinkRegex = /\[\[([^\]]+)\]\]/g;
    const backlinks: string[] = [];
    let match;
    while ((match = backlinkRegex.exec(editContent)) !== null) {
      backlinks.push(match[1]);
    }
    await supabase
      .from("notes")
      .update({ title: editTitle, content: editContent, backlinks })
      .eq("id", selectedNote.id);
    setSelectedNote({ ...selectedNote, title: editTitle, content: editContent, backlinks });
    fetchNotes();
    setSaving(false);
  };

  const openNote = (note: Note) => {
    setSelectedNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
  };

  if (selectedNote) {
    return (
      <div className="flex flex-col h-full">
        <div className="border-b border-border bg-background/80 backdrop-blur-sm px-6 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setSelectedNote(null)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="font-semibold text-lg border-0 bg-transparent px-0 focus-visible:ring-0"
          />
          <Button onClick={saveNote} disabled={saving} size="sm">
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 p-6">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full h-full bg-transparent resize-none outline-none text-sm font-mono leading-relaxed text-foreground placeholder:text-muted-foreground"
              placeholder="Write Markdown here... Use [[backlinks]] to link notes."
            />
          </div>
          {selectedNote.backlinks.length > 0 && (
            <div className="w-64 border-l border-border p-4 overflow-auto bg-card/50">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-3 flex items-center gap-1">
                <LinkIcon className="w-3 h-3" /> Backlinks
              </h3>
              {selectedNote.backlinks.map((link) => (
                <button
                  key={link}
                  onClick={() => {
                    const found = notes.find((n) => n.title === link || n.path.includes(link));
                    if (found) openNote(found);
                  }}
                  className="block text-sm text-primary hover:underline mb-1"
                >
                  {link}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Vault</h1>
          <p className="text-sm text-muted-foreground">Your Markdown knowledge base</p>
        </div>
        <Button onClick={createNote} size="sm">
          <Plus className="w-4 h-4 mr-1" /> New Note
        </Button>
      </div>
      {notes.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto opacity-40 mb-3" />
          <p className="text-sm">No notes yet. Create one or sync your integrations.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {notes.map((note, i) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card
                className="p-4 cursor-pointer hover:shadow-paper transition-shadow border-border/50"
                onClick={() => openNote(note)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <h3 className="font-medium text-sm text-foreground">{note.title}</h3>
                      <p className="text-xs text-muted-foreground">{note.path}</p>
                    </div>
                  </div>
                  {note.backlinks.length > 0 && (
                    <span className="text-xs text-primary">{note.backlinks.length} links</span>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Vault;
