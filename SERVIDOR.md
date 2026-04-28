# Infraestructura del servidor — Biblioteca Juan de Lanuza

## Servidor

| Campo                    | Valor                          |
| ------------------------ | ------------------------------ |
| SO                       | Debian GNU/Linux 12 (Bookworm) |
| Hostname                 | `biblioteca`                   |
| IP local                 | `192.168.1.151`                |
| Usuario del sistema      | `sistemas`                     |
| Contraseña acceso y root | `bibi26`                       |

---

## Repositorio

| Campo               | Valor                                           |
| ------------------- | ----------------------------------------------- |
| Remoto              | https://github.com/jxrgxx/biblioteca_lanuza.git |
| Rama principal      | `main`                                          |
| Ruta en el servidor | `/var/www/biblioteca_lanuza/`                   |

---

## Node.js y PM2

| Campo              | Valor                                            |
| ------------------ | ------------------------------------------------ |
| Versión Node       | v20.20.2                                         |
| Versión npm        | 11.12.1                                          |
| Versión PM2        | 6.0.14                                           |
| Nombre del proceso | `biblioteca`                                     |
| Entry point        | `/var/www/biblioteca_lanuza/server/src/index.js` |
| Puerto interno     | `3001`                                           |

El proceso arranca con el usuario `root` y está configurado para sobrevivir reinicios del sistema mediante `pm2 save`.

Comandos útiles de PM2:

```bash
pm2 status                             # estado del proceso
pm2 logs biblioteca --lines 50         # últimas líneas de log
pm2 reload biblioteca                  # recarga sin cortar conexiones
pm2 restart biblioteca                 # reinicio completo
```

---

## Nginx

| Campo           | Valor                                        |
| --------------- | -------------------------------------------- |
| Versión         | instalada en `/usr/sbin/nginx`               |
| Config activa   | `/etc/nginx/sites-enabled/biblioteca_lanuza` |
| Puerto HTTP     | 80 → redirección permanente a HTTPS          |
| Puerto HTTPS    | 443 (SSL)                                    |
| Certificado SSL | `/etc/ssl/certs/biblioteca.crt`              |
| Clave SSL       | `/etc/ssl/private/biblioteca.key`            |

Comportamiento del servidor virtual:

| Ruta        | Qué hace                                                         |
| ----------- | ---------------------------------------------------------------- |
| `/`         | Sirve `/var/www/biblioteca_lanuza/client/dist/` como SPA (React) |
| `/api/`     | Proxy inverso → `http://localhost:3001`                          |
| `/uploads/` | Sirve `/var/www/biblioteca_lanuza/server/uploads/` directamente  |

Comandos útiles de nginx:

```bash
sudo systemctl status nginx
sudo nginx -t                # valida la configuración antes de recargar
sudo systemctl reload nginx
```

---

## Base de datos

| Campo                   | Valor                          |
| ----------------------- | ------------------------------ |
| Motor                   | MariaDB 10.11.14               |
| Puerto                  | 3306 (solo localhost)          |
| Base de datos           | `biblioteca_lanuza`            |
| Usuario de la app       | `biblioteca_user`              |
| Acceso desde el sistema | `sudo mysql biblioteca_lanuza` |

Tablas principales:

| Tabla        | Descripción                                                                               |
| ------------ | ----------------------------------------------------------------------------------------- |
| `usuario`    | Alumnos, profesorado y personal. Campo `codigo` tipo `U_XXXX`                             |
| `libro`      | Catálogo. Campo `codigo` tipo `L-XXXX`. Fotos en `uploads/`                               |
| `prestamo`   | Préstamos activos e histórico. Campo `codigo` alfanumérico de 6 caracteres (ej. `AB3K7M`) |
| `registro`   | Registro diario de visitas a la biblioteca. Campo `codigo_usuario`                        |
| `config`     | Configuración de la app (código de registro, etc.)                                        |
| `estanteria` | Estanterías del catálogo                                                                  |

---

## Variables de entorno del servidor

Archivo: `/var/www/biblioteca_lanuza/server/.env`
Este archivo **no está en git** y debe mantenerse manualmente en el servidor.

```
DB_HOST=localhost
DB_USER=biblioteca
DB_PASSWORD=***
DB_NAME=biblioteca_lanuza
JWT_SECRET=***              ← mismo valor siempre, cambiarlo invalida todos los tokens activos
PORT=3001
CLIENT_URL=https://192.168.1.151

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=biblioteca@juandelanuza.org
SMTP_PASS=***               ← App Password de Google (16 caracteres)
SMTP_FROM=biblioteca@juandelanuza.org
CRON_RECORDATORIOS=0 8 * * *
```

---

## Servicio de correo

El backend incluye un sistema de recordatorios automáticos por email.

| Campo            | Valor                                                             |
| ---------------- | ----------------------------------------------------------------- |
| Proveedor        | Google Workspace (`smtp.gmail.com:587`)                           |
| Cuenta remitente | `biblioteca@juandelanuza.org`                                     |
| Autenticación    | App Password (no la contraseña de la cuenta)                      |
| Horario          | Cada día a las **08:00** hora de Madrid                           |
| Función          | Envía un email a cada alumno cuyo préstamo vence al día siguiente |

La App Password se genera en:
`myaccount.google.com → Seguridad → Verificación en dos pasos → Contraseñas de aplicaciones`

Si la contraseña caduca o se revoca, basta con generar una nueva y actualizar `SMTP_PASS` en el `.env` y hacer `pm2 reload biblioteca`.

---

## Puertos abiertos

| Puerto | Protocolo | Servicio                    | Acceso         |
| ------ | --------- | --------------------------- | -------------- |
| 80     | TCP       | Nginx (redirección a HTTPS) | Red local      |
| 443    | TCP       | Nginx (HTTPS + proxy API)   | Red local      |
| 3001   | TCP       | Node.js API                 | Solo localhost |
| 3306   | TCP       | MariaDB                     | Solo localhost |

---

## Roles de usuario de la aplicación

| Rol           | Acceso                                             |
| ------------- | -------------------------------------------------- |
| `alumno`      | Mi espacio, catálogo, registro diario              |
| `profesorado` | Igual que alumno                                   |
| `personal`    | Todo lo anterior + gestión completa + estadísticas |

El registro de cuentas de `profesorado` y `personal` requiere un **código de registro** configurable desde el panel de administración (`/config`).
