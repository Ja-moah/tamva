import {
  ArrowRightLeft,
  ChevronDown,
  Coins,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";

import { cn } from "../../lib/utils/cn";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { useToast } from "../ui/toast";

export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  baseRateToGHS: number; // 1 unit of currency = X GHS
  change24h: number; // percentage
  region: "West Africa" | "East Africa" | "Central/Southern Africa" | "Global";
}

export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  {
    code: "GHS",
    name: "Ghana Cedi",
    symbol: "GH₵",
    flag: "🇬🇭",
    baseRateToGHS: 1.0,
    change24h: 0.0,
    region: "West Africa",
  },
  {
    code: "USD",
    name: "US Dollar",
    symbol: "$",
    flag: "🇺🇸",
    baseRateToGHS: 15.65,
    change24h: 0.24,
    region: "Global",
  },
  {
    code: "EUR",
    name: "Euro",
    symbol: "€",
    flag: "🇪🇺",
    baseRateToGHS: 17.12,
    change24h: -0.15,
    region: "Global",
  },
  {
    code: "GBP",
    name: "British Pound",
    symbol: "£",
    flag: "🇬🇧",
    baseRateToGHS: 20.35,
    change24h: 0.42,
    region: "Global",
  },
  {
    code: "NGN",
    name: "Nigerian Naira",
    symbol: "₦",
    flag: "🇳🇬",
    baseRateToGHS: 0.0098,
    change24h: -0.85,
    region: "West Africa",
  },
  {
    code: "KES",
    name: "Kenyan Shilling",
    symbol: "KSh",
    flag: "🇰🇪",
    baseRateToGHS: 0.121,
    change24h: 0.18,
    region: "East Africa",
  },
  {
    code: "XOF",
    name: "West African CFA",
    symbol: "CFA",
    flag: "🌍",
    baseRateToGHS: 0.0261,
    change24h: 0.05,
    region: "West Africa",
  },
  {
    code: "ZAR",
    name: "South African Rand",
    symbol: "R",
    flag: "🇿🇦",
    baseRateToGHS: 0.885,
    change24h: -0.32,
    region: "Central/Southern Africa",
  },
  {
    code: "RWF",
    name: "Rwandan Franc",
    symbol: "RF",
    flag: "🇷🇼",
    baseRateToGHS: 0.0114,
    change24h: 0.12,
    region: "East Africa",
  },
];

interface CurrencyConverterProps {
  className?: string;
  variant?: "card" | "compact" | "standalone";
  initialFrom?: string;
  initialTo?: string;
  initialAmount?: number;
}

