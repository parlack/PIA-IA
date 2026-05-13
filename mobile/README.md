# PIA-IA Cartilla — App movil

App nativa (iOS + Android) construida con Expo + React Native + TypeScript.
Comparte el backend FastAPI con la version web.

## Estructura

```
mobile/
  app/                  expo-router (file-based routing)
    _layout.tsx         layout raiz
    index.tsx           entrypoint que decide login/dashboard
    login.tsx           pantalla de login (CURP + tabs)
    dashboard.tsx       cartilla de vacunacion del usuario
  src/
    api/                cliente HTTP + endpoints por dominio
      client.ts         base HTTP con manejo de errores
      auth.ts
      usuarios.ts
      vacunas.ts
    components/
      ui/               primitivos (Text, Button, Field, Tabs)
      domain/           especificos (VacunaRow, AlertaBanner, GrupoBadge)
    hooks/              logica reutilizable (useAuth, useCartilla, useSession)
    theme/              tokens (colors, typography, spacing)
    types/              interfaces compartidas
    utils/              helpers (curp, fecha)
    constants/          etiquetas de dominio
```

## Reglas de arquitectura

Sigue la skill `arquitectura-modular`:
- Screens (`app/*`) NO contienen logica de negocio. Llaman hooks.
- Toda llamada HTTP pasa por `src/api/`. Nunca `fetch` directo en componentes.
- AsyncStorage solo se accede desde `useSession`. NO leerlo en screens.
- Theme tokens (`@/theme`) — nunca hardcodear colores o tipografias.
- Maximo 300 lineas por archivo, 40 lineas por funcion.

## Iniciar

```powershell
cd mobile
npm install
npm start
```

Abre Expo Go en tu telefono y escanea el QR.

## Configurar backend

Edita `.env`:

```
EXPO_PUBLIC_API_BASE=http://TU-IP-LOCAL:8000
```

(Usa tu IP de red local, no `localhost`, porque el celular esta en otro dispositivo.)

Asegurate de que el backend permita el origen en `CORS_ORIGINS` del `.env` raiz.
