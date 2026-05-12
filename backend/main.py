# main.py — Sistema Cartilla de Vacunación Digital IMSS
# FastAPI + MySQL (PyMySQL) — contraseñas en texto plano (solo desarrollo / demo)
# Ejecutar: uvicorn main:app --reload --port 8000

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date, datetime
import pymysql
import pymysql.cursors

# ─────────────────────────────────────────────
# APP & CORS
# ─────────────────────────────────────────────
app = FastAPI(title="Cartilla de Vacunación IMSS", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],   # URL del frontend Nuxt
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────
# CONEXIÓN A BASE DE DATOS
# ─────────────────────────────────────────────
DB_CONFIG = {
    "host":     "127.0.0.1",
    "port":     3306,
    "user":     "root",        # cambia si tu usuario es diferente
    "password": "",            # cambia por tu contraseña de MySQL
    "database": "vacunas",
    "charset":  "utf8mb4",
    "cursorclass": pymysql.cursors.DictCursor,
}

def get_db():
    return pymysql.connect(**DB_CONFIG)

# ─────────────────────────────────────────────
# SCHEMAS (Pydantic)
# ─────────────────────────────────────────────

class LoginRequest(BaseModel):
    curp: str
    contrasena: Optional[str] = None

class SetPasswordRequest(BaseModel):
    curp: str
    contrasena: str

class UsuarioUpdate(BaseModel):
    nombre:           Optional[str] = None
    apellido_paterno: Optional[str] = None
    apellido_materno: Optional[str] = None
    celular:          Optional[str] = None
    correo:           Optional[str] = None
    unidad_medica_id: Optional[int] = None
    medico_familiar:  Optional[str] = None
    nss:              Optional[str] = None

class VacunaRegistro(BaseModel):
    curp_usuario:    str
    vacuna_id:       int
    numero_dosis:    int
    fecha_aplicacion: date
    lugar_aplicacion: Optional[str] = None
    lote:             Optional[str] = None
    modificado_por:   str           # CURP del admin que registra

class VacunaRegistroUpdate(BaseModel):
    fecha_aplicacion: Optional[date]   = None
    lugar_aplicacion: Optional[str]    = None
    lote:             Optional[str]    = None

class MensajeCreate(BaseModel):
    destinatario_curp: str
    remitente_curp:    str
    titulo:            str
    contenido:         str
    tipo:              str = "informacion"   # informacion | advertencia | urgente

class CatalogoVacunaCreate(BaseModel):
    nombre:            str
    enfermedad:        str
    dosis_descripcion: Optional[str] = None
    dosis_total:       int = 1

# ─────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────

def store_password(plain: str) -> str:
    """Guarda la contraseña tal cual (columna contrasena_hash en BD)."""
    return plain

def verify_password(plain: str, stored: str) -> bool:
    """Comparación en texto plano."""
    if not stored:
        return False
    return plain == stored


def rol_canonico(r) -> str:
    """
    Rol unificado para API y front.
    En BD suele guardarse como 'administrador'; el front usa 'admin'.
    """
    if r is None:
        return "usuario"
    s = str(r).strip().lower()
    if not s:
        return "usuario"
    if s in ("administrador", "administradora", "admin", "administrator"):
        return "admin"
    return s


# ─────────────────────────────────────────────
# ── AUTH ──────────────────────────────────────
# ─────────────────────────────────────────────

@app.post("/auth/login")
def login(req: LoginRequest):
    """
    - CURP existe + contraseña correcta  → autenticado completo
    - CURP existe + sin contraseña       → acceso básico
    - CURP no existe                     → 404
    - Contraseña incorrecta              → 401
    """
    db = get_db()
    try:
        with db.cursor() as cur:
            cur.execute(
                "SELECT curp, nombre, apellido_paterno, correo, contrasena_hash, rol "
                "FROM usuarios WHERE curp = %s",
                (req.curp.upper(),)
            )
            user = cur.fetchone()

        if not user:
            raise HTTPException(status_code=404, detail="CURP no encontrado en el sistema.")

        if req.contrasena:
            if not user["contrasena_hash"]:
                raise HTTPException(status_code=401, detail="Este usuario no tiene contraseña configurada.")
            if not verify_password(req.contrasena, user["contrasena_hash"]):
                raise HTTPException(status_code=401, detail="Contraseña incorrecta.")
            return {
                "autenticado": True,
                "curp":  user["curp"],
                "nombre": user["nombre"],
                "apellido_paterno": user["apellido_paterno"],
                "correo": user["correo"],
                "rol": rol_canonico(user["rol"]),
            }
        else:
            return {
                "autenticado": False,
                "curp":  user["curp"],
                "nombre": user["nombre"],
                "apellido_paterno": user["apellido_paterno"],
                "correo": user["correo"],
                "rol": rol_canonico(user["rol"]),
            }
    finally:
        db.close()


