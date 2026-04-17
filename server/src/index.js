const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api/auth", require("./routes/auth"));
app.use("/api/libros", require("./routes/libros"));
app.use("/api/usuarios", require("./routes/usuarios"));
app.use("/api/prestamos", require("./routes/prestamos"));
app.use("/api/registro", require("./routes/registro"));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () =>
  console.log(`Servidor corriendo en http://localhost:${PORT}`),
);
