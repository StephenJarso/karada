import { createFileRoute, Link } from "@tanstack/react-router";
import { CSSProperties, useState } from "react";
import { Logo } from "@/components/Logo";
import { TxFlow, type TxStage } from "@/components/TxFlow";
import { LightningBolt } from "@/components/LightningBolt";
import { ArrowLeft, Copy, Loader2, Package, Sparkles, Zap } from "lucide-react";
import ladyImg from "@/assets/merchant-lady.jpg";

export const Route = createFileRoute("/merchant")({
  head: () => ({
    meta: [
      { title: "Merchant Console · Karada" },
      {
        name: "description",
        content:
          "Create a Lightning HODL escrow invoice in seconds. Get paid the moment delivery is confirmed.",
      },
    ],
  }),
  component: MerchantPage,
});

type Step = "compose" | "invoice" | "funded" | "shipped" | "settled";

function MerchantPage() {
  const [step, setStep] = useState<Step>("compose");
  const [item, setItem] = useState("Vintage Kitenge Jacket");
  const [price, setPrice] = useState("12500");
  const [tracking, setTracking] = useState("");
  const [coins, setCoins] = useState<number[]>([]);

  const stage: TxStage =
    step === "compose" || step === "invoice"
      ? "idle"
      : step === "funded"
        ? "lock"
        : step === "shipped"
          ? "ship"
          : "settle";

  const generate = () => setStep("invoice");
  const simulateFund = () => {
    setStep("funded");
    // fire coins
    setCoins(Array.from({ length: 14 }, (_, i) => Date.now() + i));
  };
  const ship = () => {
    if (!tracking) setTracking("KE-" + Math.random().toString(36).slice(2, 8).toUpperCase());
    setStep("shipped");
  };
  const settle = () => setStep("settled");
  const reset = () => {
    setStep("compose");
    setTracking("");
    setCoins([]);
  };

  return (
    <div className="min-h-screen">
      <TopBar />

      <div className="mx-auto max-w-6xl px-6 pb-20">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-sunset/15 border border-primary/30 px-3 py-1 text-xs text-primary mb-2">
              <Sparkles className="h-3 w-3" /> Merchant Console
            </div>
            <h1 className="font-display text-4xl font-bold">New Deal</h1>
          </div>
          <div className="flex items-center gap-3">
            <img
              src={ladyImg}
              alt="Merchant"
              loading="lazy"
              width={1024}
              height={1024}
              className="h-12 w-12 rounded-full object-cover border-2 border-primary/40"
            />
            <div>
              <div className="text-sm font-semibold">Akinyi's Boutique</div>
              <div className="text-xs text-muted-foreground">Nairobi · Verified</div>
            </div>
          </div>
        </div>

        <TxFlow stage={stage} />

        <div className="grid lg:grid-cols-5 gap-6 mt-8">
          {/* Left: action panel */}
          <div className="lg:col-span-3 glass rounded-3xl p-6 space-y-6 animate-float-up">
            {step === "compose" && (
              <ComposeForm
                item={item}
                price={price}
                onItem={setItem}
                onPrice={setPrice}
                onSubmit={generate}
              />
            )}
            {step === "invoice" && (
              <InvoiceCard item={item} price={price} onFunded={simulateFund} />
            )}
            {step === "funded" && (
              <ShipPanel tracking={tracking} onTracking={setTracking} onShip={ship} />
            )}
            {step === "shipped" && <AwaitingDelivery onSettle={settle} tracking={tracking} />}
            {step === "settled" && <SettledCard price={price} onReset={reset} />}
          </div>

          {/* Right: console */}
          <ConsolePanel step={step} price={price} tracking={tracking} coins={coins} />
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
        to="/buyer"
        className="text-xs glass rounded-full px-3 py-1.5 hover:text-foreground transition"
      >
        Switch to Buyer →
      </Link>
    </nav>
  );
}

