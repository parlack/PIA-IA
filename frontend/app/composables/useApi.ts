// app/composables/useApi.ts
// Wrapper central para todas las llamadas al backend FastAPI

const BASE = "http://localhost:8000"

export const useApi = () => {
  const call = async <T>(
    method: "GET" | "POST" | "PATCH" | "DELETE",
    path: string,
    body?: unknown
  ): Promise<T> => {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Error desconocido" }))
      const d = err.detail
      const msg = Array.isArray(d)
        ? d.map((x: { msg?: string }) => x?.msg || String(x)).join("; ")
        : (typeof d === "string" ? d : "Error en el servidor")
      throw new Error(msg)
    }
    return res.json()
  }

  return {
    // Auth
    login: (curp: string, contrasena?: string) =>
      call("POST", "/auth/login", { curp, contrasena }),

    setPassword: (curp: string, contrasena: string) =>
      call("POST", "/auth/set-password", { curp, contrasena }),

    // Usuario
    getUsuario: (curp: string) =>
      call("GET", `/usuarios/${curp}`),

    updateUsuario: (curp: string, data: object) =>
      call("PATCH", `/usuarios/${curp}`, data),

    // Vacunas
    getHistorial: (curp: string) =>
      call("GET", `/usuarios/${curp}/vacunas`),

    registrarDosis: (data: object) =>
      call("POST", "/vacunas/historial", data),

    updateDosis: (id: number, data: object) =>
      call("PATCH", `/vacunas/historial/${id}`, data),

    deleteDosis: (id: number) =>
      call("DELETE", `/vacunas/historial/${id}`),

    getCatalogo: () =>
      call("GET", "/vacunas/catalogo"),

    crearVacunaCatalogo: (data: object) =>
      call("POST", "/vacunas/catalogo", data),

    updateVacunaCatalogo: (id: number, data: object) =>
      call("PATCH", `/vacunas/catalogo/${id}`, data),

    deleteVacunaCatalogo: (id: number) =>
      call("DELETE", `/vacunas/catalogo/${id}`),

    // Buzón
    getMensajes: (curp: string) =>
      call("GET", `/buzon/${curp}`),

    enviarMensaje: (data: object) =>
      call("POST", "/buzon", data),

    marcarLeido: (id: number) =>
      call("PATCH", `/buzon/${id}/leer`, {}),

    deleteMensaje: (id: number) =>
      call("DELETE", `/buzon/${id}`),

    // Admin
    adminGetUsuarios: (params?: { rol?: string; search?: string; unidad_medica_id?: number }) => {
      const sp = new URLSearchParams()
      if (params?.rol) sp.set("rol", params.rol)
      if (params?.search) sp.set("search", params.search)
      if (params?.unidad_medica_id != null) sp.set("unidad_medica_id", String(params.unidad_medica_id))
      const qs = sp.toString()
      return call("GET", `/admin/usuarios${qs ? "?" + qs : ""}`)
    },

    adminDeleteUsuario: (curp: string) =>
      call("DELETE", `/admin/usuarios/${curp}`),

    adminGetStats: () =>
      call("GET", "/admin/stats"),

    adminGetVacunasUsuario: (curp: string) =>
      call("GET", `/admin/usuarios/${curp}/vacunas`),

    // Unidades
    getUnidades: () =>
      call("GET", "/unidades"),
  }
}
