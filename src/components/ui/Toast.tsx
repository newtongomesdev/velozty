import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
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

  const contextValue = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      
      {/* Toast HUD Overlay container */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[9999] flex flex-col gap-3 w-[90%] max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`velozty-toast velozty-toast-${toast.type} pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl border backdrop-blur-md transition-all duration-300 animate-slide-up ${
              toast.type === "success"
                ? "border-volt/40"
                : toast.type === "error"
                ? "border-red-500/40"
                : toast.type === "warning"
                ? "border-yellow-500/40"
                : "border-hyperpink/40"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {toast.type === "success" && <CheckCircle className="velozty-toast-icon h-5 w-5" />}
              {toast.type === "error" && <AlertTriangle className="velozty-toast-icon h-5 w-5" />}
              {toast.type === "warning" && <AlertTriangle className="velozty-toast-icon h-5 w-5" />}
              {toast.type === "info" && <Info className="velozty-toast-icon h-5 w-5" />}
              <span className="text-xs font-medium tracking-wide uppercase">{toast.message}</span>
            </div>
            
            <button
              onClick={() => removeToast(toast.id)}
              className="velozty-toast-close transition-colors focus:outline-none"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

