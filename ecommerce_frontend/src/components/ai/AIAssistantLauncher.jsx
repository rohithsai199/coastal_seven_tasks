import React from "react";
import { Sparkles } from "lucide-react";
import { useAIAssistantStore } from "../../stores/aiAssistantStore";
import "./aiAssistant.css";

export default function AIAssistantLauncher() {
  const { isOpen, toggleOpen } = useAIAssistantStore();

  if (isOpen) return null;

  return (
    <button
      type="button"
      className="aura-launcher-btn"
      onClick={toggleOpen}
      title="Open Aura AI Shopping Concierge"
      aria-label="Open AI Shopping Concierge"
    >
      <div className="aura-launcher-icon-wrap">
        <Sparkles size={18} />
      </div>
      <span>Ask Aura AI</span>
      <span className="aura-launcher-badge">RAG</span>
    </button>
  );
}
