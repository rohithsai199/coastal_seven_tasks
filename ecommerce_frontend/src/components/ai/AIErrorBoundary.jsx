import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export default class AIErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // eslint-disable-next-line no-console
    console.error("[AI Error Boundary caught]:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "24px",
            background: "#FFF5F5",
            borderRadius: "14px",
            border: "1px solid #FED7D7",
            color: "#C53030",
            textAlign: "center",
            margin: "16px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "8px" }}>
            <AlertCircle size={28} />
          </div>
          <h4 style={{ margin: "0 0 6px", fontSize: "14px", fontWeight: "700" }}>
            AI Assistant Temporary Interruption
          </h4>
          <p style={{ margin: "0 0 14px", fontSize: "12px", color: "#742A2A" }}>
            An unexpected client error occurred while rendering the AI component.
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            style={{
              padding: "6px 14px",
              background: "#6C5CE7",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <RefreshCw size={13} />
            <span>Recover Assistant</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
