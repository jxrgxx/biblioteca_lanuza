const db = require('../db');

const generarCodigo = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

exports.getCodigo = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT valor FROM config WHERE clave = 'codigo_registro'"
    );
    res.json({ codigo: rows[0]?.valor || '' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.generarCodigo = async (req, res) => {
  try {
    const nuevo = generarCodigo();
    await db.query(
      "UPDATE config SET valor = ? WHERE clave = 'codigo_registro'",
      [nuevo]
    );
    res.json({ codigo: nuevo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
