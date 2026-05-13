# Investigacion: Sistemas Digitales de Vacunacion en el Mundo

## Hacia un nuevo estandar para Mexico

**Proyecto Integrador de Aprendizaje (PIA)**
**Objetivo:** Solucion para administrar el esquema de vacunacion para adultos en Mexico

---

## 1. Contexto y problematica

### Situacion actual en Mexico

Mexico cuenta con un sistema fragmentado de registros de vacunacion:

- **Cartilla Nacional de Salud:** Documento fisico (papel) que se pierde, deteriora o no se actualiza.
- **IMSS Digital:** Ofrece consulta de la "Cedula Digital de Salud" y reposicion de cartilla, pero requiere ir a la UMF para validar.
- **CeNSIA (CENSIA):** Desde 2016 desarrolla una Cartilla Electronica de Vacunacion (CEV), pero su adopcion ha sido limitada.
- **Fragmentacion institucional:** IMSS, ISSSTE, SSA, SEDENA, SEMAR, PEMEX y DIF operan bases de datos independientes que no se comunican entre si.

### El problema central

> Aunque los recursos para la vacunacion existen, la carencia de herramientas unificadas para gestionarlos provoca perdidas mayores: ciudadanos sin historial accesible, esquemas incompletos no detectados, duplicidad de registros y falta de alertas oportunas.

---

## 2. Casos de exito internacionales

### 2.1 India — CoWIN

**Escala:** 1,400 millones de habitantes | **Lanzamiento:** 2021

CoWIN (Co-Winning Over COVID-19) es la plataforma digital de vacunacion mas grande del mundo. Fue desarrollada en **12 dias** por un equipo de 5 personas y escalo para manejar **8.6 millones de vacunaciones diarias** sin fallas.

**Arquitectura modular:**
- **Modulo de Orquestacion:** Administradores a nivel nacional, estatal y distrital
- **Cadena de Frio (eVIN):** Monitoreo en tiempo real de temperatura y stock de vacunas
- **Registro Ciudadano:** Registro via web, app Aarogya Setu o UMANG
- **Modulo Vacunador:** Actualizacion de estado de vacunacion en punto de atencion
- **Certificados y AEFI:** Emision automatica de certificados y reporte de efectos adversos

**Lecciones para Mexico:**
- La integracion con el sistema de identidad nacional (Aadhaar) fue clave para eliminar duplicados
- El modelo de administracion multinivel permite adaptarse a la estructura federal
- La emision de certificados digitales inmediatos genera confianza ciudadana

---

### 2.2 Australia — Australian Immunisation Register (AIR)

**Escala:** 26 millones de habitantes | **Operativo desde:** 1996 (modernizado continuamente)

El AIR es un registro **de por vida** que cubre todas las vacunas administradas en Australia: programa nacional, vacunas privadas (influenza, viaje) y COVID-19.

**Caracteristicas destacadas:**
- Los proveedores deben registrar cada vacuna dentro de **24 horas** y no mas de 10 dias habiles
- Los ciudadanos acceden a su historial via **Medicare online**, **myGov** o wallet digital
- El sistema se integra con verificacion para guarderias, inscripcion escolar y beneficios fiscales familiares
- Generacion de reportes por localidad, proveedor y grupo etario
- Identificacion automatica de pacientes con esquemas vencidos

**Lecciones para Mexico:**
- Vincular la vacunacion a beneficios tangibles (inscripcion escolar, apoyos) incentiva la cobertura
- El acceso a wallet digital del celular hace el historial siempre accesible
- Los reportes por localidad permiten detectar zonas con baja cobertura

---

### 2.3 Corea del Sur — Sistema de Registro de Inmunizacion (IRIS)

**Escala:** 52 millones de habitantes | **Operativo desde:** 2002 (20+ anos de evolucion)

Corea del Sur ha construido uno de los sistemas mas maduros del mundo con la plataforma "Immunization Helper" (web y app movil).

**Caracteristicas destacadas:**
- Consulta de historial personal completo
- Alarmas automaticas de proximas vacunas
- Localizador de instituciones medicas con subsidio gubernamental
- "Enciclopedia de Vacunacion" con informacion de enfermedades
- Certificados en coreano e ingles
- Integracion con la app "My Health Records" (2025) que unifica toda la informacion de salud

