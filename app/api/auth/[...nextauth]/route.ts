import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Correo", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.error("Credentials missing");
          return null;
        }

        try {
          const { data: usuario, error } = await supabase
            .from("usuarios")
            .select("*, roles(nombre)")
            .eq("correo", credentials.email)
            .single();

          if (error || !usuario) {
            console.error("User not found:", error);
            return null;
          }

          const passwordMatch = await bcrypt.compare(
            credentials.password,
            usuario.contraseña
          );

          if (!passwordMatch) {
            console.error("Password doesn't match");
            return null;
          }

          return {
            id: usuario.id,
            name: usuario.nombre,
            email: usuario.correo,
            role: usuario.roles?.nombre,
          };
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
});

export { handler as GET, handler as POST };
