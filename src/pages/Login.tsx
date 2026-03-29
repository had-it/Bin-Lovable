import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";
import logoImg from "@/assets/bincalc-logo.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, user, loading: authLoading } = useAuth();

  // If already logged in, redirect to dashboard
  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      // Don't navigate here — the auth state change will set `user`,
      // which triggers the <Navigate> above on re-render.
    } catch (err: any) {
      setError(err.message ?? "Login failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <img src={logoImg} alt="BinCalc" className="h-10 w-10" />
            <div className="flex flex-col leading-none text-left">
              <span className="font-bold text-xl tracking-[-0.06em] text-[#1B54DE]">BinCalc</span>
              <span className="text-[11px] font-bold text-foreground">by BinSight</span>
            </div>
          </div>
          <div>
            <CardTitle className="text-xl">Log in</CardTitle>
            <CardDescription className="mt-1">Enter your credentials to access the platform</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@hospital.se"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading || authLoading}>
              {(loading || authLoading) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Log in
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