**Evolucion cronologica:**
| Ano | Hito |
|-----|------|
| 2002 | Registro en centros de salud |
| 2011 | App movil con alarmas |
| 2025 | Integracion con expediente de salud unico |

**Lecciones para Mexico:**
- Un sistema exitoso no se construye de una vez: requiere iteracion continua
- La app movil con notificaciones push es el canal mas efectivo para aumentar cobertura
- La integracion con el expediente de salud completo es el destino natural

---

### 2.4 Israel — Registro Nacional de Vacunacion (2025)

**Escala:** 9.8 millones de habitantes | **Lanzamiento:** Julio 2025

El caso mas reciente. Israel lanzo un registro digital unificado que consolida vacunas de maternidades, pediatria, escuelas, servicio militar, clinicas de viaje y seguros medicos.

**Caracteristicas destacadas:**
- Integrado a la plataforma gubernamental unica **MyGov** (acceso web y movil)
- Todos los proveedores (publicos y privados) deben reportar vacunas en **72 horas**
- Los ciudadanos pueden ver y descargar su historial
- Los medicos acceden a los registros para tratamiento
- Marco legal especifico (Ley de Ordenanza de Salud Publica, Enmienda 43)
- 200,000 usuarios en periodo de prueba

**Lecciones para Mexico:**
- Un marco legal es indispensable para obligar a proveedores a reportar
- Integrar en una plataforma gubernamental existente reduce costos y friccion
- El periodo de prueba permite ajustar antes del lanzamiento masivo

---

### 2.5 Estonia — Sistema e-Health

**Escala:** 1.3 millones de habitantes | **Modelo desde:** 2000s

Estonia es el referente mundial en gobierno digital. Su sistema de vacunacion esta integrado en la infraestructura nacional de identidad digital.

**Caracteristicas destacadas:**
- Cada ciudadano tiene un ID digital (Isikukood) vinculado a su historial de salud completo
- Portal del Paciente (digilugu.ee) para consultar y gestionar vacunas
- Certificados digitales compatibles con la Union Europea
- Infraestructura X-Road para intercambio seguro de datos entre instituciones

**Lecciones para Mexico:**
- La identidad digital unica (equivalente al CURP) es la columna vertebral del sistema
- La interoperabilidad entre instituciones requiere una capa de intercambio de datos estandarizada
- Un pais pequeno puede ser pionero y luego escalar el modelo

---

### 2.6 Chile — Registro Nacional de Inmunizaciones (RNI)

**Escala:** 19 millones de habitantes | **Operativo desde:** 2011

Chile es referente en America Latina. El RNI registra en tiempo real todas las vacunaciones del Programa Nacional de Inmunizaciones en centros publicos y privados.

**Caracteristicas destacadas:**
- Registro obligatorio para todos los proveedores (publicos y privados)
- Datos en tiempo real con georreferenciacion de localidades
- Portal Paciente para consulta de historial individual
- Trazabilidad completa de campanas de vacunacion
- Un ciudadano puede vacunarse en cualquier punto del territorio y el registro se actualiza centralmente

**Lecciones para Mexico:**
- Modelo mas cercano a la realidad mexicana por tamano y contexto latinoamericano
- La obligatoriedad del registro para proveedores privados es esencial
- La georreferenciacion permite focalizar campanas en zonas con baja cobertura

---

### 2.7 Uruguay — Sistema de Informacion de Vacunas (SIV)

**Escala:** 3.5 millones de habitantes | **Operativo desde:** 2017

Uruguay demostro que "se puede lograr mucho con recursos limitados". Su sistema fue reconocido internacionalmente y es modelo de cooperacion Sur-Sur.

**Caracteristicas destacadas:**
- Registro nominal electronico de vacunacion
- Identificacion de ninos no vacunados
- Intercambio de datos entre sector publico y privado
- Monitor de vacunas con georreferenciacion a nivel nacional
- Gestionado por AGESIC (Agencia de Gobierno Electronico)

**Lecciones para Mexico:**
- Demuestra que no se necesita un presupuesto enorme para implementar un sistema funcional
- La cooperacion interinstitucional publica-privada es factible
- El uso de datos anonimizados para analisis poblacional mejora la toma de decisiones

---