function ComposeForm({
  item,
  price,
  onItem,
  onPrice,
  onSubmit,
}: {
  item: string;
  price: string;
  onItem: (v: string) => void;
  onPrice: (v: string) => void;
  onSubmit: () => void;
}) {
  return (
    <>
      <div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Step 1</div>
        <h2 className="font-display text-2xl font-bold">List your item</h2>
      </div>
      <div className="space-y-4">
        <Field label="Item description">
          <input
            value={item}
            onChange={(e) => onItem(e.target.value)}
            placeholder="e.g. Vintage Kitenge Jacket"
            className="w-full rounded-xl bg-input/40 border border-border px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition"
          />
        </Field>
        <Field label="Price (KES)">
          <div className="relative">
            <input
              value={price}
              onChange={(e) => onPrice(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              className="w-full rounded-xl bg-input/40 border border-border px-4 py-3 text-2xl font-mono text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              ≈ {Math.round(Number(price || 0) * 6.8).toLocaleString()} sats
            </span>
          </div>
        </Field>
      </div>
      <button
        onClick={onSubmit}
        disabled={!item || !price}
        className="group w-full inline-flex items-center justify-center gap-3 rounded-2xl bg-sunset px-6 py-4 font-semibold text-primary-foreground shadow-amber transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Zap className="h-5 w-5" />
        Generate Lightning Invoice
      </button>
    </>
  );
}

function InvoiceCard({
  item,
  price,
  onFunded,
}: {
  item: string;
  price: string;
  onFunded: () => void;
}) {
  const invoice = "lnbc" + Math.random().toString(36).slice(2, 14) + "...karada";
  return (
    <div className="space-y-5">
      <div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
          Step 2 · Awaiting commitment
        </div>
        <h2 className="font-display text-2xl font-bold">Share with the buyer</h2>
      </div>

      <div className="rounded-2xl bg-savanna border border-border p-6 flex flex-col items-center gap-4 animate-pop-in">
        <div className="relative">
          <div className="absolute -inset-3 bg-sunset opacity-30 blur-2xl rounded-full" />
          <div className="relative h-44 w-44 rounded-2xl bg-white p-3 grid grid-cols-12 gap-[2px]">
            {Array.from({ length: 144 }).map((_, i) => (
              <div
                key={i}
                className={`aspect-square ${Math.random() > 0.5 ? "bg-background" : "bg-transparent"} ${i < 3 || i > 140 ? "bg-background" : ""}`}
              />
            ))}
          </div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-mono font-bold text-primary">
            {Number(price).toLocaleString()} KES
          </div>
          <div className="text-xs text-muted-foreground mt-1">{item}</div>
        </div>
        <button className="flex items-center gap-2 text-xs glass rounded-full px-3 py-1.5">
          <Copy className="h-3 w-3" /> {invoice.slice(0, 18)}…
        </button>
      </div>

      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        Waiting for HODL commitment from buyer node…
      </div>

      <button
        onClick={onFunded}
        className="w-full inline-flex items-center justify-center gap-3 rounded-2xl bg-secondary border border-border px-6 py-4 font-semibold hover:bg-secondary/70 transition"
      >
        <LightningBolt className="h-4 w-4 text-primary" />
        Simulate buyer payment
      </button>
    </div>
  );
}

function ShipPanel({
  tracking,
  onTracking,
  onShip,
}: {
  tracking: string;
  onTracking: (v: string) => void;
  onShip: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 rounded-2xl bg-success/10 border border-success/30 px-4 py-3 animate-slide-right">
        <div className="h-9 w-9 rounded-xl bg-success/20 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-success" />
        </div>
        <div>
          <div className="text-sm font-semibold text-success">Funds locked in HTLC</div>
          <div className="text-xs text-muted-foreground">
            Cryptographic vault secured. Ship to release.
          </div>
        </div>
      </div>

      <div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Step 3</div>
        <h2 className="font-display text-2xl font-bold">Dispatch the package</h2>
      </div>

      <Field label="Courier tracking number">
        <div className="flex gap-2">
          <input
            value={tracking}
            onChange={(e) => onTracking(e.target.value.toUpperCase())}
            placeholder="KE-XXXXXX"
            className="flex-1 rounded-xl bg-input/40 border border-border px-4 py-3 font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition"
          />
          <button
            onClick={() => onTracking("KE-" + Math.random().toString(36).slice(2, 8).toUpperCase())}
            className="rounded-xl glass px-4 text-xs"
          >
            Auto
          </button>
        </div>
      </Field>

      <button
        onClick={onShip}
        className="group w-full inline-flex items-center justify-center gap-3 rounded-2xl bg-sunset px-6 py-4 font-semibold text-primary-foreground shadow-amber transition hover:scale-[1.01]"
      >
        <Package className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
        Mark as Shipped
      </button>
    </div>
  );
}

function AwaitingDelivery({ onSettle, tracking }: { onSettle: () => void; tracking: string }) {
  return (
    <div className="space-y-5">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">
        Step 4 · In Transit
      </div>
      <h2 className="font-display text-2xl font-bold">Riding through Nairobi traffic…</h2>

      <div className="relative h-32 rounded-2xl bg-savanna border border-border overflow-hidden">
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 400 120"
          preserveAspectRatio="none"
        >
          <path
            d="M10 80 Q 100 20, 200 60 T 390 50"
            stroke="oklch(0.32 0.02 60)"
            strokeWidth="2"
            fill="none"
            strokeDasharray="6 6"
          />
          <path
            d="M10 80 Q 100 20, 200 60 T 390 50"
            stroke="url(#g)"
            strokeWidth="3"
            fill="none"
            className="animate-dash-flow"
          />
          <defs>
            <linearGradient id="g" x1="0" x2="1">
              <stop offset="0%" stopColor="oklch(0.86 0.19 65)" />
              <stop offset="100%" stopColor="oklch(0.62 0.13 195)" />
            </linearGradient>
          </defs>
          <circle cx="200" cy="60" r="6" fill="oklch(0.86 0.19 65)" className="animate-pulse-dot" />
        </svg>
        <div className="absolute bottom-3 left-4 text-xs font-mono text-muted-foreground">
          {tracking}
        </div>
        <div className="absolute top-3 right-4 text-xs glass rounded-full px-3 py-1">
          📍 Westlands → Karen
        </div>
      </div>

      <button
        onClick={onSettle}
        className="w-full inline-flex items-center justify-center gap-3 rounded-2xl bg-teal-gradient px-6 py-4 font-semibold text-teal-foreground shadow-teal transition hover:scale-[1.01]"
      >
        Oracle: Confirm Delivery & Release
      </button>
    </div>
  );
}

function SettledCard({ price, onReset }: { price: string; onReset: () => void }) {
  return (
    <div className="space-y-6 text-center py-6 relative">
      {/* Coin burst */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 16 }).map((_, i) => {
          const angle = (i / 16) * Math.PI * 2;
          const tx = Math.cos(angle) * 260;
          const ty = Math.sin(angle) * 180 - 50;
          return (
            <div
              key={i}
              className="absolute top-1/2 left-1/2 h-6 w-6 -ml-3 -mt-3 rounded-full bg-sunset shadow-amber"
              style={{
                ["--tx" as unknown as keyof CSSProperties]: `${tx}px`,
                ["--ty" as unknown as keyof CSSProperties]: `${ty}px`,
                animation: `coin-fly 1.4s cubic-bezier(0.22,1,0.36,1) ${i * 40}ms forwards`,
              }}
            />
          );
        })}
      </div>

      <div className="relative inline-flex h-24 w-24 mx-auto items-center justify-center rounded-3xl bg-success/20 animate-pop-in">
        <Sparkles className="h-10 w-10 text-success" />
        <div className="absolute inset-0 rounded-3xl border-2 border-success/50 animate-glow-teal" />
      </div>
      <div>
        <h2 className="font-display text-3xl font-bold">Settled. 🎉</h2>
        <p className="text-muted-foreground mt-2">
          <span className="text-primary font-mono">{Number(price).toLocaleString()} KES</span>{" "}
          released to your wallet.
        </p>
      </div>
      <button
        onClick={onReset}
        className="inline-flex items-center justify-center gap-3 rounded-2xl bg-sunset px-6 py-4 font-semibold text-primary-foreground shadow-amber"
      >
        Start a new deal
      </button>
    </div>
  );
}

