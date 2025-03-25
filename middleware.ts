import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

// Define las rutas protegidas y los roles que pueden acceder a ellas
const roleRoutes = {
  admin: ["/admin"],
  profesor: ["/profesor"],
  alumno: ["/alumno"],
  lector: ["/lector"],
  capturista: ["/capturista"],
};

// Define las rutas de redirección por defecto según el rol
const defaultRoutesByRole = {
  admin: "/admin",
  profesor: "/profesor",
  alumno: "/alumno",
  lector: "/lector",
  capturista: "/capturista",
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Obtener el token de sesión
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Si el usuario no está autenticado y está intentando acceder a una ruta protegida
  if (!token) {
    // Lista de todas las rutas protegidas
    const protectedRoutes = Object.values(roleRoutes).flat();

    // Si está intentando acceder a una ruta protegida, redirigir al login
    if (protectedRoutes.some((route) => pathname.startsWith(route))) {
      const url = new URL("/", request.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }

    // Si no está en una ruta protegida, permitir el acceso
    return NextResponse.next();
  }

  // El usuario está autenticado, obtener su rol
  const userRole = token.role as string;

  // Si el usuario está en la página de inicio y ya está autenticado
  if (pathname === "/") {
    // Redirigir a la ruta por defecto según su rol
    const defaultRoute =
      defaultRoutesByRole[userRole as keyof typeof defaultRoutesByRole];
    if (defaultRoute) {
      return NextResponse.redirect(new URL(defaultRoute, request.url));
    }
  }

  // Verificar si el usuario tiene permiso para acceder a la ruta actual
  const allowedRoutes = roleRoutes[userRole as keyof typeof roleRoutes] || [];

  // Comprobar si la ruta actual está permitida para el rol del usuario
  const isAllowed = allowedRoutes.some((route) => pathname.startsWith(route));

  // Si la ruta no está permitida para el rol del usuario
  if (!isAllowed) {
    // Verificar si está intentando acceder a una ruta protegida de otro rol
    const isProtectedRoute = Object.entries(roleRoutes)
      .filter(([role]) => role !== userRole)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .some(([_, routes]) =>
        routes.some((route) => pathname.startsWith(route))
      );

    // Si está intentando acceder a una ruta protegida de otro rol, redirigir a su ruta por defecto
    if (isProtectedRoute) {
      const defaultRoute =
        defaultRoutesByRole[userRole as keyof typeof defaultRoutesByRole];
      return NextResponse.redirect(new URL(defaultRoute, request.url));
    }
  }

  // Permitir el acceso si la ruta está permitida o no es una ruta protegida
  return NextResponse.next();
}

// Configurar qué rutas deben ser procesadas por el middleware
export const config = {
  matcher: [
    /*
     * Coincide con todas las rutas de solicitud excepto:
     * 1. Todas las rutas de API (/api/*)
     * 2. Archivos estáticos (imágenes, fuentes, scripts, etc.)
     * 3. Rutas de favicon
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
