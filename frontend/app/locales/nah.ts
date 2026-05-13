/**
 * Nahuatl central (Nahuatlahtolli) – ISO 639-3: `nah`.
 *
 * Variante central, alineada con el material educativo de la SEP.
 * Los terminos tecnicos (CURP, IMSS, vacunas) NO se traducen.
 * Cuando no hay termino tradicional, se usa loanword castellanizado.
 */
import type { Messages } from './es'

export const nah: Messages = {
  meta: {
    code: 'nah',
    name: 'Nahuatl',
    nativeName: 'Nahuatlahtolli',
  },

  common: {
    welcome:      'Nimitzpaquilia tikualli',
    login:        'Kalakí',
    logout:       'Kisa',
    save:         'Tlapia',
    cancel:       'Amo',
    search:       'Temo',
    loading:      'Yauh',
    loadingLong:  'Yauh moamatlahkuilolli',
    accept:       'Kuelita',
    download:     'Kuiti',
    yes:          'Quema',
    no:           'Amo',
    of:           'in',
    seeAll:       'Xikitta nochi',
    home:         'Chan',
  },

  nav: {
    menu:          'Tlanahuatil',
    summary:       'Amatlahkuilolli',
    vaccines:      'Tepahti',
    allergies:     'Tlen tech kohkoa',
    aefi:          'Ipanpa vakuna',
    inbox:         'Mosanilkalli',
    dependents:    'Akin tikpia',
    medicalUnit:   'Notepahkal',
    myInfo:        'Notlahtol',
    admin:         'Tlanahuatiliztli',
    groupHealth:   'Notepahti',
    groupServices: 'Tlapalehuiliztli',
    groupAccount:  'Notlahtol',
    groupSystem:   'Teposchan',
  },

  language: {
    title:    'Tlahtolli',
    subtitle: 'Xikpehpena motlahtol ipan teposnemiliztli',
  },

  login: {
    eyebrow:        'Tepahtilistli sentlalili',
    title:          'Moamatlahkuilol',
    titleItalic:    'digital.',
    subtitle:       'Se san tokayotl ipan nochi tepahtilistli.',
    curp:           'CURP',
    curpPlaceholder:'18 machiyotl',
    password:       'Ichtaka tlahtolli',
    passwordOpt:    'Ichtaka tlahtolli (amo monekik)',
    passwordHelp:   'Tla san tikitanesnequi moamatlahkuilol, amitlah xikahkili.',
    continue:       'Xinotza',
    quickConsult:   'Iciuhka tlahtoltilistli',
    fullAccess:     'Nochi kalakilistli',
    needSetup:      'Amo motech ka ichtaka tlahtolli',
    setupNow:       'Xikchihua axkan',
    invalidCurp:    'CURP monekik 18 machiyomeh.',
    notFoundTitle:  'CURP amo nesi',
    notFoundText:   'Timitzitzkis ompa chan, san ika tikitas. Ce tequipanoani monekik mitzihkuilos.',
  },

  dashboard: {
    eyebrow:        'Amatlahkuilolli digital',
    titleHello:     'Niltze,',
    titleNoName:    'Tikualli ehko.',
    progressTitle:  'Iyahyah',
    progressDoses:  'tepahtli omotemak',
    progressOf:     'in',
    alertsTitle:    'Tlen omochias',
    alertsNone:     'Amitlah onka.',
    historyTitle:   'Inanaltil itech vakuna',
    historyNone:    'Ayic onkak.',
    profileTitle:   'Motokayotl',
    inboxTitle:     'Mosanilkalli',
    inboxNone:      'Amitlah amatl.',
    inboxNoMsgs:    'Amitlah amatl tikpia.',
    priorityWarn:   'Monekik tlachias',
    priorityOne:    'tepahtli monekik tlachias',
    priorityMany:   'tepahti monekih tlachias',
    statComplete:   'Mochi',
    statCompleteOf: 'tlen monekik',
    statPending:    'Onkak ok',
    statPendingHint:'monekik tlachiwas',
    statScheme:     'Nochi monekik',
    statSchemeVacc: 'tepahti',
    statInbox:      'Mosanilkalli',
    statInboxOne:   'yankuik amatl',
    statInboxMany:  'yankuik amameh',
    pendingTitle:   'Onkak ok',
    countSuffix:    'tepahti',
    dosesApplied:   'omotemak',
    notApplied:     'Amo otemoh',
    incomplete:     'Ayemo mochi',
    allTitle:       'Nochi in tepahtli',
    searchPlaceholder: 'Temo…',
    resultsLabel:   'tlen onkak',
    colVaccine:     'Tepahtli',
    colDoses:       'Tetlamatil',
    colLastApplied: 'Tlen otzon',
    colStatus:      'Ken kah',
    noResults:      'Amitlah onkak',
    complete:       'Mochi',
    pending:        'Onkak ok',
    inboxBox:       'Mosanilkalli',
    inboxUnread:    'amo otikpoh',
    inboxMessages:  'amameh',
    deleteMsg:      'xikxipehua',
    medicalUnit:    'Tepahkali',
    unit:           'Kali',
    phone:          'Teléfono',
    notFoundEyebrow:'CURP amo onesi',
    notFoundTitle1: 'In amatlahkuilolli',
    notFoundTitle2: 'ayemo onkak.',
    backHome:       'Mokuepa chan',
    actions: {
      downloadPdf: 'PDF',
      myQr:        'Noqr',
      editProfile: 'Patla motokayotl',
      changePass:  'Patla ichtaka tlahtol',
      print:       'Xikkixti',
    },
    sections: {
      allergies:    'Tlen tech kohkoa',
      aefi:         'Tlen omochih ipanpa vakuna',
      dependents:   'Akin tikpia',
      appointments: 'Tonalmeh ipan tepahti',
    },
    quickAccessTitle: 'Iciuhka kalakiliztli',
  },

  vacunas: {
    eyebrow:     'Tlen monekik mitsmakaske',
    title:       'Notepahti',
    titleItalic: 'mochintin.',
  },

  mensajes: {
    eyebrow:     'Inamatl motepahkal',
    title:       'Motepa',
    titleItalic: 'sanilkalli.',
  },

  alergias: {
    eyebrow:     'Tlen tech kohkoa',
    title:       'Tlen mitz',
    titleItalic: 'kohkoa.',
  },

  aefi: {
    eyebrow:     'Tlen mochih ipanpa vakuna',
    title:       'Ipanpa',
    titleItalic: 'vakuna.',
  },

  dependientes: {
    eyebrow:      'Akin tikpia tikinmokuitla',
    title:        'Akin',
    titleItalic:  'tikpia.',
    requiresAuth: 'Xikalaki ica ichtaka tlahtolli inik tikinkuilas akin tikpia.',
  },

  unidadMedica: {
    eyebrow:     'Notepahkal',
    title:       'No',
    titleItalic: 'tepahkali.',
  },

  groups: {
    ninguno:            'Amo itech ce taman',
    embarazada:         'Kipia konetl',
    adulto_mayor:       'Huehuetzin',
    inmunocomprometido: 'Tetlapaltik ica kokoliztli',
    cronico:            'Huehkahua kokoliztli',
  },

  consent: {
    title:   'Yektlahkuilolli',
    intro:   'Inik tikteki PIA-IA, monekik tikkuelitas ihkuiloliztli motlapial ica tetlapaltili.',
    accept:  'Niktlanektia tlen ilihtok ihuan kena niktlapal nodatos.',
    confirm: 'Kuelita ihuan xiyo',
  },

  errors: {
    network:      'Amo timopia internet. Xitlachiya.',
    unauthorized: 'Amo motech ka tlanahuatili.',
    rateLimited:  'Miec otimotzin. Xikchiya ce minuto.',
    serverError:  'Omokokoh in teposchan. Sayoltzin xikchih.',
  },
}
