const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { verificarConexion } = require('./services/mailer');
const { iniciarCron }       = require('./jobs/recordatorios');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const loginLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Demasiados intentos. Espera 15 minutos.' },
});

app.use('/api/auth/login', loginLimit);
app.use('/api/auth', require('./routes/auth'));
app.use('/api/libros', require('./routes/libros'));
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/prestamos', require('./routes/prestamos'));
app.use('/api/registro', require('./routes/registro'));
app.use('/api/config', require('./routes/config'));
app.use('/api/estanterias', require('./routes/estanterias'));
app.use('/api/estadisticas', require('./routes/estadisticas'));

const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  await verificarConexion(); // comprueba SMTP al arrancar (no bloquea si falla)
  iniciarCron();             // activa el cron de recordatorios diarios
});
