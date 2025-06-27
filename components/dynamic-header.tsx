'use client'
import { usePathname } from 'next/navigation'

// Mapeo de rutas a nombres legibles
const routeNames = {
    '/': 'Inicio',
    '/profesor': 'Detalles',
    '/capturista': 'Detalles',
    '/encuadres': 'Encuadres',
    '/avances': 'Avances',
    '/puas': 'PUAs',
}

// Función para obtener el nombre de la ruta
function getRouteName(pathname) {
    // Primero busca coincidencia exacta
    if (routeNames[pathname]) {
        return routeNames[pathname]
    }

    // Para rutas dinámicas, busca patrones
    if (pathname.startsWith('/profesor/encuadres')) {
        return 'Encuadres'
    }
    if (pathname.startsWith('/profesor/avances')) {
        return 'Avances'
    }
    if (pathname.startsWith('/capturista/encuadres')) {
        return 'Encuadres'
    }
    if (pathname.startsWith('/capturista/puas')) {
        return 'PUAs'
    }

    // Si no encuentra coincidencia, capitaliza la última parte de la ruta
    const segments = pathname.split('/').filter(Boolean)
    const lastSegment = segments[segments.length - 1]

    if (lastSegment) {
        return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1)
    }

    return 'Página'
}

export default function DynamicHeader() {
    const pathname = usePathname()
    const routeName = getRouteName(pathname)

    return (
        <div className="text-xl">
            <span className="font-semibold">{routeName}</span>
        </div>
    )
}