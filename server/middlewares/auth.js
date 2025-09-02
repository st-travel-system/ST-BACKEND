const jwt = require("jsonwebtoken");

const { SEED } = require("../config/env");

const rolesValidos = [
  "ADMIN",
  "EMPRESA",
  "EMPLEADO",
];

// =====================
// Verificar Token
// =====================
let verificaToken = (req, res, next) => {
  let token = false;

  switch (req._parsedUrl.pathname) {
    case "/api/login":
      next();
      return;

    default:
      token = req.get("token") || req.query.token;
      break;
  }

  if (token) token = token.split("Bearer ").join("");

  jwt.verify(token, SEED, async (err, decoded) => {
    if (err) {
      return res.status(401).json({
        ok: false,
        contenido: { error: true },
      });
    }

    if(!rolesValidos.includes(decoded.rol)) {
      return res.status(401).json({
        ok: false,
        contenido: { error: true },
      });
    }

    req.usuario = { id: decoded.usuarioID, rol: decoded.rol };
    next();
  });
};

let verificaRole = (roles) => {
  return (req, res, next) => {
    if(!req.usuario || !roles.includes(req.usuario.rol)) {
      return res.status(401).json({
        ok: false,
        contenido: { error: "NO TIENES PERMISOS" },
      });
    }

    next();
  }
};

module.exports = {
  verificaToken,
  verificaRole
};
