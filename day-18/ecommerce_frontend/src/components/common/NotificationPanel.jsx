import { Bell, X } from "lucide-react";
import { useState } from "react";
import { useNotificationStore } from "../../stores/notificationStore";

function NotificationPanel() {
  const [open, setOpen] = useState(false);

  const notifications =
    useNotificationStore(
      (state) => state.notifications
    );

  const removeNotification =
    useNotificationStore(
      (state) => state.removeNotification
    );

  return (
    <div
      style={{
        position: "relative",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="nav-action-btn"
        title="Notifications"
      >
        <Bell size={19} />

        {notifications.length > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-2px",
              right: "-2px",
              minWidth: "18px",
              height: "18px",
              borderRadius: "50%",
              background: "#ff4757",
              color: "#fff",
              fontSize: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
            }}
          >
            {notifications.length}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "45px",
            width: "320px",
            maxHeight: "400px",
            overflowY: "auto",
            background: "#fff",
            border: "1px solid #eee",
            borderRadius: "14px",
            boxShadow:
              "0 10px 30px rgba(0,0,0,0.15)",
            zIndex: 1000,
            padding: "12px",
          }}
        >
          <h3
            style={{
              margin: "5px 8px 12px",
            }}
          >
            Notifications
          </h3>

          {notifications.length === 0 ? (
            <p
              style={{
                padding: "15px",
                color: "#777",
              }}
            >
              No notifications yet.
            </p>
          ) : (
            notifications.map(
              (notification) => (
                <div
                  key={notification.id}
                  style={{
                    padding: "12px",
                    borderBottom:
                      "1px solid #eee",
                    position: "relative",
                  }}
                >
                  <strong>
                    {notification.title}
                  </strong>

                  <p
                    style={{
                      margin: "5px 0",
                      fontSize: "13px",
                      color: "#666",
                    }}
                  >
                    {notification.message}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      removeNotification(
                        notification.id
                      )
                    }
                    style={{
                      position: "absolute",
                      top: "10px",
                      right: "8px",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              )
            )
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationPanel;