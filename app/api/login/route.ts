import { NextResponse } from "next/server";
import { users } from "@/lib/users";

export async function POST(request: Request) {
  const { email, password } = await request.json();
  const user = users.find((u) => u.email === email);

  if (!user || user.password !== password) {
    return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
  }

  return NextResponse.json({
    message: "Login exitoso",
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  });
}
