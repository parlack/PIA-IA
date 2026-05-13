# Despliegue PIA-IA en Coolify · piaia.yolani.co

Esta guia cubre como desplegar la imagen unificada (FastAPI + Nuxt 4 + Nginx)
en una instancia de **Coolify** y exponerla en `piaia.yolani.co`.

> **Repo publico.** Nada bajo control de versiones contiene credenciales.
> Las variables sensibles se inyectan en runtime via el panel de Coolify.

## 1. Que hay dentro del contenedor

```
piaia/web:latest
├─ Nginx     :8080   ← unico puerto expuesto al exterior (lo lee Coolify de EXPOSE)
│     ├─ /api/*       → uvicorn :8000 (FastAPI, prefijo /api removido por nginx)
│     ├─ /docs        → uvicorn :8000 (OpenAPI Swagger)
│     └─ /*           → node    :3000 (Nuxt 4 SSR)
├─ uvicorn  :8000   (interno)
└─ node     :3000   (interno, Nuxt .output)
```

Supervisord supervisa los tres procesos y los reinicia si caen.

## 2. Setup en Coolify

### 2.1 Crear el recurso

1. New Resource → **Public Repository**.
2. Repository URL: la URL publica de tu repo en GitHub/GitLab.
3. Branch: `main` (o la que uses).
4. Build pack: **Dockerfile** (Coolify lo detecta al ver `./Dockerfile`).
5. Ports exposed: `8080`.
6. Domain: `piaia.yolani.co` (Coolify gestiona TLS via Traefik / Caddy automatico).

### 2.2 Variables de entorno (panel Coolify → Environment)

| Variable | Ejemplo | Obligatoria |
|---|---|---|
| `DB_HOST` | `host de tu BD` | si |
| `DB_PORT` | `3306` o el que uses | si |
| `DB_USER` | `usuario` | si |
| `DB_PASSWORD` | `***` (NO commitear) | si |
| `DB_NAME` | `nombre_de_la_bd` | si |
| `CORS_ORIGINS` | `https://piaia.yolani.co` | si |
| `YOLANI_MAIL_API_KEY` | `yk-...` | opcional |
| `YOLANI_MAIL_API_URL` | `https://api.yolani.co` | opcional |
| `YOLANI_MAIL_DOMAIN` | `yolani.co` | opcional |
| `YOLANI_MAIL_FROM` | `PIA-IA <no-reply@yolani.co>` | opcional |
| `NUXT_PUBLIC_API_BASE` | `/api` (default) | no |

> Marca todas como **Build Variable: No** y **Is Secret: Si** para las
> credenciales. Coolify las inyecta en runtime, no en build time.

### 2.3 Healthcheck

El Dockerfile ya trae `HEALTHCHECK` (curl a `/api/health`). Coolify lo respeta automaticamente.

- `GET /api/health` → **liveness** (no toca BD). Coolify usa este.
- `GET /api/health/db` → **readiness** (verifica `SELECT 1`). Solo para diagnostico
  manual; si la BD se cae, Coolify NO debe matar el contenedor.

### 2.4 Deploy

1. **Deploy** → Coolify clona el repo, hace `docker build .` (3-5 min), arranca el contenedor.
2. Tail de logs: Coolify → Logs (combinados de supervisord).
3. Verifica:
   - `https://piaia.yolani.co/`                → web Nuxt
   - `https://piaia.yolani.co/api/health`      → `{"status": "ok"}` (liveness)
   - `https://piaia.yolani.co/api/health/db`   → `{"status": "ok", "database": "connected"}` (readiness)
   - `https://piaia.yolani.co/docs`            → Swagger

## 3. Migracion de BD (rol medico)

Antes del primer login con CURP de medico, aplica la migracion contra tu BD productiva:

```bash
mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASSWORD $DB_NAME \
    < migrations/2026_05_13_add_medico_role.sql
```

O conectandote desde tu cliente (DBeaver, TablePlus, phpMyAdmin) y pegando el SQL.

## 4. Build local (smoke fuera de Coolify)

```bash
docker build -t piaia/web:latest .
docker run --rm -p 8080:8080 \
  -e DB_HOST=tu-host \
  -e DB_PORT=3306 \
  -e DB_USER=tu-user \
  -e DB_PASSWORD='tu-password' \
  -e DB_NAME=tu-bd \
  -e CORS_ORIGINS=http://localhost:8080 \
  piaia/web:latest
```

Visita http://localhost:8080.

## 5. Mobile contra produccion

La app movil **no** se dockeriza (sigue siendo Expo). Para que apunte a Coolify:

```bash
# mobile/.env
EXPO_PUBLIC_API_BASE=https://piaia.yolani.co/api
```

## 6. Problemas comunes

- **`502 Bad Gateway`**: uvicorn o node aun no levantaron. Espera 10-20s o checa logs.
- **CORS rechazado**: asegura `CORS_ORIGINS=https://piaia.yolani.co` en Coolify.
- **`Error connecting to MySQL`**: verifica que el host BD permita conexiones desde la IP del servidor Coolify (firewall, allowed_hosts).
- **Coolify no detecta el puerto**: confirma que el Dockerfile tiene `EXPOSE 8080`.
- **Build muy lento**: Coolify cachea capas; el primer build tarda mas, el resto es rapido.
- **Cambio en frontend no aparece**: redeploy (no basta restart, hay que rebuild para que Nuxt regenere `.output`).
