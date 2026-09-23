// lib/auth.ts
// Helper `getSession()` para leer la sesión NextAuth desde Server Components / Route Handlers.
// Doc completa: docs/codigo/codigo.md#libauthts

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function getSession() {
  return await getServerSession(authOptions);
}