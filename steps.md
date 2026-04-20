# Configuración de Firebase — La Mejor Taza

Guía paso a paso para conectar esta aplicación web al proyecto Firebase
[`la-mejor-taza`](https://console.firebase.google.com/project/la-mejor-taza/overview?hl=es-419).

> Requisitos previos: una cuenta de Google con acceso al proyecto y
> [Node.js 18+](https://nodejs.org/) para instalar la CLI de Firebase.

---

## 1. Registrar la aplicación web en Firebase

1. Abre la [consola de Firebase](https://console.firebase.google.com/project/la-mejor-taza/overview?hl=es-419).
2. En la pestaña **General** del proyecto, desplázate hasta **Tus apps**.
3. Haz clic en el icono **`</>`** (Web) para agregar una app.
4. Ingresa el apodo `La Mejor Taza Web` y **registra la app**.
5. Firebase mostrará un objeto `firebaseConfig` con las llaves del proyecto.
   Cópialas — las usarás en el siguiente paso.

## 2. Colocar las credenciales en `firebase-config.js`

Abre `firebase-config.js` en la raíz del proyecto y reemplaza los valores
`YOUR_*` con los del paso anterior. Ejemplo:

```js
export const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "la-mejor-taza.firebaseapp.com",
  projectId: "la-mejor-taza",
  storageBucket: "la-mejor-taza.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abc123",
};
```

> Las llaves del SDK web son públicas por diseño. La seguridad real se aplica
> mediante Authentication, reglas de Firestore y dominios autorizados.

## 3. Activar Authentication (correo y contraseña)

1. En la consola, ve a **Build → Authentication → Get started**.
2. En la pestaña **Sign-in method**, habilita **Email/Password**.
3. En **Settings → Authorized domains**, verifica que `localhost` esté
   presente y agrega el dominio de producción (p. ej.
   `la-mejor-taza.web.app` o el dominio personalizado de la Gobernación).

## 4. Crear la base de datos Cloud Firestore

1. Ve a **Build → Firestore Database → Create database**.
2. Elige **Production mode** (las reglas se cargarán en el siguiente paso).
3. Selecciona una región cercana (recomendado `southamerica-east1` para
   usuarios en Colombia).

## 5. Cargar las reglas de seguridad

El repositorio incluye `firestore.rules`: cada usuario autenticado solo puede
leer y escribir su propio documento `users/{uid}`.

Con la CLI de Firebase:

```bash
npm install -g firebase-tools
firebase login
firebase use la-mejor-taza
firebase deploy --only firestore:rules
```

O cópialas manualmente en **Firestore → Rules** desde la consola.

## 6. Estructura de datos en Firestore

La app crea y mantiene una colección `users` con documentos identificados
por el `uid` de Authentication. Cada documento sigue esta forma:

```jsonc
// users/{uid}
{
  "fullName": "Juan Pérez",
  "documentId": "1085000000",
  "email": "juan@example.com",
  "phone": "+57 300 000 0000",
  "municipality": "PASTO",     // opcional
  "gender": "masculino",        // opcional
  "ethnicity": "indigena",      // opcional
  "age": 34,                    // opcional
  "stamps": [],                 // sellos del pasaporte
  "termsAcceptedAt": "<timestamp>",
  "createdAt": "<timestamp>",
  "updatedAt": "<timestamp>"
}
```

Los campos **municipality**, **gender**, **ethnicity** y **age** son opcionales
y el usuario puede actualizarlos en cualquier momento desde **Mi Perfil**.

## 7. Ejecutar la app localmente

```bash
# Servidor estático sencillo
npx serve .
# o
python3 -m http.server 5173
```

Abre `http://localhost:5173` (o el puerto que muestre la herramienta) en tu
navegador. Deberías poder registrarte, iniciar sesión y ver el pasaporte.

## 8. Publicar en Firebase Hosting (opcional)

```bash
firebase init hosting     # si aún no está inicializado
firebase deploy --only hosting
```

El archivo `firebase.json` incluido sirve los archivos estáticos desde la
raíz del repositorio y reescribe cualquier ruta a `index.html`.

## 9. Próximos pasos sugeridos

- Agregar inicio de sesión con Google en **Authentication → Sign-in method**.
- Crear una colección `stamps` con los stands participantes y una función
  Cloud Function que agregue sellos al pasaporte al escanear un código.
- Exportar estadísticas anónimas (municipio, género, etnia, edad) a
  BigQuery para los reportes de la Gobernación.

---

¿Dudas? Revisa la [documentación oficial de Firebase](https://firebase.google.com/docs)
o el `README` de este repositorio.
