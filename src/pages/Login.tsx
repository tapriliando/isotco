import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { MarketingShell } from "@/components/MarketingShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  getSavedLoginUsername,
  getRememberUsernamePreference,
  persistLoginPreferences,
} from "@/lib/loginPreferences";
import { storeLoginInBrowserPasswordManager } from "@/lib/browserPasswordCredential";
import {
  getStoredAuthSession,
  isAuthSessionValid,
  signInWithUsernamePassword,
} from "@/lib/supabaseClient";

const Login = () => {
  const [username, setUsername] = useState(getSavedLoginUsername);
  const [password, setPassword] = useState("");
  const [rememberUsername, setRememberUsername] = useState(getRememberUsernamePreference);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const activeSession = getStoredAuthSession();
  const isAlreadyLoggedIn = isAuthSessionValid(activeSession);
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const result = await signInWithUsernamePassword(username, password);

    setIsLoading(false);

    if (result.error) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: "Please check your username and password.",
      });
      return;
    }

    persistLoginPreferences(rememberUsername, username);

    await storeLoginInBrowserPasswordManager(username, password);

    toast({
      title: "Login successful",
      description: `Welcome ${result.data.user.user_metadata?.display_name ?? username.trim()}.`,
    });
    navigate("/dashboard", { replace: true });
  };

  if (isAlreadyLoggedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <MarketingShell>
      <Card className="w-full border-border/60 bg-card/80 shadow-2xl backdrop-blur-md">
        <CardHeader className="space-y-3 motion-safe:animate-fade-in-up">
          <CardTitle className="text-3xl font-semibold tracking-tight">Login</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Use the username and password that were provisioned for you.
          </CardDescription>
        </CardHeader>
        <CardContent className="motion-safe:animate-fade-in-up motion-safe:[animation-delay:140ms]">
          <form onSubmit={handleSubmit} className="space-y-5" autoComplete="on">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                inputMode="text"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="e.g. user_alpha"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="remember-username"
                checked={rememberUsername}
                onCheckedChange={(checked) => setRememberUsername(checked === true)}
              />
              <Label htmlFor="remember-username" className="cursor-pointer text-sm font-normal leading-none">
                Remember username on this device
              </Label>
            </div>
            <Button type="submit" className="w-full shadow-md transition-shadow hover:shadow-lg" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
            </Button>
            <Button type="button" variant="ghost" className="w-full" asChild>
              <Link to="/">Back to Home</Link>
            </Button>
          </form>
        </CardContent>
      </Card>
    </MarketingShell>
  );
};

export default Login;
