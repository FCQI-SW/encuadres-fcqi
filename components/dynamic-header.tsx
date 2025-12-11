'use client'
import { usePathname } from 'next/navigation'

const routeNames: Record<string, string> = {
  '/': 'Inicio',
  // Admin
  '/admin': 'Panel de Administración',
  '/admin/usuarios': 'Manejo de Usuarios',
  '/admin/resultados': 'Revisión de Resultados',
  '/admin/materias': 'Manejo de Materias',
  '/admin/configurar-fecha': 'Fecha de Operación',
  '/admin/anuncios': 'Anuncios',
  '/admin/anuncios/crear': 'Crear Anuncio',
  // Profesor
  '/profesor': 'Detalles',
  '/profesor/cursos': 'Mis Cursos',
  // Capturista
  '/capturista': 'Detalles',
  '/capturista/materias': 'Materias',
  // Alumno
  '/alumno/cursos': 'Mis Cursos',
  // Otros
  '/encuadres': 'Encuadres',
  '/avances': 'Avances',
}

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function getRouteName(pathname: string): string {
  if (routeNames[pathname]) {
    return routeNames[pathname]
  }

  // Rutas del admin
  if (pathname.startsWith('/admin/resultados/')) {
    return 'Detalle de Comparación'
  }
  if (pathname.startsWith('/admin/usuarios/')) {
    return 'Detalle de Usuario'
  }
  if (pathname.startsWith('/admin/materias/')) {
    return 'Detalle de Materia'
  }

  // Rutas del profesor
  if (pathname.startsWith('/profesor/cursos/')) {
    const segments = pathname.split('/')
    const lastSegment = segments[segments.length - 1]
    if (uuidRegex.test(lastSegment)) {
      return 'Detalles del Curso'
    }
  }
  if (pathname.startsWith('/profesor/encuadres')) return 'Encuadres'
  if (pathname.startsWith('/profesor/avances')) return 'Avances'

  // Rutas del alumno
  if (pathname.startsWith('/alumno/cursos/')) {
    const segments = pathname.split('/')
    const lastSegment = segments[segments.length - 1]
    if (uuidRegex.test(lastSegment)) {
      return 'Detalles del Curso'
    }
  }
  
  // Rutas del capturista
  if (pathname.startsWith('/capturista/materias') && pathname.includes('/encuadre')) return 'Encuadre'
  if (pathname.startsWith('/capturista/materias') && pathname.includes('/pua')) return 'PUA'
  if (pathname.startsWith('/capturista/materias')) return 'Materias'

  const segments = pathname.split('/').filter(Boolean)
  const lastSegment = segments[segments.length - 1]
  
  if (lastSegment && uuidRegex.test(lastSegment)) {
    return 'Detalles'
  }
  
  if (lastSegment) {
    const translations: Record<string, string> = {
      'resultados': 'Resultados',
      'usuarios': 'Usuarios',
      'materias': 'Materias',
      'anuncios': 'Anuncios',
      'crear-usuario': 'Crear Usuario',
      'configurar-fecha': 'Fecha de Operación',
    }
    return translations[lastSegment] || lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1)
  }
  return 'Página'
}

export default function DynamicHeader() {
  const pathname = usePathname() ?? '/'
  const routeName = getRouteName(pathname)

  return (
    <div className="text-xl">
      <span className="font-semibold">{routeName}</span>
    </div>
  )
}