const express = require("express");

const app = express();

const path = require("path");

/***************************/
/*----- MIDDLEWARES -------*/
/***************************/
const { verificaToken } = require("../middlewares/auth");

// app.use(verificaToken);

app.use((req, res, next) => {
  res.setHeader("Cache-Control", "public, no-cache");
  res.setHeader("X-Content-Type-Options", "nosniff");
  next();
});

/***************************/
/*--------- ROUTES --------*/
/***************************/

app.use(require("./tours"));
// app.use(require("./reportes"));

module.exports = app;
