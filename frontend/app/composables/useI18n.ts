/**
 * Sistema de i18n para PIA-IA.
 *
 * - Estado global reactivo (`useState`) compartido entre paginas.
 * - Persistencia en `localStorage` con clave `pia_locale`.
 * - 3 idiomas: Espanol, Maya yucateco, Nahuatl.
 *
 * Uso:
 *   const { t, locale, setLocale } = useI18n()
 *   t('login.continue')
 */
import { computed } from 'vue'
import { DEFAULT_LOCALE, LOCALES, LOCALE_LIST } from '~/locales'
import type { LocaleCode } from '~/locales'

const STORAGE_KEY = 'pia_locale'

function readStored(): LocaleCode {
  if (typeof window === 'undefined') return DEFAULT_LOCALE
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (raw === 'es' || raw === 'yua' || raw === 'nah') return raw
  return DEFAULT_LOCALE
}

function pick(obj: any, path: string[]): unknown {
  return path.reduce<any>((acc, key) => (acc == null ? acc : acc[key]), obj)
}

export const useI18n = () => {
  const locale = useState<LocaleCode>('pia.locale', () => readStored())

  const messages = computed(() => LOCALES[locale.value])

  function setLocale(code: LocaleCode) {
    locale.value = code
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, code)
    }
  }

  function t(key: string): string {
    const path = key.split('.')
    const direct = pick(messages.value, path)
    if (typeof direct === 'string') return direct
    // Fallback al espanol si no existe la traduccion en el idioma activo
    const fallback = pick(LOCALES.es, path)
    return typeof fallback === 'string' ? fallback : key
  }

  return {
    locale,
    messages,
    setLocale,
    locales: LOCALE_LIST,
    t,
  }
}
