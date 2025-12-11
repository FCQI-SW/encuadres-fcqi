'use client'
import { usePathname } from 'next/navigation'

const routeNames: Record<string, string> = {
  '/': 'Inicio',
  '/profesor': 'Detalles',
  '/profesor/cursos': 'Mis Cursos',
  '/capturista': 'Detalles',
  '/capturista/materias': 'Materias',
  '/alumno/cursos': 'Mis Cursos',
  '/encuadres': 'Encuadres',
  '/avances': 'Avances',
}

// Regex para detectar UUID
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function getRouteName(pathname: string): string {
  if (routeNames[pathname]) {
    return routeNames[pathname]
  }

  // Rutas del profesor
  if (pathname.startsWith('/profesor/cursos/')) {
    const segments = pathname.split('/')
    const lastSegment = segments[segments.length - 1]
    // Si el último segmento es un UUID, mostrar texto genérico
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
  
  // Si es un UUID, no mostrarlo
  if (lastSegment && uuidRegex.test(lastSegment)) {
    return 'Detalles'
  }
  
  if (lastSegment) {
    return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1)
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