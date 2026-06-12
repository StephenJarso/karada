import { createFileRoute, Link } from "@tanstack/react-router";
import { CSSProperties, useState } from "react";
import { Logo } from "@/components/Logo";
import { TxFlow, type TxStage } from "@/components/TxFlow";
import { LightningBolt } from "@/components/LightningBolt";
import {
  ArrowLeft,
  Loader2,
  PackageCheck,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import gentImg from "@/assets/buyer-gent.jpg";

export const Route = createFileRoute("/buyer")({
  head: () => ({
    meta: [
      { title: "Buyer Wallet · Karada" },
      {
        name: "description",
        content: "Scan, lock sats in escrow, and release only when your package lands. Kaa rada.",
      },
    ],
  }),
  component: BuyerPage,
});

type Step = "scan" | "review" | "locked" | "transit" | "delivered";

function BuyerPage() {
  const [step, setStep] = useState<Step>("scan");

  const stage: TxStage =
    step === "scan" || step === "review"
      ? "idle"
      : step === "locked" || step === "transit"
        ? step === "locked"
          ? "lock"
          : "ship"
        : "settle";

  const deal = { item: "Vintage Kitenge Jacket", merchant: "Akinyi's Boutique", priceKes: 12500 };
  const sats = Math.round(deal.priceKes * 6.8);

  return (
    <div className="min-h-screen">
      <TopBar />
      <div className="mx-auto max-w-6xl px-6 pb-20">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-teal/15 border border-teal/30 px-3 py-1 text-xs text-teal mb-2">
              <Sparkles className="h-3 w-3" /> Buyer Wallet
            </div>
            <h1 className="font-display text-4xl font-bold">Kaa rada, bro 👌</h1>
          </div>
          <div className="flex items-center gap-3">
            <img
              src={gentImg}
              alt="Buyer"
              loading="lazy"
              width={1024}
              height={1024}
              className="h-12 w-12 rounded-full object-cover border-2 border-teal/40"
            />
            <div>
              <div className="text-sm font-semibold">Kamau M.</div>
              <div className="text-xs text-muted-foreground">
                Balance · <span className="text-primary font-mono">120,500 sats</span>
              </div>
            </div>
          </div>
        </div>

        <TxFlow stage={stage} />

        <div className="grid lg:grid-cols-5 gap-6 mt-8">
          <div className="lg:col-span-3 glass rounded-3xl p-6 space-y-6 animate-float-up">
            {step === "scan" && <ScanPanel onScan={() => setStep("review")} />}
            {step === "review" && (
              <ReviewPanel deal={deal} sats={sats} onLock={() => setStep("locked")} />
            )}
            {step === "locked" && <LockedPanel sats={sats} onShipped={() => setStep("transit")} />}
            {step === "transit" && <TransitPanel onArrived={() => setStep("delivered")} />}
            {step === "delivered" && <DeliveredPanel sats={sats} onReset={() => setStep("scan")} />}
          </div>
          <SidePanel step={step} deal={deal} sats={sats} />
        </div>
      </div>
    </div>
  );
}

function TopBar() {
  return (
    <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
      <Link
        to="/"
        className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition"
      >
        <ArrowLeft className="h-4 w-4" />
        <Logo />
      </Link>
      <Link
        to="/merchant"
        className="text-xs glass rounded-full px-3 py-1.5 hover:text-foreground transition"
      >
        Switch to Merchant →
      </Link>
    </nav>
  );
}

function ScanPanel({ onScan }: { onScan: () => void }) {
  return (
    <div className="space-y-6 text-center py-6">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">Step 1</div>
      <h2 className="font-display text-2xl font-bold">Scan merchant invoice</h2>

      <div className="relative mx-auto h-64 w-64 rounded-3xl bg-savanna border border-border overflow-hidden">
        {/* corner brackets */}
        <Bracket pos="tl" />
        <Bracket pos="tr" />
        <Bracket pos="bl" />
        <Bracket pos="br" />
        {/* scanning line */}
        <div
          className="absolute inset-x-6 h-[2px] bg-teal-gradient shadow-teal"
          style={{ animation: "scan 2s ease-in-out infinite alternate", top: "20%" }}
        />
        <ScanLine className="absolute inset-0 m-auto h-16 w-16 text-teal/50 animate-pulse" />
        <style>{`@keyframes scan { from { top: 12%; } to { top: 78%; } }`}</style>
      </div>

      <button
        onClick={onScan}
        className="group inline-flex items-center justify-center gap-3 rounded-2xl bg-teal-gradient px-7 py-4 font-semibold text-teal-foreground shadow-teal transition hover:scale-[1.02]"
      >
        <LightningBolt className="h-5 w-5" />
        Detect Lightning invoice
      </button>
      <p className="text-xs text-muted-foreground">
        For the demo we'll auto-detect Akinyi's invoice.
      </p>
    </div>
  );
}

function Bracket({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const map = {
    tl: "top-4 left-4 border-l-2 border-t-2 rounded-tl-xl",
    tr: "top-4 right-4 border-r-2 border-t-2 rounded-tr-xl",
    bl: "bottom-4 left-4 border-l-2 border-b-2 rounded-bl-xl",
    br: "bottom-4 right-4 border-r-2 border-b-2 rounded-br-xl",
  } as const;
  return <div className={`absolute h-8 w-8 border-teal ${map[pos]}`} />;
}

function ReviewPanel({
  deal,
  sats,
  onLock,
}: {
  deal: { item: string; merchant: string; priceKes: number };
  sats: number;
  onLock: () => void;
}) {
  return (
    <div className="space-y-5 animate-pop-in">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">
        Step 2 · Confirm
      </div>
      <h2 className="font-display text-2xl font-bold">Review the deal</h2>

      <div className="rounded-2xl bg-savanna border border-border p-5 space-y-4">
        <Row k="Item" v={deal.item} />
        <Row k="Merchant" v={deal.merchant} mono={false} verified />
        <Row k="Price" v={`${deal.priceKes.toLocaleString()} KES`} />
        <Row k="Sats" v={`${sats.toLocaleString()} sats`} accent />
        <Row k="Network fee" v="~3 sats" />
      </div>

      <div className="flex items-start gap-3 rounded-2xl bg-teal/10 border border-teal/30 p-4">
        <ShieldCheck className="h-5 w-5 text-teal mt-0.5 flex-shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Your sats stay locked in a cryptographic HODL invoice. They're only released to the seller
          once delivery is confirmed by the courier oracle.{" "}
          <span className="text-teal font-semibold">Kaa rada</span> — you're protected.
        </p>
      </div>

      <button
        onClick={onLock}
        className="group w-full inline-flex items-center justify-center gap-3 rounded-2xl bg-teal-gradient px-6 py-4 font-semibold text-teal-foreground shadow-teal transition hover:scale-[1.01]"
      >
        <LightningBolt className="h-5 w-5" />
        Lock {sats.toLocaleString()} sats in escrow
      </button>
    </div>
  );
}

function Row({
  k,
  v,
  mono = true,
  accent = false,
  verified = false,
}: {
  k: string;
  v: string;
  mono?: boolean;
  accent?: boolean;
  verified?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{k}</span>
      <span
        className={`${mono ? "font-mono" : "font-semibold"} ${accent ? "text-primary text-lg" : ""} flex items-center gap-1.5`}
      >
        {v}
        {verified && (
          <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-success/20 text-success text-[10px]">
            ✓
          </span>
        )}
      </span>
    </div>
  );
}

function LockedPanel({ sats, onShipped }: { sats: number; onShipped: () => void }) {
  return (
    <div className="space-y-6 animate-pop-in">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">
        Step 3 · Vault sealed
      </div>
      <h2 className="font-display text-2xl font-bold">Your sats are locked.</h2>

      {/* Vault visual */}
      <div className="relative h-56 rounded-3xl bg-savanna border border-border overflow-hidden flex items-center justify-center">
        <div
          className="absolute inset-0 bg-gradient-radial-amber"
          style={{ background: "var(--gradient-radial-amber)" }}
        />
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-sunset opacity-30 blur-2xl" />
          <div className="relative h-32 w-32 rounded-3xl bg-savanna border-2 border-primary/60 flex items-center justify-center animate-glow-amber">
            <div className="text-center">
              <ShieldCheck className="h-10 w-10 text-primary mx-auto" />
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-2">
                HTLC
              </div>
            </div>
          </div>
        </div>
        {/* floating sats */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="absolute text-amber font-mono text-xs"
            style={{
              top: `${20 + (i % 4) * 18}%`,
              left: `${10 + ((i * 17) % 80)}%`,
              animation: `float-up 2s ease-in-out ${i * 200}ms infinite alternate`,
              opacity: 0.7,
            }}
          >
            ⚡{Math.floor(Math.random() * 9999)}
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-success/10 border border-success/30 p-4 flex items-center gap-3 animate-slide-right">
        <div className="h-9 w-9 rounded-xl bg-success/20 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-success" />
        </div>
        <div className="text-sm">
          <div className="font-semibold text-success">{sats.toLocaleString()} sats secured</div>
          <div className="text-xs text-muted-foreground">Merchant has been notified to ship.</div>
        </div>
      </div>

      <button
        onClick={onShipped}
        className="w-full inline-flex items-center justify-center gap-3 rounded-2xl bg-secondary border border-border px-6 py-4 font-semibold hover:bg-secondary/70 transition"
      >
        <Truck className="h-4 w-4" />
        Merchant marked as shipped — track →
      </button>
    </div>
  );
}

function TransitPanel({ onArrived }: { onArrived: () => void }) {
  return (
    <div className="space-y-5">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">
        Step 4 · In transit
      </div>
      <h2 className="font-display text-2xl font-bold">On the way to you 🛵</h2>

      <div className="relative h-40 rounded-2xl bg-savanna border border-border overflow-hidden p-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>Westlands</span>
          <span>Karen</span>
        </div>
        <div className="relative h-3 rounded-full bg-border overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-teal-gradient rounded-full animate-shimmer"
            style={{ width: "62%" }}
          />
        </div>
        <div className="mt-4 flex items-center gap-3 text-sm">
          <Loader2 className="h-4 w-4 text-teal animate-spin" />
          ETA · 12 min
        </div>
        <div className="mt-3 text-xs font-mono text-muted-foreground">
          📍 Forest Rd · piki passing Sarit Centre
        </div>
      </div>

      <button
        onClick={onArrived}
        className="w-full inline-flex items-center justify-center gap-3 rounded-2xl bg-sunset px-6 py-4 font-semibold text-primary-foreground shadow-amber transition hover:scale-[1.01]"
      >
        <PackageCheck className="h-5 w-5" />
        Confirm package received
      </button>
    </div>
  );
}

function DeliveredPanel({ sats, onReset }: { sats: number; onReset: () => void }) {
  return (
    <div className="space-y-6 text-center py-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => {
          const angle = (i / 20) * Math.PI * 2;
          const tx = Math.cos(angle) * 280;
          const ty = Math.sin(angle) * 200 - 40;
          return (
            <div
              key={i}
              className="absolute top-1/2 left-1/2 h-3 w-3 -ml-1.5 -mt-1.5 rounded-sm"
              style={{
                background:
                  i % 3 === 0
                    ? "oklch(0.86 0.19 65)"
                    : i % 3 === 1
                      ? "oklch(0.62 0.13 195)"
                      : "oklch(0.72 0.18 150)",
                ["--tx" as unknown as keyof CSSProperties]: `${tx}px`,
                ["--ty" as unknown as keyof CSSProperties]: `${ty}px`,
                animation: `coin-fly 1.6s cubic-bezier(0.22,1,0.36,1) ${i * 30}ms forwards`,
              }}
            />
          );
        })}
      </div>
      <div className="relative inline-flex h-24 w-24 mx-auto items-center justify-center rounded-3xl bg-success/20 animate-pop-in">
        <PackageCheck className="h-10 w-10 text-success" />
        <div className="absolute inset-0 rounded-3xl border-2 border-success/50 animate-glow-teal" />
      </div>
      <div>
        <h2 className="font-display text-3xl font-bold">Delivered. Asante! 🙌</h2>
        <p className="text-muted-foreground mt-2">
          <span className="text-primary font-mono">{sats.toLocaleString()} sats</span> released to
          merchant.
        </p>
      </div>
      <div className="text-xs glass rounded-full inline-block px-4 py-2">
        Preimage revealed · settlement complete
      </div>
      <div>
        <button
          onClick={onReset}
          className="inline-flex items-center justify-center gap-3 rounded-2xl bg-teal-gradient px-6 py-4 font-semibold text-teal-foreground shadow-teal"
        >
          Scan another deal
        </button>
      </div>
    </div>
  );
}

