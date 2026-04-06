import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import TCOCalculator from "@/components/TCOCalculator";
import { Button } from "@/components/ui/button";
import { getStoredAuthSession, signOut } from "@/lib/supabaseClient";
import appLogo from "@/assets/app_logo.png";

const Dashboard = () => {
  const navigate = useNavigate();
  const session = getStoredAuthSession();
  const displayName = useMemo(() => {
    const fromMetadata = session?.user?.user_metadata?.display_name;
    if (typeof fromMetadata === "string" && fromMetadata.trim()) return fromMetadata;
    const email = session?.user?.email ?? "";
    return email.split("@")[0] || "User";
  }, [session]);

  const handleLogout = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <img src={appLogo} alt="" className="h-10 w-10 shrink-0 object-contain md:h-11 md:w-11" />
            <div className="min-w-0 flex flex-col">
              <p className="truncate text-xs text-muted-foreground md:text-sm">Signed in as</p>
              <p className="truncate font-medium leading-tight">{displayName}</p>
            </div>
          </div>
          <Button variant="outline" className="shrink-0 shadow-sm transition-shadow hover:shadow-md" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </header>
      <TCOCalculator />
    </main>
  );
};

export default Dashboard;
