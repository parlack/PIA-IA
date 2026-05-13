/**
 * Mensajes de UI en espanol (fuente de verdad).
 * Las claves siguen `seccion.subseccion.elemento`.
 *
 * Terminos que NO se traducen a lenguas indigenas:
 * - CURP, NSS, IMSS, PIA-IA
 * - Nombres de vacunas (BCG, Hepatitis B, etc.)
 * - Fechas (YYYY-MM-DD)
 */
export const es = {
  meta: {
    code: 'es',
    name: 'Espanol',
    nativeName: 'Espanol',
  },

  common: {
    welcome:      'Bienvenido',
    login:        'Iniciar sesion',
    logout:       'Cerrar sesion',
    save:         'Guardar',
    cancel:       'Cancelar',
    search:       'Buscar',
    loading:      'Cargando',
    loadingLong:  'Cargando tu expediente',
    accept:       'Aceptar',
    download:     'Descargar',
    yes:          'Si',
    no:           'No',
    of:           'de',
    seeAll:       'Ver todos',
    home:         'Inicio',
  },

  nav: {
    menu:          'Menu',
    summary:       'Inicio',
    vaccines:      'Vacunas',
    allergies:     'Alergias',
    aefi:          'Eventos adversos',
    inbox:         'Buzon',
    dependents:    'Dependientes',
    medicalUnit:   'Mi unidad',
    myInfo:        'Mi informacion',
    admin:         'Administracion',
    groupHealth:   'Mi salud',
    groupServices: 'Servicios',
    groupAccount:  'Cuenta',
    groupSystem:   'Sistema',
  },

  language: {
    title:    'Idioma',
    subtitle: 'Selecciona el idioma de la interfaz',
  },

  login: {
    eyebrow:        'Sistema unificado de vacunacion',
    title:          'Tu cartilla',
    titleItalic:    'digital.',
    subtitle:       'Una sola identidad para todos los servicios de salud.',
    curp:           'CURP',
    curpPlaceholder:'18 caracteres',
    password:       'Contrasena',
    passwordOpt:    'Contrasena (opcional)',
    passwordHelp:   'Dejala vacia si solo quieres consultar tu cartilla.',
    continue:       'Continuar',
    quickConsult:   'Consulta rapida',
    fullAccess:     'Acceso completo',
    needSetup:      'Aun no tienes contrasena',
    setupNow:       'Crear ahora',
    invalidCurp:    'La CURP debe tener 18 caracteres.',
    notFoundTitle:  'CURP no registrada',
    notFoundText:   'Te llevaremos al inicio en modo consulta. Un administrador debe registrarte.',
  },

  dashboard: {
    eyebrow:        'Cartilla digital',
    titleHello:     'Hola,',
    titleNoName:    'Bienvenido.',
    progressTitle:  'Progreso del esquema',
    progressDoses:  'dosis aplicadas',
    progressOf:     'de',
    alertsTitle:    'Alertas pendientes',
    alertsNone:     'Sin alertas.',
    historyTitle:   'Historial de vacunas',
    historyNone:    'Sin dosis registradas.',
    profileTitle:   'Perfil',
    inboxTitle:     'Buzon',
    inboxNone:      'Sin mensajes.',
    inboxNoMsgs:    'No tienes mensajes.',
    priorityWarn:   'Atencion prioritaria',
    priorityOne:    'vacuna requiere tu atencion',
    priorityMany:   'vacunas requieren tu atencion',
    statComplete:   'Completas',
    statCompleteOf: 'en catalogo',
    statPending:    'Pendientes',
    statPendingHint:'requieren accion',
    statScheme:     'Esquema completo',
    statSchemeVacc: 'vacunas',
    statInbox:      'Bandeja',
    statInboxOne:   'mensaje nuevo',
    statInboxMany:  'mensajes nuevos',
    pendingTitle:   'Pendientes',
    countSuffix:    'vacunas',
    dosesApplied:   'dosis aplicadas',
    notApplied:     'Sin aplicar',
    incomplete:     'Incompleta',
    allTitle:       'Todas las vacunas',
    searchPlaceholder: 'Buscar…',
    resultsLabel:   'resultados',
    colVaccine:     'Vacuna',
    colDoses:       'Dosis',
    colLastApplied: 'Ultima aplicacion',
    colStatus:      'Estado',
    noResults:      'Sin resultados',
    complete:       'Completa',
    pending:        'Pendiente',
    inboxBox:       'Bandeja',
    inboxUnread:    'sin leer',
    inboxMessages:  'mensajes',
    deleteMsg:      'eliminar',
    medicalUnit:    'Unidad medica',
    unit:           'Unidad',
    phone:          'Telefono',
    notFoundEyebrow:'CURP no encontrada',
    notFoundTitle1: 'Esta cartilla',
    notFoundTitle2: 'aun no existe.',
    backHome:       'Volver al inicio',
    actions: {
      downloadPdf: 'PDF oficial',
      myQr:        'Mi QR',
      editProfile: 'Editar perfil',
      changePass:  'Cambiar contrasena',
      print:       'Imprimir',
    },
    sections: {
      allergies:   'Alergias y contraindicaciones',
      aefi:        'Eventos adversos',
      dependents:  'Dependientes',
      appointments:'Citas',
    },
    quickAccessTitle: 'Accesos rapidos',
  },

  vacunas: {
    eyebrow:     'Esquema de vacunacion',
    title:       'Mis',
    titleItalic: 'vacunas.',
  },

  mensajes: {
    eyebrow:     'Comunicaciones de tu unidad',
    title:       'Tu',
    titleItalic: 'buzon.',
  },

  alergias: {
    eyebrow:     'Alergias y contraindicaciones',
    title:       'Tus',
    titleItalic: 'alergias.',
  },

  aefi: {
    eyebrow:     'Eventos adversos post-vacunacion',
    title:       'Eventos',
    titleItalic: 'adversos.',
  },

  dependientes: {
    eyebrow:      'Personas bajo tu cuidado',
    title:        'Tus',
    titleItalic:  'dependientes.',
    requiresAuth: 'Inicia sesion con contrasena para administrar a tus dependientes.',
  },

  unidadMedica: {
    eyebrow:     'Tu unidad medica',
    title:       'Mi',
    titleItalic: 'unidad medica.',
  },

  groups: {
    ninguno:           'Sin grupo prioritario',
    embarazada:        'Embarazada',
    adulto_mayor:      'Adulto mayor',
    inmunocomprometido:'Inmunocomprometido',
    cronico:           'Enfermedad cronica',
  },

  consent: {
    title:   'Consentimiento informado',
    intro:   'Para usar PIA-IA debes aceptar el uso de tus datos personales con fines de salud publica.',
    accept:  'Acepto los terminos y la politica de privacidad',
    confirm: 'Aceptar y continuar',
  },

  errors: {
    network:       'Error de red. Verifica tu conexion.',
    unauthorized:  'No tienes permisos para esta accion.',
    rateLimited:   'Demasiados intentos. Intenta en un minuto.',
    serverError:   'Error del servidor. Intenta mas tarde.',
  },
} as const

export type Messages = typeof es