### 2.8 Reino Unido — NIMS (National Immunisation Management System)

**Escala:** 67 millones de habitantes | **Modernizado desde:** 2020

El NHS opera NIMS como sistema central de gestion de vacunaciones, con integracion a multiples sistemas de punto de atencion.

**Caracteristicas destacadas:**
- Multiples sistemas de punto de atencion (hospitales, centros, farmacias, escuelas)
- Registros aparecen en expediente del paciente en 48 horas
- Funcionalidad de "call and recall": el sistema identifica y contacta a poblacion elegible
- Datos de cobertura por grupo poblacional y region

**Lecciones para Mexico:**
- La funcionalidad de "call and recall" automatizado incrementa la cobertura significativamente
- Permitir que farmacias y escuelas registren vacunas amplia los puntos de acceso
- La integracion con el expediente medico general evita duplicidad

---

### 2.9 Singapur — National Immunisation Registry (NIR)

**Escala:** 5.9 millones de habitantes | **Operativo desde:** 2000s

Integrado en la plataforma **HealthHub**, el NIR cubre tanto el esquema infantil (14 enfermedades) como el de adultos (11 enfermedades).

**Caracteristicas destacadas:**
- Acceso via HealthHub para individuos, padres y cuidadores
- Esquema Nacional de Inmunizacion de Adultos (NAIS) con vacunas especificas por grupo
- Integracion con el National Electronic Health Record (NEHR)
- Sistema gestionado por la Communicable Diseases Agency (CDA)

**Lecciones para Mexico:**
- La separacion explicita de esquemas de adultos vs infantil facilita la gestion
- El acceso para cuidadores es importante para adultos mayores dependientes
- La vinculacion con la agencia de enfermedades transmisibles permite respuesta rapida a brotes

---

## 3. Tabla comparativa de sistemas

| Pais | Nombre | Ano | Acceso ciudadano | App movil | Alertas | Adultos | Integracion ID |
|------|--------|-----|-------------------|-----------|---------|---------|----------------|
| India | CoWIN | 2021 | Web + App | Si | Si | Si | Aadhaar |
| Australia | AIR | 1996 | Web + Wallet | Si | Si | Si | Medicare/myGov |
| Corea del Sur | IRIS | 2002 | Web + App | Si | Si | Si | ID Nacional |
| Israel | Registro Digital | 2025 | Web (MyGov) | Si | Si | Si | ID Nacional |
| Estonia | e-Health | 2000s | Portal Paciente | Si | Si | Si | Isikukood |
| Chile | RNI | 2011 | Portal Paciente | No nativo | Limitadas | Si | RUN |
| Uruguay | SIV | 2017 | Limitado | No | No | Si | CI |
| UK | NIMS | 2020 | NHS App | Si | Call/Recall | Si | NHS Number |
| Singapur | NIR | 2000s | HealthHub | Si | Si | Si | NRIC |
| **Mexico (actual)** | **Fragmentado** | **—** | **Parcial** | **IMSS Digital** | **No** | **Limitado** | **CURP** |

---

## 4. Vision del proyecto: hacia donde puede ir

### 4.1 Propuesta de solucion

**Nombre propuesto:** Sistema Nacional de Inmunizacion Digital (SINID)

**Plataformas:**
- Aplicacion web responsiva (acceso desde cualquier navegador)
- Aplicacion movil nativa (iOS/Android) para maxima accesibilidad ciudadana
- Panel administrativo web para personal de salud autorizado

### 4.2 Modulos del sistema

#### Modulo 1 — Registro e identidad
- Vinculacion con CURP como identificador unico nacional
- Registro de adultos con verificacion de identidad (INE/Pasaporte)
- Soporte para grupos prioritarios: adultos mayores, embarazadas, personal de salud, trabajadores de riesgo

#### Modulo 2 — Historial de vacunacion
- Cartilla digital completa con todas las vacunas del esquema nacional
- Registro de vacunas aplicadas con fecha, lote, lugar y profesional
- Indicador visual de esquema completo/incompleto por vacuna
- Porcentaje de avance del esquema total

#### Modulo 3 — Alertas y notificaciones inteligentes
- Notificaciones push para proximas dosis programadas
- Alertas de brotes epidemiologicos por zona geografica
- Recordatorios personalizados segun grupo de riesgo
- Avisos de campanas de vacunacion cercanas (por georreferenciacion)
- Canales: push notification, SMS, correo electronico

