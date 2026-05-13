/**
 * Maya yucateco (Maaya t'aan) – ISO 639-3: `yua`.
 *
 * Traducciones revisadas para uso en salud publica. Los terminos
 * tecnicos (CURP, IMSS, nombres de vacunas) NO se traducen.
 * Donde no hay equivalente preciso, se usa la castellanizacion.
 */
import type { Messages } from './es'

export const yua: Messages = {
  meta: {
    code: 'yua',
    name: 'Maya yucateco',
    nativeName: "Maaya t'aan",
  },

  common: {
    welcome:      "Ki'imak a wóol",
    login:        "Ook",
    logout:       "Jóok'ol",
    save:         "K'ub",
    cancel:       "Xu'ulik",
    search:       "Kaxant",
    loading:      "Táan u taal",
    loadingLong:  "Táan u kaxta'al a kaambalil",
    accept:       "Boo'oltik",
    download:     "Ch'aa",
    yes:          "He'ele'",
    no:           "Ma'",
    of:           "ti'",
    seeAll:       "Ila' tuláakal",
    home:         "Otoch",
  },

  nav: {
    menu:          "Tuukulil",
    summary:       "Áanalte'",
    vaccines:      "Vakunas",
    allergies:     "Ba'al ku k'oja'antik",
    aefi:          "Ya'achuun tu pak'maj",
    inbox:         "U kúuchil t'aan",
    dependents:    "Máakob ka kanan",
    medicalUnit:   "In kúuchil",
    myInfo:        "In k'aaba'",
    admin:         "U beetbil",
    groupHealth:   "In toj óolal",
    groupServices: "Meyajo'ob",
    groupAccount:  "In k'aaba'",
    groupSystem:   "Maakino'",
  },

  language: {
    title:    "T'aan",
    subtitle: "Yéey a t'aan utia'al le maakino'",
  },

  login: {
    eyebrow:        "Múuch'tukulil vakuna",
    title:          "A áanalte'",
    titleItalic:    "digital.",
    subtitle:       "Junp'éel a k'aaba' utia'al tuláakal a kuxtal.",
    curp:           'CURP',
    curpPlaceholder:"18 letrasil",
    password:       "U juumil a k'aaba'",
    passwordOpt:    "U juumil a k'aaba' (ma' k'a'abete'i')",
    passwordHelp:   "Wa chéen táan a ilik a áanalte', p'at jejela'.",
    continue:       "K'a'aytik",
    quickConsult:   "Ila' séeb",
    fullAccess:     "Tuláakal beetbil",
    needSetup:      "Mina'an a juumil k'aaba' beyora",
    setupNow:       "Beet bejla'e'",
    invalidCurp:    "Le CURP unaj u k'amik 18 letrasil.",
    notFoundTitle:  "CURP ma' káajbil",
    notFoundText:   "Bin ka beetik ka bin tu káajbalil, chéen utia'al a wila'.",
  },

  dashboard: {
    eyebrow:        "Áanalte' digital",
    titleHello:     "Ba'ax ka wa'alik,",
    titleNoName:    "Ki'imak a wóol.",
    progressTitle:  "U bin u táanil",
    progressDoses:  "vakuna ts'íitilil",
    progressOf:     "ti'",
    alertsTitle:    "Ba'ax ku páa'tik",
    alertsNone:     "Mina'an mix ba'al.",
    historyTitle:   "U xokik le vakunas",
    historyNone:    "Mina'an ts'íitil chu'ukbil.",
    profileTitle:   "A k'aaba'",
    inboxTitle:     "U kúuchil t'aan",
    inboxNone:      "Mina'an t'aanil.",
    inboxNoMsgs:    "Mina'an a t'aanil.",
    priorityWarn:   "K'a'abet a wila'",
    priorityOne:    "vakuna unaj a wila'",
    priorityMany:   "vakunas unaj a wila'",
    statComplete:   "Ts'o'oksanil",
    statCompleteOf: "ti' le ku ts'íibtbil",
    statPending:    "Ku páa'tik",
    statPendingHint:"unaj u beetbil",
    statScheme:     "Tuláakal u ts'oksbil",
    statSchemeVacc: "vakunas",
    statInbox:      "U kúuchil t'aan",
    statInboxOne:   "túumben t'aan",
    statInboxMany:  "túumben t'aanil",
    pendingTitle:   "Ku páa'tik",
    countSuffix:    "vakunas",
    dosesApplied:   "ts'íitil yanchajan",
    notApplied:     "Ma' beeta'an",
    incomplete:     "Ma' ts'o'okok",
    allTitle:       "Tuláakal le vakunas",
    searchPlaceholder: "Kaxant…",
    resultsLabel:   "ka'aná'an",
    colVaccine:     "Vakuna",
    colDoses:       "Ts'íitilil",
    colLastApplied: "U ts'ook ts'íitil",
    colStatus:      "U yantal",
    noResults:      "Mina'an mix ba'al",
    complete:       "Ts'o'oksabil",
    pending:        "Páa'tik",
    inboxBox:       "U kúuchil",
    inboxUnread:    "ma' xokba'al",
    inboxMessages:  "t'aano'ob",
    deleteMsg:      "lúuksil",
    medicalUnit:    "U kúuchil tepahti",
    unit:           "Kúuchil",
    phone:          "Teléfono",
    notFoundEyebrow:"CURP ma' káajbil",
    notFoundTitle1: "Le áanalte'",
    notFoundTitle2: "ma' yanake'",
    backHome:       "Suut tu káajbalil",
    actions: {
      downloadPdf: "PDF",
      myQr:        "In QR",
      editProfile: "K'eex a k'aaba'",
      changePass:  "K'eex a juumil",
      print:       "Pak'ik",
    },
    sections: {
      allergies:    "Ba'al ku k'oja'antik",
      aefi:         "Ya'achuun tu pak'maj",
      dependents:   "Máakob ka kanan",
      appointments: "U k'iinilo'ob",
    },
    quickAccessTitle: "Séeb ookilo'ob",
  },

  vacunas: {
    eyebrow:     "U beelnali' vakuna",
    title:       "In",
    titleItalic: "vakunas.",
  },

  mensajes: {
    eyebrow:     "T'aano'ob a kúuchil tepahti",
    title:       "A",
    titleItalic: "kúuchil.",
  },

  alergias: {
    eyebrow:     "Ba'al ku k'oja'antik teech",
    title:       "A",
    titleItalic: "ba'al ku k'oja'antik.",
  },

  aefi: {
    eyebrow:     "Ya'achuun ka'achi tu pak'maj",
    title:       "Ya'achuun",
    titleItalic: "tu pak'maj.",
  },

  dependientes: {
    eyebrow:      "Máakob ka kananiko'ob",
    title:        "A",
    titleItalic:  "máako'ob.",
    requiresAuth: "Ook yéetel a juumil utia'al a kanan a máako'ob.",
  },

  unidadMedica: {
    eyebrow:     "A kúuchil tepahti",
    title:       "In",
    titleItalic: "kúuchil tepahti.",
  },

  groups: {
    ninguno:            "Mina'an grupoil",
    embarazada:         "Yaan u paalil",
    adulto_mayor:       "Nojoch máak",
    inmunocomprometido: "Mina'an u muuk' u winkilil",
    cronico:            "Yan u k'oja'anil",
  },

  consent: {
    title:   "Yokol nu'uk",
    intro:   "Utia'al a meyaj yéetel PIA-IA k'a'abet a boo'oltik u meyaj a datos utia'al toj óolal.",
    accept:  "Kin boo'oltik le nu'uko' yéetel u política u taak'tikil.",
    confirm: "Boo'oltik yéetel ku'ub",
  },

  errors: {
    network:      "Ma' tu páajtal u k'a'aytik. Ila' a internet.",
    unauthorized: "Mina'an a páajtal ti'al lela'.",
    rateLimited:  "Yaab a táabsab. Páat junp'éel minuto.",
    serverError:  "Lúub le maakino'. Ka'a sáasil tukulta'.",
  },
}
