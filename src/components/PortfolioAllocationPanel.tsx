"use client";

import React, { useState, useMemo } from "react";
import {
  ShieldAlert,
  Scale,
  ArrowUpCircle,
  ArrowDownCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { PortfolioSummary, RiskProfileType } from "@/types/stock";
import {
  calculatePortfolioRebalancing,
  RISK_PROFILES,
} from "@/lib/portfolio";
import { formatCurrency } from "@/lib/utils";

interface PortfolioAllocationPanelProps {
  summary: PortfolioSummary;
}

const PROFILE_OPTIONS: RiskProfileType[] = [
  "Moderate",
  "Volatile",
  "Aggressive",
];

export const PortfolioAllocationPanel: React.FC<
  PortfolioAllocationPanelProps
> = ({ summary }) => {
  const [riskProfile, setRiskProfile] = useState<RiskProfileType>("Moderate");
  const [expanded, setExpanded] = useState<boolean>(true);

  const report = useMemo(
    () => calculatePortfolioRebalancing(summary, riskProfile),
    [summary, riskProfile]
  );

  const healthColor =
    report.healthScore >= 85
      ? "text-emerald-400 bg-emerald-500/15 border-emerald-500/30"
      : report.healthScore >= 65
      ? "text-[#F5B700] bg-[#F5B700]/15 border-[#F5B700]/30"
      : "text-rose-400 bg-rose-500/15 border-rose-500/30";

  return (
    <div className="rounded-2xl p-3.5 sm:p-4 bg-[#0A192F]/85 border border-white/10 space-y-3">
      {/* Header Row with Collapse Toggle & Health Score */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="flex items-center gap-2 text-left min-w-0"
        >
          <div className="p-1.5 rounded-lg bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shrink-0">
            <Scale className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider block truncate">
              Risk Allocation & Rebalancing
            </span>
            <span className="text-[10px] font-mono text-white/45 block truncate">
              Profil {report.profile.label} · Deviasi Maks{" "}
              {report.maxAbsDeviationPercent}%
            </span>
          </div>
        </button>

        <div className="flex items-center gap-2 shrink-0">
          {summary.totalEquityIDR > 0 && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${healthColor}`}
              title="Skor keselarasan alokasi aktual terhadap target profil risiko"
            >
              Skor {report.healthScore}%
            </span>
          )}
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Toggle Risk Allocation Panel"
          >
            {expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="space-y-3 pt-1">
          {/* Risk Profile Selector (Moderate, Volatile, Aggressive) */}
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[#040914]/90 border border-white/10">
            {PROFILE_OPTIONS.map((profileId) => {
              const active = riskProfile === profileId;
              const targetDef = RISK_PROFILES[profileId];
              return (
                <button
                  key={profileId}
                  type="button"
                  onClick={() => setRiskProfile(profileId)}
                  className={`min-h-[36px] px-2 py-1.5 rounded-lg font-mono text-[10px] sm:text-[11px] font-bold transition-all text-center ${
                    active
                      ? "bg-[#F5B700] text-navy-950 shadow-gold"
                      : "text-white/60 hover:text-white hover:bg-white/[0.06]"
                  }`}
                  title={targetDef.description}
                >
                  {targetDef.label}
                </button>
              );
            })}
          </div>

          <p className="text-[11px] text-white/55 leading-relaxed px-0.5">
            {report.profile.description}
          </p>

          {/* Asset Class Allocation & Rebalancing Breakdown */}
          {summary.totalEquityIDR <= 0 ? (
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center text-xs font-mono text-white/45 flex items-center justify-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#F5B700]" />
              <span>Tambahkan aset untuk melihat analisis rebalancing.</span>
            </div>
          ) : (
            <div className="space-y-2.5">
              {report.buckets.map((b) => {
                const statusBadge =
                  b.status === "Overweight"
                    ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                    : b.status === "Underweight"
                    ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/30"
                    : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";

                const devSign = b.deviationPercent > 0 ? "+" : "";

                return (
                  <div
                    key={b.bucket}
                    className="p-3 rounded-xl bg-[#040914]/70 border border-white/[0.07] space-y-2"
                  >
                    {/* Top Row: Asset Class Label & Status Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: b.color }}
                        />
                        <span className="font-mono text-xs font-bold text-white truncate">
                          {b.label}
                        </span>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-bold border shrink-0 ${statusBadge}`}
                      >
                        {b.status} ({devSign}
                        {b.deviationPercent}%)
                      </span>
                    </div>

                    {/* Visual Actual vs Target Progress Bar */}
                    <div className="space-y-1">
                      <div className="relative w-full h-2 rounded-full bg-white/[0.07] overflow-hidden">
                        {/* Actual Weight Bar */}
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, b.actualWeightPercent)}%`,
                            backgroundColor: b.color,
                          }}
                        />
                        {/* Target Weight Marker Line */}
                        <div
                          className="absolute top-0 bottom-0 w-[2px] bg-white shadow-[0_0_6px_#fff]"
                          style={{
                            left: `${Math.min(99, b.targetWeightPercent)}%`,
                          }}
                          title={`Target: ${b.targetWeightPercent}%`}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-mono text-white/50">
                        <span>
                          Aktual:{" "}
                          <b className="text-white">{b.actualWeightPercent}%</b>
                        </span>
                        <span>
                          Target:{" "}
                          <b className="text-white/80">
                            {b.targetWeightPercent}%
                          </b>
                        </span>
                      </div>
                    </div>

                    {/* Rebalancing Nominal Suggestion */}
                    <div className="pt-1.5 border-t border-white/[0.06] flex items-center justify-between gap-2 text-[11px] font-mono">
                      <span className="text-white/45 flex items-center gap-1">
                        {b.status === "Underweight" ? (
                          <ArrowUpCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        ) : b.status === "Overweight" ? (
                          <ArrowDownCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        )}
                        <span>{b.actionLabel}</span>
                      </span>

                      <span
                        className={`font-bold ${
                          b.suggestedActionIDR > 0
                            ? "text-cyan-300"
                            : b.suggestedActionIDR < 0
                            ? "text-rose-400"
                            : "text-emerald-400"
                        }`}
                      >
                        {b.suggestedActionIDR === 0
                          ? "Proporsional"
                          : `${b.suggestedActionIDR > 0 ? "+" : "-"}${formatCurrency(
                              Math.abs(b.suggestedActionIDR),
                              "IDR",
                              "Rp"
                            )}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
