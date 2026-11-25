"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Truck, Lock, Mail, ArrowRight, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@vatc.com");
  const [password, setPassword] = useState("Admin2026!");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Credenciales incorrectas.");
        setLoading(false);
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Error de conexión con el servidor.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#022c22] via-[#065f46] to-[#064e3b] p-4 relative overflow-hidden">
      {/* Decorative emerald glow */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#10b981]/25 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#059669]/30 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-md bg-white rounded-[32px] shadow-2xl shadow-black/30 p-8 sm:p-10 border border-white/20">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-container rounded-2xl flex items-center justify-center shadow-xl shadow-primary/30 mb-4">
            <Truck className="w-9 h-9 text-white" />
          </div>
          <span className="text-[11px] font-black uppercase tracking-[0.25em] text-primary bg-secondary-container px-3 py-1 rounded-full mb-2">
            VA Technology Communication
          </span>
          <h1 className="text-2xl font-black text-on-surface tracking-tight">
            Despacho VATC CRM
          </h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Control Logístico ZOOM, SIMCARD, Kits, Equipos Nuevos, Recepción y Parque POS
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-outline absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-outline-variant bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                placeholder="usuario@vatc.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-outline absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-outline-variant bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary to-primary-container hover:from-primary-hover hover:to-primary text-white font-bold text-sm shadow-lg shadow-primary/30 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-60 cursor-pointer mt-2"
          >
            <span>{loading ? "Verificando acceso..." : "Ingresar a Despacho VATC"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-outline-variant/60 text-center">
          <p className="text-[11px] text-on-surface-variant">
            Acceso inicial: <span className="font-bold text-primary">admin@vatc.com</span> /{" "}
            <span className="font-bold text-primary">Admin2026!</span>
          </p>
        </div>
      </div>
    </div>
  );
}
