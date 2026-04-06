import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const OPENING_LOGO = "/opening.png";

const Index = () => {
  return (
    <main className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-gradient-to-b from-[hsl(210_45%_98%)] via-[hsl(210_42%_96%)] to-[hsl(210_38%_93%)]">
      <div className="relative z-10 flex min-h-[100dvh] flex-col px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))]">
        <header className="flex flex-col items-center gap-1">
          <img
            src={OPENING_LOGO}
            alt="TCO by Astra Isuzu"
            className="h-28 w-auto max-w-[min(100%,min(96vw,720px))] object-contain object-center sm:h-32 md:h-40 lg:h-44"
            fetchPriority="high"
          />
        </header>

        <div className="flex flex-1 flex-col items-center justify-center px-2 py-8 text-center md:py-12">
          <h1 className="max-w-[12ch] font-sans text-[clamp(2rem,8vw,3.75rem)] font-black uppercase leading-[0.92] tracking-tight text-[hsl(222_47%_11%)] motion-safe:animate-fade-in-up sm:max-w-none md:tracking-tight [text-shadow:0.02em_0.02em_0_hsl(210_40%_98%),0.04em_0.04em_0_hsl(210_28%_88%_/0.5)]">
            <span className="block">Total cost,</span>
            <span className="block">full clarity</span>
          </h1>
          <p className="mt-8 max-w-md text-pretty text-sm font-medium leading-relaxed text-[hsl(222_30%_38%)] motion-safe:animate-fade-in-up motion-safe:[animation-delay:120ms] md:text-base">
            Astra Isuzu TCO tools for authorized users. Sign in with the username and password from your administrator.
          </p>
        </div>

        <div className="mx-auto w-full max-w-sm">
          <Button
            asChild
            className="h-14 w-full rounded-full border-0 bg-primary text-base font-semibold text-primary-foreground shadow-lg transition-all hover:opacity-95 hover:shadow-xl active:scale-[0.98] motion-reduce:active:scale-100"
          >
            <Link to="/login">Sign in</Link>
          </Button>
        </div>

        <p className="mx-auto mt-6 max-w-sm text-center text-[11px] leading-relaxed text-[hsl(222_30%_38%_/0.75)] md:text-xs">
          By signing in you confirm you are an authorized user. Contact your administrator if you need access.
        </p>
      </div>
    </main>
  );
};

export default Index;
