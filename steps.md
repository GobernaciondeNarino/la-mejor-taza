# Configuración de Firebase — La Mejor Taza

Guía para conectar el prototipo
[`La Mejor Taza.html`](./La%20Mejor%20Taza.html) al proyecto Firebase
[`la-mejor-taza`](https://console.firebase.google.com/project/la-mejor-taza/overview?hl=es-419).

> El prototipo usa hoy datos demo en `data/stands.js` (`window.STANDS_DATA`,
> `window.COMENTARIOS_DEMO`, `window.PASAPORTE_DEMO`). Estos pasos documentan
> cómo reemplazarlos por Firestore en producción, conservando la UI tal cual.

## 1. Registrar la app web

1. Abre la [consola de Firebase](https://console.firebase.google.com/project/la-mejor-taza/overview?hl=es-419).
2. En **General → Tus apps**, haz clic en **`</>`** (Web).
3. Apodo: `La Mejor Taza Web`. Registra y copia el objeto `firebaseConfig`.

## 2. Activar Authentication

- **Build → Authentication → Get started**.
- Habilita **Email/Password** (para el login del administrador).
- Habilita **Anonymous** (para votos del usuario móvil sin fricción).
- En **Settings → Authorized domains**, agrega el dominio donde publicarás
  (p. ej. `la-mejor-taza.web.app` y cualquier dominio personalizado).

Asignar rol de administrador por custom claim (desde Cloud Functions o
Cloud Shell):

```bash
firebase functions:shell
> admin.auth().setCustomUserClaims("<uid>", { admin: true })
```

Las reglas de Firestore exigen `request.auth.token.admin == true` para
escribir en `stands` y borrar votos.

## 3. Crear Cloud Firestore

- **Build → Firestore Database → Create database**.
- Modo **Production** · región `southamerica-east1` (cercana a Colombia).

## 4. Publicar las reglas

El repo incluye `firestore.rules` alineado con el esquema del prototipo.

```bash
npm install -g firebase-tools
firebase login
firebase use la-mejor-taza
firebase deploy --only firestore:rules
```

## 5. Esquema de datos

Tres colecciones (nombres elegidos en el chat de diseño):

### `stands/{standId}`
Los registra el administrador. Lectura pública.

```jsonc
{
  "id": "st-08",
  "nombre": "Doña Lucía",
  "municipio": "Chachagüí",
  "region": "Centro",
  "direccion": "Vía aeropuerto, Chachagüí",
  "correo": "donalucia@correo.co",
  "descripcion": "Café de finca única. Bourbon rosado, edición limitada.",
  "coords": { "x": 0.52, "y": 0.46 },
  "color": "oklch(0.55 0.12 20)",
  "logoUrl": "https://…",   // opcional, Firebase Storage
  "createdAt": "<timestamp>",
  "updatedAt": "<timestamp>"
}
```

Los agregados de votos (`votos.bueno/regular/malo`) se mantienen con
Cloud Functions que escuchan la creación en `votos/`.

### `votos/{autoId}`
Lo crea el formulario móvil al escanear el QR. Escritura pública con
validación en reglas.

```jsonc
{
  "stand": "st-08",
  "emoji": "bueno",          // "bueno" | "regular" | "malo"
  "correo": "mf***@gmail.com",
  "compra": true,
  "texto": "Comentario opcional (≤ 500 chars)",
  "createdAt": "<serverTimestamp>"
}
```

### `pasaportes/{correo}`
Documento por correo (en minúsculas) con los stands visitados. Se
actualiza al mismo tiempo que se crea el voto.

```jsonc
{
  "correo": "maria@gmail.com",
  "nombre": "María Fernanda",
  "inicio": "2026-04-14",
  "visitados": ["st-01", "st-02", "st-06", "st-08"]
}
```

## 6. Cablear la UI al Firestore real

1. Crea `firebase-config.js` en la raíz con el objeto del paso 1:

   ```js
   // firebase-config.js
   export const firebaseConfig = {
     apiKey: "…",
     authDomain: "la-mejor-taza.firebaseapp.com",
     projectId: "la-mejor-taza",
     storageBucket: "la-mejor-taza.appspot.com",
     messagingSenderId: "…",
     appId: "…"
   };
   ```

2. En `La Mejor Taza.html`, reemplaza la carga de `data/stands.js` por un
   módulo que lea de Firestore en tiempo real y vuelque en los mismos
   globals (`window.STANDS_DATA`, `window.COMENTARIOS_DEMO`) antes de
   montar React. Un patrón de cableado:

   ```html
   <script type="module">
     import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
     import { getFirestore, collection, onSnapshot, orderBy, limit, query }
       from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
     import { firebaseConfig } from "./firebase-config.js";

     const app = initializeApp(firebaseConfig);
     const db = getFirestore(app);

     window.STANDS_DATA = [];
     window.COMENTARIOS_DEMO = [];

     onSnapshot(collection(db, "stands"), snap => {
       window.STANDS_DATA = snap.docs.map(d => ({ id: d.id, ...d.data() }));
       window.dispatchEvent(new Event("lmt:data"));
     });

     onSnapshot(
       query(collection(db, "votos"), orderBy("createdAt", "desc"), limit(20)),
       snap => {
         window.COMENTARIOS_DEMO = snap.docs.map(d => d.data());
         window.dispatchEvent(new Event("lmt:data"));
       }
     );
   </script>
   ```

   Luego, en el script de inicialización de React, vuelve a renderizar
   cuando llegue `lmt:data`.

3. El formulario de voto (`VoteForm` en `components/VoteFlow.jsx`) debe
   llamar a:

   ```js
   await addDoc(collection(db, "votos"), {
     stand: stand.id,
     emoji: data.emoji,
     correo: data.correo,
     compra: data.compra,
     texto: data.texto,
     createdAt: serverTimestamp(),
   });
   await setDoc(
     doc(db, "pasaportes", data.correo.toLowerCase()),
     { correo: data.correo.toLowerCase(),
       visitados: arrayUnion(stand.id) },
     { merge: true }
   );
   ```

## 7. Correr localmente

```bash
# Servidor estático (Node o Python)
npx serve .
# o
python3 -m http.server 5173
```

Abre `http://localhost:5173/` (redirige a `La Mejor Taza.html`).

## 8. Publicar en Firebase Hosting

```bash
firebase init hosting    # si aún no está inicializado
firebase deploy --only hosting
```

`firebase.json` ya reescribe `/` → `/La Mejor Taza.html` y `/s/**` →
`/La Mejor Taza.html` (para las URLs cortas `lamejortaza.co/s/{standId}`
impresas en los carteles QR).

## 9. Próximos pasos

- Cloud Function `onCreate(votos)` que recalcule agregados en `stands`.
- Cloud Function `onCreate(stands)` que genere el PNG del QR en Storage.
- Firebase Analytics para medir escaneos y conversión por stand.
- BigQuery export para reportes de la Gobernación.
