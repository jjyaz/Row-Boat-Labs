import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import heroImage from "@/assets/hero-image.jpg";
import WaveBackground from "@/components/WaveBackground";
import { Anchor, FileText, GitBranch, Github, Mail, Shield, Zap } from "lucide-react";
import { toast } from "sonner";

const CA_ADDRESS = "5VWYTwH9izCLCq8vFkXiLabLbAoEPj1HvUdYHkj2pump";

const features = [
  {
    icon: Mail,
    title: "Real Integrations",
    desc: "Connect Gmail, Calendar & Drive. Real OAuth, real data ingestion.",
  },
  {
    icon: FileText,
    title: "Markdown Vault",
    desc: "Your knowledge lives in plain Markdown with backlinks. Obsidian-compatible.",
  },
  {
    icon: GitBranch,
    title: "Knowledge Graph",
    desc: "Entities, relationships, and decisions extracted and linked automatically.",
  },
  {
    icon: Zap,
    title: "AI Coworker",
    desc: "Chat grounded in your memory graph. Generates real briefs, decks, and docs.",
  },
  {
    icon: Shield,
    title: "Local-First Privacy",
    desc: "Your vault is yours. Inspect, edit, and export everything.",
  },
];

const Index = () => {
  const handleCopyCA = async () => {
    try {
      await navigator.clipboard.writeText(CA_ADDRESS);
      toast.success("CA copied to clipboard!");
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center">
        <div className="absolute top-6 right-6 z-20 flex items-center gap-3">
          <button
            onClick={handleCopyCA}
            className="text-foreground/70 hover:text-foreground transition-colors font-mono text-sm font-bold"
            aria-label="Copy Contract Address"
          >
            CA
          </button>
          <a
            href="https://github.com/jjyaz/Row-Boat-Labs"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground/70 hover:text-foreground transition-colors"
            aria-label="GitHub Repository"
          >
            <Github className="w-7 h-7" />
          </a>
        </div>
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Row Boat Labs — abstract papercut ocean waves"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/40 to-transparent" />
        </div>

        <div className="relative z-10 container mx-auto px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-xl"
          >
            <div className="flex items-center gap-3 mb-6">
              <Anchor className="w-8 h-8 text-primary" />
              <span className="text-lg font-bold tracking-tight text-foreground">Row Boat Labs</span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight mb-6">
              Your AI coworker
              <br />
              <span className="text-primary">remembers everything.</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-md">
              Connect your workspace. Build a living knowledge graph from emails, meetings, and docs. 
              Let AI act on your memory — not its hallucinations.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/auth">
                <Button size="lg" className="text-base px-8 py-6 shadow-paper hover:shadow-paper-hover transition-shadow">
                  Connect your workspace
                </Button>
              </Link>
              <Link to="/auth">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-base px-8 py-6 border-accent text-accent hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  Open your Vault
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="relative py-24 bg-card">
        <WaveBackground subtle />
        <div className="relative z-10 container mx-auto px-6">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-3xl font-bold text-center text-foreground mb-16"
          >
            How it works
          </motion.h2>
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-xl bg-background/80 backdrop-blur-sm shadow-depth border border-border/50 hover:shadow-paper transition-shadow"
              >
                <f.icon className="w-8 h-8 text-primary mb-4" />
                <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border bg-background">
        <div className="container mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Anchor className="w-4 h-4" />
            <span>Row Boat Labs</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Built on <a href="https://github.com/rowboatlabs/rowboat" className="underline hover:text-foreground" target="_blank" rel="noopener noreferrer">Rowboat</a> (Apache-2.0)
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
