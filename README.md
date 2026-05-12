# Biblioteca Juan de Lanuza

Aplicación web para la gestión de la biblioteca del Colegio Juan de Lanuza. Catálogo público de libros, gestión de préstamos, usuarios, actividades y estadísticas de uso.

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

| Paquete            | Uso                             |
| ------------------ | ------------------------------- |
| Node.js + Express  | Servidor HTTP                   |
| mysql2             | Conexión a base de datos        |
| jsonwebtoken       | Autenticación JWT               |
| bcryptjs           | Hash de contraseñas             |
| multer             | Subida de fotos                 |
| nodemailer         | Envío de emails                 |
| node-cron          | Tareas programadas              |
| helmet             | Cabeceras de seguridad HTTP     |
| express-rate-limit | Limitación de intentos de login |
| dotenv             | Variables de entorno            |

---

## Arquitectura

```
┌─────────────────────────────────────────────┐
│              Navegador (React)              │
│         http://localhost:5173 (dev)         │
│    https://biblioteca.juandelanuza.local    │
└──────────────────┬──────────────────────────┘
                   │ HTTP / HTTPS
┌──────────────────▼──────────────────────────┐
│             Nginx (producción)              │
│  /        → build de React                  │
│  /api     → proxy a Express :3001           │
│  /uploads → archivos estáticos (fotos)      │
└──────────┬──────────────────────────────────┘
           │
┌──────────▼──────────────────────────────────┐
│         Servidor Express (Node.js)          │
│           http://localhost:3001             │
│         Gestionado con PM2                  │
└──────────┬──────────────────────────────────┘
           │
┌──────────▼──────────────────────────────────┐
│               MariaDB                       │
│       base de datos: biblioteca_lanuza      │
└─────────────────────────────────────────────┘
```

---

## Estructura de carpetas

```
biblioteca_lanuza/
├── client/
│   ├── public/
│   │   ├── fonts/Essai.ttf
│   │   ├── login-bg.jpg
│   │   └── portada-default.png
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── components/
│       │   ├── EtiquetasImpresion.jsx
│       │   ├── Footer.jsx
│       │   ├── LibroCard.jsx
│       │   ├── PrivateRoute.jsx
│       │   ├── Sidebar.jsx
│       │   └── Toast.jsx
│       ├── context/
│       │   └── AuthContext.jsx
│       ├── pages/
│       │   ├── Actividades.jsx
│       │   ├── Catalogo.jsx
│       │   ├── Dashboard.jsx
│       │   ├── Estadisticas.jsx
│       │   ├── LibroDetalle.jsx
│       │   ├── Libros.jsx
│       │   ├── Login.jsx
│       │   ├── MiEspacio.jsx
│       │   ├── OlvidePassword.jsx
│       │   ├── Prestamos.jsx
│       │   ├── Register.jsx
│       │   ├── Registro.jsx
│       │   ├── ResetPassword.jsx
│       │   └── Usuarios.jsx
│       ├── services/
│       │   └── api.js
│       └── utils/
│           ├── csv.js
│           └── dates.js
│
├── server/
│   ├── uploads/
│   │   ├── fotos_portadas/
│   │   └── fotos_actividades/
│   └── src/
│       ├── index.js
│       ├── db.js
│       ├── controllers/
│       │   ├── actividadesController.js
│       │   ├── authController.js
│       │   ├── configController.js
│       │   ├── estadisticasController.js
│       │   ├── estanteriasController.js
│       │   ├── librosController.js
│       │   ├── passwordResetController.js
│       │   ├── prestamosController.js
│       │   ├── registroController.js
│       │   └── usuariosController.js
│       ├── jobs/
│       │   └── recordatorios.js
│       ├── middleware/
│       │   ├── auth.js
│       │   └── isPersonal.js
│       ├── routes/
│       │   ├── actividades.js
│       │   ├── auth.js
│       │   ├── config.js
│       │   ├── estadisticas.js
│       │   ├── estanterias.js
│       │   ├── libros.js
│       │   ├── prestamos.js
│       │   ├── registro.js
│       │   └── usuarios.js
│       └── services/
│           └── mailer.js
│
└── database/
```

---

## Instalación en local

### Requisitos

- Node.js 18+
- MySQL / MariaDB
- XAMPP (recomendado para desarrollo)

