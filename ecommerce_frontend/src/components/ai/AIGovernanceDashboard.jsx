import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ShieldCheck,
  Zap,
  DollarSign,
  Activity,
  Layers,
  Database,
  RefreshCw,
  Clock,
  Sparkles,
  Server,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  BarChart3,
  Play,
  Flame,
} from "lucide-react";
import {
  getAIGovernance,
  dispatchAsyncQuotaAuditTask,
  dispatchAsyncReindexTask,
} from "../../services/aiService";
import { useTaskStore } from "../../stores/taskStore";

export default function AIGovernanceDashboard() {
  const addTask = useTaskStore((state) => state.addTask);
  const [isAuditing, setIsAuditing] = useState(false);
  const [isReindexing, setIsReindexing] = useState(false);
  const [actionNotice, setActionNotice] = useState(null);

  // Poll every 4 seconds so when any customer or admin uses AI chat, it live-updates!
  const {
    data: governance,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["ai-governance"],
    queryFn: getAIGovernance,
    refetchInterval: 4000,
    staleTime: 3000,
  });

  const handleTriggerQuotaAudit = async () => {
    setIsAuditing(true);
    setActionNotice(null);
    try {
      const data = await dispatchAsyncQuotaAuditTask();
      addTask({
        taskId: data.task_id,
        type: "quota_audit",
        title: "AI Quota & Cost Audit",
        metadata: { initiatedAt: new Date().toISOString() },
      });
      setActionNotice({
        type: "success",
        text: "Celery Background Task dispatched: Running full AI quota & zero-spend audit...",
      });
    } catch (err) {
      console.error("Failed to dispatch quota audit task:", err);
      setActionNotice({
        type: "error",
        text: err.response?.data?.detail || "Failed to dispatch Celery quota audit task.",
      });
    } finally {
      setIsAuditing(false);
    }
  };

  const handleTriggerReindex = async () => {
    setIsReindexing(true);
    setActionNotice(null);
    try {
      const data = await dispatchAsyncReindexTask();
      addTask({
        taskId: data.task_id,
        type: "ai_reindex",
        title: "Vector Store Reindex",
        metadata: { initiatedAt: new Date().toISOString() },
      });
      setActionNotice({
        type: "success",
        text: "Celery Background Task dispatched: Vectorizing catalog in background worker...",
      });
    } catch (err) {
      console.error("Failed to dispatch reindex task:", err);
      setActionNotice({
        type: "error",
        text: err.response?.data?.detail || "Failed to dispatch reindex task.",
      });
    } finally {
      setIsReindexing(false);
    }
  };

  if (isLoading && !governance) {
    return (
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: "16px",
          border: "1px solid #E2E8F0",
          padding: "36px",
          textAlign: "center",
          boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
          marginTop: "24px",
          marginBottom: "28px",
        }}
      >
        <RefreshCw
          size={28}
          className="animate-spin"
          style={{ color: "#6C5CE7", margin: "0 auto 12px", animation: "spin 1s linear infinite" }}
        />
        <h4 style={{ margin: "0 0 6px", fontSize: "16px", fontWeight: 700, color: "#1E272E" }}>
          Loading Responsible AI & Cost Governance telemetry...
        </h4>
        <p style={{ margin: 0, fontSize: "13px", color: "#64748B" }}>
          Polling free-tier quotas and active rate limit meters...
        </p>
      </div>
    );
  }

  if (isError && !governance) {
    return (
      <div
        style={{
          background: "#FEF2F2",
          borderRadius: "16px",
          border: "1px solid #FEE2E2",
          padding: "24px",
          marginTop: "24px",
          marginBottom: "28px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#DC2626" }}>
          <AlertTriangle size={20} />
          <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 700 }}>
            Unable to load AI Governance Telemetry
          </h4>
        </div>
        <p style={{ margin: "8px 0 12px", fontSize: "13px", color: "#7F1D1D" }}>
          {error?.response?.status === 403 || error?.response?.status === 401
            ? "Administrator privilege is required to inspect AI Quota & Cost Governance."
            : error?.message || "Failed to retrieve quota telemetry from server."}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          style={{
            background: "#DC2626",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "8px",
            padding: "8px 14px",
            fontSize: "12px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const providers = governance?.providers_quota || {};
  const totalUsed = governance?.total_requests_used ?? 0;
  const totalRemaining = governance?.total_remaining_requests ?? 0;
  const totalQuota = governance?.total_daily_quota ?? 16900;
  const overallUsedPct = totalQuota > 0 ? ((totalUsed / totalQuota) * 100).toFixed(1) : 0;
  const lastUpdatedFormatted = governance?.last_updated
    ? new Date(governance.last_updated).toLocaleTimeString()
    : "Just now";

  return (
    <section
      id="ai-governance-section"
      style={{
        marginTop: "32px",
        marginBottom: "36px",
        background: "linear-gradient(180deg, #FFFFFF 0%, #FAFBFC 100%)",
        borderRadius: "20px",
        border: "1px solid #E2E8F0",
        padding: "28px 30px",
        boxShadow: "0 8px 30px rgba(0, 0, 0, 0.04)",
      }}
    >
      {/* Header Banner */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "16px",
          paddingBottom: "22px",
          borderBottom: "1px solid #EDF2F7",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <div
              style={{
                background: "linear-gradient(135deg, #6C5CE7 0%, #4834D4 100%)",
                color: "#FFFFFF",
                padding: "9px",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(108, 92, 231, 0.3)",
              }}
            >
              <ShieldCheck size={24} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "20px",
                    fontWeight: 800,
                    color: "#1E272E",
                    letterSpacing: "-0.3px",
                  }}
                >
                  Responsible AI & Cost Governance
                </h2>
                <span
                  style={{
                    background: "#E0F2FE",
                    color: "#0369A1",
                    fontSize: "11px",
                    fontWeight: 800,
                    padding: "3px 9px",
                    borderRadius: "999px",
                    letterSpacing: "0.2px",
                  }}
                >
                  ADMIN ONLY
                </span>
              </div>
              <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748B" }}>
                Real-time free-tier API quota tracking, rate limits, caching efficiency, and guaranteed $0 spend.
              </p>
            </div>
          </div>
        </div>

        {/* Live Telemetry Status & Refresh */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {/* Pulsing indicator */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "#F0FDF4",
              border: "1px solid #DCFCE7",
              color: "#15803D",
              padding: "6px 12px",
              borderRadius: "999px",
              fontSize: "12px",
              fontWeight: 700,
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#22C55E",
                boxShadow: "0 0 8px #22C55E",
                animation: "pulse 2s infinite",
              }}
            />
            <span>Live Sync Active</span>
            <span style={{ color: "#86EFAC" }}>•</span>
            <span style={{ fontSize: "11px", color: "#166534" }}>{lastUpdatedFormatted}</span>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            title="Refresh quota metrics now"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "#FFFFFF",
              color: "#475569",
              border: "1px solid #CBD5E1",
              padding: "7px 12px",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <RefreshCw
              size={13}
              style={{
                animation: isFetching ? "spin 1s linear infinite" : "none",
              }}
            />
            <span>{isFetching ? "Updating..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionNotice && (
        <div
          style={{
            marginTop: "16px",
            padding: "12px 16px",
            borderRadius: "10px",
            background: actionNotice.type === "success" ? "#F0FDF4" : "#FEF2F2",
            border: `1px solid ${actionNotice.type === "success" ? "#BBF7D0" : "#FECACA"}`,
            color: actionNotice.type === "success" ? "#15803D" : "#B91C1C",
            fontSize: "13px",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {actionNotice.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>{actionNotice.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: "14px" }}
          >
            ×
          </button>
        </div>
      )}

      {/* Top Level KPI Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "14px",
          marginTop: "20px",
          marginBottom: "24px",
        }}
      >
        {/* Card 1: $0 Budget Target */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "14px",
            border: "1px solid #E2E8F0",
            padding: "16px 18px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
              Budget Target
            </span>
            <div style={{ background: "#ECFDF5", color: "#059669", padding: "5px", borderRadius: "8px" }}>
              <DollarSign size={16} />
            </div>
          </div>
          <div style={{ marginTop: "10px", display: "flex", alignItems: "baseline", gap: "8px" }}>
            <span style={{ fontSize: "24px", fontWeight: 900, color: "#059669" }}>$0.00</span>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#059669", background: "#D1FAE5", padding: "2px 6px", borderRadius: "4px" }}>
              100% Free
            </span>
          </div>
          <p style={{ margin: "6px 0 0", fontSize: "11px", color: "#64748B" }}>
            Actual Spend: <strong>${(governance?.actual_spend_usd ?? 0).toFixed(2)}</strong> (Target Met)
          </p>
        </div>

        {/* Card 2: Total Requests Used vs Remaining */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "14px",
            border: "1px solid #E2E8F0",
            padding: "16px 18px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
              Today's Requests
            </span>
            <div style={{ background: "#EFF6FF", color: "#2563EB", padding: "5px", borderRadius: "8px" }}>
              <Activity size={16} />
            </div>
          </div>
          <div style={{ marginTop: "10px", display: "flex", alignItems: "baseline", gap: "8px" }}>
            <span style={{ fontSize: "24px", fontWeight: 900, color: "#1E272E" }}>
              {totalUsed}
            </span>
            <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 600 }}>
              used
            </span>
          </div>
          <p style={{ margin: "6px 0 0", fontSize: "11px", color: "#2563EB", fontWeight: 700 }}>
            {totalRemaining.toLocaleString()} remaining today ({overallUsedPct}% of daily pool)
          </p>
        </div>

        {/* Card 3: Commercial Savings */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "14px",
            border: "1px solid #E2E8F0",
            padding: "16px 18px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
              Commercial Savings
            </span>
            <div style={{ background: "#F5F3FF", color: "#7C3AED", padding: "5px", borderRadius: "8px" }}>
              <TrendingDown size={16} />
            </div>
          </div>
          <div style={{ marginTop: "10px", display: "flex", alignItems: "baseline", gap: "8px" }}>
            <span style={{ fontSize: "24px", fontWeight: 900, color: "#7C3AED" }}>
              ${(governance?.total_savings_usd ?? 0).toFixed(4)}
            </span>
          </div>
          <p style={{ margin: "6px 0 0", fontSize: "11px", color: "#64748B" }}>
            Saved vs paid proprietary LLMs (e.g. GPT-4o-mini)
          </p>
        </div>

        {/* Card 4: Redis Cache Hits & Savings */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "14px",
            border: "1px solid #E2E8F0",
            padding: "16px 18px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
              Redis AI Cache
            </span>
            <div style={{ background: "#FEF3C7", color: "#D97706", padding: "5px", borderRadius: "8px" }}>
              <Zap size={16} />
            </div>
          </div>
          <div style={{ marginTop: "10px", display: "flex", alignItems: "baseline", gap: "8px" }}>
            <span style={{ fontSize: "24px", fontWeight: 900, color: "#D97706" }}>
              {governance?.cache_hits_today ?? 0}
            </span>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#B45309", background: "#FEF3C7", padding: "2px 6px", borderRadius: "4px" }}>
              {governance?.cache_hit_ratio_pct ?? 0}% hits
            </span>
          </div>
          <p style={{ margin: "6px 0 0", fontSize: "11px", color: "#64748B" }}>
            ${(governance?.cache_savings_usd ?? 0).toFixed(4)} saved by instant cached queries
          </p>
        </div>
      </div>

      {/* Provider Quota Tracking Grid */}
      <div style={{ marginTop: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#1E272E" }}>
              Free-Tier Provider Quota Tracking & Live Meters
            </h3>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748B" }}>
              Active allowances, request counts, rate limits, and remaining balance per provider.
            </p>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
            gap: "16px",
          }}
        >
          {Object.entries(providers).map(([providerKey, data]) => {
            const used = data.today_requests ?? 0;
            const limit = data.daily_limit ?? 1;
            const remaining = data.remaining_requests ?? Math.max(0, limit - used);
            const usagePct = data.usage_percentage ?? Number(((used / limit) * 100).toFixed(1));

            // Theme colors per provider
            let brandColor = "#6C5CE7";
            let brandBg = "#F0EDFD";
            let progressGrad = "linear-gradient(90deg, #6C5CE7 0%, #A29BFE 100%)";

            if (providerKey === "gemini") {
              brandColor = "#2563EB";
              brandBg = "#EFF6FF";
              progressGrad = "linear-gradient(90deg, #2563EB 0%, #60A5FA 100%)";
            } else if (providerKey === "mistral") {
              brandColor = "#EA580C";
              brandBg = "#FFF7ED";
              progressGrad = "linear-gradient(90deg, #EA580C 0%, #FDBA74 100%)";
            }

            return (
              <div
                key={providerKey}
                style={{
                  background: "#FFFFFF",
                  borderRadius: "14px",
                  border: "1px solid #E2E8F0",
                  padding: "20px",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
              >
                <div>
                  {/* Card Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div
                        style={{
                          background: brandBg,
                          color: brandColor,
                          padding: "7px",
                          borderRadius: "10px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Cpu size={18} />
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 800, color: "#1E272E" }}>
                          {data.name || providerKey.toUpperCase()}
                        </h4>
                        <span style={{ fontSize: "11px", color: "#64748B" }}>
                          Free Tier • $0/token
                        </span>
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 800,
                        padding: "3px 8px",
                        borderRadius: "999px",
                        background: data.status === "HEALTHY" ? "#ECFDF5" : "#FEF3C7",
                        color: data.status === "HEALTHY" ? "#059669" : "#D97706",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      {data.status === "HEALTHY" ? <CheckCircle2 size={11} /> : <AlertTriangle size={11} />}
                      {data.status || "HEALTHY"}
                    </span>
                  </div>

                  {/* Main Usage Meter */}
                  <div
                    style={{
                      background: "#F8FAFC",
                      borderRadius: "10px",
                      padding: "12px 14px",
                      marginBottom: "14px",
                      border: "1px solid #EDF2F7",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px" }}>
                      <div>
                        <span style={{ fontSize: "20px", fontWeight: 900, color: "#1E272E" }}>
                          {used.toLocaleString()}
                        </span>
                        <span style={{ fontSize: "12px", color: "#64748B", marginLeft: "4px" }}>
                          / {limit.toLocaleString()} reqs used
                        </span>
                      </div>
                      <span style={{ fontSize: "13px", fontWeight: 800, color: brandColor }}>
                        {usagePct}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div
                      style={{
                        height: "8px",
                        width: "100%",
                        background: "#E2E8F0",
                        borderRadius: "999px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${Math.max(1, Math.min(100, usagePct))}%`,
                          background: progressGrad,
                          borderRadius: "999px",
                          transition: "width 0.5s ease-out",
                        }}
                      />
                    </div>

                    {/* Remaining Callout */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: "8px",
                        fontSize: "11px",
                        fontWeight: 700,
                      }}
                    >
                      <span style={{ color: "#059669" }}>
                        Remaining: {remaining.toLocaleString()} requests
                      </span>
                      <span style={{ color: "#64748B" }}>
                        Daily Cap: {limit.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Sub-metrics */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "8px",
                      fontSize: "11px",
                      color: "#475569",
                    }}
                  >
                    <div style={{ background: "#F1F5F9", padding: "6px 10px", borderRadius: "6px" }}>
                      <span style={{ color: "#64748B", display: "block" }}>Rate Limit</span>
                      <strong>{data.rpm_limit} RPM</strong>
                    </div>
                    <div style={{ background: "#F1F5F9", padding: "6px 10px", borderRadius: "6px" }}>
                      <span style={{ color: "#64748B", display: "block" }}>Tokens Today</span>
                      <strong>{(data.tokens_consumed || 0).toLocaleString()}</strong>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: "12px",
                    paddingTop: "10px",
                    borderTop: "1px dashed #E2E8F0",
                    fontSize: "11px",
                    color: "#64748B",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>Commercial value:</span>
                  <strong style={{ color: "#7C3AED" }}>
                    +${(data.commercial_savings_usd || 0).toFixed(4)} saved
                  </strong>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Governance Architecture & Background Tasks Controls */}
      <div
        style={{
          marginTop: "26px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "16px",
        }}
      >
        {/* Left: Policy & Routing Protocol */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "14px",
            border: "1px solid #E2E8F0",
            padding: "20px 22px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <Layers size={18} color="#6C5CE7" />
            <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 800, color: "#1E272E" }}>
              Active Routing & Cost Governance Policy
            </h4>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "12px" }}>
            <div>
              <span style={{ color: "#64748B", fontWeight: 600, display: "block", marginBottom: "4px" }}>
                Multi-tier Dynamic Failover Protocol:
              </span>
              <div
                style={{
                  background: "#F8FAFC",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid #E2E8F0",
                  fontFamily: "monospace",
                  fontSize: "11px",
                  color: "#1E293B",
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "6px",
                }}
              >
                <span style={{ color: "#6C5CE7", fontWeight: 700 }}>Groq (Llama 3.3)</span>
                <span>➔</span>
                <span style={{ color: "#2563EB", fontWeight: 700 }}>Gemini 2.0</span>
                <span>➔</span>
                <span style={{ color: "#EA580C", fontWeight: 700 }}>Mistral</span>
                <span>➔</span>
                <span style={{ color: "#059669", fontWeight: 700 }}>Local Catalog Engine</span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <div style={{ background: "#F8FAFC", padding: "8px 10px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                <span style={{ color: "#64748B", fontSize: "11px", display: "block" }}>Rate Limiting</span>
                <strong style={{ fontSize: "11px", color: "#1E272E" }}>30 req/min (JWT + IP)</strong>
              </div>
              <div style={{ background: "#F8FAFC", padding: "8px 10px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                <span style={{ color: "#64748B", fontSize: "11px", display: "block" }}>Cache TTL</span>
                <strong style={{ fontSize: "11px", color: "#1E272E" }}>15-30m SHA-256 Redis</strong>
              </div>
            </div>

            <div style={{ color: "#059669", fontSize: "11px", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
              <CheckCircle2 size={13} />
              <span>Strict $0 Out-of-Pocket Cap: Paid provider fallbacks disabled.</span>
            </div>
          </div>
        </div>

        {/* Right: Background Tasks Trigger Controls (Celery) */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "14px",
            border: "1px solid #E2E8F0",
            padding: "20px 22px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <Server size={18} color="#2563EB" />
              <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 800, color: "#1E272E" }}>
                Celery Background Tasks (Admin Actions)
              </h4>
            </div>
            <p style={{ margin: "0 0 14px", fontSize: "12px", color: "#64748B" }}>
              Dispatch asynchronous Celery background workers to audit rate limits or reindex embeddings without blocking HTTP workers.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {/* Celery Task Button 1: Quota Audit */}
              <button
                type="button"
                onClick={handleTriggerQuotaAudit}
                disabled={isAuditing}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "10px",
                  padding: "10px 16px",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: isAuditing ? "not-allowed" : "pointer",
                  opacity: isAuditing ? 0.7 : 1,
                  boxShadow: "0 2px 8px rgba(37, 99, 235, 0.25)",
                  transition: "all 0.2s",
                }}
              >
                <ShieldCheck size={16} />
                <span>{isAuditing ? "Dispatching Audit..." : "Run Quota & Cost Audit (Background Task)"}</span>
              </button>

              {/* Celery Task Button 2: Reindex ChromaDB */}
              <button
                type="button"
                onClick={handleTriggerReindex}
                disabled={isReindexing}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  background: "#F8FAFC",
                  color: "#334155",
                  border: "1px solid #CBD5E1",
                  borderRadius: "10px",
                  padding: "10px 16px",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: isReindexing ? "not-allowed" : "pointer",
                  opacity: isReindexing ? 0.7 : 1,
                  transition: "all 0.2s",
                }}
              >
                <Sparkles size={16} color="#D97706" />
                <span>{isReindexing ? "Queuing Vector Reindex..." : "Reindex Vector Store (Background Task)"}</span>
              </button>
            </div>
          </div>

          <span style={{ fontSize: "11px", color: "#64748B", marginTop: "14px", display: "block" }}>
            Tasks run in Celery background workers and report live progress in the Background Task Tracker.
          </span>
        </div>
      </div>
    </section>
  );
}