@app.post("/auth/set-password")
def set_password(req: SetPasswordRequest):
    """Establece o actualiza la contraseña de un usuario."""
    if len(req.contrasena) < 8:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 8 caracteres.")
    guardado = store_password(req.contrasena)
    db = get_db()
    try:
        with db.cursor() as cur:
            cur.execute(
                "UPDATE usuarios SET contrasena_hash = %s WHERE curp = %s",
                (guardado, req.curp.upper())
            )
        db.commit()
        return {"ok": True, "mensaje": "Contraseña actualizada correctamente."}
    finally:
        db.close()


# ─────────────────────────────────────────────
# ── USUARIO ───────────────────────────────────
# ─────────────────────────────────────────────

@app.get("/usuarios/{curp}")
def get_usuario(curp: str):
    db = get_db()
    try:
        with db.cursor() as cur:
            cur.execute("""
                SELECT u.curp, u.nombre, u.apellido_paterno, u.apellido_materno,
                       u.celular, u.correo, u.rol, u.nss, u.medico_familiar,
                       u.creado_en,
                       um.nombre AS unidad_nombre, um.telefono AS unidad_telefono,
                       um.ciudad, um.estado
                FROM usuarios u
                LEFT JOIN unidades_medicas um ON u.unidad_medica_id = um.id
                WHERE u.curp = %s
            """, (curp.upper(),))
            user = cur.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado.")
        user["rol"] = rol_canonico(user["rol"])
        return user
    finally:
        db.close()


@app.patch("/usuarios/{curp}")
def update_usuario(curp: str, data: UsuarioUpdate):
    fields = {k: v for k, v in data.dict().items() if v is not None}
    if not fields:
        raise HTTPException(status_code=400, detail="Sin campos para actualizar.")
    db = get_db()
    try:
        with db.cursor() as cur:
            sets = ", ".join(f"`{k}` = %s" for k in fields)
            vals = list(fields.values()) + [curp.upper()]
            cur.execute(f"UPDATE usuarios SET {sets} WHERE curp = %s", vals)
        db.commit()
        return {"ok": True}
    finally:
        db.close()


# ─────────────────────────────────────────────
# ── VACUNAS — HISTORIAL ────────────────────────
# ─────────────────────────────────────────────

@app.get("/usuarios/{curp}/vacunas")
def get_historial(curp: str):
    """
    Devuelve el historial + resumen (dosis aplicadas vs total por vacuna del catálogo).
    """
    db = get_db()
    try:
        with db.cursor() as cur:
            # Catálogo completo
            cur.execute("SELECT id, nombre, dosis_total FROM vacunas_catalogo ORDER BY id")
            catalogo = cur.fetchall()

            # Historial del usuario
            cur.execute("""
                SELECT h.id, h.vacuna_id, h.numero_dosis, h.fecha_aplicacion,
                       h.lugar_aplicacion, h.lote, h.registrado_en,
                       v.nombre AS vacuna_nombre, v.dosis_total
                FROM historial_vacunas h
                JOIN vacunas_catalogo v ON h.vacuna_id = v.id
                WHERE h.curp_usuario = %s
                ORDER BY h.fecha_aplicacion DESC
            """, (curp.upper(),))
            historial = cur.fetchall()

        # Agrupar dosis aplicadas por vacuna_id
        dosis_por_vacuna: dict = {}
        for h in historial:
            vid = h["vacuna_id"]
            if vid not in dosis_por_vacuna:
                dosis_por_vacuna[vid] = []
            dosis_por_vacuna[vid].append(h)

        resumen = []
        for v in catalogo:
            aplicadas = dosis_por_vacuna.get(v["id"], [])
            ultima_fecha = None
            if aplicadas:
                fechas = [r["fecha_aplicacion"] for r in aplicadas]
                ultima_fecha = str(max(fechas))
            resumen.append({
                "vacuna_id":    v["id"],
                "nombre":       v["nombre"],
                "dosis_total":  v["dosis_total"],
                "dosis_aplicadas": len(aplicadas),
                "completa":     len(aplicadas) >= v["dosis_total"],
                "ultima_fecha": ultima_fecha,
            })

        # Fechas como string para serialización
        for h in historial:
            h["fecha_aplicacion"] = str(h["fecha_aplicacion"])
            h["registrado_en"]    = str(h["registrado_en"])

        return {"resumen": resumen, "historial": historial}
    finally:
        db.close()


