import React, { createContext, useContext, useState, useCallback } from "react";
import { X, CheckCircle, AlertTriangle, Info } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = "info", duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast HUD Overlay container */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[9999] flex flex-col gap-3 w-[90%] max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl border backdrop-blur-md transition-all duration-300 animate-slide-up shadow-[0_4px_20px_rgba(0,0,0,0.5)] ${
              toast.type === "success"
                ? "bg-[#050508]/90 border-volt/40 text-white shadow-[0_0_10px_rgba(198,255,0,0.15)]"
                : toast.type === "error"
                ? "bg-[#050508]/90 border-red-500/40 text-red-200"
                : toast.type === "warning"
                ? "bg-[#050508]/90 border-yellow-500/40 text-yellow-200"
                : "bg-[#050508]/90 border-hyperpink/40 text-white shadow-[0_0_10px_rgba(255,43,214,0.15)]"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {toast.type === "success" && <CheckCircle className="h-5 w-5 text-volt" />}
              {toast.type === "error" && <AlertTriangle className="h-5 w-5 text-red-400" />}
              {toast.type === "warning" && <AlertTriangle className="h-5 w-5 text-yellow-400" />}
              {toast.type === "info" && <Info className="h-5 w-5 text-hyperpink" />}
              <span className="text-xs font-medium tracking-wide uppercase">{toast.message}</span>
            </div>
            
            <button
              onClick={() => removeToast(toast.id)}
              className="text-white/40 hover:text-white transition-colors focus:outline-none"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
