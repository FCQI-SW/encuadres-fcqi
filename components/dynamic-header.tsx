'use client'
import { usePathname } from 'next/navigation'

// Tipa el mapa
const routeNames: Record<string, string> = {
  '/': 'Inicio',
  '/profesor': 'Detalles',
  '/capturista': 'Detalles',
  '/encuadres': 'Encuadres',
  '/avances': 'Avances',
  '/puas': 'PUAs',
}

// Tipa el parámetro y el retorno
function getRouteName(pathname: string): string {
  if (routeNames[pathname]) {
    return routeNames[pathname]
  }

  if (pathname.startsWith('/profesor/encuadres')) return 'Encuadres'
  if (pathname.startsWith('/profesor/avances')) return 'Avances'
  if (pathname.startsWith('/capturista/encuadres')) return 'Encuadres'
  if (pathname.startsWith('/capturista/puas')) return 'PUAs'

  const segments = pathname.split('/').filter(Boolean)
  const lastSegment = segments[segments.length - 1]
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
