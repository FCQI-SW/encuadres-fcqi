"use client"
import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { DateRange, RangeKeyDict } from "react-date-range"
import { es } from "date-fns/locale"
import { format } from "date-fns"
import { ChevronLeft } from "lucide-react"

// Importa el Button de ShadCN (ajusta la ruta según tu proyecto)
import { Button } from "@/components/ui/button"

import "react-date-range/dist/styles.css"
import "react-date-range/dist/theme/default.css"

// Definimos un tipo para el objeto de rango de fechas
type MyDateRange = {
  startDate: Date
  endDate: Date
  key: string
}

// Helper para formatear la hora (de "HH:mm" a "h:mm a")
function formatTime(timeString: string): string {
  const [hours, minutes] = timeString.split(":").map(Number)
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)
  return format(date, "h:mm a", { locale: es })
}

export default function DateRangePicker() {
  const router = useRouter()

  // Estado inicial con las fechas 14 de abril 2021 y 23 de abril 2021
  const [selectionRange, setSelectionRange] = useState<MyDateRange>({
    startDate: new Date(2021, 3, 14), // Mes 3 = Abril (0-based)
    endDate: new Date(2021, 3, 23),
    key: "selection",
  })

  // Estados para la hora de inicio y fin
  const [startTime, setStartTime] = useState("00:00")
  const [endTime, setEndTime] = useState("23:59")

  // Función para manejar la selección en el calendario
  const handleSelect = (ranges: RangeKeyDict) => {
    const selection = ranges.selection as MyDateRange
    setSelectionRange({
      startDate: selection.startDate,
      endDate: selection.endDate,
      key: "selection",
    })
  }

  // Formateo de fechas al estilo "14 de abril de 2021"
  const fromString = format(selectionRange.startDate, "d 'de' MMMM 'de' yyyy", { locale: es })
  const toString = format(selectionRange.endDate, "d 'de' MMMM 'de' yyyy", { locale: es })

  return (
    <div className="flex flex-col p-6">
      {/* Botón de regresar en la parte superior izquierda */}
      <Button variant="outline" className="mb-4 self-start" onClick={() => router.push("/admin")}>
        <ChevronLeft className="mr-2 h-5 w-5" /> Regresar
      </Button>

      {/* Contenedor central para el calendario y demás */}
      <div className="flex flex-col items-center w-full">
        {/* Calendario para rango de fechas con selección en color #00723F */}
        <DateRange
          ranges={[selectionRange]}
          onChange={handleSelect}
          locale={es}
          moveRangeOnFirstSelection={false}
          months={1}
          direction="horizontal"
          rangeColors={["#00723F"]}
        />

        {/* Selector de hora para fecha de inicio */}
        <div className="mt-4 flex flex-col items-center">
          <label htmlFor="start-time" className="mb-2 font-medium">
            Selecciona la hora de inicio:
          </label>
          <input
            id="start-time"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </div>

        {/* Selector de hora para fecha final */}
        <div className="mt-4 flex flex-col items-center">
          <label htmlFor="end-time" className="mb-2 font-medium">
            Selecciona la hora final:
          </label>
          <input
            id="end-time"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </div>

        {/* Muestra la fecha y hora seleccionadas */}
        <p className="mt-4 text-center">
          Fecha indicada: {fromString} a las {formatTime(startTime)} a {toString} a las {formatTime(endTime)}
        </p>

        {/* Botón para "Establecer fecha" */}
        <button className="mt-4 px-4 py-2 bg-[#DD971A] hover:bg-[#FEBE10] text-white rounded cursor-pointer">
          Establecer fecha
        </button>
      </div>
    </div>
  )
}