function ConsolePanel({
  step,
  price,
  tracking,
  coins,
}: {
  step: Step;
  price: string;
  tracking: string;
  coins: number[];
}) {
  const logs: { t: string; m: string; c: string }[] = [
    { t: "00:00", m: "Oracle node listening on :8080", c: "text-muted-foreground" },
  ];
  if (step !== "compose")
    logs.push({ t: "00:02", m: `INVOICE created · ${price} KES`, c: "text-primary" });
  if (step === "funded" || step === "shipped" || step === "settled")
    logs.push({ t: "00:04", m: "HTLC-LOCK detected · funds in vault", c: "text-success" });
  if (step === "shipped" || step === "settled")
    logs.push({ t: "00:06", m: `SHIP · tracking ${tracking}`, c: "text-amber" });
  if (step === "settled") {
    logs.push({ t: "00:09", m: "COURIER · DELIVERED (signature)", c: "text-success" });
    logs.push({ t: "00:09", m: "PREIMAGE released · settlement broadcast", c: "text-success" });
  }

  return (
    <div className="lg:col-span-2 glass rounded-3xl p-5 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">
          Oracle Console
        </div>
        <div className="flex items-center gap-1.5 text-xs text-success">
          <span className="h-2 w-2 rounded-full bg-success animate-pulse-dot" />
          live
        </div>
      </div>
      <div className="flex-1 rounded-2xl bg-background/60 border border-border p-4 font-mono text-[12px] space-y-2 overflow-hidden">
        {logs.map((l, i) => (
          <div
            key={i}
            className={`flex gap-3 animate-slide-right ${l.c}`}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <span className="text-muted-foreground">[{l.t}]</span>
            <span>{l.m}</span>
          </div>
        ))}
        {coins.length > 0 && step === "funded" && (
          <div className="text-amber">⚡ {coins.length} sats packets routed</div>
        )}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[10px]">
        <Stat label="Status" value={step.toUpperCase()} />
        <Stat label="Network" value="Lightning" />
        <Stat label="Fees" value="~3 sats" />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-secondary/60 border border-border px-2 py-2">
      <div className="text-muted-foreground uppercase tracking-widest">{label}</div>
      <div className="font-semibold text-foreground mt-0.5">{value}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
