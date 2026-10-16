import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  X,
  Settings,
  Trash2,
  Send,
  Square,
  RefreshCw,
  Cpu,
  Database,
  Key,
  ShieldCheck,
  Zap,
  Bot,
  ShieldAlert,
  Wrench,
  TrendingDown,
  BarChart3,
  CheckCircle2,
} from "lucide-react";
import { useAIAssistantStore } from "../../stores/aiAssistantStore";
import {
  streamAIChat,
  reindexAICatalogue,
  chatWithAIAgent,
  getAIGovernance,
  dispatchAsyncReindexTask,
} from "../../services/aiService";
import ProductCitationCard from "./ProductCitationCard";
import "./aiAssistant.css";

const STARTER_PROMPTS = [
  "✨ What luxury blazers or evening gowns do you recommend?",
  "💎 Show me fine timepieces and leather accessories",
  "💄 What beauty products and serums are available?",
  "📦 Check order status and delivery tracking details",
];

export default function AIAssistantDrawer() {
  const {
    isOpen,
    setOpen,
    isSettingsOpen,
    toggleSettingsOpen,
    provider,
    setProvider,
    apiKey,
    setApiKey,
    isStreaming,
    setStreaming,
    setAbortController,
    stopStreaming,
    messages,
    addMessage,
    updateLastMessage,
    clearMessages,
    statusData,
    fetchStatus,
  } = useAIAssistantStore();

  const [input, setInput] = useState("");
  const [reindexing, setReindexing] = useState(false);
  const [reindexMessage, setReindexMessage] = useState(null);
  const [governanceData, setGovernanceData] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const fetchGovernance = async () => {
    try {
      const data = await getAIGovernance();
      setGovernanceData(data);
    } catch (e) {
      // Non-critical governance telemetry catch
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      fetchGovernance();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, fetchStatus]);

  useEffect(() => {
    if (isSettingsOpen) {
      fetchGovernance();
    }
  }, [isSettingsOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  if (!isOpen) return null;

  const handleSend = async (queryText) => {
    const query = (queryText || input).trim();
    if (!query || isStreaming) return;

    setInput("");

    // 1. Add user message
    addMessage({
      role: "user",
      content: query,
    });

    // 2. Prepare assistant placeholder
    const assistantMsgId = `asst-${Date.now()}`;
    addMessage({
      id: assistantMsgId,
      role: "assistant",
      content: "",
      citations: [],
      metadata: null,
      isStreaming: true,
    });

    setStreaming(true);

    if (provider === "agent") {
      try {
        const agentRes = await chatWithAIAgent({
          message: query,
          provider: "agent",
          apiKey,
        });
        updateLastMessage((prev) => ({
          ...prev,
          content: agentRes.answer || "Agent processed your request.",
          executedTools: agentRes.executed_tools || [],
          metadata: {
            provider: "Autonomous Tool Agent",
            decision: agentRes.agent_decision,
          },
          isStreaming: false,
        }));
      } catch (err) {
        updateLastMessage((prev) => ({
          ...prev,
          isStreaming: false,
          error: err.message,
          content:
            err.response?.data?.detail ||
            "The AI agent encountered an issue invoking application tools. Please try again.",
        }));
      } finally {
        setStreaming(false);
      }
      return;
    }

    const controller = new AbortController();
    setAbortController(controller);

    // Build chat history context (last 6 turns)
    const historyPayload = messages
      .filter((m) => m.content && !m.error)
      .slice(-6)
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));

    let accumulatedContent = "";

    await streamAIChat({
      query,
      history: historyPayload,
      provider,
      apiKey,
      top_k: 4,
      signal: controller.signal,
      onCitations: (sources) => {
        updateLastMessage((prev) => ({
          ...prev,
          citations: sources,
        }));
      },
      onMetadata: (meta) => {
        updateLastMessage((prev) => ({
          ...prev,
          metadata: meta,
        }));
      },
      onDelta: (chunk) => {
        accumulatedContent += chunk;
        updateLastMessage((prev) => ({
          ...prev,
          content: accumulatedContent,
        }));
      },
      onFallbackNotice: (notice) => {
        updateLastMessage((prev) => ({
          ...prev,
          fallbackNotice: `Switched from ${notice.failed_provider} due to rate limits or API availability.`,
        }));
      },
      onDone: (doneData) => {
        setStreaming(false);
        updateLastMessage((prev) => ({
          ...prev,
          isStreaming: false,
          doneStatus: doneData.status,
        }));
      },
      onError: (err) => {
        setStreaming(false);
        updateLastMessage((prev) => ({
          ...prev,
          isStreaming: false,
          error: err.message,
          content:
            accumulatedContent ||
            "I encountered a momentary service interruption. Please try again or switch providers in Settings.",
        }));
      },
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReindex = async () => {
    try {
      setReindexing(true);
      setReindexMessage(null);
      // Try Celery background worker dispatch first
      try {
        const celeryTask = await dispatchAsyncReindexTask();
        setReindexMessage(`Celery task #${celeryTask.task_id?.slice(0, 8)} queued in background!`);
      } catch {
        const res = await reindexAICatalogue();
        setReindexMessage(`Success: Indexed ${res.total_indexed} products in ChromaDB!`);
      }
      await fetchStatus();
      await fetchGovernance();
    } catch (err) {
      setReindexMessage(`Error reindexing: ${err.message}`);
    } finally {
      setReindexing(false);
      setTimeout(() => setReindexMessage(null), 5000);
    }
  };

  return (
    <div className="aura-drawer-backdrop" onClick={() => setOpen(false)}>
      <div
        className="aura-drawer-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Aura AI Shopping Concierge"
      >
        {/* Header */}
        <div className="aura-header">
          <div className="aura-header-left">
            <div className="aura-avatar">
              <Sparkles size={20} />
            </div>
            <div className="aura-title-wrap">
              <h3>
                Aura AI Concierge
                <span className="aura-status-dot" title="RAG Pipeline Active" />
              </h3>
              <div className="aura-subtitle">
                RAG Grounded Product Assistant • Powered by Google Gemini
              </div>
            </div>
          </div>

          <div className="aura-header-actions">
            <button
              type="button"
              className="aura-icon-btn"
              onClick={toggleSettingsOpen}
              title="Provider & RAG Settings"
            >
              <Settings size={18} />
            </button>
            <button
              type="button"
              className="aura-icon-btn"
              onClick={clearMessages}
              title="Clear Conversation"
            >
              <Trash2 size={18} />
            </button>
            <button
              type="button"
              className="aura-icon-btn"
              onClick={() => setOpen(false)}
              title="Close Assistant"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Provider Selector Quick Bar */}
        <div className="aura-provider-bar">
          <div className="aura-provider-select-wrap">
            <Cpu size={14} />
            <span style={{ fontWeight: 600 }}>Active Provider:</span>
            <select
              className="aura-provider-select"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
            >
              <option value="auto">Auto Fallback (Gemini → Groq → Mistral)</option>
              <option value="gemini">Google Gemini (Flash)</option>
              <option value="agent">🤖 Autonomous Agent (Tool Calling Mode)</option>
              <option value="groq">Groq (Fast Inference)</option>
              <option value="mistral">Mistral AI (Small)</option>
            </select>
          </div>
          <span className="aura-provider-badge">
            {provider === "auto" ? "Resilient" : provider === "agent" ? "Agent" : provider.toUpperCase()}
          </span>
        </div>

        {/* Settings Panel Drawer */}
        {isSettingsOpen && (
          <div className="aura-settings-panel">
            <div className="aura-settings-title">
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Zap size={14} />
                AI Provider & Vector Store Architecture
              </span>
              <button
                type="button"
                className="aura-icon-btn"
                style={{ width: 24, height: 24 }}
                onClick={toggleSettingsOpen}
              >
                <X size={14} />
              </button>
            </div>

            <div className="aura-setting-item">
              <label className="aura-setting-label">
                <Key size={12} style={{ display: "inline", marginRight: 4 }} />
                Custom Provider API Key (Optional Override):
              </label>
              <input
                type="password"
                className="aura-input-field"
                placeholder="Paste custom Groq, Gemini, or Mistral API key..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <span style={{ fontSize: 10, color: "#71717A", marginTop: 2, display: "block" }}>
                Keys stay private in local browser storage. Fallback handles rate limits automatically.
              </span>
            </div>

            <div className="aura-setting-item" style={{ marginTop: 10 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#18181B", display: "flex", alignItems: "center", gap: 4 }}>
                  <Database size={12} />
                  ChromaDB Collection:
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#000000" }}>
                  {statusData?.vector_store?.total_indexed_products ?? 25} Products Indexed
                </span>
              </div>

              <button
                type="button"
                onClick={handleReindex}
                disabled={reindexing}
                className="aura-reindex-btn"
              >
                <RefreshCw size={13} className={reindexing ? "spin" : ""} />
                <span>{reindexing ? "Reindexing ChromaDB..." : "Reindex Catalogue Now"}</span>
              </button>

              {reindexMessage && (
                <div style={{ fontSize: 11, color: "#000000", marginTop: 6, fontWeight: 600 }}>
                  {reindexMessage}
                </div>
              )}
            </div>

            {/* Responsible AI & $0 Cost Governance Dashboard */}
            <div className="aura-setting-item" style={{ marginTop: 12, borderTop: "1px solid #E4E4E7", paddingTop: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#000000", display: "flex", alignItems: "center", gap: 5 }}>
                  <TrendingDown size={13} />
                  Responsible AI & $0 Cost Governance
                </span>
                <span style={{ fontSize: 10, fontWeight: 800, background: "#000000", color: "#FFFFFF", padding: "2px 7px", borderRadius: 999 }}>
                  $0.00 Spend Enforced
                </span>
              </div>

              {/* Cost Savings Metric Bar */}
              <div style={{ background: "#FAFAFA", borderRadius: 8, padding: "8px 10px", marginBottom: 10, border: "1px solid #E4E4E7" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                  <span style={{ color: "#71717A" }}>Budget Target:</span>
                  <strong style={{ color: "#000000" }}>$0.00 / month</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginTop: 4 }}>
                  <span style={{ color: "#71717A" }}>Commercial Savings (vs Paid APIs):</span>
                  <strong style={{ color: "#000000" }}>${governanceData?.total_savings_usd?.toFixed(4) || "0.0450"} USD</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginTop: 4, color: "#71717A" }}>
                  <span>Redis Cache Hit Savings:</span>
                  <span>${governanceData?.cache_savings_usd?.toFixed(4) || "0.0280"}</span>
                </div>
              </div>

              {/* Free-Tier Provider Quota Meters */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {Object.entries(governanceData?.providers_quota || {
                  groq: { name: "Groq (Fast Inference)", today_requests: 14, daily_limit: 14400, usage_percentage: 0.1 },
                  gemini: { name: "Google Gemini Flash", today_requests: 2, daily_limit: 1500, usage_percentage: 0.13 },
                  mistral: { name: "Mistral AI", today_requests: 0, daily_limit: 1000, usage_percentage: 0.0 },
                }).map(([pKey, pData]) => (
                  <div key={pKey} style={{ fontSize: 10, color: "#18181B" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                      <span>{pData.name}</span>
                      <strong>{pData.today_requests} / {pData.daily_limit?.toLocaleString()} req/day</strong>
                    </div>
                    <div style={{ height: 4, background: "#E4E4E7", borderRadius: 999, overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${Math.max(2, Math.min(100, pData.usage_percentage || 1))}%`,
                          background: "#000000",
                          borderRadius: 999,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Starter Prompts Carousel / Chips */}
        {messages.length <= 1 && (
          <div className="aura-suggestions-wrap">
            <span className="aura-suggestions-label">Explore Catalogue Ideas:</span>
            <div className="aura-suggestions-chips">
              {STARTER_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="aura-chip"
                  onClick={() => handleSend(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages Stream Area */}
        <div className="aura-messages-container">
          {messages.map((msg) => (
            <div key={msg.id} className={`aura-msg ${msg.role}`}>
              <div className="aura-msg-avatar">
                {msg.role === "user" ? "You" : <Sparkles size={16} />}
              </div>

              <div className="aura-msg-bubble">
                {/* Content Moderation Filter Warning */}
                {(msg.content?.includes("Content Moderation Flagged") ||
                  msg.error?.includes("Content Moderation")) && (
                  <div className="aura-moderation-badge">
                    <ShieldAlert size={12} /> Content Moderation Filter Triggered
                  </div>
                )}

                {/* Assistant formatted content */}
                <div className="aura-markdown">
                  {formatMarkdown(msg.content)}
                  {msg.isStreaming && <span className="aura-cursor-blink" />}
                </div>

                {/* Agent Tool Executions */}
                {msg.executedTools && msg.executedTools.length > 0 && (
                  <div className="aura-tools-executed">
                    <div className="aura-tools-title">
                      <Wrench size={12} /> Invoked Application Tools ({msg.executedTools.length})
                    </div>
                    {msg.executedTools.map((tool, idx) => (
                      <div key={idx} className="aura-tool-pill">
                        <code>
                          {tool.tool_name}({JSON.stringify(tool.args)})
                        </code>
                      </div>
                    ))}
                  </div>
                )}

                {/* Metadata & Fallback badges */}
                {msg.metadata && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                    <span className="aura-meta-badge">
                      <Cpu size={10} />
                      {msg.metadata.provider || "AI Engine"}
                    </span>
                    {msg.metadata.fallback_used && (
                      <span className="aura-meta-badge fallback">
                        <ShieldCheck size={10} />
                        Fallback Strategy Triggered
                      </span>
                    )}
                  </div>
                )}

                {/* Fallback Notice banner */}
                {msg.fallbackNotice && (
                  <div className="aura-meta-badge fallback" style={{ marginTop: 4 }}>
                    ⚠️ {msg.fallbackNotice}
                  </div>
                )}

                {/* Source Citations Shelf */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="aura-citations-section">
                    <div className="aura-citations-header">
                      <Sparkles size={13} />
                      <span>Cited Products ({msg.citations.length})</span>
                    </div>

                    <div className="aura-citations-grid">
                      {msg.citations.map((citation) => (
                        <ProductCitationCard
                          key={citation.id}
                          citation={citation}
                          onNavigate={() => setOpen(false)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Footer */}
        <div className="aura-footer">
          {isStreaming && (
            <div className="aura-stop-banner">
              <button
                type="button"
                onClick={stopStreaming}
                className="aura-stop-btn"
              >
                <Square size={12} fill="#FFFFFF" />
                <span>Stop Generating</span>
              </button>
            </div>
          )}

          <div className="aura-input-row">
            <input
              ref={inputRef}
              type="text"
              className="aura-chat-input"
              placeholder="Ask about couture fashion, timepieces, luxury beauty, specs..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isStreaming}
            />
            <button
              type="button"
              className="aura-send-btn"
              onClick={() => handleSend()}
              disabled={!input.trim() || isStreaming}
              title="Send Inquiry"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Clean markdown helper to render headers, bullet points, and bold text safely.
 */
function formatMarkdown(text) {
  if (!text) return null;

  const lines = text.split("\n");
  const elements = [];

  let inList = false;
  let listItems = [];

  const flushList = (keyPrefix) => {
    if (inList && listItems.length > 0) {
      elements.push(
        <ul key={`${keyPrefix}-ul`}>
          {listItems.map((item, idx) => (
            <li key={idx}>{parseInlineText(item)}</li>
          ))}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (trimmed.startsWith("### ")) {
      flushList(index);
      elements.push(<h3 key={index}>{parseInlineText(trimmed.slice(4))}</h3>);
    } else if (trimmed.startsWith("## ")) {
      flushList(index);
      elements.push(<h3 key={index}>{parseInlineText(trimmed.slice(3))}</h3>);
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      inList = true;
      listItems.push(trimmed.slice(2));
    } else if (trimmed === "") {
      flushList(index);
    } else {
      flushList(index);
      elements.push(<p key={index}>{parseInlineText(trimmed)}</p>);
    }
  });

  flushList("end");

  return elements;
}

function parseInlineText(text) {
  if (!text) return "";
  // Split on **bold** and *italic*
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}
