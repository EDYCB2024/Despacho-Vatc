"use client";

import { useContext, useEffect, useState } from "react";
import { UserPlus, Database, Shield } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { UserContext } from "../DashboardShell";
import { formatDate } from "@/lib/utils";

interface UserRow {
  id: string;
  email: string;
  full_name: string;
  alias: string | null;
  role: string;
  department: string;
  status: string;
  created_at: string;
}

export default function SettingsPage() {
  const user = useContext(UserContext);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "editor",
    department: "DESPACHO",
  });
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadUsers = async () => {
    const res = await fetch("/api/users");
    const json = await res.json();
    setUsers(json.data || []);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setSaving(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) {
        setMsg(json.error || "Error creando usuario.");
      } else {
        setMsg("Usuario creado exitosamente.");
        setForm({
          full_name: "",
          email: "",
          password: "",
          role: "editor",
          department: "DESPACHO",
        });
        loadUsers();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <TopBar
        title="Configuración del Sistema"
        subtitle="Gestión de operadores de despacho, roles y conexión Neon PostgreSQL"
        user={user}
      />

      <main className="p-4 sm:p-6 space-y-6 max-w-[1440px] mx-auto w-full">
        {/* Neon Status Card */}
        <section className="bg-white border border-outline-variant rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-secondary-container text-primary flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-on-surface">
                Base de Datos: Neon PostgreSQL (Despacho-Vatc • frosty-recipe-24511413)
              </h2>
              <p className="text-xs text-on-surface-variant">
                Conexión serverless activa • Paleta Corporativa Verde Esmeralda (#065f46)
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Conectado
          </span>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form
            onSubmit={handleCreateUser}
            className="bg-white border border-outline-variant rounded-2xl p-5 space-y-4"
          >
            <div className="flex items-center gap-2 text-primary">
              <UserPlus className="w-5 h-5" />
              <h3 className="text-sm font-black uppercase tracking-wider">Nuevo Usuario</h3>
            </div>

            {msg && (
              <div className="p-2.5 rounded-xl bg-secondary-container text-primary text-xs font-bold">
                {msg}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">
                Nombre Completo
              </label>
              <input
                required
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="input-green"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">
                Correo
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input-green"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">
                Contraseña
              </label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="input-green"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">
                  Rol
                </label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="input-green"
                >
                  <option value="admin">Administrador</option>
                  <option value="editor">Operador</option>
                  <option value="viewer">Lector</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-on-surface-variant mb-1">
                  Departamento
                </label>
                <select
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className="input-green"
                >
                  <option value="DESPACHO">DESPACHO</option>
                  <option value="RECEPCION">RECEPCIÓN</option>
                  <option value="SERVICIO TECNICO">SERVICIO TÉCNICO</option>
                  <option value="OPERACIONES">OPERACIONES</option>
                  <option value="GENERAL">GENERAL</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-container text-white text-xs font-bold shadow-md shadow-primary/20 cursor-pointer disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Crear Usuario"}
            </button>
          </form>

          <div className="lg:col-span-2 bg-white border border-outline-variant rounded-2xl p-5 overflow-hidden">
            <div className="flex items-center gap-2 text-primary mb-4">
              <Shield className="w-5 h-5" />
              <h3 className="text-sm font-black uppercase tracking-wider">
                Usuarios Registrados ({users.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-outline-variant text-[10px] font-black uppercase text-primary">
                    <th className="py-2 pr-3">Nombre</th>
                    <th className="py-2 pr-3">Correo</th>
                    <th className="py-2 pr-3">Rol</th>
                    <th className="py-2 pr-3">Departamento</th>
                    <th className="py-2">Creado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/50">
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="py-2.5 pr-3 font-bold text-on-surface">{u.full_name}</td>
                      <td className="py-2.5 pr-3 text-on-surface-variant">{u.email}</td>
                      <td className="py-2.5 pr-3">
                        <span className="px-2 py-0.5 rounded-full bg-secondary-container text-primary font-bold uppercase text-[10px]">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 text-on-surface-variant">{u.department}</td>
                      <td className="py-2.5 text-outline">{formatDate(u.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