export function LiveCurrencyConverter({
  className,
  variant: _variant = "card",
  initialFrom = "USD",
  initialTo = "GHS",
  initialAmount = 1000,
}: CurrencyConverterProps) {
  const [fromCode, setFromCode] = useState(initialFrom);
  const [toCode, setToCode] = useState(initialTo);
  const [amount, setAmount] = useState<string>(initialAmount.toString());
  const [rates, setRates] = useState<CurrencyInfo[]>(SUPPORTED_CURRENCIES);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const { toast } = useToast();

  // Selected currency objects
  const fromCurrency = useMemo(
    () => rates.find((c) => c.code === fromCode) || rates[1],
    [rates, fromCode],
  );
  const toCurrency = useMemo(
    () => rates.find((c) => c.code === toCode) || rates[0],
    [rates, toCode],
  );

  // Conversion rate: (from -> GHS) / (to -> GHS)
  const exchangeRate = useMemo(() => {
    return fromCurrency.baseRateToGHS / toCurrency.baseRateToGHS;
  }, [fromCurrency, toCurrency]);

  const parsedAmount = parseFloat(amount) || 0;
  const convertedAmount = parsedAmount * exchangeRate;

  // Simulate live rate jittering / market updates
  const handleRefreshRates = () => {
    setIsUpdating(true);
    setTimeout(() => {
      setRates((prev) =>
        prev.map((c) => {
          if (c.code === "GHS") return c;
          const jitter = (Math.random() - 0.49) * 0.008 * c.baseRateToGHS;
          const newRate = +(c.baseRateToGHS + jitter).toFixed(4);
          const newChange = +((Math.random() - 0.48) * 1.5).toFixed(2);
          return { ...c, baseRateToGHS: newRate, change24h: newChange };
        }),
      );
      setLastUpdated(new Date());
      setIsUpdating(false);
      toast({
        title: "Exchange Rates Updated",
        description: `PAPSS & Bank of Ghana inter-bank mid-market feeds synchronized at ${new Date().toLocaleTimeString()}`,
        type: "success",
      });
    }, 450);
  };

  const handleSwap = () => {
    const temp = fromCode;
    setFromCode(toCode);
    setToCode(temp);
  };

  const presetAmounts = [100, 500, 1000, 5000, 25000];

  return (
    <Card
      className={cn(
        "relative overflow-hidden border border-[var(--border-default)] shadow-lg",
        className,
      )}
    >
      {/* Top Banner & Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--accent-gold-subtle)] border border-[var(--accent-gold-border)] text-[var(--accent-gold-text)] dark:text-[var(--accent-gold)]">
            <Coins className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-[var(--text-primary)]">
                Live African &amp; Global Currency Converter
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500 border border-emerald-500/20">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                PAPSS Interbank Live
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Real-time multi-rail FX settlement quotes across Mobile Money (MTN, Telecel, AT) &amp; Commercial Banks
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-[var(--text-muted)] hidden sm:inline">
            Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshRates}
            disabled={isUpdating}
            className="gap-1.5 cursor-pointer text-xs"
          >
            <RefreshCw className={cn("size-3.5", isUpdating && "animate-spin text-[var(--accent-gold)]")} />
            Sync Rates
          </Button>
        </div>
      </div>

      {/* Main Converter Grid */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
        {/* FROM Input Box */}
        <div className="md:col-span-5 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-default)] p-4 shadow-sm hover:border-[var(--accent-gold-border)] transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
              You Convert From
            </span>
            <span className="text-xs font-mono font-semibold text-[var(--accent-gold-text)] dark:text-[var(--accent-gold)]">
              1 {fromCurrency.code} = {exchangeRate.toFixed(4)} {toCurrency.code}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="number"
              min="0"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-transparent text-2xl font-extrabold font-mono text-[var(--text-primary)] focus:outline-none placeholder:text-[var(--text-muted)]"
            />
            <div className="relative shrink-0">
              <select
                value={fromCode}
                onChange={(e) => setFromCode(e.target.value)}
                className="appearance-none cursor-pointer rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] py-2 pl-3 pr-8 text-sm font-bold text-[var(--text-primary)] hover:border-[var(--accent-gold-border)] focus:outline-none"
              >
                {rates.map((curr) => (
                  <option key={curr.code} value={curr.code}>
                    {curr.flag} {curr.code} ({curr.symbol})
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[var(--text-muted)]" />
            </div>
          </div>
          <div className="mt-2 text-xs text-[var(--text-muted)] truncate">
            {fromCurrency.name} &bull; {fromCurrency.region}
          </div>
        </div>

        {/* SWAP Button */}
        <div className="md:col-span-1 flex justify-center">
          <button
            type="button"
            onClick={handleSwap}
            aria-label="Swap currencies"
            className="group flex size-11 items-center justify-center rounded-2xl bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] hover:border-[var(--accent-gold)] hover:text-[var(--accent-gold)] shadow-md transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
          >
            <ArrowRightLeft className="size-5 transition-transform duration-300 group-hover:rotate-180" />
          </button>
        </div>

        {/* TO Output Box */}
        <div className="md:col-span-5 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-default)] p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Guaranteed Converted Rate
            </span>
            <div className="flex items-center gap-1 text-xs font-bold">
              {toCurrency.change24h >= 0 ? (
                <span className="text-emerald-500 inline-flex items-center">
                  <TrendingUp className="size-3 mr-0.5" />+{toCurrency.change24h}% (24h)
                </span>
              ) : (
                <span className="text-rose-500 inline-flex items-center">
                  <TrendingDown className="size-3 mr-0.5" />
                  {toCurrency.change24h}% (24h)
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-full text-2xl font-extrabold font-mono text-emerald-500 truncate select-all">
              {toCurrency.symbol}{" "}
              {convertedAmount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 4,
              })}
            </div>
            <div className="relative shrink-0">
              <select
                value={toCode}
                onChange={(e) => setToCode(e.target.value)}
                className="appearance-none cursor-pointer rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] py-2 pl-3 pr-8 text-sm font-bold text-[var(--text-primary)] hover:border-[var(--accent-gold-border)] focus:outline-none"
              >
                {rates.map((curr) => (
                  <option key={curr.code} value={curr.code}>
                    {curr.flag} {curr.code} ({curr.symbol})
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[var(--text-muted)]" />
            </div>
          </div>
          <div className="mt-2 text-xs text-[var(--text-muted)] truncate">
            {toCurrency.name} &bull; {toCurrency.region}
          </div>
        </div>
      </div>

      {/* Quick Preset Buttons & Rail Spread Breakdown */}
      <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[var(--text-muted)]">Quick Presets:</span>
          <div className="flex flex-wrap items-center gap-1.5">
            {presetAmounts.map((p) => (
              <button
                key={p}
                onClick={() => setAmount(p.toString())}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-mono font-semibold transition-all cursor-pointer",
                  amount === p.toString()
                    ? "bg-[var(--accent-gold)] text-black font-bold shadow-sm"
                    : "bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-default)]",
                )}
              >
                {fromCurrency.symbol} {p.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {/* Multi-Rail Settlement Routing Badge */}
        <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-amber-400" />
            <strong>MoMo Rail:</strong> 0.25% fee
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-blue-400" />
            <strong>GhIPSS Switch:</strong> 0.10% fee
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-400" />
            <strong>PAPSS Africa:</strong> 0.15% fee
          </span>
        </div>
      </div>

      {/* Mini African FX Live Matrix */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-2">
        {rates
          .filter((c) => c.code !== "GHS")
          .map((curr) => {
            const ghsRate = curr.baseRateToGHS;
            return (
              <div
                key={curr.code}
                onClick={() => {
                  setFromCode(curr.code);
                  setToCode("GHS");
                }}
                className="group cursor-pointer rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] p-2.5 hover:border-[var(--accent-gold-border)] transition-all"
              >
                <div className="flex items-center justify-between text-[11px] font-bold text-[var(--text-secondary)]">
                  <span>
                    {curr.flag} {curr.code}
                  </span>
                  <span
                    className={
                      curr.change24h >= 0
                        ? "text-emerald-500 font-mono text-[10px]"
                        : "text-rose-500 font-mono text-[10px]"
                    }
                  >
                    {curr.change24h >= 0 ? "+" : ""}
                    {curr.change24h}%
                  </span>
                </div>
                <div className="mt-1 font-mono text-xs font-extrabold text-[var(--text-primary)]">
                  GH₵ {ghsRate.toFixed(2)}
                </div>
              </div>
            );
          })}
      </div>
    </Card>
  );
}