function SidePanel({
  step,
  deal,
  sats,
}: {
  step: Step;
  deal: { item: string; merchant: string; priceKes: number };
  sats: number;
}) {
  return (
    <div className="lg:col-span-2 space-y-4">
      <div className="glass rounded-3xl p-5">
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
          Your protection
        </div>
        <ul className="space-y-3 text-sm">
          <Protection on={step !== "scan"} label="Invoice verified · merchant signed" />
          <Protection
            on={["locked", "transit", "delivered"].includes(step)}
            label="Sats locked in HTLC vault"
          />
          <Protection
            on={["transit", "delivered"].includes(step)}
            label="Shipment confirmed by oracle"
          />
          <Protection on={step === "delivered"} label="Preimage released · seller paid" />
        </ul>
      </div>

      <div className="glass rounded-3xl p-5">
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Order</div>
        <div className="text-sm space-y-2">
          <div className="font-semibold">{deal.item}</div>
          <div className="text-muted-foreground">{deal.merchant}</div>
          <div className="pt-2 border-t border-border flex items-center justify-between">
            <span className="text-muted-foreground text-xs">Total</span>
            <span className="font-mono text-primary">{sats.toLocaleString()} sats</span>
          </div>
        </div>
      </div>

      <div className="rounded-3xl p-[1px] bg-sunset">
        <div className="rounded-3xl bg-card p-4 text-xs text-muted-foreground leading-relaxed">
          💡 <span className="text-foreground font-semibold">Kaa rada tip:</span> Always confirm the
          merchant's signature and never release funds before the package is in your hands.
        </div>
      </div>
    </div>
  );
}

function Protection({ on, label }: { on: boolean; label: string }) {
  return (
    <li className={`flex items-start gap-3 transition ${on ? "opacity-100" : "opacity-40"}`}>
      <span
        className={`mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${on ? "bg-success/20 text-success" : "bg-secondary text-muted-foreground"}`}
      >
        {on ? "✓" : "•"}
      </span>
      <span className={on ? "text-foreground" : "text-muted-foreground"}>{label}</span>
    </li>
  );
}
