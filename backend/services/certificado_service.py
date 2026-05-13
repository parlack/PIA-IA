"""Servicio de certificados de vacunacion (PDF) y QR personales.

Tokens QR persistidos en la tabla `qr_tokens_personales` (creada on-demand).
Cada CURP tiene a lo sumo un token vigente: si el usuario regenera, se sustituye
e invalidan los anteriores. Esto permite que un screenshot del QR siga siendo
valido durante las 24h originales aunque el servidor reinicie.
"""
from __future__ import annotations
import io
import secrets
from datetime import datetime, timedelta
from typing import Optional

import qrcode
from fastapi import HTTPException
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image,
)


_TOKEN_TTL_SECONDS = 60 * 60 * 24
_TABLA_INICIALIZADA = False


def _asegurar_tabla(db) -> None:
    """Crea la tabla de tokens QR si no existe (idempotente)."""
    global _TABLA_INICIALIZADA
    if _TABLA_INICIALIZADA:
        return
    with db.cursor() as cur:
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS `qr_tokens_personales` (
                `token`       VARCHAR(64)  NOT NULL,
                `curp`        VARCHAR(18)  NOT NULL,
                `creado_en`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
                `expira_en`   DATETIME     NOT NULL,
                PRIMARY KEY (`token`),
                KEY `idx_qr_curp`   (`curp`, `expira_en`),
                KEY `idx_qr_expira` (`expira_en`),
                CONSTRAINT `fk_qr_curp` FOREIGN KEY (`curp`)
                    REFERENCES `usuarios` (`curp`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
            """
        )
    db.commit()
    _TABLA_INICIALIZADA = True


def _gc_tokens(db) -> None:
    """Borra tokens vencidos para mantener la tabla pequena."""
    with db.cursor() as cur:
        cur.execute("DELETE FROM qr_tokens_personales WHERE expira_en < NOW()")
    db.commit()


def generar_token_qr(db, curp: str, *, forzar_nuevo: bool = False) -> tuple[str, datetime]:
    """Devuelve un token QR vigente para `curp`.

    Si el usuario ya tiene un token sin caducar y `forzar_nuevo=False`, se
    reutiliza (asi los screenshots siguen siendo validos). En caso contrario
    se invalida cualquier token previo y se emite uno nuevo con TTL de 24h.

    Retorna `(token, expira_en)`.
    """
    _asegurar_tabla(db)
    curp_u = curp.upper()

    if not forzar_nuevo:
        with db.cursor() as cur:
            cur.execute(
                """
                SELECT token, expira_en FROM qr_tokens_personales
                WHERE curp = %s AND expira_en > NOW()
                ORDER BY expira_en DESC LIMIT 1
                """,
                (curp_u,),
            )
            row = cur.fetchone()
        if row:
            return row["token"], row["expira_en"]

    token = secrets.token_urlsafe(24)
    expira_en = datetime.now() + timedelta(seconds=_TOKEN_TTL_SECONDS)
    with db.cursor() as cur:
        cur.execute(
            "DELETE FROM qr_tokens_personales WHERE curp = %s",
            (curp_u,),
        )
        cur.execute(
            """
            INSERT INTO qr_tokens_personales (token, curp, expira_en)
            VALUES (%s, %s, %s)
            """,
            (token, curp_u, expira_en),
        )
    db.commit()
    _gc_tokens(db)
    return token, expira_en


def verificar_token_qr(db, token: str) -> Optional[str]:
    """Devuelve la CURP asociada al token si esta vigente, o None."""
    _asegurar_tabla(db)
    with db.cursor() as cur:
        cur.execute(
            """
            SELECT curp FROM qr_tokens_personales
            WHERE token = %s AND expira_en > NOW() LIMIT 1
            """,
            (token,),
        )
        row = cur.fetchone()
    return row["curp"] if row else None


def _qr_imagen(payload: str, size_cm: float = 4.0) -> Image:
    qr = qrcode.QRCode(box_size=10, border=2)
    qr.add_data(payload)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#0E5037", back_color="#F5F1E8")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return Image(buf, width=size_cm * cm, height=size_cm * cm)


def construir_pdf_cartilla(db, curp: str, base_url: Optional[str] = None) -> bytes:
    """Genera la cartilla en PDF como bytes."""
    curp_u = curp.upper()
    with db.cursor() as cur:
        cur.execute(
            """
            SELECT u.*, um.nombre AS unidad_nombre, um.ciudad AS unidad_ciudad,
                   um.estado AS unidad_estado
            FROM usuarios u
            LEFT JOIN unidades_medicas um ON um.id = u.unidad_medica_id
            WHERE u.curp = %s
            """,
            (curp_u,),
        )
        user = cur.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado.")

        cur.execute(
            """
            SELECT h.id, h.numero_dosis, h.fecha_aplicacion, h.lugar_aplicacion,
                   h.lote, v.nombre AS vacuna, v.enfermedad
            FROM historial_vacunas h
            JOIN vacunas_catalogo v ON v.id = h.vacuna_id
            WHERE h.curp_usuario = %s
            ORDER BY h.fecha_aplicacion DESC
            """,
            (curp_u,),
        )
        historial = cur.fetchall()

        cur.execute(
            "SELECT sustancia, severidad FROM alergias WHERE curp_usuario = %s",
            (curp_u,),
        )
        alergias = cur.fetchall()

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=LETTER,
        rightMargin=2.2 * cm, leftMargin=2.2 * cm,
        topMargin=2.2 * cm, bottomMargin=2.2 * cm,
        title=f"Cartilla {curp_u}",
        author="PIA-IA",
    )

    styles = getSampleStyleSheet()
    eyebrow = ParagraphStyle(
        "eyebrow", parent=styles["Normal"],
        fontName="Courier", fontSize=8, textColor=colors.HexColor("#6B6358"),
        leading=12, spaceAfter=4,
    )
    h1 = ParagraphStyle(
        "h1", parent=styles["Heading1"],
        fontName="Times-Roman", fontSize=26, textColor=colors.HexColor("#1C1B17"),
        leading=30, spaceAfter=6,
    )
    h2 = ParagraphStyle(
        "h2", parent=styles["Heading2"],
        fontName="Times-Roman", fontSize=14, textColor=colors.HexColor("#0E5037"),
        leading=18, spaceBefore=12, spaceAfter=6,
    )
    body = ParagraphStyle(
        "body", parent=styles["Normal"],
        fontName="Helvetica", fontSize=10, textColor=colors.HexColor("#1C1B17"),
        leading=14,
    )
    small = ParagraphStyle(
        "small", parent=styles["Normal"],
        fontName="Helvetica", fontSize=8, textColor=colors.HexColor("#6B6358"),
        leading=10,
    )

    elements: list = []

    token, _ = generar_token_qr(db, curp_u)
    qr_payload = f"{base_url or 'pia-ia'}/verificar/{token}" if base_url else f"PIA-IA:{token}"
    qr_img = _qr_imagen(qr_payload, size_cm=3.6)

    encabezado = Table(
        [[
            [
                Paragraph("PIA-IA / SISTEMA NACIONAL DE INMUNIZACION", eyebrow),
                Paragraph("Cartilla digital de vacunacion", h1),
                Paragraph(
                    f"{user['nombre']} {user['apellido_paterno']} "
                    f"{user['apellido_materno'] or ''}", body,
                ),
                Paragraph(f"CURP: <b>{user['curp']}</b>", body),
                Paragraph(
                    f"NSS: {user['nss'] or '-'} &nbsp;&nbsp;|&nbsp;&nbsp; "
                    f"Grupo: <b>{user['grupo_prioritario'] or 'ninguno'}</b>",
                    body,
                ),
            ],
            qr_img,
        ]],
        colWidths=[11 * cm, 4 * cm],
    )
    encabezado.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ]))
    elements.append(encabezado)

    elements.append(Spacer(1, 10))
    elements.append(Table(
        [[""]], colWidths=[16 * cm],
        style=[("LINEABOVE", (0, 0), (-1, -1), 0.5, colors.HexColor("#1C1B17"))],
    ))

    elements.append(Paragraph("HISTORIAL DE DOSIS", eyebrow))
    elements.append(Spacer(1, 4))

    if not historial:
        elements.append(Paragraph(
            "No hay dosis registradas en el sistema.", body))
    else:
        data = [["Fecha", "Vacuna", "Dosis", "Lugar", "Lote"]]
        for h in historial:
            data.append([
                str(h["fecha_aplicacion"]),
                h["vacuna"],
                str(h["numero_dosis"]),
                (h["lugar_aplicacion"] or "-")[:32],
                (h["lote"] or "-")[:18],
            ])
        tbl = Table(data, colWidths=[2.5 * cm, 5.5 * cm, 1.6 * cm, 4.4 * cm, 2.5 * cm])
        tbl.setStyle(TableStyle([
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#0E5037")),
            ("LINEBELOW", (0, 0), (-1, 0), 0.8, colors.HexColor("#1C1B17")),
            ("LINEBELOW", (0, 1), (-1, -1), 0.2, colors.HexColor("#E7E1D4")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1),
             [colors.HexColor("#FFFFFF"), colors.HexColor("#FAF7EE")]),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
        ]))
        elements.append(tbl)

    if alergias:
        elements.append(Paragraph("ALERGIAS / CONTRAINDICACIONES", h2))
        for a in alergias:
            elements.append(Paragraph(
                f"<b>{a['sustancia']}</b> — severidad {a['severidad']}", body))

    elements.append(Spacer(1, 16))
    elements.append(Paragraph(
        "Este documento es una representacion oficial del esquema de vacunacion. "
        "El QR superior permite verificar la cartilla en el sistema PIA-IA y caduca "
        "en 24 horas.", small,
    ))

    doc.build(elements)
    return buf.getvalue()
