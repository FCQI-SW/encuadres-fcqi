// components/session-provider.tsx
// Envoltorio de `SessionProvider` de next-auth para poder inyectar la sesión
// desde el layout server-side y evitar un flash sin sesión en el primer render.
// Doc completa: docs/codigo/codigo.md#session-providertsx

"use client";

import type React from "react";
import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import type { Session } from "next-auth";

export function SessionProvider({ 
  children,
  session 
}: { 
  children: React.ReactNode;
  session?: Session | null;
}) {
  return (
    <NextAuthSessionProvider session={session}>
      {children}
    </NextAuthSessionProvider>
  );
}