import { createFileRoute, Link } from "@tanstack/react-router";
import heroImg from "@/assets/kaa-rada-hero.jpg";
import ladyImg from "@/assets/merchant-lady.jpg";
import gentImg from "@/assets/buyer-gent.jpg";
import { Logo } from "@/components/Logo";
import { LightningBolt } from "@/components/LightningBolt";
import { ArrowRight, ShieldCheck, Store, Wallet } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Karada — Kaa Rada. Trustless Lightning Escrow for Kenya" },
      {
        name: "description",
        content:
          "Karada secures every deal with Bitcoin Lightning HODL invoices. Merchants get paid, buyers stay protected — kaa rada.",
      },
      { property: "og:title", content: "Karada — Kaa Rada. Lightning Escrow." },
      {
        property: "og:description",
        content: "Trustless escrow over Bitcoin Lightning, built for Kenya.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Logo />
        <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-success animate-pulse-dot" />
          Lightning Node · Online
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 pt-6 pb-20 grid lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-7 animate-float-up">
          <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs">
            <LightningBolt className="h-3.5 w-3.5 text-primary" />
            <span className="text-muted-foreground">Lightning · HODL Escrow</span>
          </div>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.02]">
            Deal smart. <br />
            <span className="text-gradient-sunset">Kaa rada.</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
            From Gikomba to Westlands, From Diaspora over-seas — Karada locks every payment in a cryptographic vault until
            the goods land. No chargebacks. No middlemen. Just sats moving at the speed of trust.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              to="/merchant"
              className="group relative inline-flex items-center justify-center gap-3 rounded-2xl bg-sunset px-7 py-4 font-semibold text-primary-foreground shadow-amber transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <Store className="h-5 w-5" />
              I'm a Merchant
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/buyer"
              className="group relative inline-flex items-center justify-center gap-3 rounded-2xl bg-teal-gradient px-7 py-4 font-semibold text-teal-foreground shadow-teal transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <Wallet className="h-5 w-5" />
              I'm a Buyer
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="flex items-center gap-6 pt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-success" /> Non-custodial
            </div>
            <div>⚡ Sub-second settlement</div>
            <div>🇰🇪 Made in Kenya</div>
          </div>
        </div>

        {/* Hero image */}
        <div className="relative animate-float-up" style={{ animationDelay: "120ms" }}>
          <div className="absolute -inset-6 bg-sunset opacity-20 blur-3xl rounded-full" />
          <div className="relative rounded-3xl overflow-hidden border border-border shadow-soft">
            <img
              src={heroImg}
              alt="Two Kenyan friends smiling and reminding each other to kaa rada — stay alert"
              width={1536}
              height={1024}
              className="w-full h-auto object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between">
              <div className="glass rounded-xl px-3 py-2">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Friends say
                </div>
                <div className="font-display text-lg font-semibold">"Kaa rada, bro." 👉🧠</div>
              </div>
              <div className="glass rounded-full p-2 animate-spin-slow">
                <LightningBolt className="h-5 w-5 text-primary" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Role cards */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="grid md:grid-cols-2 gap-6">
          <RoleCard
            to="/merchant"
            img={ladyImg}
            tag="For Sellers"
            title="Merchant"
            blurb="Generate a Lightning invoice in seconds. Get paid the moment your courier confirms delivery."
            accent="amber"
            cta="Open Merchant Console"
          />
          <RoleCard
            to="/buyer"
            img={gentImg}
            tag="For Buyers"
            title="Buyer"
            blurb="Scan, lock your sats in escrow, and only release them once the package is in your hands."
            accent="teal"
            cta="Open Buyer Wallet"
          />
        </div>
      </section>

      <footer className="border-t border-border/60 py-8">
        <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <div className="h-1.5 w-24 rounded kitenge-stripe" />
            <span>Karada · Built in Kisumu 🇰🇪</span>
          </div>
          <div>⚡ Powered by Lightning</div>
        </div>
      </footer>
    </div>
  );
}

function RoleCard({
  to,
  img,
  tag,
  title,
  blurb,
  cta,
  accent,
}: {
  to: "/merchant" | "/buyer";
  img: string;
  tag: string;
  title: string;
  blurb: string;
  cta: string;
  accent: "amber" | "teal";
}) {
  const accentBg =
    accent === "amber"
      ? "bg-sunset shadow-amber text-primary-foreground"
      : "bg-teal-gradient shadow-teal text-teal-foreground";
  return (
    <Link
      to={to}
      className="group relative overflow-hidden rounded-3xl glass p-2 hover:scale-[1.01] transition-transform duration-300"
    >
      <div className="relative overflow-hidden rounded-2xl aspect-[5/4]">
        <img
          src={img}
          alt={title}
          loading="lazy"
          width={1024}
          height={1024}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute top-4 left-4">
          <span className="text-[10px] uppercase tracking-widest glass rounded-full px-3 py-1">
            {tag}
          </span>
        </div>
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
          <div>
            <h3 className="font-display text-3xl font-bold">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">{blurb}</p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between px-4 py-4">
        <span className="text-sm text-muted-foreground">{cta}</span>
        <span
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ${accentBg}`}
        >
          Enter <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}
