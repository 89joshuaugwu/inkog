"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface ToastContextType {
  toast: (message: string, type?: "success" | "error" | "info") => void;
}

const ToastContext = createContext<ToastContextType>({
  toast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback(
    (message: string, type: "success" | "error" | "info" = "info") => {
      const id = Date.now().toString();
      setToasts((prev) => [...prev, { id, message, type }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3500);
    },
    []
  );

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Toast Container */}
      <div
        className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3"
        style={{ maxWidth: "380px" }}
      >
        {toasts.map((t) => {
          const colors = {
            success: {
              bg: "rgba(132, 204, 22, 0.12)",
              border: "rgba(132, 204, 22, 0.35)",
              text: "#84CC16",
              emoji: "✓",
            },
            error: {
              bg: "rgba(239, 68, 68, 0.12)",
              border: "rgba(239, 68, 68, 0.35)",
              text: "#EF4444",
              emoji: "✗",
            },
            info: {
              bg: "rgba(139, 92, 246, 0.12)",
              border: "rgba(139, 92, 246, 0.35)",
              text: "#A78BFA",
              emoji: "ℹ",
            },
          };
          const c = colors[t.type];

          return (
            <div
              key={t.id}
              className="flex items-center gap-3 font-body text-sm cursor-pointer transition-all duration-200"
              onClick={() => dismiss(t.id)}
              style={{
                backgroundColor: "#141414",
                border: `1px solid ${c.border}`,
                borderRadius: "14px",
                padding: "14px 18px",
                color: "#FFFFFF",
                boxShadow: "0px 8px 24px rgba(0, 0, 0, 0.4)",
                backdropFilter: "blur(12px)",
                animation: "fade-in-up 0.3s ease-out",
              }}
            >
              <span
                className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs"
                style={{ backgroundColor: c.bg, color: c.text }}
              >
                {c.emoji}
              </span>
              <p className="flex-1" style={{ lineHeight: "20px" }}>
                {t.message}
              </p>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