#### Modulo 4 — Casos especiales de atencion
- Registro de alergias a componentes de vacunas
- Contraindicaciones medicas documentadas
- Recomendaciones personalizadas segun condicion (embarazo, inmunosupresion, edad avanzada)
- Historial de reacciones adversas (AEFI)

#### Modulo 5 — Panel administrativo
- Registro/modificacion de vacunas por personal autorizado
- Dashboard de estadisticas en tiempo real
- Reportes de cobertura por unidad medica, municipio, estado y nacional
- Gestion del catalogo oficial de vacunas
- Buzon de comunicacion con usuarios

#### Modulo 6 — Interoperabilidad (fase avanzada)
- API estandarizada para integracion con IMSS, ISSSTE, SSA
- Compatibilidad con estandares HL7 FHIR para interoperabilidad en salud
- Posible integracion con RENAPO para validacion de identidad
- Exportacion de datos anonimizados para investigacion epidemiologica

### 4.3 Arquitectura tecnica propuesta

```
┌─────────────────────────────────────────────────┐
│               CAPA DE PRESENTACION              │
│  ┌─────────────┐  ┌──────────────┐  ┌────────┐ │
│  │ App Movil   │  │ Web App      │  │ Admin  │ │
│  │ (Nativa)    │  │ (Responsiva) │  │ Panel  │ │
│  └──────┬──────┘  └──────┬───────┘  └───┬────┘ │
└─────────┼────────────────┼──────────────┼───────┘
          │                │              │
          ▼                ▼              ▼
┌─────────────────────────────────────────────────┐
│                CAPA API (REST)                  │
│  FastAPI / Node.js                              │
│  Autenticacion · Autorizacion · Rate Limiting   │
└────────────────────┬────────────────────────────┘
                     │
          ┌──────────┼──────────┐
          ▼          ▼          ▼
┌──────────────┐ ┌────────┐ ┌──────────────┐
│ Base de Datos│ │ Cache  │ │ Notificaciones│
│ MySQL/       │ │ Redis  │ │ Firebase/     │
│ PostgreSQL   │ │        │ │ OneSignal     │
└──────────────┘ └────────┘ └──────────────┘
```

### 4.4 Grupos prioritarios

Segun indicaciones del proyecto, el sistema debe hacer enfasis en la logica de alertas para:

| Grupo | Vacunas prioritarias | Tipo de alerta |
|-------|---------------------|----------------|
| Adultos mayores (65+) | Neumococica, Influenza, COVID-19 | Recordatorio estacional + alerta de brote |
| Personal de salud | Hepatitis B, Influenza, COVID-19 | Cumplimiento obligatorio + refuerzos |
| Embarazadas | Tdap, Influenza | Alerta por trimestre de embarazo |
| Trabajadores de riesgo | Segun exposicion laboral | Alertas personalizadas por ocupacion |

---

## 5. Integracion con sistemas existentes

### Opcion A: Integracion con RENAPO y sistemas estatales

**Ventajas:**
- Validacion de identidad confiable via CURP/RENAPO
- Aprovechamiento de infraestructura existente
- Reduccion de registros duplicados
- Legitimidad institucional

**Desventajas:**
- Dependencia de sistemas gubernamentales con posibles limitaciones tecnicas
- Procesos burocraticos para obtener acceso a APIs
- Riesgo de caidas por indisponibilidad de servicios externos
- Complejidad en el manejo de datos entre instituciones

### Opcion B: Infraestructura soberana e independiente

**Ventajas:**
- Control total sobre disponibilidad y rendimiento
- Desarrollo e iteracion mas rapidos
- Sin dependencias externas
- Posibilidad de funcionar offline

**Desventajas:**
- Necesidad de crear mecanismos propios de verificacion de identidad
- Riesgo de duplicidad de registros sin validacion cruzada
- Mayor costo de infraestructura propia
- Falta de legitimidad institucional sin vinculacion oficial

### Recomendacion: Enfoque hibrido

Iniciar como infraestructura independiente con capacidad de integracion futura. Usar CURP como identificador unico y disenar APIs compatibles con estandares internacionales (HL7 FHIR) para facilitar la integracion cuando sea politicamente viable.

