# Biblioteca Juan de Lanuza

Aplicación web completa para la gestión de la biblioteca del Colegio Juan de Lanuza. Permite gestionar el catálogo de libros, préstamos, usuarios y estadísticas de uso, con un catálogo público accesible sin registro.

---

## Índice

1. [Tecnologías](#tecnologías)
2. [Arquitectura](#arquitectura)
3. [Estructura de carpetas](#estructura-de-carpetas)
4. [Instalación y arranque en local](#instalación-y-arranque-en-local)
5. [Variables de entorno](#variables-de-entorno)
6. [Sistema de roles](#sistema-de-roles)
7. [Rutas del cliente](#rutas-del-cliente)
8. [API REST — Endpoints](#api-rest--endpoints)
9. [Base de datos](#base-de-datos)
10. [Funcionalidades destacadas](#funcionalidades-destacadas)
11. [Despliegue en producción](#despliegue-en-producción)

---

## Tecnologías

### Frontend

| Paquete         | Uso                  |
| --------------- | -------------------- |
| React 18        | UI                   |
| React Router v6 | Enrutado SPA         |
| Vite            | Bundler / dev server |
| Tailwind CSS    | Estilos              |
| Axios           | Peticiones HTTP      |
| Lucide React    | Iconos               |
| qrcode.react    | Generación de QR     |

### Backend

| Paquete            | Uso                                |
| ------------------ | ---------------------------------- |
| Node.js + Express  | Servidor HTTP                      |
| mysql2             | Conexión a base de datos           |
| jsonwebtoken       | Autenticación JWT                  |
| bcryptjs           | Hash de contraseñas                |
| multer             | Subida de fotos de portada         |
| nodemailer         | Envío de emails (Gmail SMTP)       |
| node-cron          | Tareas programadas (recordatorios) |
| helmet             | Cabeceras de seguridad HTTP        |
| express-rate-limit | Limitación de intentos de login    |
| dotenv             | Variables de entorno               |

---

## Arquitectura

```
┌─────────────────────────────────────────────┐
│              Navegador (React)              │
│         http://localhost:5173 (dev)         │
│    https://biblioteca.lanuza.local (prod)   │
└──────────────────┬──────────────────────────┘
                   │ HTTP / HTTPS
┌──────────────────▼──────────────────────────┐
│             Nginx (producción)              │
│  / → proxy al cliente (React build)         │
│  /api → proxy al servidor Express           │
│  /uploads → archivos estáticos (fotos)      │
└──────────┬──────────────────────────────────┘
           │
┌──────────▼──────────────────────────────────┐
│         Servidor Express (Node.js)          │
│           http://localhost:3001             │
│       Mantenido con PM2 en producción       │
└──────────┬──────────────────────────────────┘
           │
┌──────────▼──────────────────────────────────┐
│          MariaDB / MySQL                    │
│       base de datos: biblioteca_lanuza      │
└─────────────────────────────────────────────┘
```

---

## Estructura de carpetas

```
biblioteca_lanuza/
├── client/                                             # Frontend React
│   ├── public/                                         # Archivos estáticos (logos, imágenes)
│   │   ├── arbol_logo_transparente_wide.png            # Logo horizontal (cabeceras)
│   │   ├── arbol_logo_transparente_cuadrado.png        # Logo cuadrado (favicon)
│   │   ├── logo.png                                    # Logo alternativo
│   │   ├── login-bg.jpg                                # Foto de fondo del login
│   │   ├── portada-default.png                         # Portada por defecto para libros sin foto
│   │   └── fonts/
│   │       └── Essai.ttf                               # Fuente corporativa
│   └── src/
│       ├── App.jsx                                     # Definición de rutas
│       ├── main.jsx                                    # Punto de entrada
│       ├── index.css                                   # Estilos globales + Tailwind
│       ├── components/                                 # Componentes reutilizables
│       │   ├── Footer.jsx                              # Pie de página global
│       │   ├── LibroCard.jsx                           # Tarjeta de libro en catálogo
│       │   ├── PrivateRoute.jsx                        # Guard de rutas protegidas
│       │   ├── Sidebar.jsx                             # Menú lateral de gestión
│       │   └── Toast.jsx                               # Notificaciones emergentes
│       ├── context/
│       │   └── AuthContext.jsx                         # Estado global de autenticación
│       ├── pages/                                      # Páginas de la aplicación
│       │   ├── Catalogo.jsx                            # Catálogo público de libros
│       │   ├── Dashboard.jsx                           # Panel inicial de gestión
│       │   ├── Estadisticas.jsx                        # Gráficas y métricas de uso
│       │   ├── LibroDetalle.jsx                        # Detalle público de un libro
│       │   ├── Libros.jsx                              # Gestión de libros (biblioteca)
│       │   ├── Login.jsx                               # Inicio de sesión
│       │   ├── MiEspacio.jsx                           # Perfil del usuario
│       │   ├── OlvidePassword.jsx                      # Solicitud de recuperación de contraseña
│       │   ├── Prestamos.jsx                           # Gestión de préstamos (biblioteca)
│       │   ├── Register.jsx                            # Registro de nueva cuenta
│       │   ├── Registro.jsx                            # Registro de visitas diarias
│       │   ├── ResetPassword.jsx                       # Restablecer contraseña con token
│       │   └── Usuarios.jsx                            # Gestión de usuarios (biblioteca)
│       ├── services/
│       │   └── api.js                                  # Instancia de Axios con baseURL y token
│       └── utils/
│           ├── csv.js                                  # Utilidades para exportar a CSV
│           └── dates.js                                # Formateo de fechas
│
├── server/                                             # Backend Express
│   ├── .env                                            # Variables de entorno (no esta en git)
│   ├── uploads/                                        # Fotos de portada subidas
│   └── src/
│       ├── index.js                                    # Entrada del servidor, middlewares globales
│       ├── db.js                                       # Pool de conexiones MySQL
│       ├── controllers/                                # Lógica de negocio
│       │   ├── authController.js
│       │   ├── configController.js
│       │   ├── estadisticasController.js
│       │   ├── estanteriasController.js
│       │   ├── librosController.js
│       │   ├── passwordResetController.js
│       │   ├── prestamosController.js
│       │   ├── registroController.js
│       │   └── usuariosController.js
│       ├── middleware/
│       │   ├── auth.js                                 # Verifica JWT en cabecera Authorization
│       │   └── isPersonal.js                           # Restringe acceso a rol biblioteca
│       ├── routes/                                     # Definición de endpoints
│       │   ├── auth.js
│       │   ├── config.js
│       │   ├── estadisticas.js
│       │   ├── estanterias.js
│       │   ├── libros.js
│       │   ├── prestamos.js
│       │   ├── registro.js
│       │   └── usuarios.js
│       ├── services/
│       │   └── mailer.js                               # Configuración Nodemailer + función sendMail
│       └── jobs/
│           └── recordatorios.js                        # Cron que envía recordatorios de devolución
│
└── database/                                           # Scripts SQL de la BD
```

---

## Instalación y arranque en local

### Requisitos previos

- Node.js 18+
- MySQL / MariaDB
- XAMPP (recomendado para desarrollo local)

### 1. Clonar el repositorio

```bash
git clone <https://github.com/jxrgxx/biblioteca_lanuza.git>
cd biblioteca_lanuza
```

### 2. Base de datos

1. Arrancar XAMPP y activar Apache + MySQL
2. Abrir phpMyAdmin (`http://localhost/phpmyadmin`)
3. Crear una base de datos llamada `biblioteca_lanuza`
4. Importar el esquema desde `database/`

### 3. Configurar el servidor

```bash de vscode
cd server
cp .env.example .env   # o crear .env manualmente (os proporcioanre el .env)
npm install
npm run dev            # arranca con nodemon en el puerto 3001
```

### 4. Configurar el cliente

```bash de vscode
cd client
npm install
npm run dev            # arranca Vite en el puerto 5173
```

La aplicación estará disponible en `http://localhost:5173`.

---

## Variables de entorno

Crear el archivo `server/.env` (os proporcionare el .env local) con las siguientes variables:

```env
# Base de datos
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=biblioteca_lanuza

# JWT
JWT_SECRET=<cadena_aleatoria_larga>

# Servidor
PORT=3001
CLIENT_URL=http://localhost:5173

# SMTP (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=correo@juandelanuza.org
SMTP_PASS=<contraseña_de_aplicacion_gmail>
SMTP_FROM=correo@juandelanuza.org

```

> **Nota sobre SMTP_PASS:** Gmail requiere una _contraseña de aplicación_, no la contraseña normal de la cuenta. Se genera en la configuración de seguridad de Google con la verificación en dos pasos activada.

---

## Sistema de roles

| Rol           | Acceso                                                                 |
| ------------- | ---------------------------------------------------------------------- |
| `alumno`      | Catálogo público, detalle de libro, Mi espacio (sus propios préstamos) |
| `profesorado` | Todo lo anterior + panel de gestión completo                           |
| `personal`    | Todo lo anterior + panel de gestión completo                           |
| `biblioteca`  | Todo lo anterior + panel de gestión completo                           |

Los roles `profesorado` y `personal` requieren un **código de registro** al crear la cuenta. Este código lo gestiona el bibliotecario desde la sección de Usuarios.

El middleware `isPersonal` en el servidor bloquea el acceso a endpoints de gestión si el rol del token JWT no es `biblioteca`.

---

## Rutas del cliente

### Rutas públicas

| Ruta                        | Página           | Descripción                               |
| --------------------------- | ---------------- | ----------------------------------------- |
| `/`                         | `Catalogo`       | Catálogo de libros con buscador y filtros |
| `/libros/:id`               | `LibroDetalle`   | Detalle de un libro, disponibilidad y QR  |
| `/login`                    | `Login`          | Inicio de sesión                          |
| `/register`                 | `Register`       | Crear cuenta nueva                        |
| `/olvide-password`          | `OlvidePassword` | Solicitar enlace de recuperación          |
| `/reset-password?token=...` | `ResetPassword`  | Establecer nueva contraseña               |

### Rutas protegidas — solo rol biblioteca

| Ruta            | Página         | Descripción                           |
| --------------- | -------------- | ------------------------------------- |
| `/dashboard`    | `Dashboard`    | Resumen general con métricas          |
| `/libros`       | `Libros`       | CRUD de libros, estanterías, exportar |
| `/prestamos`    | `Prestamos`    | Gestión de préstamos y devoluciones   |
| `/usuarios`     | `Usuarios`     | CRUD de usuarios, importar CSV        |
| `/registro`     | `Registro`     | Registro de visitas diarias           |
| `/estadisticas` | `Estadisticas` | Gráficas y estadísticas de uso        |

### Rutas protegidas — cualquier usuario autenticado

| Ruta          | Página      | Descripción                                 |
| ------------- | ----------- | ------------------------------------------- |
| `/mi-espacio` | `MiEspacio` | Perfil propio y préstamos activos/histórico |

---

## API REST — Endpoints

Todos los endpoints van prefijados con `/api`.

### Autenticación — `/api/auth`

| Método | Ruta                | Auth | Descripción                                           |
| ------ | ------------------- | ---- | ----------------------------------------------------- |
| POST   | `/register`         | No   | Registrar nuevo usuario                               |
| POST   | `/login`            | No   | Iniciar sesión, devuelve JWT                          |
| GET    | `/perfil`           | Sí   | Obtener datos del usuario autenticado para mi espacio |
| PUT    | `/cambiar-password` | Sí   | Cambiar contraseña (requiere la actual)               |
| POST   | `/forgot-password`  | No   | Solicitar email de recuperación                       |
| POST   | `/reset-password`   | No   | Restablecer contraseña con token                      |

> El endpoint `/login` tiene rate limit: máximo **20 peticiones por IP cada 15 minutos**.

---

### Libros — `/api/libros`

| Método | Ruta                   | Auth       | Descripción                                       |
| ------ | ---------------------- | ---------- | ------------------------------------------------- |
| GET    | `/`                    | No         | Listar libros con filtros y búsqueda              |
| GET    | `/filtros/generos`     | No         | Lista de géneros distintos                        |
| GET    | `/filtros/idiomas`     | No         | Lista de idiomas distintos                        |
| GET    | `/filtros/editoriales` | No         | Lista de editoriales distintas                    |
| GET    | `/filtros/estanterias` | No         | Lista de estanterías distintas                    |
| GET    | `/:id`                 | No         | Detalle de un libro                               |
| POST   | `/`                    | Biblioteca | Crear libro (genera código `L_N` automático)      |
| PUT    | `/:id`                 | Biblioteca | Editar libro                                      |
| DELETE | `/:id`                 | Biblioteca | Eliminar libro (falla si tiene préstamos activos) |
| POST   | `/:id/foto`            | Biblioteca | Subir foto de portada                             |

**Parámetros de filtro para `GET /`:**

- `search` — búsqueda por título, autor, ISBN o código
- `estado` — `disponible`, `prestado`, `baja`
- `genero`, `idioma`, `editorial`, `estanteria`
- `sort`, `order` — columna y dirección de ordenación

```
GET /api/libros?search=harry&estado=disponible&genero=Fantasía&sort=titulo&order=asc
```

---

### Préstamos — `/api/prestamos`

| Método | Ruta            | Auth       | Descripción                                     |
| ------ | --------------- | ---------- | ----------------------------------------------- |
| GET    | `/`             | Biblioteca | Listar todos los préstamos                      |
| GET    | `/mis`          | Sí         | Préstamos del usuario autenticado               |
| GET    | `/:id`          | Biblioteca | Detalle de un préstamo                          |
| POST   | `/`             | Biblioteca | Crear préstamo individual                       |
| POST   | `/lote`         | Biblioteca | Crear préstamos en lote (por código de usuario) |
| PUT    | `/:id/devolver` | Biblioteca | Registrar devolución                            |
| PUT    | `/:id`          | Biblioteca | Editar préstamo                                 |
| DELETE | `/:id`          | Biblioteca | Eliminar préstamo                               |

Al crear un préstamo se genera automáticamente un código alfanumérico de 6 caracteres, se actualiza el estado del libro a `prestado` y se programa un recordatorio por email para la fecha de devolución.

---

### Usuarios — `/api/usuarios`

| Método | Ruta                   | Auth       | Descripción                                         |
| ------ | ---------------------- | ---------- | --------------------------------------------------- |
| GET    | `/`                    | Biblioteca | Listar todos los usuarios                           |
| GET    | `/:id`                 | Biblioteca | Detalle de un usuario                               |
| GET    | `/:id/prestamos-count` | Biblioteca | Número total de préstamos de un usuario             |
| POST   | `/`                    | Biblioteca | Crear usuario (genera código `U_N` automático)      |
| POST   | `/importar`            | Biblioteca | Importar usuarios en bloque desde CSV               |
| POST   | `/subida-de-curso`     | Biblioteca | Avanzar curso a todos los alumnos                   |
| PUT    | `/:id`                 | Biblioteca | Editar usuario                                      |
| PATCH  | `/:id/activo`          | Biblioteca | Activar o desactivar usuario                        |
| DELETE | `/:id`                 | Biblioteca | Eliminar usuario (falla si tiene préstamos activos) |

**Importación CSV (`POST /importar`):**
Recibe un array de objetos `{nombre, apellidos, email}` junto con `rol`, `ubicacion` (curso) y `password` comunes para todos. Ejecuta todo en una transacción MySQL: si falla cualquier fila, no se inserta ninguna.

**Subida de curso (`POST /subida-de-curso`):**

- Los alumnos de `2º Bach` se desactivan automáticamente.
- El resto de alumnos avanzan al siguiente curso de la lista.

---

### Estanterías — `/api/estanterias`

| Método | Ruta   | Auth       | Descripción                                                 |
| ------ | ------ | ---------- | ----------------------------------------------------------- |
| GET    | `/`    | Sí         | Listar todas las estanterías                                |
| POST   | `/`    | Biblioteca | Crear estantería                                            |
| PUT    | `/:id` | Biblioteca | Renombrar estantería (actualiza todos los libros afectados) |
| DELETE | `/:id` | Biblioteca | Eliminar estantería                                         |

---

### Registro de visitas — `/api/registro`

| Método | Ruta   | Auth       | Descripción                                        |
| ------ | ------ | ---------- | -------------------------------------------------- |
| GET    | `/`    | Biblioteca | Listar entradas del registro (filtrable por fecha) |
| POST   | `/`    | Biblioteca | Crear entrada                                      |
| PUT    | `/:id` | Biblioteca | Editar entrada                                     |
| DELETE | `/:id` | Biblioteca | Eliminar entrada                                   |

---

### Estadísticas — `/api/estadisticas`

Todos requieren autenticación con rol biblioteca.

| Ruta                      | Descripción                                                   |
| ------------------------- | ------------------------------------------------------------- |
| `/resumen`                | Totales: libros, préstamos activos, vencidos, visitas del mes |
| `/libros-top`             | Libros más prestados                                          |
| `/alumnos-top`            | Alumnos con más préstamos                                     |
| `/prestamos-por-mes`      | Préstamos agrupados por mes                                   |
| `/prestamos-por-curso`    | Préstamos agrupados por curso del alumno                      |
| `/libros-nunca-prestados` | Libros que nunca han sido prestados                           |
| `/tasa-devolucion`        | % de devoluciones a tiempo vs. tarde                          |
| `/tiempo-medio`           | Duración media de préstamo (global y por curso)               |
| `/alumnos-morosos`        | Alumnos con préstamos vencidos y días acumulados              |
| `/registro-por-mes`       | Visitas diarias agrupadas por mes                             |
| `/cursos-top`             | Cursos con más visitas registradas                            |
| `/dia-semana`             | Distribución de visitas por día de la semana                  |

---

### Configuración — `/api/config`

| Método | Ruta               | Auth       | Descripción                       |
| ------ | ------------------ | ---------- | --------------------------------- |
| GET    | `/codigo-registro` | Biblioteca | Obtener código de registro actual |
| POST   | `/codigo-registro` | Biblioteca | Generar nuevo código de registro  |

---

## Base de datos

### Tablas principales

**`usuario`**

```
id, codigo (U_N), nombre, apellidos, email, password,
rol, ubicacion (curso/clase), activo, fecha_alta, fecha_baja
```

**`libro`**

```
id, codigo (L_N), titulo, autor, editorial,
genero, idioma, categoria, volumen, estanteria, estado, nombre_foto
```

**`prestamo`**

```
id, codigo (alfanumérico 6 chars), id_usuario, id_libro,
fecha_inicio, fecha_devolucion_prevista, fecha_devolucion_real,
devuelto, codigo_lote, created_at
```

**`registro`**

```
id, nombre, codigo_usuario, curso, fecha
```

**`estanteria`**

```
id, nombre
```

**`config`**

```
clave, valor
```

**`password_reset`**

```
id, id_usuario, token, expires_at, usado, created_at
```

**`recordatorio`**

```
id, id_prestamo, codigo_lote, enviar_en, enviado, created_at
```

### Estados de un libro

- `disponible` — puede prestarse
- `prestado` — tiene un préstamo activo
- `extraviado` — libro perdido
- `no disponible` — retirado temporalmente del catálogo

---

## Funcionalidades destacadas

### Recuperación de contraseña

Flujo completo por email: el usuario solicita el reset, el servidor genera un token con 1 hora de validez y envía un email con el enlace. Al usar el enlace, el token se marca como usado y no puede reutilizarse.

### Recordatorios automáticos

Un cron job (`node-cron`) se ejecuta cada 5 minutos y revisa la tabla `recordatorio` buscando entradas pendientes cuya hora de envío ya haya llegado. Cuando se crea un préstamo, se programa automáticamente un recordatorio para las 16:45 del día anterior a la devolución prevista. El email se envía al usuario con los detalles del libro y la fecha límite.

### Importación masiva de usuarios por CSV

Desde la página de Usuarios se puede subir un CSV con columnas `nombre`, `apellidos`, `email`. El personal elige el rol, el curso y una contraseña común para todos. Se muestra una previsualización antes de confirmar. La inserción es todo o nada (transacción MySQL): si hay un email duplicado u otro error, no se crea ningún usuario.

### Subida de curso

Un botón especial recorre todos los alumnos activos y los avanza automáticamente al siguiente curso de la lista. Los alumnos en `2º Bach` quedan desactivados.

### Exportación

Las páginas de Libros, Usuarios y Préstamos permiten exportar los datos visibles en pantalla a CSV o JSON desde un desplegable.

### Lightbox de portada

Al hacer clic en una fila de la tabla de libros se abre un modal con la foto de portada del libro en tamaño completo.

### Estanterías editables

Al renombrar una estantería desde el panel de Libros, todos los libros que tenían asignada esa estantería se actualizan automáticamente en la base de datos.

---

## Despliegue en producción

El servidor de producción es una VPS con Debian. El proceso general es:

1. **Subir cambios al servidor** vía SSH / `git pull`
2. **Compilar el cliente:**
   ```bash
   cd client && npm run build
   ```
3. **Reiniciar el servidor con PM2:**
   ```bash
   pm2 restart biblioteca-server
   ```
4. **Nginx** sirve el build de React para rutas del cliente y hace proxy de `/api` al puerto 3001.
5. **MariaDB** corre localmente en el servidor.

Para más detalles sobre la infraestructura del servidor (SSH, PM2, Nginx, pasos exactos de deploy) consultar la memoria del proyecto: `memory/project_server.md`.
