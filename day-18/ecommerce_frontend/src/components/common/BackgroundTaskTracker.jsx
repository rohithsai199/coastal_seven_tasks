import { useState } from "react";
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  X,
  Download,
  Trash2,
  Activity,
} from "lucide-react";
import { useTaskStore } from "../../stores/taskStore";

export default function BackgroundTaskTracker() {
  const { tasks, isTrackerOpen, setTrackerOpen, removeTask, clearCompleted } =
    useTaskStore();
  const [isMinimized, setIsMinimized] = useState(false);

  if (!tasks || tasks.length === 0) {
    return null;
  }

  const activeCount = tasks.filter(
    (t) => t.state === "PENDING" || t.state === "PROGRESS"
  ).length;

  const handleDownloadPdf = (pdfUrl, filename) => {
    if (!pdfUrl) return;
    const backendUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
    const fullUrl = pdfUrl.startsWith("http")
      ? pdfUrl
      : `${backendUrl}${pdfUrl.startsWith("/") ? "" : "/"}${pdfUrl}`;

    const link = document.createElement("a");
    link.href = fullUrl;
    link.setAttribute("download", filename || "order_invoice.pdf");
    link.setAttribute("target", "_blank");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        width: isMinimized ? "300px" : "380px",
        maxHeight: "85vh",
        zIndex: 9999,
        background: "#FFFFFF",
        borderRadius: "16px",
        boxShadow: "0 10px 40px rgba(0, 0, 0, 0.16), 0 2px 10px rgba(108, 92, 231, 0.1)",
        border: "1px solid #EFEFEF",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        fontFamily: "inherit",
      }}
    >
      {/* Tracker Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #1E272E 0%, #2D3436 100%)",
          color: "#FFFFFF",
          padding: "14px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          userSelect: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Activity size={18} color="#6C5CE7" />
            {activeCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-4px",
                  right: "-6px",
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#00B894",
                  boxShadow: "0 0 8px #00B894",
                }}
              />
            )}
          </div>
          <div>
            <span style={{ fontSize: "14px", fontWeight: 800, letterSpacing: "-0.2px" }}>
              Background Tasks
            </span>
            {activeCount > 0 ? (
              <span
                style={{
                  display: "inline-block",
                  marginLeft: "8px",
                  background: "rgba(108, 92, 231, 0.3)",
                  color: "#A29BFE",
                  padding: "2px 8px",
                  borderRadius: "999px",
                  fontSize: "11px",
                  fontWeight: 700,
                }}
              >
                {activeCount} running
              </span>
            ) : (
              <span
                style={{
                  display: "inline-block",
                  marginLeft: "8px",
                  background: "rgba(0, 184, 148, 0.2)",
                  color: "#00B894",
                  padding: "2px 8px",
                  borderRadius: "999px",
                  fontSize: "11px",
                  fontWeight: 700,
                }}
              >
                Idle
              </span>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          {tasks.length > activeCount && !isMinimized && (
            <button
              type="button"
              onClick={clearCompleted}
              title="Clear completed tasks"
              style={{
                background: "transparent",
                border: "none",
                color: "#808E9B",
                cursor: "pointer",
                padding: "4px",
                display: "flex",
                alignItems: "center",
                borderRadius: "6px",
              }}
            >
              <Trash2 size={14} />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsMinimized(!isMinimized)}
            style={{
              background: "transparent",
              border: "none",
              color: "#FFFFFF",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              borderRadius: "6px",
            }}
          >
            {isMinimized ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Task List Body */}
      {!isMinimized && (
        <div
          style={{
            maxHeight: "360px",
            overflowY: "auto",
            padding: "12px 14px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            background: "#FAFAFA",
          }}
        >
          {tasks.map((task) => {
            const isFinished = task.state === "SUCCESS";
            const isFailed = task.state === "FAILURE";
            const isRunning = task.state === "PROGRESS" || task.state === "PENDING";

            return (
              <div
                key={task.taskId}
                style={{
                  background: "#FFFFFF",
                  borderRadius: "12px",
                  padding: "14px",
                  border: isFinished
                    ? "1px solid #DDF6EE"
                    : isFailed
                    ? "1px solid #FEE2E2"
                    : "1px solid #EAEAEA",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                }}
              >
                {/* Title & Dismiss Button */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "8px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "8px",
                        background:
                          task.type === "invoice" ? "#F0EDFD" : "#E8F8F5",
                        color:
                          task.type === "invoice" ? "#6C5CE7" : "#00B894",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {task.type === "invoice" ? (
                        <FileText size={15} />
                      ) : (
                        <UploadCloud size={15} />
                      )}
                    </div>
                    <div>
                      <h4
                        style={{
                          fontSize: "13px",
                          fontWeight: 800,
                          color: "#1E272E",
                          margin: 0,
                          lineHeight: "16px",
                        }}
                      >
                        {task.title}
                      </h4>
                      <span style={{ fontSize: "11px", color: "#808E9B" }}>
                        ID: {task.taskId.slice(0, 8)}...
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    {/* Status Pill */}
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 800,
                        padding: "3px 8px",
                        borderRadius: "999px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        background: isFinished
                          ? "#E6F8F4"
                          : isFailed
                          ? "#FEE2E2"
                          : "#FEF8E7",
                        color: isFinished
                          ? "#00B894"
                          : isFailed
                          ? "#E74C3C"
                          : "#D35400",
                      }}
                    >
                      {isRunning && (
                        <Loader2
                          size={11}
                          className="animate-spin"
                          style={{
                            animation: "spin 1s linear infinite",
                          }}
                        />
                      )}
                      {isFinished && <CheckCircle2 size={11} />}
                      {isFailed && <AlertCircle size={11} />}
                      {task.state}
                    </span>

                    <button
                      type="button"
                      onClick={() => removeTask(task.taskId)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#B2BEC3",
                        cursor: "pointer",
                        padding: "2px",
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div style={{ margin: "8px 0 6px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#636E72",
                      marginBottom: "4px",
                    }}
                  >
                    <span>Progress</span>
                    <span>{task.progress ?? 0}%</span>
                  </div>
                  <div
                    style={{
                      height: "7px",
                      width: "100%",
                      background: "#EDF2F7",
                      borderRadius: "999px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${Math.max(4, Math.min(100, task.progress || 0))}%`,
                        background: isFinished
                          ? "linear-gradient(90deg, #00B894, #55EFC4)"
                          : isFailed
                          ? "#E74C3C"
                          : "linear-gradient(90deg, #6C5CE7, #A29BFE)",
                        borderRadius: "999px",
                        transition: "width 0.4s ease-in-out",
                      }}
                    />
                  </div>
                </div>

                {/* Status Message */}
                <p
                  style={{
                    fontSize: "12px",
                    color: isFailed ? "#E74C3C" : "#636E72",
                    margin: "4px 0 8px",
                    lineHeight: "15px",
                    wordBreak: "break-word",
                  }}
                >
                  {task.status}
                </p>

                {/* Completion Actions */}
                {isFinished && task.type === "invoice" && task.result?.pdf_url && (
                  <button
                    type="button"
                    onClick={() =>
                      handleDownloadPdf(
                        task.result.pdf_url,
                        task.result.filename
                      )
                    }
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      width: "100%",
                      padding: "8px 12px",
                      background: "#6C5CE7",
                      color: "#FFFFFF",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: 800,
                      border: "none",
                      cursor: "pointer",
                      marginTop: "4px",
                      boxShadow: "0 2px 8px rgba(108, 92, 231, 0.25)",
                    }}
                  >
                    <Download size={14} /> Download PDF Invoice
                  </button>
                )}

                {isFinished && task.type === "csv_import" && task.result && (
                  <div
                    style={{
                      background: "#F0FDF4",
                      padding: "8px 10px",
                      borderRadius: "8px",
                      border: "1px solid #DCFCE7",
                      fontSize: "11px",
                      color: "#166534",
                      marginTop: "4px",
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>Imported: <strong>{task.result.imported_count}</strong> items</span>
                    <span>Total: {task.result.total_rows}</span>
                    {task.result.skipped_count > 0 && (
                      <span style={{ color: "#B45309" }}>Skipped: {task.result.skipped_count}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
