// Caracteres permitidos (sin confusos: 0, O, l, 1, I)
const MAYUSCULAS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const MINUSCULAS = "abcdefghjkmnpqrstuvwxyz";
const NUMEROS = "23456789";
const SIMBOLOS = "@#$%&*!?+-=";

export function generarClaveSegura(longitud: number = 12): string {
  const todosCaracteres = MAYUSCULAS + MINUSCULAS + NUMEROS + SIMBOLOS;
  
  // Garantizar al menos 2 de cada tipo
  let clave = "";
  clave += obtenerCaracteresAleatorios(MAYUSCULAS, 2);
  clave += obtenerCaracteresAleatorios(MINUSCULAS, 2);
  clave += obtenerCaracteresAleatorios(NUMEROS, 2);
  clave += obtenerCaracteresAleatorios(SIMBOLOS, 2);
  
  // Completar el resto con caracteres aleatorios
  const restante = longitud - clave.length;
  clave += obtenerCaracteresAleatorios(todosCaracteres, restante);
  
  // Mezclar la clave para que no sea predecible
  return mezclarString(clave);
}

function obtenerCaracteresAleatorios(caracteres: string, cantidad: number): string {
  let resultado = "";
  const array = new Uint32Array(cantidad);
  crypto.getRandomValues(array);
  
  for (let i = 0; i < cantidad; i++) {
    resultado += caracteres[array[i] % caracteres.length];
  }
  
  return resultado;
}

function mezclarString(str: string): string {
  const array = str.split("");
  const randomValues = new Uint32Array(array.length);
  crypto.getRandomValues(randomValues);
  
  for (let i = array.length - 1; i > 0; i--) {
    const j = randomValues[i] % (i + 1);
    [array[i], array[j]] = [array[j], array[i]];
  }
  
  return array.join("");
}

export function validarFortalezaClave(clave: string): {
  valida: boolean;
  errores: string[];
} {
  const errores: string[] = [];
  
  if (clave.length < 12) {
    errores.push("La clave debe tener al menos 12 caracteres");
  }
  
  if (!/[A-Z].*[A-Z]/.test(clave)) {
    errores.push("Debe contener al menos 2 letras mayúsculas");
  }
  
  if (!/[a-z].*[a-z]/.test(clave)) {
    errores.push("Debe contener al menos 2 letras minúsculas");
  }
  
  if (!/[0-9].*[0-9]/.test(clave)) {
    errores.push("Debe contener al menos 2 números");
  }
  
  if (!/[@#$%&*!?+\-=].*[@#$%&*!?+\-=]/.test(clave)) {
    errores.push("Debe contener al menos 2 símbolos especiales");
  }
  
  return {
    valida: errores.length === 0,
    errores,
  };
}

export function validarCorreoInstitucional(correo: string): {
  valido: boolean;
  error?: string;
} {
  const correoLimpio = correo.trim().toLowerCase();
  
  // Validar formato básico de email
  const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regexEmail.test(correoLimpio)) {
    return { valido: false, error: "Formato de correo inválido" };
  }
  
  // Validar dominio institucional
  const dominiosPermitidos = ["@uabc.edu.mx", "@uabc.mx"];
  const esInstitucional = dominiosPermitidos.some((dominio) =>
    correoLimpio.endsWith(dominio)
  );
  
  if (!esInstitucional) {
    return {
      valido: false,
      error: "Solo se permiten correos institucionales (@uabc.edu.mx o @uabc.mx)",
    };
  }
  
  return { valido: true };
}