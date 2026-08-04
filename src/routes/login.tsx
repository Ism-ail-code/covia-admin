import { useRef, useState } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Loader2, LogIn, MapPinned } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ensureSession, isAuthenticated, signIn } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  beforeLoad: async () => {
    await ensureSession();
    if (isAuthenticated()) {
      throw redirect({ to: "/" });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const failedAttemptsRef = useRef(0);
  const lastAttemptRef = useRef(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const now = Date.now();
    const elapsed = now - lastAttemptRef.current;
    const minDelay = Math.min(1000 * Math.pow(2, failedAttemptsRef.current), 60000);
    if (elapsed < minDelay) {
      toast.error(`Too many attempts. Wait ${Math.ceil((minDelay - elapsed) / 1000)} seconds.`);
      return;
    }

    setSubmitting(true);
    lastAttemptRef.current = now;
    const { ok, error } = await signIn(email, password);
    setSubmitting(false);
    if (!ok) {
      failedAttemptsRef.current += 1;
      toast.error(error ?? "Sign in failed");
      return;
    }
    failedAttemptsRef.current = 0;
    toast.success("Welcome back");
    navigate({ to: "/" });
  };

  return (
    <div className="grid min-h-screen place-items-center bg-muted/30 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3">
          <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primary font-display text-primary-foreground shadow-sm">
            <MapPinned className="size-5.5" />
          </span>
          <div className="text-center">
            <h1 className="font-display text-xl font-semibold tracking-tight">Covia Admin</h1>
            <p className="text-sm text-muted-foreground">Coordination Platform console</p>
          </div>
        </div>

        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Sign in</CardTitle>
              <CardDescription>Use your Covia administrator account to continue.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@covia.pk"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
                {submitting ? "Signing in…" : "Sign in"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}