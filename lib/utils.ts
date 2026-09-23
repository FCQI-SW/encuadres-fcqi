// lib/utils.ts
// `cn(...)`: helper de shadcn para merge de clases Tailwind. Basado en clsx + tailwind-merge.
// Doc completa: docs/codigo/codigo.md#libutilsts

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
