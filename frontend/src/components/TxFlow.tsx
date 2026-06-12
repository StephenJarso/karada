import { CheckCircle2, Lock, Send, Sparkles } from "lucide-react";

export type TxStage = "idle" | "lock" | "ship" | "settle";

const steps = [
  { key: "lock", label: "Lock", sub: "HTLC commit", icon: Lock },
  { key: "ship", label: "Ship", sub: "Dispatch", icon: Send },
  { key: "settle", label: "Settle", sub: "Preimage release", icon: Sparkles },
] as const;

const order: TxStage[] = ["idle", "lock", "ship", "settle"];

export function TxFlow({ stage }: { stage: TxStage }) {
  const activeIdx = order.indexOf(stage);

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between gap-2">
        {steps.map((step, i) => {
          const reached = activeIdx >= i + 1;
          const isCurrent = activeIdx === i + 1;
          const Icon = reached ? CheckCircle2 : step.icon;
          return (
            <div key={step.key} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-2 flex-shrink-0">
                <div
                  className={`relative h-12 w-12 rounded-xl flex items-center justify-center transition-all duration-500 ${
                    reached
                      ? "bg-sunset shadow-amber text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  } ${isCurrent ? "animate-glow-amber" : ""}`}
                >
                  <Icon className="h-5 w-5" strokeWidth={2.4} />
                  {isCurrent && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary animate-pulse-dot" />
                  )}
                </div>
                <div className="text-center">
                  <div
                    className={`text-xs font-semibold ${reached ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    {step.label}
                  </div>
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
                    {step.sub}
                  </div>
                </div>
              </div>
              {i < steps.length - 1 && (
                <div className="flex-1 mx-2 h-[2px] relative overflow-hidden rounded">
                  <div className="absolute inset-0 bg-border" />
                  <div
                    className={`absolute inset-y-0 left-0 bg-sunset transition-all duration-700 ${
                      activeIdx > i + 1 ? "w-full" : isCurrent ? "w-1/2 animate-shimmer" : "w-0"
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
