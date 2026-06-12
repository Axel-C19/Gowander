# GoWander — Guía de presentación final
### Cómputo Móvil (EPC) + Modelos de Calidad (ISW112)

Esta guía cubre **todas las piezas del proyecto**, qué decir de cada una, el guion de la demo en vivo, y las preguntas probables del profesor con sus respuestas.

---

## 1. El elevator pitch (30 segundos)

> "GoWander es una aplicación móvil de generación inteligente de itinerarios de viaje. El usuario elige una o varias ciudades y sus fechas, descubre atracciones turísticas con tarjetas estilo swipe —como Tinder, pero de lugares— y la aplicación genera automáticamente una ruta optimizada considerando distancias, horarios de apertura y tiempos de traslado, distribuida día por día y visualizada en un mapa interactivo. Además incluye una capa social: amigos, chat, y viajes públicos calificados por la comunidad."

---

## 2. Mapa de requisitos (EPC) — qué se pidió vs. qué se entregó

| Req | Requisito del documento | Estado | Dónde demostrarlo |
|-----|------------------------|--------|-------------------|
| R-01 | Registro de usuario | ✅ | Pantalla Registro (+ inicio de sesión con Google) |
| R-02 | Inicio de sesión | ✅ | Login con JWT |
| R-03 | Preferencias turísticas | ✅ | Onboarding de intereses (9 categorías) + edición en Perfil |
| R-04 | Selección de destinos (múltiples) | ✅ | 50 ciudades, 256 lugares reales; viajes multi-ciudad |
| R-05 | Tarjetas turísticas interactivas | ✅ | Deck swipe con foto real, categoría, duración, horarios |
| R-06 | Aceptar/rechazar lugares | ✅ | Gestos + botones ✓/✕; lugares cerrados se muestran en B/N y no se pueden aceptar |
| R-07 | Rutas optimizadas automáticas | ✅ | Motor de itinerarios: vecino más cercano + horarios + empaquetado por días |
| R-08 | Mapas interactivos | ✅ | Marcadores numerados + polilínea de ruta |
| R-09 | Guardar itinerarios | ✅ | Guardar + pestaña "Mis viajes" |
| R-10 | Compartir rutas | ✅ | Compartir privado (chat con amigos) y público (Explorar) |

**Exclusiones acordadas** (decirlas con confianza, son decisión de alcance, no carencia): recuperación de contraseña, registro abierto masivo, listas de favoritos personalizadas.

**Extras no pedidos** (puntos a favor): modo oscuro/claro, 4 idiomas (ES/EN/FR/DE), sistema de calificaciones con estrellas, avatares y biografía, identidad de marca propia (logo G-avión).

---

## 3. Arquitectura — las piezas y cómo explicarlas

### 3.1 Visión general (monorepo)

```
gowander/
├── apps/mobile/      → React Native + Expo + TypeScript (la app)
├── apps/backend/     → FastAPI + Python (la API)
├── packages/         → tipos, constantes y utilidades compartidas
├── infra/docker/     → contenedores para dev/test/prod
└── docs/QA/          → plan de calidad, bitácora de defectos, plan manual
```

**Frase clave:** "Es un monorepo con paquetes compartidos: los tipos TypeScript del frontend y los esquemas Pydantic del backend describen el mismo contrato, así un cambio de API rompe en compilación, no en producción."

### 3.2 Frontend (Cómputo Móvil)

- **React Native + Expo (TypeScript)** — una base de código, iOS y Android.
- **Navegación**: React Navigation — 5 pestañas (Mis viajes, Social, ¿A dónde?, Explorar, Perfil) + stack para el flujo de planeación, que está **bloqueado** (sin botón atrás ni gesto de regreso) para impedir estados inconsistentes.
- **Estado**: Zustand (slices: auth, swipe, trip, settings) + TanStack Query para todo lo que viene del servidor (caché, reintentos, invalidación).
- **Sistema de diseño propio**: tokens de color (naranja atardecer / azul cielo / crema / espresso), tipografía Nunito, botones 3D estilo Duolingo, tarjetas con borde grueso. **Tema claro y oscuro** con paletas completas, e **i18n** en 4 idiomas.
- **Mapas**: react-native-maps (Apple Maps, sin API key ni costos).

