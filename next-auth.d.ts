// next-auth.d.ts
// Extensión de tipos de NextAuth: agrega `id` y `role` a `User`, `Session.user` y `JWT`.
// Doc completa: docs/codigo/codigo.md#next-authdts

import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    name: string;
    email: string;
    role: string;
  }

  interface Session {
    user: User;
  }

  interface JWT {
    id: string;
    name: string;
    email: string;
    role: string;
  }
}
