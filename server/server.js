/***************************/
/*-------- IMPORTS --------*/
/***************************/
const express = require("express");
const fileUpload = require('express-fileupload')
const http = require("http");
const path = require("path");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const util = require("util");
const helmet = require("helmet");

const mongoose = require("mongoose");

const { PRODUCCION, PORT_APP, MONGO_URL, DB_MONGO } = require("./config/env");

/***************************/
/*----- CONFIG SERVER -----*/
/***************************/
const app = express();
app.use(fileUpload())
let server = http.createServer(app);

/***************************/
/*----- CONFIG LOG -----*/
/***************************/

const log_file_err = fs.createWriteStream(__dirname + "/error.log", {
  flags: "a",
});

if (PRODUCCION) {
  process.on("uncaughtException", function (err) {
    log_file_err.write(util.format(new Date() + " - Exception: " + err) + "\n");
  });
  process.on("unhandledRejection", function (err) {
    log_file_err.write(util.format(new Date() + " - Rejection: " + err) + "\n");
  });
  process.on("warning", function (err) {
    log_file_err.write(
      util.format(new Date() + " - Warning: " + err.message) + "\n"
    );
  });
}

/***************************/
/*------ ENABLE CORS ------*/
/***************************/
app.use(cors({ exposedHeaders: "Filename" }));

/***************************/
/*------ ENABLE HELMET ------*/
/***************************/
// app.use(helmet());

/***************************/
/*- ENABLE FOLDER PUBLIC  -*/
/***************************/
const publicPath = path.resolve(__dirname, "../src");
app.use('/api/static', express.static(publicPath));

/***************************/
/*----- BODY PARSER -------*/
/***************************/
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

/***************************/
/*--------- ROUTES --------*/
/***************************/
// CARPETA DE IMAGENES TOUR
// const uploadDir = path.join(__dirname, '../src/imagenes_tour');
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir);
//   console.log(`Carpeta creada: ${uploadDir}`);
// } else {
//   console.log(`Carpeta existente: ${uploadDir}`);
// }

app.use(require("./routes/index"));

/***************************/
/*----- START SERVER ------*/
/***************************/

app.disable("x-powered-by");


server.listen(PORT_APP, (err) => {
  if (err) {
    console.log(err);
    return;
  }

  console.log(`Servidor corriendo en puerto ${PORT_APP}`);
});

server.timeout = 6000000;
