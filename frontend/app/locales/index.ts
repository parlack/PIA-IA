import { es } from './es'
import { yua } from './yua'
import { nah } from './nah'

export type LocaleCode = 'es' | 'yua' | 'nah'

export const LOCALES = { es, yua, nah } as const

export const LOCALE_LIST: { code: LocaleCode; name: string; nativeName: string }[] = [
  { code: 'es',  name: 'Espanol',       nativeName: 'Espanol' },
  { code: 'yua', name: 'Maya yucateco', nativeName: "Maaya t'aan" },
  { code: 'nah', name: 'Nahuatl',       nativeName: 'Nahuatlahtolli' },
]

export const DEFAULT_LOCALE: LocaleCode = 'es'
