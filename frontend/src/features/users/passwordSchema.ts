import { z } from 'zod'

// RN-04 (parte que se valida en el navegador): mínimo 8 caracteres y no solo números.
// El backend aplicará además los validadores de Django (no parecida a los datos ni común).
export const newPasswordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .refine((value) => !/^\d+$/.test(value), 'La contraseña no puede tener solo números')