---

## 6. Estimacion de costos

Basado en casos reales internacionales (Madrid, Colombia, India):

| Concepto | Estimacion |
|----------|-----------|
| Desarrollo web + API (6-9 meses) | $500,000 - $1,200,000 MXN |
| App movil nativa iOS + Android | $300,000 - $800,000 MXN |
| Infraestructura cloud (anual) | $120,000 - $360,000 MXN |
| Base de datos y almacenamiento | $60,000 - $180,000 MXN |
| Servicio de notificaciones (anual) | $24,000 - $60,000 MXN |
| Equipo de desarrollo (5-8 personas, 9 meses) | $2,000,000 - $4,500,000 MXN |
| Capacitacion del personal de salud | $200,000 - $500,000 MXN |
| Mantenimiento anual post-lanzamiento | $600,000 - $1,200,000 MXN |
| **Total estimado (Fase 1)** | **$3,800,000 - $8,800,000 MXN** |

> **Nota:** Colombia demostro que aprovechando infraestructura existente (SISPRO) se puede reducir dramaticamente el costo. Uruguay logro un sistema funcional con recursos limitados.

---

## 7. Roadmap de implementacion

### Fase 1 — MVP (3-6 meses)
- Registro de usuarios con CURP
- Historial digital de vacunacion
- Panel administrativo basico
- Web responsiva

### Fase 2 — Notificaciones y movil (6-12 meses)
- App movil nativa (iOS/Android)
- Sistema de alertas push y SMS
- Alertas por grupo de riesgo
- Georreferenciacion de unidades medicas

### Fase 3 — Inteligencia y escala (12-18 meses)
- Dashboard analitico para autoridades
- Reportes de cobertura por region
- Deteccion de brotes con alertas masivas
- Casos especiales y recomendaciones personalizadas

### Fase 4 — Interoperabilidad (18-24 meses)
- APIs para integracion con IMSS, ISSSTE, SSA
- Compatibilidad con estandares HL7 FHIR
- Posible integracion con RENAPO
- Exportacion de datos para investigacion

---

## 8. Conclusiones

1. **Ningun pais exitoso empezo con un sistema perfecto.** Corea del Sur tardo 20 anos en llegar a su sistema actual. India desarrollo CoWIN en 12 dias y lo itero constantemente. La clave es comenzar y mejorar.

2. **Mexico ya tiene la pieza fundamental:** el CURP como identificador unico nacional, equivalente al Aadhaar (India), Medicare (Australia) o Isikukood (Estonia).

3. **El mayor diferenciador es la experiencia ciudadana.** Los sistemas exitosos priorizan el acceso movil, las alertas automaticas y la simplicidad del proceso.

4. **La obligatoriedad del registro por parte de proveedores** (publicos y privados) es comun en todos los sistemas exitosos (Israel: 72 hrs, Australia: 24 hrs).

5. **Chile y Uruguay demuestran que America Latina puede lograrlo** con recursos limitados y voluntad politica.

6. **La integracion institucional es el desafio mas grande** para Mexico, pero no es prerrequisito para empezar. Se puede construir un sistema independiente y conectarlo despues.

---

## 9. Referencias

- WHO Digital Adaptation Kit for Immunizations (2024)
- Australia — Services Australia, "Australian Immunisation Register"
- India — CoWIN Platform (cowin.gov.in), Exemplars in Global Health
- Corea del Sur — KDCA, "Twenty Years of Progress: IRIS in Korea" (PubMed, 2024)
- Israel — Library of Congress, "Digital Vaccination Registry Launched" (2025)
- Estonia — vaktsineeri.ee, Portal del Paciente digilugu.ee
- Chile — MINSAL, Registro Nacional de Inmunizaciones
- Uruguay — PAHO/WHO, AGESIC
- Reino Unido — NHS England, NIMS
- Singapur — HealthHub, National Immunisation Registry (CDA)
- Mexico — gob.mx/salud, CeNSIA, IMSS Digital
- Madrid — Contratacion publica del RUVCM (2024)
- Colombia — Ministerio de Salud, plataforma "Mi Vacuna"
- GHSP Journal — "Design, Development, and Deployment of an EIR: Vietnam, Tanzania, Zambia"
