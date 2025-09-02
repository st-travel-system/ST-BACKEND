const express = require("express");
const app = express();

// const multer = require("multer");
// const upload = multer();

const ReportesController = require("../controllers/reportesController/index");

app.get("/api/reportes_vendedor/:usuario", (req, res) => {
	ReportesController.reportes_vendedor(req, res);
});
app.get("/api/reportes_admin", (req, res) => {
	ReportesController.reportes_admin(req, res);
});
app.get("/api/reportes_admin_estadisticas", (req, res) => {
	ReportesController.reportes_admin_estadisticas(req, res);
});


module.exports = app;
