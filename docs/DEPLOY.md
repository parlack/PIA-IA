# Despliegue PIA-IA · piaia.yolani.co

Este documento explica como construir y desplegar la imagen Docker unificada
(API FastAPI + Web Nuxt + Nginx) en `piaia.yolani.co`.

> **Importante.** El repositorio es publico. Ningun archivo bajo control de
> versiones contiene credenciales. Todas las variables sensibles se inyectan
> en runtime (`docker run -e ...` o panel Yolani).

## 1. Que hay dentro del contenedor

```
piaia/web:latest
├─ Nginx     :8080   ← unico puerto expuesto al exterior
│     ├─ /api/*       → uvicorn :8000 (FastAPI, prefijo /api removido)
│     ├─ /docs        → uvicorn :8000 (OpenAPI)
│     └─ /*           → node    :3000 (Nuxt 4 SSR)
├─ uvicorn  :8000   (interno)
└─ node     :3000   (interno, Nuxt .output)
```

Supervisord supervisa los tres procesos y los reinicia si caen.

## 2. Variables de entorno requeridas

| Variable | Ejemplo | Obligatoria |
|---|---|---|
| `DB_HOST` | `host de tu BD` | si |
| `DB_PORT` | `3306` o el que uses | si |
| `DB_USER` | `usuario` | si |
| `DB_PASSWORD` | `***` (NO commitear) | si |
| `DB_NAME` | `nombre_de_la_bd` | si |
| `CORS_ORIGINS` | `https://piaia.yolani.co` | si |
| `YOLANI_MAIL_API_KEY` | `yk-...` | opcional (mail) |
| `YOLANI_MAIL_API_URL` | `https://api.yolani.co` | opcional |
| `YOLANI_MAIL_DOMAIN` | `yolani.co` | opcional |
| `YOLANI_MAIL_FROM` | `PIA-IA <no-reply@yolani.co>` | opcional |
| `NUXT_PUBLIC_API_BASE` | `/api` (default en supervisord) | no |

## 3. Build local

```bash
docker build -t piaia/web:latest .
```

Tarda ~3-5 min la primera vez (Nuxt build + pip install + Node 20 apt).

## 4. Correr local (smoke)

```bash
docker run --rm -p 8080:8080 \
  -e DB_HOST=tu-host \
  -e DB_PORT=3306 \
  -e DB_USER=tu-user \
  -e DB_PASSWORD='tu-password' \
  -e DB_NAME=tu-bd \
  -e CORS_ORIGINS=http://localhost:8080 \
  piaia/web:latest
```

Visita http://localhost:8080. Healthcheck: `curl http://localhost:8080/api/health`.

Tambien puedes copiar `docker-compose.example.yml` a `docker-compose.yml` y correr `docker compose up`.

## 5. Subir a Yolani (piaia.yolani.co)

1. Construye y empuja la imagen al registro que use Yolani
   (o sube el tarball: `docker save piaia/web:latest | gzip > piaia.tar.gz`).
2. En el panel de Yolani configura:
   - **Puerto interno:** `8080`
   - **Dominio:** `piaia.yolani.co`
   - **Variables de entorno:** las de la tabla #2.
3. Aplica la migracion SQL del rol medico contra la BD productiva:
   ```bash
   mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASSWORD $DB_NAME \
       < migrations/2026_05_13_add_medico_role.sql
   ```
4. Verifica:
   - `https://piaia.yolani.co/`                → debe servir la landing/login Nuxt
   - `https://piaia.yolani.co/api/health`      → `{"ok": true, ...}`
   - `https://piaia.yolani.co/docs`            → OpenAPI swagger
   - Login admin/medico con CURP + password.

## 6. Problemas comunes

- **`502 Bad Gateway` en `/`**: uvicorn o node aun no levantaron. Espera 10-20s.
  Logs: `docker logs piaia` (supervisord stream).
- **`Network request failed` en mobile**: la app movil no esta dockerizada; sigue
  apuntando a `EXPO_PUBLIC_API_BASE`. Para que use produccion, en `mobile/.env`
  pon `EXPO_PUBLIC_API_BASE=https://piaia.yolani.co/api`.
- **CORS rechazado**: asegura que `CORS_ORIGINS` contenga `https://piaia.yolani.co`.
- **DB no accesible**: verifica firewall del host MySQL hacia la IP del contenedor.
