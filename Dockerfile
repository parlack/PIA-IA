# =========================================================
# PIA-IA · imagen unificada (FastAPI + Nuxt 4 + Nginx)
# ---------------------------------------------------------
# Sirve la web en piaia.yolani.co a traves de:
#   /api/*  -> FastAPI (uvicorn :8000)
#   /*      -> Nuxt SSR (node :3000)
# Nginx escucha en :8080 y multiplexa ambos.
#
# IMPORTANTE: este Dockerfile NO contiene secretos. Las variables
# de entorno se inyectan en runtime (docker run -e ... o panel Yolani).
# Repo publico => repetimos: NUNCA hardcodear credenciales aqui.
# =========================================================

# ---------- Stage 1: build del frontend Nuxt -------------
FROM node:20-bookworm-slim AS web-build

WORKDIR /build

# Manifests primero para aprovechar cache (npm ci sin postinstall: el
# `nuxt prepare` necesita el codigo fuente y lo ejecutamos despues).
COPY frontend/package.json frontend/package-lock.json ./frontend/
RUN cd frontend && npm ci --ignore-scripts --no-audit --no-fund

# Codigo del frontend (Nuxt 4 con srcDir=app/).
COPY frontend/ ./frontend/

# Build SSR. `nuxt prepare` se ejecuta como parte de `nuxt build`.
RUN cd frontend && npx nuxt prepare && npm run build

# ---------- Stage 2: build de dependencias Python --------
FROM python:3.11-slim-bookworm AS api-build

ENV PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /build

COPY backend/requirements.txt ./
RUN pip install --upgrade pip \
 && pip install --prefix=/install -r requirements.txt

# ---------- Stage 3: imagen final ------------------------
FROM python:3.11-slim-bookworm AS runtime

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    NODE_ENV=production \
    PORT=8080 \
    NUXT_HOST=0.0.0.0 \
    NUXT_PORT=3000 \
    UVICORN_HOST=0.0.0.0 \
    UVICORN_PORT=8000

# Nginx + Supervisord + Node 20 + curl (para healthcheck)
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
        curl ca-certificates gnupg nginx supervisor \
 && mkdir -p /etc/apt/keyrings \
 && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
        | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
 && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" \
        > /etc/apt/sources.list.d/nodesource.list \
 && apt-get update \
 && apt-get install -y --no-install-recommends nodejs \
 && rm -rf /var/lib/apt/lists/* \
 && rm -f /etc/nginx/sites-enabled/default

WORKDIR /app

# --- Python (FastAPI) ---
COPY --from=api-build /install /usr/local
COPY backend/ /app/backend/

# --- Frontend Nuxt (output SSR) ---
# Nuxt 4 deja todo lo necesario en .output/, autocontenido.
COPY --from=web-build /build/frontend/.output /app/frontend/.output

# --- Migracion SQL (no se ejecuta automaticamente) ---
COPY migrations/ /app/migrations/

# --- Config Nginx + Supervisord ---
COPY docker/nginx.conf       /etc/nginx/nginx.conf
COPY docker/supervisord.conf /etc/supervisor/conf.d/piaia.conf

# Usuario sin privilegios (nginx necesita escribir en /var/lib/nginx)
RUN chown -R www-data:www-data /var/lib/nginx /var/log/nginx /app

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=5 \
    CMD curl -fsS http://127.0.0.1:8080/api/health || exit 1

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/piaia.conf", "-n"]
