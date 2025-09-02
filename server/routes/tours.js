const express = require("express");
const app = express();
const fs = require('fs');
const path = require('path');

const ToursController = require("../controllers/toursController/index");

app.get("/api/obtener_tours_surland", (req, res) => {
	ToursController.obtenerToursSurland(req, res);
});
app.get("/api/obtener_info_tours_surland", (req, res) => {
	ToursController.obtenerInfoToursSurland(req, res);
});
app.get("/api/obtener_tours_base", (req, res) => {
	ToursController.obtenerToursBase(req, res);
});
// app.get("/api/obtener_tours_publicados", (req, res) => {
// 	ToursController.obtenerTourPublicados(req, res);
// });

app.get("/api/obtener_tours_publicados/:page/:limit", (req, res) => {
    const { page , limit  } = req.params; // Parámetros de paginación
	const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 10;
    ToursController.obtenerTourPublicados(req, res,pageNumber, limitNumber);
});


app.get("/api/obtener_opciones_tours/:identificador", (req, res) => {
	ToursController.obtenerOpcionesTours(req, res);
});
app.get("/api/obtener_categorias_precios_tours/:identificador", (req, res) => {
	ToursController.obtenerCategoriasPreciosTours(req, res);
});
app.get("/api/obtener_tours_publicados_categoria/:categoria", (req, res) => {
	ToursController.obtenerTourPublicadosCategoria(req, res);
});
app.get("/api/obtener_tour_publicado/:id_tour", (req, res) => {
	ToursController.obtenerTourPublicado(req, res);
});
app.get("/api/obtener_info_adicional_tour/:id_tour", (req, res) => {
	ToursController.obtenerInfoAdicionalTour(req, res);
});
app.post("/api/subir_imagen_portada/:id_tour", (req, res) => {
	ToursController.subirImagenPortada(req, res);
});
app.post("/api/subir_imagenes_galeria/:id_tour", (req, res) => {
	ToursController.subirGaleriaFotos(req, res);
});

// Ruta para actualizar la foto principal del tour
app.post("/api/actualizar_foto_principal/:id_tour", (req, res) => {
	ToursController.actualizarFotoPrincipal(req, res);
  });
  

app.delete("/api/eliminar_foto/:id_tour/:foto", (req, res) => {
    ToursController.eliminarFotoGaleria(req, res);
});

app.post("/api/publicar_tour/:id_tour/:publicado", (req, res) => {
	ToursController.publicarTour(req, res);
});


app.get("/api/obtener_tours_recomendados/:region", (req, res) => {
	ToursController.obtenerToursRecomendados(req, res);
});


const directorioImagenes = path.join(__dirname, '../../src/fotos_galeria');

app.use('/fotos_galeria', express.static(directorioImagenes));

 app.get('/api/mostrar_imagen_tour/:id/:ruta', (req, res) => {
  
	const idImagen = req.params.id;
	const rutaImagen = req.params.ruta;
	
	// Ruta relativa de la imagen dentro del directorio de imágenes
	// Enviar la etiqueta de imagen con la ruta src
	res.send(`<img src="/fotos_galeria/${idImagen}/${rutaImagen}" alt="Imagen">`);
  });



// DESCRIPCION HOTELES
app.post("/api/actualizar_descripcion_hotel/:id_descripcion/:id_tour", (req, res) => {
	ToursController.actualizarDescripcionHotel(req, res);
});



// NUEVA FOTO PRUEBA AWS
app.post("/api/publicar_foto_aws/:id_tour", (req, res) => {
	ToursController.publicarFotoPruebaAws(req, res);
});

// Ruta para subir los filtros del archivo de Excel
app.post("/api/subir_filtros", (req, res) => {
    ToursController.subirFiltros(req, res);
});



app.get("/api/obtener_conversion", (req, res) => {
	ToursController.obtenerConversion(req, res);
});


module.exports = app;
