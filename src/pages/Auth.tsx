import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import WaveBackground from "@/components/WaveBackground";
import { motion } from "framer-motion";

const Auth = () => {
  const { user, loading, signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");

  if (loading) return null;
  if (user) return <Navigate to="/app" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setConfirmMessage("");
    setSubmitting(true);

    const result = isSignUp ? await signUp(email, password) : await signIn(email, password);
    if (result.error) {
      setError(result.error.message);
    } else if (isSignUp) {
      setConfirmMessage("Check your email to confirm your account.");
    }
    setSubmitting(false);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      <WaveBackground />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md px-4"
      >
        <Card className="shadow-paper border-border/50 backdrop-blur-sm bg-card/90">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
              {isSignUp ? "Create your account" : "Welcome back"}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Row Boat Labs</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
              {confirmMessage && <p className="text-sm text-primary">{confirmMessage}</p>}
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
              </Button>
            </form>
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(""); setConfirmMessage(""); }}
              className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
            </button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Auth;
