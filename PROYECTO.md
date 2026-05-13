# Cartilla de Vacunacion Digital IMSS

Sistema web para la administracion del esquema de vacunacion para adultos en Mexico.

## Stack Tecnologico

| Capa       | Tecnologia                       |
|------------|----------------------------------|
| Frontend   | Nuxt 4 + Vue 3 + TailwindCSS    |
| Backend    | FastAPI (Python) + Uvicorn       |
| BD         | MySQL 8 / MariaDB                |
| Notifs     | SweetAlert2                      |
| Iconos     | @nuxt/icon (Heroicons)           |

## Estructura del Proyecto

```
PIA-IA/
├── backend/
│   └── main.py              # API REST (FastAPI)
├── frontend/
│   ├── app/
│   │   ├── composables/
│   │   │   └── useApi.ts     # Wrapper HTTP al backend
│   │   ├── layouts/
│   │   │   ├── auth.vue      # Layout para login (sin sidebar)
│   │   │   └── default.vue   # Layout principal con sidebar
│   │   ├── pages/
│   │   │   ├── admin.vue     # Panel de administracion
│   │   │   ├── dashboard.vue # Cartilla del usuario
│   │   │   ├── login.vue     # Inicio de sesion por CURP
│   │   │   └── settings.vue  # Configuracion del perfil
│   │   ├── utils/
│   │   │   └── rol.ts        # Utilidades de roles
│   │   └── app.vue           # Raiz de la app
│   ├── assets/css/main.css   # Estilos globales
│   ├── nuxt.config.ts        # Configuracion Nuxt
│   └── tailwind.config.js    # Configuracion Tailwind
├── vacunas.sql               # Schema + datos de prueba
├── start.ps1                 # Script para correr ambos servidores
├── PROYECTO.md               # Este archivo
├── INVESTIGACION.md          # Investigacion de sistemas internacionales
├── .env                      # Variables de entorno (no en git)
└── .env.example              # Plantilla de variables de entorno
```

## Esquema de Base de Datos

- **usuarios** — Ciudadanos y administradores (PK: CURP)
- **vacunas_catalogo** — 15 vacunas del esquema nacional
- **historial_vacunas** — Dosis aplicadas por usuario
- **mensajes_buzon** — Sistema de mensajeria interna
- **unidades_medicas** — Directorio de UMFs

## API Endpoints

### Auth
- `POST /auth/login` — Login por CURP (con o sin contrasena)
- `POST /auth/set-password` — Establecer contrasena

### Usuario
- `GET /usuarios/{curp}` — Datos del usuario
- `PATCH /usuarios/{curp}` — Actualizar perfil

### Vacunas
- `GET /usuarios/{curp}/vacunas` — Historial + resumen
- `POST /vacunas/historial` — Registrar dosis
- `PATCH /vacunas/historial/{id}` — Editar dosis
- `DELETE /vacunas/historial/{id}` — Eliminar dosis
- `GET /vacunas/catalogo` — Catalogo completo
- `POST /vacunas/catalogo` — Agregar vacuna
- `PATCH /vacunas/catalogo/{id}` — Editar vacuna
- `DELETE /vacunas/catalogo/{id}` — Eliminar vacuna

### Buzon
- `GET /buzon/{curp}` — Mensajes del usuario
- `POST /buzon` — Enviar mensaje
- `PATCH /buzon/{id}/leer` — Marcar como leido
- `DELETE /buzon/{id}` — Eliminar mensaje

### Admin
- `GET /admin/usuarios` — Lista de usuarios (filtrable)
- `DELETE /admin/usuarios/{curp}` — Eliminar usuario
- `GET /admin/stats` — Estadisticas generales
- `GET /admin/usuarios/{curp}/vacunas` — Historial de un usuario

### Utilidades
- `GET /unidades` — Directorio de unidades medicas
- `GET /health` — Health check del sistema

## Roles

| Rol             | Acceso                                |
|-----------------|---------------------------------------|
| usuario         | Dashboard, settings, buzon            |
| administrador   | Todo + panel admin, CRUD completo     |

## Credenciales de Prueba

| CURP                  | Nombre            | Contrasena | Rol            |
|-----------------------|-------------------|------------|----------------|
| XEXX010101HNEXXXA4    | Admin Sistema     | 123        | administrador  |
| MAGL850305MNLRMS04    | Laura Martinez    | 123        | usuario        |
| GARM850101HDFRRS04    | Carlos Garcia     | 123        | usuario        |

## Instalacion y Ejecucion

### 1. Base de datos

```sql
CREATE DATABASE vacunas;
USE vacunas;
SOURCE vacunas.sql;
```

### 2. Variables de entorno

Copia `.env.example` a `.env` y configura:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_contrasena
DB_NAME=vacunas
```

### 3. Backend

```powershell
cd backend
pip install fastapi uvicorn pymysql python-dotenv
python -m uvicorn main:app --reload --port 8000
```

### 4. Frontend

```powershell
cd frontend
npm install
npm run dev
```

### 5. Script automatizado

```powershell
.\start.ps1
```

Abre ambos servidores:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- Swagger: http://localhost:8000/docs