@app.post("/vacunas/historial")
def registrar_dosis(data: VacunaRegistro):
    db = get_db()
    try:
        with db.cursor() as cur:
            cur.execute("""
                INSERT INTO historial_vacunas
                  (curp_usuario, vacuna_id, numero_dosis, fecha_aplicacion,
                   lugar_aplicacion, lote, modificado_por)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (
                data.curp_usuario.upper(),
                data.vacuna_id,
                data.numero_dosis,
                data.fecha_aplicacion,
                data.lugar_aplicacion,
                data.lote,
                data.modificado_por.upper(),
            ))
        db.commit()
        return {"ok": True, "id": cur.lastrowid}
    finally:
        db.close()


@app.patch("/vacunas/historial/{id}")
def update_dosis(id: int, data: VacunaRegistroUpdate):
    fields = {k: v for k, v in data.dict().items() if v is not None}
    if not fields:
        raise HTTPException(status_code=400, detail="Sin campos para actualizar.")
    db = get_db()
    try:
        with db.cursor() as cur:
            sets = ", ".join(f"`{k}` = %s" for k in fields)
            vals = list(fields.values()) + [id]
            cur.execute(f"UPDATE historial_vacunas SET {sets} WHERE id = %s", vals)
        db.commit()
        return {"ok": True}
    finally:
        db.close()


@app.delete("/vacunas/historial/{id}")
def delete_dosis(id: int):
    db = get_db()
    try:
        with db.cursor() as cur:
            cur.execute("DELETE FROM historial_vacunas WHERE id = %s", (id,))
        db.commit()
        return {"ok": True}
    finally:
        db.close()


# ─────────────────────────────────────────────
# ── CATÁLOGO DE VACUNAS ────────────────────────
# ─────────────────────────────────────────────

@app.get("/vacunas/catalogo")
def get_catalogo():
    db = get_db()
    try:
        with db.cursor() as cur:
            cur.execute("SELECT * FROM vacunas_catalogo ORDER BY id")
            return cur.fetchall()
    finally:
        db.close()


@app.post("/vacunas/catalogo")
def crear_vacuna_catalogo(data: CatalogoVacunaCreate):
    db = get_db()
    try:
        with db.cursor() as cur:
            cur.execute("""
                INSERT INTO vacunas_catalogo (nombre, enfermedad, dosis_descripcion, dosis_total)
                VALUES (%s, %s, %s, %s)
            """, (data.nombre, data.enfermedad, data.dosis_descripcion, data.dosis_total))
        db.commit()
        return {"ok": True, "id": cur.lastrowid}
    finally:
        db.close()


@app.patch("/vacunas/catalogo/{id}")
def update_vacuna_catalogo(id: int, data: CatalogoVacunaCreate):
    db = get_db()
    try:
        with db.cursor() as cur:
            cur.execute("""
                UPDATE vacunas_catalogo
                SET nombre=%s, enfermedad=%s, dosis_descripcion=%s, dosis_total=%s
                WHERE id=%s
            """, (data.nombre, data.enfermedad, data.dosis_descripcion, data.dosis_total, id))
        db.commit()
        return {"ok": True}
    finally:
        db.close()


@app.delete("/vacunas/catalogo/{id}")
def delete_vacuna_catalogo(id: int):
    db = get_db()
    try:
        with db.cursor() as cur:
            cur.execute("DELETE FROM vacunas_catalogo WHERE id = %s", (id,))
        db.commit()
        return {"ok": True}
    finally:
        db.close()


# ─────────────────────────────────────────────
# ── BUZÓN ─────────────────────────────────────
# ─────────────────────────────────────────────

@app.get("/buzon/{curp}")
def get_mensajes(curp: str):
    db = get_db()
    try:
        with db.cursor() as cur:
            cur.execute("""
                SELECT m.id, m.titulo, m.contenido, m.tipo, m.leido,
                       m.enviado_en, m.leido_en,
                       u.nombre AS remitente_nombre, u.apellido_paterno AS remitente_apellido
                FROM mensajes_buzon m
                JOIN usuarios u ON m.remitente_curp = u.curp
                WHERE m.destinatario_curp = %s
                ORDER BY m.enviado_en DESC
            """, (curp.upper(),))
            rows = cur.fetchall()
        for r in rows:
            r["enviado_en"] = str(r["enviado_en"])
            r["leido_en"]   = str(r["leido_en"]) if r["leido_en"] else None
        return rows
    finally:
        db.close()


@app.post("/buzon")
def enviar_mensaje(data: MensajeCreate):
    if data.tipo not in ("informacion", "advertencia", "urgente"):
        raise HTTPException(status_code=400, detail="Tipo inválido.")
    db = get_db()
    try:
        with db.cursor() as cur:
            cur.execute("""
                INSERT INTO mensajes_buzon
                  (destinatario_curp, remitente_curp, titulo, contenido, tipo)
                VALUES (%s, %s, %s, %s, %s)
            """, (
                data.destinatario_curp.upper(),
                data.remitente_curp.upper(),
                data.titulo,
                data.contenido,
                data.tipo,
            ))
        db.commit()
        return {"ok": True, "id": cur.lastrowid}
    finally:
        db.close()


@app.patch("/buzon/{id}/leer")
def marcar_leido(id: int):
    db = get_db()
    try:
        with db.cursor() as cur:
            cur.execute(
                "UPDATE mensajes_buzon SET leido=1, leido_en=NOW() WHERE id=%s",
                (id,)
            )
        db.commit()
        return {"ok": True}
    finally:
        db.close()


@app.delete("/buzon/{id}")
def delete_mensaje(id: int):
    db = get_db()
    try:
        with db.cursor() as cur:
            cur.execute("DELETE FROM mensajes_buzon WHERE id=%s", (id,))
        db.commit()
        return {"ok": True}
    finally:
        db.close()


# ─────────────────────────────────────────────
# ── ADMIN ─────────────────────────────────────
# ─────────────────────────────────────────────

@app.get("/admin/usuarios")
def admin_get_usuarios(
    rol: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    unidad_medica_id: Optional[int] = Query(None, description="Filtra usuarios asignados a esta unidad médica"),
):
    db = get_db()
    try:
        with db.cursor() as cur:
            sql = """
                SELECT u.curp, u.nombre, u.apellido_paterno, u.apellido_materno,
                       u.correo, u.celular, u.rol, u.nss, u.creado_en,
                       u.unidad_medica_id,
                       um.nombre AS unidad_nombre
                FROM usuarios u
                LEFT JOIN unidades_medicas um ON u.unidad_medica_id = um.id
                WHERE 1=1
            """
            params = []
            if rol:
                sql += " AND u.rol = %s"
                params.append(rol)
            if unidad_medica_id is not None:
                sql += " AND u.unidad_medica_id = %s"
                params.append(unidad_medica_id)
            if search:
                sql += " AND (u.curp LIKE %s OR u.nombre LIKE %s OR u.apellido_paterno LIKE %s)"
                like = f"%{search}%"
                params += [like, like, like]
            sql += " ORDER BY u.creado_en DESC"
            cur.execute(sql, params)
            rows = cur.fetchall()
        for r in rows:
            r["creado_en"] = str(r["creado_en"])
            r["rol"] = rol_canonico(r.get("rol"))
        return rows
    finally:
        db.close()


@app.delete("/admin/usuarios/{curp}")
def admin_delete_usuario(curp: str):
    db = get_db()
    try:
        with db.cursor() as cur:
            cur.execute("DELETE FROM usuarios WHERE curp = %s", (curp.upper(),))
        db.commit()
        return {"ok": True}
    finally:
        db.close()


@app.get("/admin/stats")
def admin_stats():
    db = get_db()
    try:
        with db.cursor() as cur:
            cur.execute("SELECT COUNT(*) AS total FROM usuarios WHERE rol='usuario'")
            total_usuarios = cur.fetchone()["total"]

            cur.execute("SELECT COUNT(*) AS total FROM historial_vacunas")
            total_dosis = cur.fetchone()["total"]

            cur.execute("SELECT COUNT(*) AS total FROM mensajes_buzon WHERE leido=0")
            mensajes_no_leidos = cur.fetchone()["total"]

            cur.execute("SELECT COUNT(*) AS total FROM vacunas_catalogo")
            total_vacunas_catalogo = cur.fetchone()["total"]

            cur.execute("""
                SELECT v.nombre, COUNT(*) AS aplicaciones
                FROM historial_vacunas h
                JOIN vacunas_catalogo v ON h.vacuna_id = v.id
                GROUP BY h.vacuna_id
                ORDER BY aplicaciones DESC
                LIMIT 5
            """)
            top_vacunas = cur.fetchall()

        return {
            "total_usuarios":        total_usuarios,
            "total_dosis":           total_dosis,
            "mensajes_no_leidos":    mensajes_no_leidos,
            "total_vacunas_catalogo":total_vacunas_catalogo,
            "top_vacunas":           top_vacunas,
        }
    finally:
        db.close()


@app.get("/admin/usuarios/{curp}/vacunas")
def admin_get_vacunas_usuario(curp: str):
    return get_historial(curp)


# ─────────────────────────────────────────────
# ── UNIDADES MÉDICAS ──────────────────────────
# ─────────────────────────────────────────────

@app.get("/unidades")
def get_unidades():
    db = get_db()
    try:
        with db.cursor() as cur:
            cur.execute("SELECT * FROM unidades_medicas ORDER BY nombre")
            return cur.fetchall()
    finally:
        db.close()


# ─────────────────────────────────────────────
# ARRANCAR: uvicorn main:app --reload --port 8000
# INSTALAR: pip install fastapi uvicorn pymysql
# ─────────────────────────────────────────────