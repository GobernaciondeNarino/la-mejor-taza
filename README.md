# La Mejor Taza

**Pasaporte digital del café de Nariño** — votación pública con QR, libreta
de sellos y dashboard en tiempo real para el Festival del Café 2026 de la
Gobernación de Nariño.

> Frontend estático (React + Three.js, sin build step) sobre un backend
> **PHP 8 + PDO** con MySQL/MariaDB o SQLite. Toda la capa de seguridad
> (sesiones, CSRF, rate limiting, validación) vive en el servidor.

---

## Tabla de contenido

1. [Funcionalidades](#1-funcionalidades)
2. [Arquitectura](#2-arquitectura)
3. [Requisitos](#3-requisitos)
4. [Instalación local](#4-instalación-local)
5. [Configuración](#5-configuración)
6. [Base de datos](#6-base-de-datos)
7. [Seguridad](#7-seguridad)
8. [API HTTP](#8-api-http)
9. [Animaciones con Three.js](#9-animaciones-con-threejs)
10. [Despliegue en producción](#10-despliegue-en-producción)
11. [Estructura del repositorio](#11-estructura-del-repositorio)
12. [Roadmap](#12-roadmap)

---

## 1. Funcionalidades

### Rutas reales (no mockup)

| URL                                  | Audiencia | Qué hace                                                  |
| ------------------------------------ | --------- | --------------------------------------------------------- |
| `/`                                  | Público   | Dashboard: podio, mapa, ranking, votos en vivo.           |
| `/festival/{standId}`                | Público   | Detalle del stand + botón "Votar este stand →".           |
| `/s/{standId}`                       | Móvil     | **Página real de votación** que abre el QR del stand.     |
| `/pasaporte`                         | Móvil     | Libreta del usuario con sus sellos reales (por correo).   |
| `/admin/login`                       | Admin     | Login del organizador.                                    |
| `/admin` · `/admin/stands`           | Admin     | Lista y métricas (gating real).                           |
| `/admin/stands/new`                  | Admin     | Crear stand (POST `/api/stands`).                         |
| `/admin/stands/{id}/edit`            | Admin     | Editar / borrar (PUT/DELETE `/api/stands/{id}`).          |
| `/admin/qr`                          | Admin     | Carteles A5 imprimibles con el QR del stand.              |
| `/admin/live`                        | Admin     | Actividad y ranking en tiempo real.                       |
| `/install.php`                       | One-shot  | Asistente de instalación (auto-bloquea al terminar).      |
| `/api/...`                           | Backend   | Front controller PHP (auth, stands, votos, pasaportes).   |

### Administrador
- Autenticación real (cookie `HttpOnly + Secure + SameSite=Strict` +
  CSRF + Argon2id + pepper).
- **CRUD real** de stands. El editor llama a la API y refresca el
  dashboard.
- Generación de carteles A5 con QR único.
- Botón "Cerrar sesión" real.
- Las rutas `/admin/*` están **gated**: si no hay sesión válida, la SPA
  redirige a `/admin/login` y la API rechaza con `401 unauthorized`.

### Usuario · móvil (al escanear el QR)
- El QR apunta a `https://tu-sitio/s/{standId}`. Al abrir, la app
  reconoce el stand y muestra el formulario a pantalla completa
  (sin marco de teléfono — esto **no es una demo**).
- 3 pasos: correo → emoji → comentario + ¿compraste?.
- El voto se guarda en la tabla `votos`, los agregados en `stands`
  se incrementan, y el correo se sella en la tabla `pasaportes`.
- Tras votar, el correo queda en `localStorage.lmt.email` y la app
  navega a `/pasaporte`.

### Pasaporte (`/pasaporte`)
- Si hay correo guardado, carga la libreta directamente.
- Si no, pide el correo y consulta `/api/pasaportes/{correo}`.
- Renderiza una página por sello visitado, con índice y portada.
- Botón "Cerrar" limpia el correo del dispositivo.

### Público
- Hero animado con un campo 3D de granos de café (Three.js, respeta
  `prefers-reduced-motion`).
- Polling cada 5 s al `/api/dashboard`. Cualquier voto nuevo aparece
  en el feed en vivo y mueve el ranking.

---

## 2. Arquitectura

```
            QR impreso /s/{standId}
                       │
                       ▼
┌──────────────────────────────────┐
│ Frontend estático                │
│ - React via Babel Standalone     │
│ - Three.js (hero animado)        │
│ - js/api.js → fetch(/api/…)      │
└──────────┬───────────────────────┘
           │ HTTPS
           ▼
┌──────────────────────────────────┐
│ Backend PHP (api/)               │
│ - index.php = front controller   │
│ - Sesiones HttpOnly + CSRF       │
│ - PDO con sentencias preparadas  │
│ - Rate limiting por IP / correo  │
│ - Validación estricta            │
└──────────┬───────────────────────┘
           ▼
   MySQL/MariaDB · SQLite
   ┌─ admins      ─ stands
   ├─ votos       ─ pasaportes
   └─ rate_limits
```

---

## 3. Requisitos

- **PHP 8.1 o superior** con las extensiones `pdo`, `pdo_mysql` (o
  `pdo_sqlite`), `json`, `mbstring`, `intl` (recomendado para `Normalizer`).
- **MySQL 8 / MariaDB 10.5+** (recomendado en producción) **o** SQLite 3.35+.
- Servidor web con soporte de `.htaccess` (Apache, LiteSpeed) o un bloque
  `try_files` equivalente en Nginx (ver §10).
- Para el desarrollador: Git, opcionalmente `composer` (no requerido).

---

## 4. Instalación local

### 4.1. Asistente de instalación web (recomendado)

`install.php` es un asistente al estilo WordPress: pide los datos de la
base de datos y del administrador, prueba la conexión, escribe
`api/config.php`, crea las tablas, hace un seed opcional y se autobloquea
al terminar.

```bash
git clone https://github.com/GobernaciondeNarino/la-mejor-taza.git
cd la-mejor-taza

# Servidor de desarrollo (PHP 8 ya trae uno)
php -S 127.0.0.1:8000 router.php
```

Abre <http://127.0.0.1:8000/install.php> (o entra a `/`, que redirige
automáticamente cuando no hay `api/config.php`). Pasos:

1. **Bienvenida** — comprueba versión de PHP, extensiones (`pdo`,
   `pdo_mysql`/`pdo_sqlite`, `mbstring`, `json`), Argon2id y permisos
   de `api/` y `db/`.
2. **Base de datos** — selecciona MySQL/MariaDB o SQLite. Para MySQL
   piden host, puerto, **nombre de la base**, **usuario** y
   **contraseña**; si la base no existe, la crea con `utf8mb4`.
3. **Administrador** — URL del sitio, correo y contraseña (mínimo 12).
   Aquí también puedes desmarcar el seed de los 8 stands de ejemplo.
4. **Instalación** — genera `pepper` y `app_secret` aleatorios,
   escribe `api/config.php` con `'installed' => true` y un
   `reinstall_token`, ejecuta el esquema y crea el admin.
5. **Listo** — muestra el `reinstall_token` por si en el futuro
   necesitas reabrir el asistente sin borrar el config, y sugiere
   borrar `install.php`.

> Mientras `api/config.php` no exista, `install.php` se ejecuta libremente.
> En cuanto existe, el asistente se autobloquea — la única forma de
> reabrirlo es:
> - borrar `api/config.php`, **o**
> - llamar `install.php?reinstall={token}` con el token guardado en el
>   propio config.

Cuando termines, **borra** `install.php` del servidor (no hace falta
en producción).

### 4.2. Instalación manual (sin wizard)

Si prefieres no usar el asistente:

```bash
# A) SQLite — rápido para desarrollo
php -r "\$p=new PDO('sqlite:db/la-mejor-taza.sqlite');
        \$p->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        \$p->exec(file_get_contents('db/schema.sqlite.sql'));
        \$p->exec(file_get_contents('db/seed.sql'));
        echo 'OK\n';"

# B) MySQL/MariaDB
mysql -u root -p < db/schema.mysql.sql
mysql -u root -p -e "
  CREATE USER 'lmt_app'@'localhost' IDENTIFIED BY 'CAMBIAR_EN_PRODUCCION';
  GRANT SELECT, INSERT, UPDATE, DELETE ON la_mejor_taza.* TO 'lmt_app'@'localhost';
  FLUSH PRIVILEGES;
"
mysql -u lmt_app -p la_mejor_taza < db/seed.sql

# Config + administrador
cp api/config.example.php api/config.php
$EDITOR api/config.php   # ajusta el DSN, pepper y app_secret
php db/create-admin.php admin@lamejortaza.co 'TuContraseñaMuyLarga'
```

---

## 5. Configuración

`api/config.php` está en `.gitignore` — nunca lo commits.

```php
return [
    'db' => [
        'dsn'      => 'mysql:host=127.0.0.1;dbname=la_mejor_taza;charset=utf8mb4',
        'user'     => 'lmt_app',
        'password' => '…',
        // SQLite alternativo:
        // 'dsn' => 'sqlite:' . __DIR__ . '/../db/la-mejor-taza.sqlite',
    ],
    'pepper'     => '64 hex (genera con random_bytes)',
    'app_secret' => '64 hex (otro distinto)',
    'session' => [
        'name'     => 'lmt_sid',
        'lifetime' => 28800,
        'secure'   => true,        // exige HTTPS
        'samesite' => 'Strict',
    ],
    'allowed_origins' => [
        'https://lamejortaza.co',
    ],
    'rate_limits' => [
        'login'      => ['window' => 600, 'max' => 5],
        'vote'       => ['window' => 60,  'max' => 1],
        'vote_email' => ['window' => 600, 'max' => 12],
        'global'     => ['window' => 60,  'max' => 120],
    ],
    'force_https' => true,
    'debug'       => false,
];
```

Generar `pepper` y `app_secret`:

```bash
php -r "echo bin2hex(random_bytes(32)) . PHP_EOL;"   # ejecuta dos veces
```

> Si cambias el `pepper` en producción, **invalidas todos los hashes
> existentes**. Hay que rotar contraseñas o migrar.

---

## 6. Base de datos

### 6.1. Tablas

| Tabla         | Función                                                   |
| ------------- | --------------------------------------------------------- |
| `admins`      | Cuentas de organizadores (Argon2id + pepper).             |
| `stands`      | Stands del festival y agregados de votos por emoji.       |
| `votos`       | Un voto por (stand, correo). FK a stands. Índice único.   |
| `pasaportes`  | Stands visitados por correo. JSON de ids.                 |
| `rate_limits` | Ventanas fijas por (bucket, hash) para limitar requests.  |

Esquema completo en [`db/schema.mysql.sql`](db/schema.mysql.sql) y
[`db/schema.sqlite.sql`](db/schema.sqlite.sql).

### 6.2. Seed

```bash
mysql -u lmt_app -p la_mejor_taza < db/seed.sql
# o, en SQLite:
php -r "(new PDO('sqlite:db/la-mejor-taza.sqlite'))->exec(file_get_contents('db/seed.sql'));"
```

### 6.3. Mantenimiento

- Limpiar la tabla `rate_limits` periódicamente (un cron diario o mensual
  basta — la lógica reescribe la fila automáticamente, pero la tabla
  crece con cada nueva IP):

  ```sql
  DELETE FROM rate_limits
  WHERE window_start < UNIX_TIMESTAMP(NOW() - INTERVAL 7 DAY);
  ```

- Backups: `mysqldump --single-transaction` (MySQL) o copia atómica del
  archivo `.sqlite`.

---

## 7. Seguridad

### Capas en el servidor

| Riesgo                            | Mitigación                                                    |
| --------------------------------- | ------------------------------------------------------------- |
| SQLi                              | PDO + sentencias preparadas + `ATTR_EMULATE_PREPARES = false`. |
| XSS persistido                    | `Validate::comment()` quita HTML/control chars; CSP estricta. |
| CSRF                              | Sesión + `X-CSRF-Token` + lista blanca de Origin/Referer.     |
| Session fixation / robo de cookie | Cookie `HttpOnly; Secure; SameSite=Strict`, `regenerate_id`, fingerprint UA + prefijo IP. |
| Brute force login                 | 5 intentos / 10 min por IP, hashing constante incluso en fallo. |
| Spam de votos                     | 1 voto / min / IP / stand, 12 / 10 min / correo, índice único en DB. |
| Robo de hashes                    | Argon2id (`memory_cost=65536, time_cost=4, threads=2`) + pepper HMAC-SHA256 separado. |
| Filtración de errores             | `display_errors=0`, mensajes públicos genéricos, detalles a `error_log`. |
| Accesos directos a `config.php`   | `.htaccess` con `Require all denied` + ruta privada.          |
| Sniffing / MITM                   | HSTS (1 año), `force_https`, cabeceras `X-Content-Type-Options`. |
| Clickjacking                      | `X-Frame-Options: SAMEORIGIN`, CSP `frame-ancestors 'self'`.  |
| PII en logs / dashboard           | Correo enmascarado (`te**@correo.co`) en respuestas públicas. |

### Capas en el navegador

- **CSP** estricta en `La Mejor Taza.html` (`connect-src 'self'`,
  `object-src 'none'`, etc.).
- `js/security.js`: validación cliente espejo del servidor + rate limit
  local de 60 s por stand.
- React escapa por defecto los textos.

### Origen permitido

`api/config.php → allowed_origins` se compara contra `Origin` o `Referer`
en cualquier `POST/PUT/DELETE`. Añade allí cada dominio donde corra el
front antes de salir a producción.

---

## 8. API HTTP

Todas las respuestas usan `application/json` y la forma:

```jsonc
{ "ok": true,  "data": <payload> }       // éxito
{ "ok": false, "error": "code", "message": null }   // error
```

| Método  | Ruta                          | Auth         | Notas                              |
| ------- | ----------------------------- | ------------ | ---------------------------------- |
| `GET`   | `/api/auth/me`                | público      | Devuelve usuario (o null) + CSRF.  |
| `POST`  | `/api/auth/login`             | público      | Body: `{email, password}`.         |
| `POST`  | `/api/auth/logout`            | público      | Cierra sesión.                     |
| `GET`   | `/api/stands`                 | público      | Lista todos los stands.            |
| `GET`   | `/api/stands/:id`             | público      |                                    |
| `POST`  | `/api/stands`                 | admin        | Body: stand completo.              |
| `PUT`   | `/api/stands/:id`             | admin        | Reemplaza campos.                  |
| `DELETE`| `/api/stands/:id`             | admin        | CASCADE borra votos.               |
| `GET`   | `/api/votos?limit=20`         | público      | Últimos N votos (correos enmascarados). |
| `POST`  | `/api/votos`                  | público*     | Validado server-side; índice único.|
| `DELETE`| `/api/votos/{id}`             | admin        | Modera comentarios; ajusta agregados. |
| `GET`   | `/api/pasaportes/{correo}`    | público      | Correo viene URL-encoded.          |
| `GET`   | `/api/dashboard`              | público      | Stands + votos + métricas.         |
| `GET`   | `/api/health`                 | público      | Versión PHP, BD alcanzable, contadores. |
| `GET`   | `/api/export/votos.csv`       | admin        | CSV con BOM UTF-8 (Excel).         |
| `GET`   | `/api/export/stands.csv`      | admin        | CSV con BOM UTF-8.                 |
| `GET`   | `/api/export/pasaportes.csv`  | admin        | CSV con BOM UTF-8.                 |

> \* No requiere usuario, pero **sí** CSRF + Origin permitido.

### Ejemplo: emitir voto

```bash
# 1. Obtener CSRF (y la cookie)
curl -c c.txt http://127.0.0.1:8000/api/auth/me

# 2. Enviar voto
curl -b c.txt -H "Content-Type: application/json" \
     -H "X-CSRF-Token: $(jq -r .data.csrf < <(curl -s -b c.txt http://127.0.0.1:8000/api/auth/me))" \
     -H "Origin: http://127.0.0.1:8000" \
     -d '{"stand":"st-08","emoji":"bueno","correo":"yo@correo.co","compra":true}' \
     http://127.0.0.1:8000/api/votos
```

---

## 9. Animaciones con Three.js

`js/three-background.js` monta una escena WebGL detrás del hero del
dashboard usando los tokens CSS (`--grano`, `--galeras`, `--cafeto`).

- Granos de café 3D flotando en órbitas suaves.
- Capa de "vapor" con `THREE.Points`.
- Niebla exponencial fundiendo bordes.
- Parallax con el ratón.
- Pausa en `visibilitychange` y un solo frame con `prefers-reduced-motion`.

```html
<section data-three-bg>…</section>
```

Cualquier elemento con `data-three-bg` se monta automáticamente. También:

```jsx
<section ref={(el) => el && window.LMTThree && window.LMTThree.mount(el)} />
```

`mount(el)` devuelve `{ destroy() }` para liberar el contexto WebGL.

---

## 10. Despliegue en producción

### Apache

`firebase.json` ya no se usa. La configuración vive en los `.htaccess`:

- `/.htaccess` — cabeceras globales (HSTS, X-Frame-Options,
  Permissions-Policy), bloqueo de archivos sensibles, rewrites para `/`
  y `/s/{id}` → la SPA.
- `/api/.htaccess` — front controller en `index.php`, bloqueo directo a
  `lib/`, `routes/`, `config.php`.

Sube todo el repo (excepto lo de `.gitignore`) al docroot. Mueve idealmente
`api/config.php` y `db/*.sqlite` **fuera** del docroot y ajusta los
require/DSN.

### Nginx

```nginx
server {
    listen 443 ssl http2;
    server_name lamejortaza.co;
    root /var/www/la-mejor-taza;
    index "La Mejor Taza.html";

    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    location ~ ^/api(/.*)?$ {
        try_files $uri /api/index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }

    location ~ ^/(api/(config|lib|routes)|db|\.git) { return 403; }

    location ~ ^/s/[a-z0-9\-]{2,32}/?$ { try_files /La%20Mejor%20Taza.html =404; }
    location = / { try_files /La%20Mejor%20Taza.html =404; }
}
```

### TLS

Imprescindible (HSTS, cookies `Secure`). Usa Let's Encrypt:

```bash
certbot --nginx -d lamejortaza.co -d www.lamejortaza.co
```

---

## 11. Estructura del repositorio

```
la-mejor-taza/
├── app.php                    # SPA renderizada por PHP (inyecta <base> y LMT_BOOTSTRAP)
├── index.html                 # redirección a app.php
├── router.php                 # router para `php -S` en desarrollo
├── .htaccess                  # cabeceras globales + rewrites
├── components/                # JSX in-browser (React via Babel)
│   ├── Shared.jsx             # Logo, sello, QR, barras
│   ├── Admin.jsx              # login + AdminShell + StandsList + StandEditor
│   ├── QRPrint.jsx            # poster A5 + lista
│   ├── VoteFlow.jsx           # MobileVotePage real (full-screen)
│   ├── Passport.jsx           # PassportPage real (libreta del usuario)
│   └── Dashboard.jsx          # PublicDashboard + MapaNarino + PublicDetail
├── js/
│   ├── router.js              # router cliente (pushState + popstate)
│   ├── api.js                 # cliente del backend PHP (fetch + CSRF)
│   ├── security.js            # validación cliente, mascarado, rate-limit
│   └── three-background.js    # escena Three.js (granos flotantes)
├── styles/tokens.css          # design tokens
├── install.php                # asistente de instalación (estilo WordPress)
├── api/
│   ├── .htaccess              # bloqueo + front controller
│   ├── index.php              # bootstrap + router
│   ├── config.example.php     # plantilla (la genera install.php)
│   ├── lib/
│   │   ├── Config.php         # carga de config inmutable
│   │   ├── Db.php             # PDO singleton + tx()
│   │   ├── Response.php       # JSON helpers
│   │   ├── Session.php        # sesiones endurecidas + CSRF
│   │   ├── Validate.php       # email, standId, comentario, etc.
│   │   ├── RateLimit.php      # ventanas fijas en DB
│   │   ├── Security.php       # cabeceras, hash, CSRF/Origin
│   │   └── Router.php
│   └── routes/
│       ├── auth.php
│       ├── stands.php
│       ├── votos.php
│       ├── pasaportes.php
│       └── dashboard.php
├── db/
│   ├── schema.mysql.sql
│   ├── schema.sqlite.sql
│   ├── seed.sql
│   └── create-admin.php       # CLI para crear/actualizar admins
└── README.md
```

---

## 12. Despliegue en subdirectorio

Si la app vive bajo una ruta (p. ej. `https://cisna.narino.gov.co/lamejortaza/`):

- Sube todo el repo dentro de esa carpeta del docroot.
- `app.php` calcula el `<base href>` correcto leyendo `SCRIPT_NAME`,
  por lo que `js/`, `styles/` y `/api/` resuelven a
  `/lamejortaza/...` automáticamente.
- El `.htaccess` está escrito en formato relativo (sin paths absolutos),
  así que funciona igual en raíz que en cualquier subdirectorio.
- El asistente de instalación pone en `allowed_origins` la URL exacta
  que ingreses en el paso "URL del sitio". **Esa URL debe coincidir
  con la que ven los navegadores** o los POST devolverán
  `403 origin_not_allowed`.
- En `api/config.php`, deja `'session' => ['secure' => true]` cuando
  el sitio se sirve por HTTPS (cookies sólo viajan por TLS).

### Verificación rápida tras instalar

```bash
# 1. Health check (no requiere CSRF). Debe ser 200 con db_reachable=true.
curl https://tu-sitio/lamejortaza/api/health

# 2. Auth/me. Debe ser 200 con user:null + csrf.
curl https://tu-sitio/lamejortaza/api/auth/me

# 3. Refresh profundo del SPA. Debe ser 200 (no 404) y traer LMT_BOOTSTRAP.
curl -I https://tu-sitio/lamejortaza/admin/login
curl -I https://tu-sitio/lamejortaza/s/st-08
```

### "Después de instalar veo 404 en `/admin/login` / `/s/{id}`"

Casi siempre es uno de estos:

1. **`mod_rewrite` no está activo.** En cPanel suele venir habilitado;
   en Apache "vanilla" hay que asegurar `LoadModule rewrite_module
   modules/mod_rewrite.so`. Verifica con `apachectl -M | grep rewrite`.
2. **`AllowOverride None` en el VirtualHost.** El `.htaccess` se ignora.
   Tienes que pedir al hosting (o ajustar la config) `AllowOverride All`
   o al menos `AllowOverride FileInfo Indexes Options`.
3. **El `.htaccess` no se subió** (algunos clientes FTP ocultan los
   archivos que empiezan con punto). Verifica que existe físicamente.

Diagnóstico: visita `https://tu-sitio/lamejortaza/api/health`.
- 200 con JSON → la API funciona; el problema es sólo en las URLs SPA
  (`mod_rewrite` o `AllowOverride`).
- 404 / página de error de hosting → ni la API está accesible; revisa
  `.htaccess` y permisos.

### "POST /api/votos devuelve `origin_not_allowed`"

Edita `api/config.php` y agrega tu URL real (sin barra final) en
`allowed_origins`:

```php
'allowed_origins' => [
    'https://cisna.narino.gov.co/lamejortaza',
],
```

## 13. Roadmap

- [ ] Endpoint `/api/qr/{standId}.png` que genere el PNG con
      `endroid/qr-code` (composer).
- [ ] Migrar `MapaNarino` SVG estilizado a `municipios.geojson` con
      Leaflet/MapLibre.
- [ ] WebSockets / SSE para feed live (hoy es polling 5 s).
- [ ] Doble factor (TOTP) para administradores.
- [ ] Exportes CSV / XLSX para informes de la Gobernación.
- [ ] Tests E2E (Playwright) para el flujo voto → pasaporte → dashboard.

---

**Comité del Café · Gobernación de Nariño · 2026**