### 3.3 Backend (la inteligencia)

- **FastAPI + SQLAlchemy + PostgreSQL**, autenticación JWT (+ OAuth de Google verificando el token contra Google).
- **El motor de itinerarios** (la joya — explícalo bien):
  1. Toma los lugares aceptados de cada sesión de swipe.
  2. Los ordena con **vecino más cercano** (heurística de distancia haversine).
  3. Los **empaqueta en días** respetando un presupuesto horario (09:00–20:00), tiempos de traslado a pie y los **horarios de apertura** de cada lugar (si el Louvre cierra los lunes, lo agenda otro día del viaje).
  4. Con **múltiples ciudades**, cada tramo se ancla a sus fechas reales y los días corren continuos por todo el viaje.
- **Social**: amistades (solicitud → aceptación), mensajes directos, compartir itinerarios privadamente (el receptor gana permiso de lectura) o públicamente (feed Explorar, ordenado por calificación).

### 3.4 Base de datos (entidades)

`users` (con preferencias, avatar, bio, google_id) → `swipe_sessions` → `swipe_actions` → `itineraries` (con is_saved, is_public, fechas) → `itinerary_stops` (orden, día, horas) → `itinerary_ratings`; `destinations` (50) → `places` (256, con horarios JSON y fotos de Wikipedia); `friendships`, `messages`.

---

## 4. Modelos de Calidad (ISW112) — unidad por unidad

### Unidad I — Errores, fallas y defectos
- **Artefacto**: `docs/QA/DEFECT_LOG.md` — bitácora con **6 defectos reales** encontrados y corregidos, cada uno clasificado con la taxonomía del curso:
  - **Error** = equivocación humana al programar.
  - **Defecto** = la imperfección que quedó en el código.
  - **Falla** = el comportamiento incorrecto observable.
- **Ejemplo estrella para contar (GW-001)**: la falla era que "el itinerario salía con menos lugares de los aceptados". El defecto: una condición de carrera en los gestos de swipe + un 500 del backend por restricción de unicidad. El error: asumir que los callbacks de gestos se ejecutan en serie. La corrección: guard de reentrada en el cliente + respuesta 409 idempotente en la API + **prueba de regresión permanente**.

### Unidad II — Tipos de pruebas (114 automatizadas, todas en verde)

| § | Tipo | Qué hay | Ejemplos |
|---|------|---------|----------|
| 2.1 | **Funcionales** | ~70 pruebas de integración sobre la API real | auth, preferencias, destinos, swipe, generación (1 ciudad y multi-ciudad), guardar, social, ratings |
| 2.2 | **No funcionales** | rendimiento y seguridad | motor < 2 s con 50 lugares; barrido de autenticación en todos los endpoints; tokens falsificados rechazados; aislamiento entre usuarios; la contraseña jamás viaja en respuestas |
| 2.3 | **Estructurales** (caja blanca) | unitarias de funciones internas | haversine, ordenamiento vecino-más-cercano, predicado de horarios, formato de horas |
| 2.4 | **De cambios** (regresión) | una prueba por defecto histórico | swipe duplicado → 409; horarios incompletos ≠ cerrado; campo `date` de Pydantic |
| 2.5 | **Manuales y automáticas** | plan manual de **24 casos** en dispositivo (`docs/QA/MANUAL_TEST_PLAN.md`) + suite automática en CI | gestos, calendario de rangos, tarjetas B/N, modo oscuro, comportamiento sin red |

### Unidad III — Seguimiento de errores-fallas-defectos
- Herramienta: bitácora versionada en Git + repositorio GitHub (`Axel-C19/Gowander`); cada corrección referencia su commit.
- Flujo: falla observada → reproducida con una prueba → causa raíz → corrección → **prueba de regresión** → cierre en la bitácora.

### Unidad IV — Proyecto aplicando técnicas de calidad
- GoWander **es** el proyecto de la Unidad IV: pirámide de pruebas (unitarias → integración → manuales E2E), política de "una regresión por defecto", seguridad por defecto (todo endpoint autenticado, verificación de propiedad), y **CI en GitHub Actions** que ejecuta lint + las 114 pruebas en cada push: ningún defecto regresa en silencio.
- **Prevención por diseño**: el flujo de planeación bloqueado es un ejemplo de eliminar estados inválidos en lugar de manejarlos después.

