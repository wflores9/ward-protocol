// src/app/page.tsx  →  Hero Section (replace your current hero)
<section className="relative flex min-h-[92vh] flex-col items-center justify-center overflow-hidden bg-[#0A1428] px-6 pt-16 text-center">
  {/* Subtle background grid / ledger lines (optional but nice) */}
  <div className="absolute inset-0 bg-[radial-gradient(#1E3A5F_0.8px,transparent_1px)] bg-[length:4px_4px] opacity-40" />

  <div className="relative z-10 mx-auto max-w-5xl">
    {/* Eyebrow */}
    <div className="mb-4 font-mono text-sm tracking-[4px] text-[#D4A017]">
      DETERMINISTIC · ON-CHAIN · ORACLE-FREE
    </div>

    {/* Logo - large centered version of your W */}
    <div className="mb-8 flex justify-center">
      <div className="relative">
        <div className="text-[120px] font-bold leading-none tracking-[-4px] text-[#93C5FD] drop-shadow-[0_0_30px_rgba(147,197,253,0.15)]">
          W
        </div>
        {/* Gold underline + sparkle */}
        <div className="mx-auto mt-1 h-[3px] w-24 bg-[#D4A017]" />
        <div className="absolute -right-1 -top-1 text-[#D4A017]">✧</div>
      </div>
    </div>

    {/* H1 - exact text you specified */}
    <h1 className="mx-auto max-w-4xl text-balance text-6xl font-semibold tracking-[-1.5px] text-white md:text-7xl">
      Deterministic default resolution<br />for on-chain lending.
    </h1>

    {/* Subheadline - exact */}
    <p className="mx-auto mt-6 max-w-3xl text-pretty text-xl leading-relaxed text-[#CBD5E1]">
      When a borrower defaults, Ward Protocol defines exactly what happens. 
      Nine on-ledger checks. No oracle. No human judgment. No Ward signature — ever.
    </p>

    {/* Small mono status line - exact */}
    <p className="mt-4 font-mono text-sm tracking-wide text-[#64748B]">
      Built on XRPL. Mainnet-ready at XLS-66 launch.
    </p>

    {/* CTAs - keep your existing buttons here */}
    <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
      <button className="rounded-xl bg-white px-8 py-3.5 font-medium text-[#0A1428] transition hover:bg-[#CBD5E1]">
        Explore the 9 Checks
      </button>
      <button className="rounded-xl border border-white/20 px-8 py-3.5 font-medium text-white transition hover:bg-white/5">
        Try on Altnet
      </button>
      <button className="rounded-xl px-8 py-3.5 font-medium text-[#93C5FD] transition hover:text-white">
        Talk to the Team →
      </button>
    </div>
  </div>
</section>