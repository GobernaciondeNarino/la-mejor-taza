# La Mejor Taza

**Pasaporte digital del café de Nariño** — votación pública con QR, libreta de
sellos y dashboard en tiempo real para el Festival del Café 2026 de la
Gobernación de Nariño.

> Aplicación web estática (sin build step) construida con React via Babel
> Standalone, animaciones 3D con Three.js y Firebase (Auth + Firestore +
> Hosting) como backend.

---

## Tabla de contenido

1. [Funcionalidades](#1-funcionalidades)
2. [Arquitectura](#2-arquitectura)
3. [Instalación local](#3-instalación-local)
4. [Configuración de Firebase](#4-configuración-de-firebase)
5. [Estructura de la base de datos](#5-estructura-de-la-base-de-datos)
6. [Reglas de seguridad](#6-reglas-de-seguridad)
7. [Despliegue (Firebase Hosting)](#7-despliegue-firebase-hosting)
8. [Animaciones con Three.js](#8-animaciones-con-threejs)
9. [Estructura del repositorio](#9-estructura-del-repositorio)
10. [Roadmap](#10-roadmap)

---

## 1. Funcionalidades

### Administrador (web · escritorio)
- Login por correo + contraseña con Firebase Authentication.
- Registro de stands (nombre, municipio, región, dirección, correo, color
  del sello, descripción).
- Generación de carteles A5 con QR único por stand
  (`https://lamejortaza.co/s/{standId}`), listos para imprimir.
- Dashboard de actividad en vivo: últimos votos y ranking actual.

### Usuario · móvil (al escanear el QR)
- Formulario en 3 pasos: correo, calificación con emoji
  (😞 / 😐 / 😍) y comentario opcional + ¿compraste?.
- Confirmación con animación de sello aterrizando sobre el pasaporte.
- "Pasaporte" coleccionable (libreta) que crece sello a sello, persistido
  por correo en Firestore.

### Público
- Dashboard `/` con podio top-3, mapa de Nariño con marcadores por stand,
  tabla completa, feed de votos en vivo y métricas agregadas.
- Detalle por stand: distribución de calificaciones y comentarios
  recientes.
- Hero animado con un campo 3D de granos de café
  (`Three.js`, respeta `prefers-reduced-motion`).

---

## 2. Arquitectura

```
┌──────────────────┐    QR     ┌──────────────────┐
│ Cartel impreso   │ ────────► │  Móvil (Vote)    │
│   /s/{standId}   │           │  React + Babel   │
└──────────────────┘           └─────────┬────────┘
                                         │ addDoc(votos)
                                         ▼
┌─────────────────┐  onSnapshot  ┌──────────────────┐
│ Dashboard live  │◄─────────────│   Firestore      │
│ (público + admin)│             │ stands · votos   │
└─────────────────┘              │ · pasaportes     │
                                 └──────────────────┘
                                         ▲
                                         │ admin custom claim
                                ┌──────────────────┐
                                │ Login admin (web)│
                                │ Firebase Auth    │
                                └──────────────────┘
```

- **Frontend**: HTML estático + React (CDN) + JSX in-browser via Babel.
  No requiere `npm run build`.
- **3D**: Three.js r160 (CDN). Fondo animado en el hero del dashboard.
- **Backend**: Firestore con reglas declarativas; Auth (Email/Password
  para admins, Anonymous para votos); Hosting con headers de seguridad.

---

## 3. Instalación local

### Requisitos

- Node.js 18+ (sólo para `firebase-tools`; el sitio en sí no necesita Node)
- Una cuenta Google con acceso al proyecto Firebase.

### Pasos

```bash
git clone https://github.com/GobernaciondeNarino/la-mejor-taza.git
cd la-mejor-taza

# Servidor estático (cualquier opción funciona)
npx serve .             # opción 1
python3 -m http.server  # opción 2
```

Abre `http://localhost:3000/` (o el puerto que indique tu servidor) y la
app redirige automáticamente a `La Mejor Taza.html`.

> **Modo demo**: sin `firebase-config.js`, la UI usa los datos de
> `data/stands.js`. Útil para diseñar y demostrar la experiencia sin
> conectarte al backend.

---

## 4. Configuración de Firebase

### 4.1. Crear el proyecto

1. Ve a la [consola de Firebase](https://console.firebase.google.com/) e
   inicia sesión con la cuenta institucional.
2. **Add project** → nombre `la-mejor-taza` → región `southamerica-east1`.
3. **Build → Authentication → Get started**:
   - Habilita **Email/Password** (login del administrador).
   - Habilita **Anonymous** (votos del usuario móvil sin fricción).
4. **Build → Firestore Database → Create database** en modo **Production**.

### 4.2. Registrar la app web

En **Project settings → General → Your apps → `</>`**, apodo
`La Mejor Taza Web`. Copia el objeto `firebaseConfig`.

### 4.3. Crear `firebase-config.js`

```bash
cp firebase-config.example.js firebase-config.js
# edita los valores
```

```js
// firebase-config.js
export const firebaseConfig = {
  apiKey: "AIza…",
  authDomain: "la-mejor-taza.firebaseapp.com",
  projectId: "la-mejor-taza",
  storageBucket: "la-mejor-taza.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef…",
};
```

> El archivo `firebase-config.js` está en `.gitignore`. **No lo commits**.
> Las claves de Firebase Web son públicas por diseño; lo que protege el
> backend son las reglas (sección 6) y el dominio autorizado.

Reinicia el servidor estático: la consola debe mostrar
`[firebase] auth anónimo OK` y la UI cambia a "Firebase activo".

### 4.4. Otorgar rol de administrador

Las reglas exigen `request.auth.token.admin == true` para escribir en
`stands` y borrar votos. Asigna el claim desde Cloud Shell:

```bash
firebase functions:shell
# dentro del shell
> admin.auth().setCustomUserClaims("UID_DEL_USUARIO", { admin: true })
```

O crea una Cloud Function `setAdmin(uid)` invocable sólo por otros admins.

### 4.5. Dominios autorizados

En **Authentication → Settings → Authorized domains** agrega:

- `localhost`
- `la-mejor-taza.web.app`
- el dominio personalizado (ej. `lamejortaza.co`)

---

## 5. Estructura de la base de datos

Tres colecciones en Firestore:

### `stands/{standId}`

Lectura pública. Escritura sólo admin.

```jsonc
{
  "id": "st-08",                       // = id del documento
  "nombre": "Doña Lucía",
  "municipio": "Chachagüí",
  "region": "Centro",
  "direccion": "Vía aeropuerto, Chachagüí",
  "correo": "donalucia@correo.co",
  "descripcion": "Bourbon rosado, edición limitada.",
  "coords": { "x": 0.52, "y": 0.46 },  // posición en el mapa estilizado
  "color": "oklch(0.55 0.12 20)",
  "logoUrl": "https://…",              // opcional (Firebase Storage)
  "votos": { "bueno": 0, "regular": 0, "malo": 0 },  // mantenido por Cloud Function
  "createdAt": "<timestamp>",
  "updatedAt": "<timestamp>"
}
```

### `votos/{autoId}`

Creado desde el móvil. Inmutable para clientes.

```jsonc
{
  "stand":     "st-08",
  "emoji":     "bueno",        // "bueno" | "regular" | "malo"
  "correo":    "maria@gmail.com",
  "compra":    true,
  "texto":     "Comentario opcional (≤ 500 chars)",
  "createdAt": "<serverTimestamp>"
}
```

### `pasaportes/{correo}`

ID del documento = correo en minúsculas.

```jsonc
{
  "correo":    "maria@gmail.com",
  "nombre":    "María Fernanda",
  "inicio":    "2026-04-14",
  "visitados": ["st-01", "st-02", "st-06", "st-08"]
}
```

### Inicialización (seed)

Importa los 8 stands demo de `data/stands.js`:

```bash
# requiere node y firebase-admin instalado en un proyecto auxiliar
node scripts/seed.js     # script opcional, ver Roadmap
```

O insertarlos manualmente desde la consola Firestore con el JSON de
`data/stands.js`.

---

## 6. Reglas de seguridad

El archivo `firestore.rules` aplica:

| Colección       | Lectura | Crear         | Actualizar / Borrar |
| --------------- | ------- | ------------- | ------------------- |
| `stands`        | público | sólo admin    | sólo admin          |
| `votos`         | público | autenticado*  | sólo admin          |
| `pasaportes/{c}`| público | autenticado*  | borrar: sólo admin  |

\* Auth anónimo basta. Las reglas validan:

- `stand` con regex `^[a-z0-9\-]{2,32}$`
- `emoji ∈ {bueno, regular, malo}`
- `correo` con regex de email (≤ 254 chars)
- `texto` ≤ 500 chars
- `createdAt == request.time` (no spoofeable)
- En `pasaportes`, el id del documento tiene que igualar al campo `correo`.

Despliega las reglas:

```bash
npm install -g firebase-tools
firebase login
firebase use la-mejor-taza
firebase deploy --only firestore:rules
```

### Capas adicionales de seguridad

- **CSP**: `<meta http-equiv="Content-Security-Policy">` en
  `La Mejor Taza.html` restringe scripts a `self`, `unpkg.com`,
  `gstatic.com` y `cdnjs.cloudflare.com`.
- **HTTP Headers** (Firebase Hosting, ver `firebase.json`):
  `X-Content-Type-Options: nosniff`, `Referrer-Policy:
  strict-origin-when-cross-origin`, `Permissions-Policy` que apaga
  cámara/micrófono/geolocalización, y HSTS de 1 año.
- **Sanitización en cliente** (`js/security.js`): escape HTML,
  validación de email, mascarado para mostrar en público
  (`mf***@gmail.com`), longitud máxima de comentarios y un rate-limit
  local de 60 s por stand para evitar spam accidental.
- **`firebase-config.js`** está en `.gitignore`.

---

## 7. Despliegue (Firebase Hosting)

```bash
firebase init hosting   # sólo la primera vez (acepta los defaults)
firebase deploy --only hosting,firestore:rules
```

`firebase.json` ya:

- Sirve `/` → `/La Mejor Taza.html`.
- Reescribe `/s/**` → `/La Mejor Taza.html` para los QR cortos
  (`lamejortaza.co/s/st-08`).
- Aplica los headers de seguridad mencionados.
- Excluye documentación (`README.md`, `steps.md`),
  `firebase-config.example.js` y `municipios.geojson` del despliegue.

---

## 8. Animaciones con Three.js

`js/three-background.js` monta una escena WebGL detrás del hero del
dashboard. Usa los tokens CSS (`--grano`, `--galeras`, `--cafeto`,
`--paper-3`) para mantener coherencia con el resto del diseño.

### Características

- Granos de café 3D (esferas elipsoidales) flotando en órbitas suaves.
- Capa de "vapor" con `THREE.Points` semitransparente.
- Niebla exponencial con el color de papel para fundir los bordes.
- Parallax sutil con el ratón.
- Pausa automática cuando la pestaña pierde foco
  (`visibilitychange`).
- Renderiza un solo frame estático cuando el usuario tiene
  `prefers-reduced-motion: reduce`.

### API

```html
<section data-three-bg>…</section>
```

Cualquier elemento con `data-three-bg` se monta automáticamente. También
puedes invocarlo desde React:

```jsx
<section ref={(el) => el && window.LMTThree && window.LMTThree.mount(el)}>
  …
</section>
```

`mount(el)` devuelve `{ destroy() }` para liberar el contexto WebGL si el
componente se desmonta.

---

## 9. Estructura del repositorio

```
la-mejor-taza/
├── La Mejor Taza.html         # punto de entrada (carga React + módulos)
├── index.html                 # redirección a La Mejor Taza.html
├── components/
│   ├── Shared.jsx             # Logo, sello, QR, barras
│   ├── PhoneFrame.jsx         # marco de teléfono para vistas móviles
│   ├── Admin.jsx              # Login + Stands + Editor
│   ├── QRPrint.jsx            # poster A5 + lista
│   ├── VoteFlow.jsx           # formulario móvil + confirmación
│   ├── Passport.jsx           # libreta 3D con sellos
│   └── Dashboard.jsx          # dashboard público + mapa + detalle
├── data/
│   └── stands.js              # datos demo (fallback si no hay Firestore)
├── js/
│   ├── security.js            # sanitización, validación, rate-limit
│   ├── firebase.js            # init Firebase + onSnapshot + submitVote
│   └── three-background.js    # escena Three.js (granos flotantes)
├── styles/
│   └── tokens.css             # design tokens (paleta, tipografía, sombras)
├── firebase.json              # hosting + headers de seguridad
├── firestore.rules            # reglas de seguridad de Firestore
├── firebase-config.example.js # plantilla (copiar a firebase-config.js)
├── municipios.geojson         # contorno de Nariño (futuro mapa real)
├── steps.md                   # checklist breve de Firebase
└── README.md
```

---

## 10. Roadmap

- [ ] Cloud Function `onCreate(votos)` que recalcule
      `stands/{id}.votos.{bueno,regular,malo}` de forma atómica.
- [ ] Cloud Function `onCreate(stands)` que genere el PNG del QR en
      Storage.
- [ ] Reemplazar `MapaNarino` SVG estilizado por `municipios.geojson` con
      Leaflet/MapLibre.
- [ ] Firebase App Check (reCAPTCHA Enterprise) para reforzar el rate
      limit del lado servidor.
- [ ] Firebase Analytics + BigQuery export para reportes de la
      Gobernación.
- [ ] Cloud Function `setAdmin(uid)` invocable sólo por otros admins.
- [ ] Tests E2E (Playwright) para el flujo voto → pasaporte → dashboard.

---

**Comité del Café · Gobernación de Nariño · 2026**
