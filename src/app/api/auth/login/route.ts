import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import { SESSION_COOKIE_NAME, signSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json(
        { error: "Ingresa tu correo y contraseña." },
        { status: 400 }
      );
    }

    const { rows } = await query<{
      id: string;
      email: string;
      password_hash: string;
      full_name: string;
      alias: string | null;
      role: string;
      department: string;
      status: string;
    }>(
      `SELECT id, email, password_hash, full_name, alias, role, department, status
       FROM users WHERE LOWER(email) = $1 LIMIT 1`,
      [email]
    );

    const user = rows[0];
    if (!user || user.status !== "active") {
      return NextResponse.json(
        { error: "Credenciales inválidas o usuario inactivo." },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json(
        { error: "Credenciales inválidas." },
        { status: 401 }
      );
    }

    const sessionUser = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      alias: user.alias,
      role: user.role,
      department: user.department,
    };

    const token = signSession(sessionUser);
    const response = NextResponse.json({ user: sessionUser });
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch (err) {
    console.error("Login error:", err);
    const detail =
      err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json(
      {
        error: detail.includes("DATABASE_URL")
          ? "Falta configurar DATABASE_URL en las variables de entorno (Vercel / .env.local)."
          : `Error al iniciar sesión (${detail}).`,
      },
      { status: 500 }
    );
  }
}
