export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative h-9 w-9">
        <div className="absolute inset-0 rounded-xl bg-sunset shadow-amber" />
        <div className="absolute inset-[3px] rounded-[10px] bg-background flex items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5 text-primary"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2L4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        </div>
      </div>
      <div className="leading-none">
        <div className="font-display text-xl font-bold tracking-tight">Karada</div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Kaa Rada · Stay Alert
        </div>
      </div>
    </div>
  );
}
