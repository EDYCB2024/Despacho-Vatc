import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const { rows } = await query(
      "SELECT id, email, full_name, alias, role, department, status, created_at FROM users ORDER BY created_at DESC"
    );
    return NextResponse.json({ data: rows });
  } catch (err) {
    console.error("GET /api/users error:", err);
    return NextResponse.json({ error: "Error consultando usuarios." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (currentUser && currentUser.role !== "admin") {
      return NextResponse.json({ error: "Solo administradores pueden crear usuarios." }, { status: 403 });
    }

    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const fullName = String(body.full_name || "").trim();
    const password = String(body.password || "Vatc2026!");
    const role = String(body.role || "editor");
    const department = String(body.department || "DESPACHO");
    const alias = String(body.alias || fullName.split(" ")[0] || "USER").toUpperCase();

    if (!email || !fullName) {
      return NextResponse.json({ error: "Correo y nombre son obligatorios." }, { status: 400 });
    }

    const hash = await bcrypt.hash(password, 10);
    const { rows } = await query(
      `INSERT INTO users (email, password_hash, full_name, alias, role, department, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'active')
       RETURNING id, email, full_name, alias, role, department, status, created_at`,
      [email, hash, fullName, alias, role, department]
    );

    return NextResponse.json({ data: rows[0] }, { status: 201 });
  } catch (err: unknown) {
    const msg =
      err instanceof Error && err.message.includes("unique")
        ? "Ya existe un usuario con ese correo."
        : "Error creando usuario.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