### 1. Clonar

```bash
git clone https://github.com/jxrgxx/biblioteca_lanuza.git
cd biblioteca_lanuza
```

### 2. Base de datos

1. Arrancar XAMPP (Apache + MySQL)
2. Abrir phpMyAdmin → crear base de datos `biblioteca_lanuza`
3. Importar el esquema desde `database/`

### 3. Servidor

```bash
cd server
cp .env.example .env   # completar con las credenciales
npm install
npm run dev            # puerto 3001
```

### 4. Cliente

```bash
cd client
npm install
npm run dev            # puerto 5173
```

---

## Variables de entorno

`server/.env`:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=biblioteca_lanuza

JWT_SECRET=

PORT=3001
CLIENT_URL=http://localhost:5173

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=correo@juandelanuza.org
SMTP_PASS=
SMTP_FROM=correo@juandelanuza.org
```

`SMTP_PASS` debe ser una contraseña de aplicación de Gmail (no la contraseña de la cuenta).

---

## Sistema de roles

| Rol           | Acceso                              |
| ------------- | ----------------------------------- |
| `alumno`      | Catálogo público, Mi espacio        |
| `profesorado` | Todo lo anterior + panel de gestión |
| `personal`    | Todo lo anterior + panel de gestión |
| `biblioteca`  | Todo lo anterior + panel de gestión |

Los roles `profesorado` y `personal` requieren un código de registro al crear la cuenta. El rol `biblioteca` solo se puede asignar a usuarios que ya sean `personal` o `profesorado`.

---

## Rutas del cliente

### Públicas

| Ruta                     | Página           | Descripción                          |
| ------------------------ | ---------------- | ------------------------------------ |
| `/`                      | `Catalogo`       | Catálogo con buscador y filtros      |
| `/libros/:id`            | `LibroDetalle`   | Detalle y QR de un libro             |
| `/login`                 | `Login`          | Inicio de sesión                     |
| `/register`              | `Register`       | Crear cuenta                         |
| `/olvide-password`       | `OlvidePassword` | Solicitar recuperación de contraseña |
| `/reset-password?token=` | `ResetPassword`  | Restablecer contraseña               |

### Protegidas — rol biblioteca

| Ruta            | Página         | Descripción                      |
| --------------- | -------------- | -------------------------------- |
| `/dashboard`    | `Dashboard`    | Resumen con métricas             |
| `/libros`       | `Libros`       | Gestión de libros y estanterías  |
| `/prestamos`    | `Prestamos`    | Gestión de préstamos             |
| `/usuarios`     | `Usuarios`     | Gestión de usuarios              |
| `/registro`     | `Registro`     | Registro de visitas diarias      |
| `/estadisticas` | `Estadisticas` | Gráficas y estadísticas          |
| `/actividades`  | `Actividades`  | Gestión de actividades con fotos |

### Protegidas — cualquier usuario autenticado

| Ruta          | Página      | Descripción               |
| ------------- | ----------- | ------------------------- |
| `/mi-espacio` | `MiEspacio` | Perfil propio y préstamos |

---

## API REST

Todos los endpoints van prefijados con `/api`.

### Autenticación — `/api/auth`

| Método | Ruta                | Auth | Descripción                      |
| ------ | ------------------- | ---- | -------------------------------- |
| POST   | `/register`         | No   | Registrar usuario                |
| POST   | `/login`            | No   | Login, devuelve JWT              |
| GET    | `/perfil`           | Sí   | Datos del usuario autenticado    |
| PUT    | `/cambiar-password` | Sí   | Cambiar contraseña               |
| POST   | `/forgot-password`  | No   | Solicitar email de recuperación  |
| POST   | `/reset-password`   | No   | Restablecer contraseña con token |

El endpoint `/login` tiene rate limit: 20 peticiones por IP cada 15 minutos.

### Libros — `/api/libros`

| Método | Ruta                   | Auth       | Descripción                                                                                          |
| ------ | ---------------------- | ---------- | ---------------------------------------------------------------------------------------------------- |
| GET    | `/`                    | No         | Listar con filtros (`search`, `estado`, `genero`, `idioma`, `editorial`, `estanteria`, `etiquetado`) |
| GET    | `/filtros/generos`     | No         | Géneros disponibles                                                                                  |
| GET    | `/filtros/idiomas`     | No         | Idiomas disponibles                                                                                  |
| GET    | `/filtros/editoriales` | No         | Editoriales disponibles                                                                              |
| GET    | `/filtros/estanterias` | No         | Estanterías disponibles                                                                              |
| GET    | `/:id`                 | No         | Detalle de un libro                                                                                  |
| POST   | `/`                    | Biblioteca | Crear libro (genera código `L_N`)                                                                    |
| PUT    | `/:id`                 | Biblioteca | Editar libro                                                                                         |
| DELETE | `/:id`                 | Biblioteca | Eliminar (falla si tiene préstamos activos)                                                          |
| POST   | `/:id/foto`            | Biblioteca | Subir foto de portada                                                                                |
| POST   | `/importar`            | Biblioteca | Importar libros desde CSV                                                                            |
| POST   | `/marcar-etiquetado`   | Biblioteca | Marcar libros como etiquetados                                                                       |
| POST   | `/eliminar-multiple`   | Biblioteca | Eliminar varios libros                                                                               |

### Préstamos — `/api/prestamos`

| Método | Ruta                 | Auth       | Descripción                       |
| ------ | -------------------- | ---------- | --------------------------------- |
| GET    | `/`                  | Biblioteca | Listar todos                      |
| GET    | `/mis`               | Sí         | Préstamos del usuario autenticado |
| GET    | `/:id`               | Biblioteca | Detalle                           |
| POST   | `/`                  | Biblioteca | Crear préstamo individual         |
| POST   | `/lote`              | Biblioteca | Crear préstamos en lote           |
| PUT    | `/:id/devolver`      | Biblioteca | Registrar devolución              |
| PUT    | `/:id`               | Biblioteca | Editar préstamo                   |
| DELETE | `/:id`               | Biblioteca | Eliminar préstamo                 |
| POST   | `/eliminar-multiple` | Biblioteca | Eliminar varios préstamos         |

### Usuarios — `/api/usuarios`

| Método | Ruta                   | Auth       | Descripción                                 |
| ------ | ---------------------- | ---------- | ------------------------------------------- |
| GET    | `/`                    | Biblioteca | Listar todos                                |
| GET    | `/:id`                 | Biblioteca | Detalle                                     |
| GET    | `/:id/prestamos-count` | Biblioteca | Número de préstamos del usuario             |
| POST   | `/`                    | Biblioteca | Crear usuario (genera código `U_N`)         |
| POST   | `/importar`            | Biblioteca | Importar desde CSV                          |
| POST   | `/subida-de-curso`     | Biblioteca | Avanzar curso a todos los alumnos           |
| POST   | `/eliminar-multiple`   | Biblioteca | Eliminar varios usuarios                    |
| PUT    | `/:id`                 | Biblioteca | Editar usuario                              |
| PATCH  | `/:id/activo`          | Biblioteca | Activar / desactivar                        |
| DELETE | `/:id`                 | Biblioteca | Eliminar (falla si tiene préstamos activos) |

### Actividades — `/api/actividades`

| Método | Ruta                 | Auth       | Descripción                    |
| ------ | -------------------- | ---------- | ------------------------------ |
| GET    | `/`                  | Biblioteca | Listar (filtrable por fecha)   |
| GET    | `/enums`             | Biblioteca | Tipos disponibles              |
| GET    | `/:id`               | Biblioteca | Detalle con fotos              |
| POST   | `/`                  | Biblioteca | Crear actividad                |
| PUT    | `/:id`               | Biblioteca | Editar actividad               |
| DELETE | `/:id`               | Biblioteca | Eliminar actividad y sus fotos |
| POST   | `/:id/fotos`         | Biblioteca | Subir foto                     |
| DELETE | `/:id/fotos/:fotoId` | Biblioteca | Eliminar foto                  |

### Estanterías — `/api/estanterias`

| Método | Ruta   | Auth       | Descripción                                      |
| ------ | ------ | ---------- | ------------------------------------------------ |
| GET    | `/`    | Sí         | Listar todas                                     |
| POST   | `/`    | Biblioteca | Crear                                            |
| PUT    | `/:id` | Biblioteca | Renombrar (actualiza todos los libros afectados) |
| DELETE | `/:id` | Biblioteca | Eliminar                                         |

### Registro de visitas — `/api/registro`

| Método | Ruta   | Auth       | Descripción                  |
| ------ | ------ | ---------- | ---------------------------- |
| GET    | `/`    | Biblioteca | Listar (filtrable por fecha) |
| POST   | `/`    | Biblioteca | Crear entrada                |
| PUT    | `/:id` | Biblioteca | Editar                       |
| DELETE | `/:id` | Biblioteca | Eliminar                     |

### Estadísticas — `/api/estadisticas`

Todos requieren rol biblioteca.

| Ruta                      | Descripción                       |
| ------------------------- | --------------------------------- |
| `/resumen`                | Totales generales                 |
| `/libros-top`             | Libros más prestados              |
| `/alumnos-top`            | Alumnos con más préstamos         |
| `/prestamos-por-mes`      | Préstamos agrupados por mes       |
| `/prestamos-por-curso`    | Préstamos por curso               |
| `/libros-nunca-prestados` | Libros sin ningún préstamo        |
| `/tasa-devolucion`        | % devoluciones a tiempo vs. tarde |
| `/tiempo-medio`           | Duración media de préstamo        |
| `/alumnos-morosos`        | Alumnos con préstamos vencidos    |
| `/registro-por-mes`       | Visitas agrupadas por mes         |
| `/cursos-top`             | Cursos con más visitas            |
| `/dia-semana`             | Visitas por día de la semana      |

### Configuración — `/api/config`

| Método | Ruta               | Auth       | Descripción                |
| ------ | ------------------ | ---------- | -------------------------- |
| GET    | `/codigo-registro` | Biblioteca | Obtener código de registro |
| POST   | `/codigo-registro` | Biblioteca | Generar nuevo código       |

---

## Base de datos

**`usuario`**

```
id, codigo (U_N), nombre, apellidos, email, password,
rol, ubicacion, activo, fecha_alta, fecha_baja
```

**`libro`**

```
id, codigo (L_N), titulo, autor, editorial, volumen,
idioma, genero, categoria, estanteria, estado, nombre_foto, etiquetado
```

**`prestamo`**

```
id, codigo (6 chars), id_usuario, id_libro, codigo_lote,
fecha_inicio, fecha_devolucion_prevista, fecha_devolucion_real,
devuelto, created_at
```

**`actividad`**

```
id, nombre, fecha, tipo, subtipo, idioma, duracion,
destinatario, curso_destinatario, objetivos, reflexiones
```

**`actividad_foto`**

```
id, id_actividad, nombre_foto
```

**`estanteria`**

```
id, nombre
```

**`registro`**

```
id, nombre, codigo_usuario, curso, fecha
```

**`recordatorio`**

```
id, id_prestamo, codigo_lote, enviar_en, enviado, created_at
```

**`password_reset`**

```
id, id_usuario, token, expires_at, usado, created_at
```

**`config`**

```
clave, valor
```

### Estados de un libro

| Estado          | Descripción              |
| --------------- | ------------------------ |
| `disponible`    | Se puede prestar         |
| `prestado`      | Tiene un préstamo activo |
| `extraviado`    | Libro perdido            |
| `no disponible` | Retirado temporalmente   |

---

## Funcionalidades destacadas

**Recordatorios automáticos** — Un cron cada 5 minutos revisa la tabla `recordatorio` y envía emails a los usuarios el día anterior a la fecha de devolución prevista (a las 16:45).

**Importación masiva** — Libros y usuarios se pueden importar desde CSV. Se muestra previsualización antes de confirmar. La inserción es todo o nada (transacción MySQL).

**Selección múltiple** — En Libros, Préstamos y Usuarios se pueden seleccionar varios registros con click, shift+click o seleccionar todo, para eliminarlos en lote. Si alguno falla, no se elimina ninguno.

**Etiquetas QR** — Desde la página de Libros se pueden seleccionar hasta 32 libros e imprimir sus etiquetas QR en formato A4 (4 columnas × 8 filas, 52.5 × 37 mm). El sistema lleva registro de qué libros ya han sido etiquetados.

**Subida de curso** — Avanza automáticamente el curso de todos los alumnos activos. Los alumnos de 2º Bach quedan desactivados.

**Recuperación de contraseña** — Flujo completo por email con token de un solo uso y validez de 1 hora.