---

## 5. Guion de la demo en vivo (5–7 min)

> ⚠️ **Antes de presentar**: backend corriendo (`make dev-backend` o uvicorn), IP correcta en `apps/mobile/.env` (¡cambia con la red! `ifconfig | grep inet`), y reiniciar Metro con `npx expo start -c`. Plan B: video grabado de la demo.

1. **Splash + Login** (30 s) — logo G-avión; inicia sesión. Menciona Google Sign-In.
2. **Registro nuevo → Preferencias** (45 s) — crea un usuario en vivo; muestra el onboarding de intereses ("esto alimenta el orden de recomendación del deck").
3. **Planear viaje multi-ciudad** (2 min) — "¿A dónde?" → París → calendario de rango (ej. lunes–martes) → "Sí, agregar ciudad" → señala que **no hay escape**: ni pestañas ni botón atrás, solo la ✕ con confirmación → Ámsterdam con fechas siguientes (el calendario bloquea fechas anteriores) → "Crear mi viaje".
4. **Swipe** (1 min) — fotos reales de Wikipedia; muestra una tarjeta **en blanco y negro** ("cerrado en tus fechas — no se puede aceptar, solo descartar"); barra de progreso; encabezado "París (1/2)".
5. **Itinerario + mapa** (1 min) — días con encabezados de fecha real; el Louvre cae en el día que sí abre; "Ver en mapa": marcadores numerados y ruta. Guardar.
6. **Social + Explorar** (1 min) — comparte el viaje a un amigo por chat; publícalo; ábrelo en Explorar y califícalo con estrellas.
7. **Perfil** (30 s) — cambia a **modo oscuro** en vivo y cambia el idioma a inglés/francés: toda la app reacciona al instante.

---

## 6. Preguntas probables del profesor (y respuestas)

**"¿Cómo optimizas la ruta? ¿Es la ruta óptima?"**
Heurística de vecino más cercano con distancia haversine — O(n²), no garantiza el óptimo global (eso es el TSP, NP-difícil), pero da rutas razonables en milisegundos. La evolución natural es Google Distance Matrix + OR-Tools; está documentado como trabajo futuro.

**"¿Cómo diferencias error, defecto y falla?"**
Con el caso GW-001 (sección 4, Unidad I). Tener la bitácora abierta de respaldo.

**"¿Qué pasa si dos usuarios deslizan al mismo tiempo / hay condiciones de carrera?"**
Restricción de unicidad en BD (sesión, lugar) + manejo idempotente 409 + guard en el cliente. Y hay una prueba de regresión que lo verifica.

**"¿Cómo aseguras que un usuario no vea datos de otro?"**
Toda consulta filtra por el user_id del JWT; los recursos ajenos devuelven 404 (ni siquiera revelan existencia). Hay pruebas de seguridad específicas de aislamiento entre usuarios.

**"¿Por qué FastAPI/React Native?"**
Una base de código móvil para dos plataformas; tipado fuerte en ambos lados (TypeScript/Pydantic); FastAPI valida automáticamente entradas (eso mismo atrapó el defecto GW-006).

**"¿Cobertura de pruebas?"**
114 automatizadas + 24 manuales; lo importante no es el número sino la **trazabilidad**: cada requisito R-01..R-10 tiene pruebas funcionales, y cada defecto histórico tiene su regresión.

**"¿De dónde salen los datos de lugares?"**
Catálogo curado de 50 ciudades / 256 lugares con coordenadas y horarios realistas; fotos resueltas desde Wikipedia/Wikimedia (sin API key). En producción se cambiaría por Google Places.

---

## 7. Checklist del día de la presentación

- [ ] Backend corriendo y `.env` con la IP actual (o túnel Cloudflare)
- [ ] Teléfono con la app abierta y sesión cerrada (para demo de login)
- [ ] Un segundo usuario amigo ya creado (para demo de chat/compartir)
- [ ] Un viaje público ya calificado (para que Explorar no esté vacío)
- [ ] `pytest` corrido esa mañana — poder decir "114/114 en verde hoy"
- [ ] Pestañas abiertas: GitHub repo, DEFECT_LOG.md, GitHub Actions (CI verde)
- [ ] Video de respaldo de la demo por si falla la red
