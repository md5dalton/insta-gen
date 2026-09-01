import { CheckCircle2, ShieldAlert, Activity, X } from "lucide-react"

interface Toast {
    text: string
    type: "success" | "info" | "error"
}

export default function Toaster({ toast, onClose }: { toast: Toast | null; onClose: () => void }) {
    if (!toast) return null

    return (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200 ${
            toast.type === 'success'
              ? 'bg-slate-950 border-emerald-500/50 text-emerald-300 shadow-emerald-950/40'
              : toast.type === 'error'
              ? 'bg-slate-950 border-rose-500/50 text-rose-300 shadow-rose-950/40'
              : 'bg-slate-950 border-indigo-500/50 text-indigo-300 shadow-indigo-950/40'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : toast.type === 'error' ? (
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <Activity className="w-4 h-4 text-indigo-400 shrink-0" />
          )}
          <span className="text-xs font-medium">{toast.text}</span>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:text-white text-slate-400 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
    )
}