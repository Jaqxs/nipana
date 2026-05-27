"use client";
import { useEffect, useRef, useState } from "react";

interface Notification {
  id: string;
  kind: "approval" | "anomaly" | "invoice" | "stock" | "system" | "ai";
  title: string;
  body: string;
  createdAt: string;
  unread: boolean;
}

const ICONS: Record<Notification["kind"], string> = {
  approval: "ri-checkbox-circle-line",
  anomaly: "ri-radar-line",
  invoice: "ri-file-paper-2-line",
  stock: "ri-archive-line",
  system: "ri-settings-3-line",
  ai: "ri-sparkling-2-line",
};

const TONE: Record<Notification["kind"], { bg: string; fg: string }> = {
  approval: { bg: "#dde6d2", fg: "#536450" },
  anomaly: { bg: "#f1d9c8", fg: "#8a4d31" },
  invoice: { bg: "#fbf3df", fg: "#7a571c" },
  stock: { bg: "#fbf3df", fg: "#7a571c" },
  system: { bg: "#f7f1e3", fg: "#6b5e4d" },
  ai: { bg: "#fbf3df", fg: "#7a571c" },
};

function formatTimeAgo(dateString: string) {
  if (!dateString) return "";
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 5) return "Just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [pulse, setPulse] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside or ESC
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  // Fetch initial notifications and subscribe to real-time events via Server-Sent Events (SSE)
  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setItems(data);
          }
        }
      } catch (err) {
        console.error("Failed to load notifications:", err);
      }
    };

    fetchInitial();

    // Subscribe to SSE
    const eventSource = new EventSource("/api/notifications/sse");

    eventSource.onmessage = (event) => {
      try {
        if (!event.data) return;
        const newNotification = JSON.parse(event.data);
        if (newNotification && newNotification.id) {
          setItems((prev) => {
            // Avoid duplicate additions
            if (prev.some((n) => n.id === newNotification.id)) return prev;
            return [newNotification, ...prev];
          });

          // Trigger delightful visual wiggle/pulse animation on the bell
          setPulse(true);
          setTimeout(() => setPulse(false), 800);
        }
      } catch (err) {
        // Heartbeats and empty pings are handled safely
      }
    };

    eventSource.onerror = (err) => {
      console.error("Real-time notifications connection lost. Reconnecting...", err);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const unreadCount = items.filter((i) => i.unread).length;

  const markAllRead = async () => {
    // Optimistic UI update
    setItems((prev) => prev.map((i) => ({ ...i, unread: false })));
    try {
      await fetch("/api/notifications/read-all", { method: "POST" });
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  };

  const markRead = async (id: string) => {
    // Optimistic UI update
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, unread: false } : i)));
    try {
      await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    } catch (err) {
      console.error(`Failed to mark notification ${id} as read:`, err);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="surface-flat w-9 h-9 flex items-center justify-center text-ink-soft hover:text-gold-600 transition relative"
        aria-label="Notifications"
      >
        <i className={`ri-notification-3-line text-lg transition-all ${pulse ? "bell-ring-active" : ""}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-medium flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-12 w-[380px] bg-white border border-line rounded-xl shadow-xl z-50 overflow-hidden"
          style={{ boxShadow: "0 24px 48px -16px rgba(31,26,20,0.22), 0 4px 12px -4px rgba(31,26,20,0.08)" }}
        >
          <div className="px-4 py-3 border-b border-line flex items-center justify-between">
            <div>
              <div className="font-display text-base text-ink">Notifications</div>
              <div className="text-[11px] text-ink-muted">{unreadCount} unread</div>
            </div>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-gold-700 hover:underline">
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[460px] overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-ink-muted">
                No notifications yet.
              </div>
            ) : (
              items.map((n) => {
                const tone = TONE[n.kind] || TONE.system;
                return (
                  <button
                    key={n.id}
                    onClick={() => n.unread && markRead(n.id)}
                    className={`w-full text-left flex gap-3 p-4 border-b border-line hover:bg-paper-50 transition ${
                      n.unread ? "bg-paper-50/60 font-medium" : ""
                    }`}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 animate-pulse-slow"
                      style={{ background: tone.bg, color: tone.fg }}
                    >
                      <i className={`${ICONS[n.kind] || ICONS.system} text-base`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-sm text-ink truncate ${n.unread ? "font-semibold" : "font-medium"}`}>
                          {n.title}
                        </span>
                        {n.unread && <span className="w-1.5 h-1.5 rounded-full bg-gold-500 shrink-0" />}
                      </div>
                      <div className="text-xs text-ink-muted leading-snug">{n.body}</div>
                      <div className="text-[10px] text-ink-faint mt-1.5 uppercase tracking-wider">
                        {formatTimeAgo(n.createdAt)}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="px-4 py-3 border-t border-line bg-paper-50/40 flex items-center justify-between">
            <button className="text-xs text-ink-muted hover:text-ink">Notification settings</button>
            <button className="text-xs text-gold-700 hover:underline font-medium">View all →</button>
          </div>
        </div>
      )}
    </div>
  );
}

