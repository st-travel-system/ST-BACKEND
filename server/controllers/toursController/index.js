const TourModel = require("../../models/tour/index");


const mongoose = require("mongoose");

const jwt = require("jsonwebtoken");

const { SEED } = require("../../config/env");
const Dropbox = require('dropbox').Dropbox;
const fs = require('fs');
const path = require('path');
const fetch = require('isomorphic-fetch');  // Necesario para usar la API de Dropbox en Node.js
const dotenv=require('dotenv');
dotenv.config();

const axios = require('axios');
const xml2js = require('xml2js');
const xlsx = require('xlsx');
const { promisify } = require('util');
const parseStringAsync = promisify(xml2js.parseString);

const moment = require('moment-timezone');

const multer = require("multer");
const { v4: uuidv4 } = require('uuid');  // Para generar nombres aleatorios únicos
// Configuración de almacenamiento con Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
      cb(null, "fotos_portada/"); // Guardar archivos en la carpeta 'fotos_portada'
  },
  filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname)); // Nombre único
  }
});

// Filtro para validar que el archivo sea una imagen
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
      return cb(null, true);
  } else {
      return cb(new Error("Solo se permiten imágenes (JPG, PNG)"));
  }
};

// Configurar middleware de subida
const upload = multer({ 
  storage, 
  fileFilter, 
  limits: { fileSize: 5 * 1024 * 1024 } // Tamaño máximo de 5MB
}).single("imagen_portada");


const AWS = require('aws-sdk');

// Configura las credenciales de AWS (puedes usar variables de entorno o ponerlas directamente aquí, aunque no es recomendable para producción).
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

// Crea una instancia del servicio S3
const s3 = new AWS.S3();



class ToursController {
  constructor() { }

  registro = async (req, res) => {
    const body = req.body;
    const id = new mongoose.Types.ObjectId();
    const arreglo_datos = JSON.parse(body.datos);

    const directorio = `src/imagenes_vehiculo/` + id;

    // Verificar si el directorio ya existe, si no, crearlo
    if (!fs.existsSync(directorio)) {
        fs.mkdirSync(directorio, { recursive: true }, (err) => {
            if (err) console.error('Error al crear el directorio:', err);
        });
    }

    // Objeto para almacenar las fotos con claves específicas
    const fotos = {};

    // Función para procesar las imágenes
    const procesarImagen = (archivo, clave) => {
        if (archivo) {
            const extension = path.extname(archivo.name);
            const nuevoNombre = `${clave}_${id}${extension}`;
            const rutaCompleta = path.join(directorio, nuevoNombre);

            archivo.mv(rutaCompleta, (err) => {
                if (err) {
                    console.error(`Error al guardar la imagen ${clave}:`, err);
                } else {
                    console.log(`Imagen ${clave} guardada correctamente`);
                }
            });

            fotos[clave] = nuevoNombre; // Añadir la clave y la URL al objeto fotos
        } else {
            console.error(`No se recibió la imagen ${clave}`);
        }
    };

    // Procesar cada imagen con su clave específica
    procesarImagen(req.files?.frente, 'foto_frente');
    procesarImagen(req.files?.derecho, 'foto_derecho');
    procesarImagen(req.files?.izquierdo, 'foto_izquierdo');
    procesarImagen(req.files?.trasera, 'foto_trasera');
    procesarImagen(req.files?.motor, 'foto_motor');
    procesarImagen(req.files?.llantas, 'foto_llantas');
    procesarImagen(req.files?.tablero, 'foto_tablero');
    procesarImagen(req.files?.interiores, 'foto_interiores');

    // Crear el modelo con los datos y las fotos
    const data = new TourModel({
        _id: id.toString(),
        usuario: arreglo_datos.usuario,
        nombre: arreglo_datos.nombre,
        modelo: arreglo_datos.modelo,
        lote: arreglo_datos.lote,
        kilometraje: arreglo_datos.kilometraje,
        transmicion: arreglo_datos.transmicion,
        marca: arreglo_datos.marca,
        anio: arreglo_datos.anio,
        ubicacion: arreglo_datos.ubicacion,
        descripcion: arreglo_datos.descripcion,
        precio: arreglo_datos.precio,
        estado: 0,
        validado: 0,
        fotos, // Guardar el objeto fotos en el modelo
        fecha_creacion: moment().tz("America/Mexico_City").toDate(),
    });

    try {
        await data.save();
        return res.json({ ok: true });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ ok: false, error: 'Error al registrar el vehículo' });
    }
};


   subirImagenPortada = (req, res) => {

    const { id_tour } = req.params;
  
    if (!id_tour) {
        return res.status(400).json({ ok: false, mensaje: "ID del tour es requerido" });
    }

    const directorio = `src/fotos_portada/` + id_tour;

    // Verificar si el directorio ya existe, si no, crearlo
    if (!fs.existsSync(directorio)) {
        fs.mkdirSync(directorio, { recursive: true }, (err) => {
            if (err) console.error('Error al crear el directorio:', err);
        });
    }

    const fotos = {};

    // Función para procesar las imágenes
    const procesarImagen = (archivo, clave) => {
      if (archivo) {
          const extension = path.extname(archivo.name);
          const nuevoNombre = `${clave}_${id_tour}${extension}`;
          const rutaCompleta = path.join(directorio, nuevoNombre);

          archivo.mv(rutaCompleta, (err) => {
              if (err) {
                  console.error(`Error al guardar la imagen ${clave}:`, err);
              } else {
                  console.log(`Imagen ${clave} guardada correctamente`);
              }
          });

          fotos[clave] = nuevoNombre; // Añadir la clave y la URL al objeto fotos
      } else {
          console.error(`No se recibió la imagen ${clave}`);
      }


  };

  // Procesar cada imagen con su clave específica
  procesarImagen(req.files?.foto_portada, 'foto_portada');
 
       try {
            const actualizado = TourModel.actualizarFotoPortada(id_tour, fotos.foto_portada);
  
            if (actualizado) {
                res.json({ ok: true, mensaje: "Imagen subida y actualizada correctamente", ruta: fotos.foto_portada });
            } else {
                res.status(400).json({ ok: false, mensaje: "No se encontró el tour y no se actualizo" });
            }
        } catch (error) {
            res.status(500).json({ ok: false, mensaje: "Error al actualizar en la base de datos", error });
        }
  };


//  subirGaleriaFotos = async (req, res) => { 
//     const { id_tour } = req.params;
    
//     if (!id_tour) {
//         return res.status(400).json({ ok: false, mensaje: "ID del tour es requerido para esta solicitud" });
//     }

//     const directorio_base = `src/fotos_galeria/`;
//     if (!fs.existsSync(directorio_base)) {
//         fs.mkdirSync(directorio_base, { recursive: true });
//     }
    
//     const directorio = `src/fotos_galeria/` + id_tour;
//     if (!fs.existsSync(directorio)) {
//         fs.mkdirSync(directorio, { recursive: true });
//     }
    
//     if (!req.files || Object.keys(req.files).length === 0) {
//         return res.status(400).json({ ok: false, mensaje: "No se enviaron imágenes" });
//     }
    
//     const fotos = [];
//     const archivos = Array.isArray(req.files.fotos) ? req.files.fotos : [req.files.fotos];
    
//     for (let i = 0; i < Math.min(archivos.length, 5); i++) {
//         const archivo = archivos[i];
//         const extension = path.extname(archivo.name);
//         const nuevoNombre = `galeria_${i + 1}_${id_tour}${extension}`;
//         const rutaCompleta = path.join(directorio, nuevoNombre);

//         try {
//             await archivo.mv(rutaCompleta);
//             fotos.push(nuevoNombre);
//         } catch (err) {
//             console.error(`Error al guardar la imagen ${nuevoNombre}:`, err);
//             return res.status(500).json({ ok: false, mensaje: "Error al guardar las imágenes" });
//         }
//     }
    
//     try {
//         // Verificar si ya existe un registro de fotos para este tour
//         const fotosExistentes = await TourModel.obtenerFotosPorIdTour(id_tour);

//         if (fotosExistentes) {
//             // Si ya existe un registro, agregar las nuevas fotos a las existentes
//             const fotosActualizadas = [...JSON.parse(fotosExistentes.fotos_galeria), ...fotos];
//             const actualizacionExitosa = await TourModel.actualizarFotosGaleria(id_tour, fotosActualizadas);
//             if (actualizacionExitosa) {
//                 res.json({ ok: true, mensaje: "Fotos actualizadas correctamente", fotos: fotosActualizadas });
//             } else {
//                 res.status(500).json({ ok: false, mensaje: "Error al actualizar las fotos en la base de datos" });
//             }
//         } else {
//             // Si no existe un registro, crear uno nuevo
//             const creacionExitosa = await TourModel.crearFotosGaleria(id_tour, fotos);
//             if (creacionExitosa) {
//                 res.json({ ok: true, mensaje: "Fotos guardadas correctamente", fotos });
//             } else {
//                 res.status(500).json({ ok: false, mensaje: "Error al crear las fotos en la base de datos" });
//             }
//         }
//     } catch (error) {
//         console.error("Error al procesar las fotos:", error);
//         res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
//     }
// };


// Crea una instancia de Dropbox con tu token de acceso

// subirGaleriaFotos = async (req, res) => {

//   const dbx = new Dropbox({ accessToken: 'sl.u.AFoD6OrUM92Z_ErKzPIPaQv3iQjQijycDCx2kpOotdn-JLf2rkZOnQg8CxWFdcFwhKd9LpFN6vy96N1lOnyztRlF2xbKaFkdokL3C-_4fL_Xq49_rELSktlQs29U0tQPd8WGGpcJlk2D_kBtFnlvLwKvEqtSzFi1MhLGQBjjAbYwA9QI6wYxCXCHIchK4uk135pqG-tZPLM4YA0fXHOueqTda5E9DluA24_P5Yhp_AsLpnqS4l3xxDOq7l87yRMhZJrmRv9I-nkksghgdYf7kOVLcOMj1W0YoFjp7G9ytLzR5f62cuN-F93_4WGjtw5cE2s7XkVKcYkpTvFu9n8hdZlSfbwz8ED3bPFrR9wCpS9-sSkRv9trVZGZo999F4B4CGyiOYcr4mvVpVhCmWItUtwTpbDwOsRvrezlVgYXj1zRXElRD_PvQ-f2NEzloXsOiXBq8vc_mrU91JSyrMMaFanUszAsn9RPmTA3aOokHZ_Roc0Z1el1sZ833wCfQfUfT77XUtzYjSMEBb_LBvO8QPrz1XKRYSdqzhTizoCPFNZ6ytR4tV3DhISoDXWtyKVrr9sDIQVxDINP2wv2eJDX3K0xjyjtUPgX-m6gpNCNiOvgP3YWkzRTZbTyMT4lKgnWLAz3-0UvKoCJ2X-8TyHS79TlldBt_Ngz6uizf-v7187VyVC71KbQMdfEcHI6f5BJZT3dhzosVTR5q4MJGR8o-ciQHuV7BfeA6ha90wDCRNsXMYUIQNNrqS65LYcLna-ISLb0poFMEFQ9TdL_nCk_1Te9wnNiCwYEegglxBk74_6UClSVy74Z7HnUbULi_qwvfVmOm-SM0qaXAi3_5A-EzpdOP-PGLdd83c4XkUBIUewreasSxlu6uPnG9IJsuos08CcVOk1DBlYCrh_6FyA5qf8z9HVKZl74g5qFH-ZAUzZGu_hrMU919TSLauj5d9nxyi2U-6MpxiXVDOvcoDRozLgtThHWY3LSfybvz6Tz1KoJt34owTBIz3ERMLv8KyepA1WnWY30gF29H5MxsUam1djLGNdF-ZRo1w-QakGIIJfr0Umf_34NnW8cohw3douG5EPYzQ2bOhUN7oFL_K4092906082Pzth6vgEyRtyHS8CLTwMoQ7H3Pk77N1ELBGU_OGKttxEZbxvoVrwXEf27oSinMxGo3FR2nQVL4lxDYNQoJOYCi-0Chfi6b9N9p_xhbzzB4ntevgF6Ghn6JE79Ry1GCBb6c1qWfkDuyzfZ5tpcG8gFDkrDG6kXgV827RiJ_UFrATwm9aTNyzM1ELrh8p6_oART2mvqc03KG5TB5ucALJCIZlFRxU-_zwa1U7O9HNPcByKiPeWdlGx9r5Lxw5NnbFVYdOjaEr9RzTtjuBEtQrZS7JTQpSOgrBpKmPuznaS_EZV_IaGURXZ_KYUffGFf7JrQE3iniwo68-MZChfSnUYKrKtdOzGJikyjcX0oVs', fetch: fetch });

//   const { id_tour } = req.params;
  
//   if (!id_tour) {
//       return res.status(400).json({ ok: false, mensaje: "ID del tour es requerido para esta solicitud" });
//   }

//   if (!req.files || Object.keys(req.files).length === 0) {
//       return res.status(400).json({ ok: false, mensaje: "No se enviaron imágenes" });
//   }

//   const fotos = [];
//   const archivos = Array.isArray(req.files.fotos) ? req.files.fotos : [req.files.fotos];

//   // Subir las fotos a Dropbox
//   for (let i = 0; i < Math.min(archivos.length, 5); i++) {
//       const archivo = archivos[i];
//       const extension = path.extname(archivo.name);
//       const nuevoNombre = `galeria_${i + 1}_${id_tour}${extension}`;
//       const fileBuffer = archivo.data;

//       try {
//           // Subir el archivo a Dropbox
//           const uploadResponse = await dbx.filesUpload({
//               path: `/fotos_tour/${nuevoNombre}`,  // Ruta en Dropbox
//               contents: fileBuffer
//           });

//           // Obtener el enlace compartido de la imagen subida
//           const sharedLinkResponse = await dbx.sharingCreateSharedLinkWithSettings({
//               path: uploadResponse.result.path_display
//           });

//           // Obtener la URL compartida pública
//           let urlCompleta = sharedLinkResponse.result.url;
//           // Reemplazar los parámetros no deseados
//           urlCompleta = urlCompleta.replace('?e=1', '?dl=1').replace('?dl=0', '?dl=1').split('?')[0] + '?dl=1';


//           // Guardar la URL completa y el nombre del archivo
//           fotos.push({ urlCompleta });

//       } catch (err) {
//           console.error(`Error al subir la imagen ${nuevoNombre}:`, err);
//           return res.status(500).json({ ok: false, mensaje: "Error al subir las imágenes a Dropbox" });
//       }
//   }

//   try {
//       // Verificar si ya existe un registro de fotos para este tour
//       const fotosExistentes = await TourModel.obtenerFotosPorIdTour(id_tour);

//       if (fotosExistentes) {
//           // Si ya existe un registro, agregar las nuevas fotos a las existentes
//           const fotosActualizadas = [...JSON.parse(fotosExistentes.fotos_galeria), ...fotos];
//           const actualizacionExitosa = await TourModel.actualizarFotosGaleria(id_tour, fotosActualizadas);
//           if (actualizacionExitosa) {
//               res.json({ ok: true, mensaje: "Fotos actualizadas correctamente", fotos: fotosActualizadas });
//           } else {
//               res.status(500).json({ ok: false, mensaje: "Error al actualizar las fotos en la base de datos" });
//           }
//       } else {
//           // Si no existe un registro, crear uno nuevo
//           const creacionExitosa = await TourModel.crearFotosGaleria(id_tour, fotos);
//           if (creacionExitosa) {
//               res.json({ ok: true, mensaje: "Fotos guardadas correctamente", fotos });
//           } else {
//               res.status(500).json({ ok: false, mensaje: "Error al crear las fotos en la base de datos" });
//           }
//       }
//   } catch (error) {
//       console.error("Error al procesar las fotos:", error);
//       res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
//   }
// };


// subirGaleriaFotos = async (req, res) => {
//   const { id_tour } = req.params;

//   if (!id_tour) {
//       return res.status(400).json({ ok: false, mensaje: "ID del tour es requerido para esta solicitud" });
//   }

//   if (!req.files || Object.keys(req.files).length === 0) {
//       return res.status(400).json({ ok: false, mensaje: "No se enviaron imágenes" });
//   }

//   const fotos = [];
//   const archivos = Array.isArray(req.files.fotos) ? req.files.fotos : [req.files.fotos];

//   // Subir las fotos a AWS S3
//   for (let i = 0; i < Math.min(archivos.length, 5); i++) {
//       const archivo = archivos[i];
//       const extension = path.extname(archivo.name);
//       const nuevoNombre = `galeria_${i + 1}_${id_tour}${extension}`;
//       const fileBuffer = archivo.data;

//       try {
//           // Subir archivo a S3
//           const params = {
//               Bucket: 'sttravelshop', // Nombre del bucket en S3
//               Key: nuevoNombre,       // Nombre que tendrá el archivo en S3
//               Body: fileBuffer,       // El contenido del archivo
//               ContentType: archivo.mimetype, // Tipo de contenido (ajústalo según el tipo de la imagen)
//               // ACL: 'public-read'      // Hacer el archivo público
//           };

//           const data = await s3.upload(params).promise();

//           // Guardar la URL completa de S3
//           fotos.push({ urlCompleta: data.Location });

//       } catch (err) {
//           console.error(`Error al subir la imagen ${nuevoNombre} a AWS S3:`, err);
//           return res.status(500).json({ ok: false, mensaje: "Error al subir las imágenes a AWS S3" });
//       }
//   }

//   try {
//       // Verificar si ya existe un registro de fotos para este tour
//       const fotosExistentes = await TourModel.obtenerFotosPorIdTour(id_tour);

//       if (fotosExistentes) {
//           // Si ya existe un registro, agregar las nuevas fotos a las existentes
//           const fotosActualizadas = [...JSON.parse(fotosExistentes.fotos_galeria), ...fotos];
//           const actualizacionExitosa = await TourModel.actualizarFotosGaleria(id_tour, fotosActualizadas);
//           if (actualizacionExitosa) {
//               res.json({ ok: true, mensaje: "Fotos actualizadas correctamente", fotos: fotosActualizadas });
//           } else {
//               res.status(500).json({ ok: false, mensaje: "Error al actualizar las fotos en la base de datos" });
//           }
//       } else {
//           // Si no existe un registro, crear uno nuevo
//           const creacionExitosa = await TourModel.crearFotosGaleria(id_tour, fotos);
//           if (creacionExitosa) {
//               res.json({ ok: true, mensaje: "Fotos guardadas correctamente", fotos });
//           } else {
//               res.status(500).json({ ok: false, mensaje: "Error al crear las fotos en la base de datos" });
//           }
//       }
//   } catch (error) {
//       console.error("Error al procesar las fotos:", error);
//       res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
//   }
// };


subirGaleriaFotos = async (req, res) => {
  const { id_tour } = req.params;

  if (!id_tour) {
    return res.status(400).json({ ok: false, mensaje: "ID del tour es requerido para esta solicitud" });
  }

  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).json({ ok: false, mensaje: "No se enviaron imágenes" });
  }

  const fotos = [];
  const archivos = Array.isArray(req.files.fotos) ? req.files.fotos : [req.files.fotos];

  // Subir las fotos a AWS S3
  for (let i = 0; i < Math.min(archivos.length, 5); i++) {
    const archivo = archivos[i];
    const extension = path.extname(archivo.name);  // Obtener la extensión de la imagen
    const nuevoNombre = `${uuidv4()}_${id_tour}${extension}`;  // Generar nombre único para cada imagen
    const fileBuffer = archivo.data;

    try {
      // Subir archivo a S3
      const params = {
        Bucket: process.env.AWS_S3_BUCKET, // Nombre del bucket en S3
        Key: nuevoNombre,       // Nombre único que tendrá el archivo en S3
        Body: fileBuffer,       // El contenido del archivo
        ContentType: archivo.mimetype, // Tipo de contenido (ajústalo según el tipo de la imagen)
      };

      const data = await s3.upload(params).promise();

      // Guardar la URL completa de S3
      fotos.push({ urlCompleta: data.Location });

    } catch (err) {
      console.error(`Error al subir la imagen ${nuevoNombre} a AWS S3:`, err);
      return res.status(500).json({ ok: false, mensaje: "Error al subir las imágenes a AWS S3" });
    }
  }

  try {
    // Verificar si ya existe un registro de fotos para este tour
    const fotosExistentes = await TourModel.obtenerFotosPorIdTour(id_tour);

    if (fotosExistentes) {
      // Si ya existe un registro, agregar las nuevas fotos a las existentes
      const fotosActualizadas = [...JSON.parse(fotosExistentes.fotos_galeria), ...fotos];
      const actualizacionExitosa = await TourModel.actualizarFotosGaleria(id_tour, fotosActualizadas);
      if (actualizacionExitosa) {
        res.json({ ok: true, mensaje: "Fotos actualizadas correctamente", fotos: fotosActualizadas });
      } else {
        res.status(500).json({ ok: false, mensaje: "Error al actualizar las fotos en la base de datos" });
      }
    } else {
      // Si no existe un registro, crear uno nuevo
      const creacionExitosa = await TourModel.crearFotosGaleria(id_tour, fotos);
      if (creacionExitosa) {
        res.json({ ok: true, mensaje: "Fotos guardadas correctamente", fotos });
      } else {
        res.status(500).json({ ok: false, mensaje: "Error al crear las fotos en la base de datos" });
      }
    }
  } catch (error) {
    console.error("Error al procesar las fotos:", error);
    res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};

// Controlador para actualizar la foto principal
actualizarFotoPrincipal = async (req, res) => {
  const { foto_principal } = req.body; // La URL de la foto seleccionada
  const { id_tour } = req.params; // El id_tour recibido en los parámetros de la URL

  try {
    const fotoActualizada = await TourModel.actualizarFotoPrincipal(id_tour, foto_principal);
    if (fotoActualizada) {
      res.json({ ok: true, mensaje: "Foto principal actualizada correctamente" });
    } else {
      res.status(500).json({ ok: false, mensaje: "Error al actualizar la foto principal" });
    }
  } catch (error) {
    console.error("Error al actualizar la foto principal:", error);
    res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  }
};




//  eliminarFotoGaleria = async (req, res) => {
//   const { id_tour, foto } = req.params;

//   if (!id_tour || !foto) {
//       return res.status(400).json({ ok: false, mensaje: "ID del tour y nombre de la foto son requeridos" });
//   }

//   const directorio = `src/fotos_galeria/${id_tour}`;
//   const fotoRuta = path.join(directorio, foto);

//   try {
//       // Verificar si la foto existe en el directorio
//       if (fs.existsSync(fotoRuta)) {
//           fs.unlinkSync(fotoRuta);  // Eliminar el archivo de la galería

//           // Obtener las fotos existentes de la base de datos
//           const fotosExistentes = await TourModel.obtenerFotosPorIdTour(id_tour);
//           if (fotosExistentes) {
//               // Asegurarse de que fotos_galeria sea un arreglo
//               let fotosGaleria = fotosExistentes.fotos_galeria;

//               // Si fotos_galeria es una cadena, convertirla a un arreglo (en caso de que esté almacenada como cadena)
//               if (typeof fotosGaleria === 'string') {
//                   fotosGaleria = JSON.parse(fotosGaleria);
//               }

//               // Eliminar la foto de la lista en la base de datos
//               const fotosActualizadas = fotosGaleria.filter(fotoNombre => fotoNombre !== foto);
//               const actualizacionExitosa = await TourModel.actualizarFotosGaleria(id_tour, fotosActualizadas);

//               if (actualizacionExitosa) {
//                   return res.json({ ok: true, mensaje: "Foto eliminada correctamente", fotos: fotosActualizadas });
//               } else {
//                   return res.status(500).json({ ok: false, mensaje: "Error al actualizar las fotos en la base de datos" });
//               }
//           } else {
//               return res.status(404).json({ ok: false, mensaje: "No se encontraron fotos para este tour" });
//           }
//       } else {
//           return res.status(404).json({ ok: false, mensaje: "La foto no existe en el sistema de archivos" });
//       }
//   } catch (err) {
//       console.error("Error al eliminar la foto:", err);
//       return res.status(500).json({ ok: false, mensaje: "Error al eliminar la foto" });
//   }
// };

 eliminarFotoGaleria = async (req, res) => {
  const { id_tour, foto } = req.params;

  if (!id_tour || !foto) {
      return res.status(400).json({ ok: false, mensaje: "ID del tour y nombre de la foto son requeridos" });
  }

  // Nombre del archivo en S3 (asumimos que la URL tiene el nombre de archivo y la ruta completa)
  const bucketName = process.env.AWS_S3_BUCKET;  // Nombre del bucket de S3
  const fotoNombre = foto.split('/').pop();  // Extraemos solo el nombre del archivo (sin la ruta completa)

  try {
    // Eliminar la foto de AWS S3
    const params = {
        Bucket: bucketName,
        Key: fotoNombre,
    };

    await s3.deleteObject(params).promise();  // Eliminar de S3

    // Obtener las fotos existentes de la base de datos
    const fotosExistentes = await TourModel.obtenerFotosPorIdTour(id_tour);

    if (fotosExistentes) {
        // Asegurarse de que fotos_galeria sea un arreglo
        let fotosGaleria = fotosExistentes.fotos_galeria;

        // Si fotos_galeria es una cadena, convertirla a un arreglo (en caso de que esté almacenada como cadena)
        if (typeof fotosGaleria === 'string') {
            fotosGaleria = JSON.parse(fotosGaleria);
        }

        // Eliminar la foto de la lista en la base de datos
        const fotosActualizadas = fotosGaleria.filter(foto => foto.urlCompleta !== `https://${bucketName}.s3.us-east-2.amazonaws.com/${fotoNombre}`);
        const actualizacionExitosa = await TourModel.actualizarFotosGaleria(id_tour, fotosActualizadas);

        if (actualizacionExitosa) {
            return res.json({ ok: true, mensaje: "Foto eliminada correctamente", fotos: fotosActualizadas });
        } else {
            return res.status(500).json({ ok: false, mensaje: "Error al actualizar las fotos en la base de datos" });
        }
    } else {
        return res.status(404).json({ ok: false, mensaje: "No se encontraron fotos para este tour" });
    }
  } catch (err) {
    console.error("Error al eliminar la foto:", err);
    return res.status(500).json({ ok: false, mensaje: "Error al eliminar la foto" });
  }
};


  publicarTour = async (req, res) => {
    const body = req.body;
     const { id_tour,publicado } = req.params;

     try {
      const publicacionExitosa = await TourModel.publicarTour(id_tour,publicado);
      if (publicacionExitosa) {
          res.json({ ok: true, mensaje: "Tour cambiado de estado correctamente" });
      } else {
          res.status(500).json({ ok: false, mensaje: "Error al publicar el tour" });
      }
     } catch (error) {
      console.error("Error en la actualización de la base de datos:", error);
      res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
     }
  }


  obtenerToursBase = async (req, res) => {
    const body = req.body;

     try {
      const toursPublicados = await TourModel.obtenerToursBase();
      const toursUnicos = Array.from(
        new Map(toursPublicados.map(tour => [tour.id_tour, tour])).values()
      );
      if (toursPublicados) {
          res.json({ ok: true, mensaje: "Tours Obtenidos Correctamente",toursUnicos });
      } else {
          res.status(500).json({ ok: false, mensaje: "Error al obtener el tours" });
      }
     } catch (error) {
      console.error("Error en la actualización de la base de datos:", error);
      res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
     }
  }
  // obtenerTourPublicados = async (req, res) => {
  //   const body = req.body;

  //    try {
  //     const publicados = 1;
  //     const toursPublicados = await TourModel.obtenerTourPublicados(publicados);
  //     const toursUnicos = Array.from(
  //       toursPublicados.reduce((map, tour) => {
  //         const existente = map.get(tour.id_tour);
  //         // Si no existe uno previo o el actual es más barato, lo agregamos
  //         if (!existente || tour.precio < existente.precio) {
  //           map.set(tour.id_tour, tour);
  //         }
  //         return map;
  //       }, new Map()).values()
  //     );
      
  //     if (toursPublicados) {
  //         res.json({ ok: true, mensaje: "Tours Obtenidos Correctamente",toursUnicos });
  //     } else {
  //         res.status(500).json({ ok: false, mensaje: "Error al obtener el tours" });
  //     }
  //    } catch (error) {
  //     console.error("Error en la actualización de la base de datos:", error);
  //     res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
  //    }
  // }
  obtenerTourPublicados = async (req, res,page, limit) => {
    // Recibir los parámetros de paginación
    // const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit; // Calcular el offset

    try {
        const publicados = 1;

        // Llamar al modelo con los parámetros de paginación
        const toursPublicados = await TourModel.obtenerTourPublicados(publicados, limit, offset);

        // Filtrar tours únicos según el precio más bajo
        const toursUnicos = Array.from(
            toursPublicados.reduce((map, tour) => {
                const existente = map.get(tour.id_tour);
                // Si no existe uno previo o el actual es más barato, lo agregamos
                if (!existente || tour.precio < existente.precio) {
                    map.set(tour.id_tour, tour);
                }
                return map;
            }, new Map()).values()
        );

        if (toursUnicos.length > 0) {
            // Obtener el total de tours para calcular el número de páginas
            const totalTours = await TourModel.obtenerTotalTours(publicados);
            const totalPages = Math.ceil(totalTours / limit); // Calcular total de páginas

            res.json({
                ok: true,
                mensaje: "Tours obtenidos correctamente",
                toursUnicos: toursUnicos,
                totalPages, // Páginas totales
                currentPage: page // Página actual
            });
        } else {
            res.status(404).json({ ok: false, mensaje: "No hay tours publicados" });
        }
    } catch (error) {
        console.error("Error al obtener tours:", error);
        res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
    }
}

  obtenerOpcionesTours = async (req, res) => {
    const body = req.body;
    const { identificador } = req.params;

     try {
      const opcionesTours = await TourModel.obtenerOpcionesTours(identificador);
      const nombresYIdsTours = opcionesTours ? opcionesTours.map(tour => ({
        id_tour: tour.id_tour,
        nombre_tour: tour.nombre_tour
    })) : [];

      if (opcionesTours) {
          res.json({ ok: true, mensaje: "Tours Obtenidos Correctamente",nombresYIdsTours });
      } else {
          res.status(500).json({ ok: false, mensaje: "Error al obtener opciones tours" });
      }
     } catch (error) {
      console.error("Error en la actualización de la base de datos:", error);
      res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
     }
  }

  obtenerCategoriasPreciosTours = async (req, res) => {
    const body = req.body;
    const { identificador } = req.params;

     try {
      const categoriasPrecios = await TourModel.obtenerCategoriasPreciosTours(identificador);
    //   const nombresYIdsTours = categoriasPrecios ? categoriasPrecios.map(tour => ({
    //     id_tour: tour.id_tour,
    //     nombre_tour: tour.nombre_tour
    // })) : [];

      if (categoriasPrecios) {
          res.json({ ok: true, mensaje: "Categoria Precios Tours Obtenidos Correctamente",categoriasPrecios });
      } else {
          res.status(500).json({ ok: false, mensaje: "Error al obtener opciones tours" });
      }
     } catch (error) {
      console.error("Error en la actualización de la base de datos:", error);
      res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
     }
  }

  obtenerTourPublicadosCategoria = async (req, res) => {
    const body = req.body;
    const { categoria } = req.params;

     try {
      const publicados = 1;
      const toursPublicadosCategoria = await TourModel.obtenerTourPublicadosCategoria(categoria);
      const toursUnicos = Array.from(
        new Map(toursPublicadosCategoria.map(tour => [tour.tour_code, tour])).values()
      );
      if (toursPublicadosCategoria) {
          res.json({ ok: true, mensaje: "Tours Obtenidos Correctamente",toursUnicos });
      } else {
          res.status(500).json({ ok: false, mensaje: "Error al obtener el tours" });
      }
     } catch (error) {
      console.error("Error en la actualización de la base de datos:", error);
      res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
     }
  }

  obtenerTourPublicado = async (req, res) => {
    const body = req.body;
    const { id_tour } = req.params;
     try {
        const toursPublicados = await TourModel.obtenerTourPublicado(id_tour);

        // Obtener los tours únicos por ID
       
        const tourUnico = Array.from(
          toursPublicados.reduce((map, tour) => {
            const existente = map.get(tour.id_tour);
            // Si no existe uno previo o el actual es más barato, lo agregamos
            if (!existente || tour.precio < existente.precio) {
              map.set(tour.id_tour, tour);
            }
            return map;
          }, new Map()).values()
        );
        
        
        // Extraer todas las fechas de inicio en un solo arreglo
        const fechasInicio = toursPublicados.map(tour => tour.fecha_inicio);
        
        // Agregar el arreglo de fechas al objeto `tourUnico`
        tourUnico.forEach(tour => {
          tour.fechas_inicio = fechasInicio;
        });
        
      
      if (toursPublicados) {
          res.json({ ok: true, mensaje: "Tour Obtenido Correctamente",tourUnico });
      } else {
          res.status(500).json({ ok: false, mensaje: "Error al obtener el tours" });
      }
     } catch (error) {
      console.error("Error en la actualización de la base de datos:", error);
      res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
     }
  }


  obtenerInfoAdicionalTour = async (req, res) => {
    const body = req.body;
    const { id_tour } = req.params;
     try {
      const descripciones = await TourModel.obtenerDescripcionesTour(id_tour);
      const itinerario = await TourModel.obtenerItinerarioTour(id_tour);
   
      if (descripciones && itinerario) {
          res.json({ ok: true, mensaje: "Información Adicional Obtenida Correctamente",descripciones,itinerario});
      } else {
          res.status(500).json({ ok: false, mensaje: "Error al obtener info tours" });
      }
     } catch (error) {
      console.error("Error en la actualización de la base de datos:", error);
      res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
     }
  }


 

  // obtenerToursSurland = async (req, res) => {
  //   try {
  //     const url = 'http://xmlserverproduccion.surland.com/OfiTourServerPaquetesSurland.svc?wsdl';
  
  //     // Define dos mensajes SOAP con la variable que difiere (por ejemplo, el código de catálogo)
  //     const soapRequest1 = `
  //       <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
  //                          xmlns:tem="http://tempuri.org/" 
  //                          xmlns:ofit="http://schemas.datacontract.org/2004/07/OfiTourXmlServerParsec.Entidades" 
  //                          xmlns:ofit1="http://schemas.datacontract.org/2004/07/OfiTourXmlServerParsec.Entidades.PreviusData" 
  //                          xmlns:arr="http://schemas.microsoft.com/2003/10/Serialization/Arrays">
  //           <soapenv:Header/>
  //           <soapenv:Body>
  //               <tem:GetPreviusDataFromDate>
  //                   <tem:request>
  //                       <ofit:LanguageIsoCode>?</ofit:LanguageIsoCode>
  //                       <ofit:Login>
  //                           <ofit:ConsumerId></ofit:ConsumerId>
  //                           <ofit:Password>st99ThGb</ofit:Password>
  //                           <ofit:Username>sttraveltest</ofit:Username>
  //                       </ofit:Login>
  //                       <ofit1:TimeStamp>?</ofit1:TimeStamp>
  //                       <ofit1:TourCatalogsCodes>
  //                           <!-- Primer código de catálogo -->
  //                           <arr:int>9</arr:int>
  //                       </ofit1:TourCatalogsCodes>
  //                       <ofit1:DepartureStartDateForSearch>2025-04-01</ofit1:DepartureStartDateForSearch>
  //                   </tem:request>
  //               </tem:GetPreviusDataFromDate>
  //           </soapenv:Body>
  //       </soapenv:Envelope>
  //     `;
  
  //     const soapRequest2 = `
  //       <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
  //                          xmlns:tem="http://tempuri.org/" 
  //                          xmlns:ofit="http://schemas.datacontract.org/2004/07/OfiTourXmlServerParsec.Entidades" 
  //                          xmlns:ofit1="http://schemas.datacontract.org/2004/07/OfiTourXmlServerParsec.Entidades.PreviusData" 
  //                          xmlns:arr="http://schemas.microsoft.com/2003/10/Serialization/Arrays">
  //           <soapenv:Header/>
  //           <soapenv:Body>
  //               <tem:GetPreviusDataFromDate>
  //                   <tem:request>
  //                       <ofit:LanguageIsoCode>?</ofit:LanguageIsoCode>
  //                       <ofit:Login>
  //                           <ofit:ConsumerId></ofit:ConsumerId>
  //                           <ofit:Password>st99ThGb</ofit:Password>
  //                           <ofit:Username>sttraveltest</ofit:Username>
  //                       </ofit:Login>
  //                       <ofit1:TimeStamp>?</ofit1:TimeStamp>
  //                       <ofit1:TourCatalogsCodes>
  //                           <!-- Segundo código de catálogo, por ejemplo -->
  //                           <arr:int>20</arr:int>
  //                       </ofit1:TourCatalogsCodes>
  //                       <ofit1:DepartureStartDateForSearch>2025-04-01</ofit1:DepartureStartDateForSearch>
  //                   </tem:request>
  //               </tem:GetPreviusDataFromDate>
  //           </soapenv:Body>
  //       </soapenv:Envelope>
  //     `;
  
  //     // Realiza ambas solicitudes en paralelo
  //     const [response1, response2] = await Promise.all([
  //       axios.post(url, soapRequest1, {
  //         headers: {
  //           'Content-Type': 'text/xml; charset=utf-8',
  //           'SOAPAction': 'http://tempuri.org/IOfiTourServerPaquetesSurland/GetPreviusDataFromDate'
  //         }
  //       }),
  //       axios.post(url, soapRequest2, {
  //         headers: {
  //           'Content-Type': 'text/xml; charset=utf-8',
  //           'SOAPAction': 'http://tempuri.org/IOfiTourServerPaquetesSurland/GetPreviusDataFromDate'
  //         }
  //       })
  //     ]);
  
  //     // Obtén el XML de cada respuesta
  //     const xmlData1 = response1.data;
  //     const xmlData2 = response2.data;
  
  //     // Parsear cada respuesta a JSON
  //     const result1 = await parseStringAsync(xmlData1, { explicitArray: false, ignoreAttrs: true });
  //     const result2 = await parseStringAsync(xmlData2, { explicitArray: false, ignoreAttrs: true });
  
  //     // Extraer los tours de cada respuesta (ajusta la ruta según tu estructura)
  //     const toursData1 = result1['s:Envelope']['s:Body']['GetPreviusDataFromDateResponse']
  //       ['GetPreviusDataFromDateResult']['a:TourCatalogs']['a:TourCatalog']['a:TourPrograms']['a:TourProgram'];
  //     const toursData2 = result2['s:Envelope']['s:Body']['GetPreviusDataFromDateResponse']
  //       ['GetPreviusDataFromDateResult']['a:TourCatalogs']['a:TourCatalog']['a:TourPrograms']['a:TourProgram'];
  
  //     // Normalizar a arreglos y unirlos
  //     const normalize = data => Array.isArray(data) ? data : data ? [data] : [];
  //     const mergedToursData = [...normalize(toursData1), ...normalize(toursData2)];
  
  //     // Procesa el arreglo combinado de tours (como en tu código actual)
  //     const extractedTours = mergedToursData.map(program => {
  //       const tourName = program['a:Name'];
  //       const tourCode = program['a:Code'];
        
  //       const departures = program['a:TourReferences']?.['a:TourReference']?.flatMap(reference => {
  //         const tourId = reference['a:Code'];
  //         const nombreCategoria = reference['a:Name'] || '';
          
  //         const departureData = reference['a:Departures']?.['a:Departure'];
  //         const departuresArray = Array.isArray(departureData)
  //           ? departureData
  //           : departureData ? [departureData] : [];
          
  //         return departuresArray.map(departure => {
  //           const startDate = departure['a:StartDate'];
  //           const endDate = departure['a:EndDate'];
            
  //           const conceptsData = departure['a:Concepts']?.['a:Concept'];
  //           const conceptsArray = Array.isArray(conceptsData)
  //             ? conceptsData
  //             : conceptsData ? [conceptsData] : [];
            
  //           const prices = conceptsArray
  //             .map(concept => parseFloat(concept['a:Amount']))
  //             .filter(price => isFinite(price));
  //           const lowestPrice = prices.length ? Math.min(...prices) : null;
            
  //           return {
  //             id: tourId,
  //             nombreCategoria,
  //             startDate,
  //             endDate,
  //             lowestPrice
  //           };
  //         });
  //       }) || [];
        
  //       return {
  //         tourName,
  //         tourCode,
  //         departures
  //       };
  //     });
  
  //     // Por ejemplo, unir todo en un arreglo "groupedTours"
  //     const groupedTours = extractedTours.flatMap(tour => {
  //       return tour.departures.map(departure => ({
  //         nombre_tour: tour.tourName,
  //         tipo_tour: tour.tourCode,
  //         id_tour: departure.id,
  //         nombreCategoria: departure.nombreCategoria,
  //         fecha_inicio: departure.startDate,
  //         fecha_fin: departure.endDate,
  //         precio: departure.lowestPrice
  //       }));
  //     });
  
  //     // Puedes aplicar también el filtrado que necesites
  //     const filteredTours = extractedTours.flatMap(tour => {
  //       return tour.departures
  //         .filter(departure => {
  //           const nombreCategoria = departure.nombreCategoria;
  //           return !(
  //             nombreCategoria.includes("Cat. Lujo") || nombreCategoria.includes("Cat. Superior")
  //             || nombreCategoria.includes("Opción ´B´") || nombreCategoria.includes("Opción ´C´") 
  //             || nombreCategoria.includes("Opción ´D´") || nombreCategoria.includes("Opción ´E´") 
  //             || nombreCategoria.includes("Cat. Premium") || nombreCategoria.includes("Opción´D´ Oro Plus") 
  //             || nombreCategoria.includes("Opción´D´")
  //           );
  //         })
  //         .map(departure => ({
  //           nombre_tour: tour.tourName,
  //           tipo_tour: tour.tourCode,
  //           id_tour: departure.id,
  //           nombreCategoria: departure.nombreCategoria,
  //           fecha_inicio: departure.startDate,
  //           fecha_fin: departure.endDate,
  //           precio: departure.lowestPrice
  //         }));
  //     });
  
  //     // (Aquí puedes insertar en la BD si lo necesitas)
  //     await TourModel.resetearBD();
  //     for (const departure of filteredTours) {
  //         await TourModel.insertTour(departure);
  //     }
  
  //     // Envía la respuesta. Por ejemplo, podrías enviar el primer tour y todos los datos extraídos
  //     res.json({ ok: true, tours: filteredTours,cantidadTours:filteredTours.length });
  
  //   } catch (error) {
  //     console.error('Error al realizar la solicitud SOAP:', error);
  //     res.status(500).json({ ok: false, message: 'Error interno del servidor' });
  //   }
  // };

  // obtenerToursSurland = async (req, res) => {
  //   try {
  //     const url = 'http://xmlserverproduccion.surland.com/OfiTourServerPaquetesSurland.svc?wsdl';
  
  //     // Define dos mensajes SOAP con la variable que difiere (por ejemplo, el código de catálogo)
  //     const soapRequest1 = `
  //       <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
  //                          xmlns:tem="http://tempuri.org/" 
  //                          xmlns:ofit="http://schemas.datacontract.org/2004/07/OfiTourXmlServerParsec.Entidades" 
  //                          xmlns:ofit1="http://schemas.datacontract.org/2004/07/OfiTourXmlServerParsec.Entidades.PreviusData" 
  //                          xmlns:arr="http://schemas.microsoft.com/2003/10/Serialization/Arrays">
  //         <soapenv:Header/>
  //         <soapenv:Body>
  //             <tem:GetPreviusDataFromDate>
  //                 <tem:request>
  //                     <ofit:LanguageIsoCode>?</ofit:LanguageIsoCode>
  //                     <ofit:Login>
  //                         <ofit:ConsumerId></ofit:ConsumerId>
  //                         <ofit:Password>st99ThGb</ofit:Password>
  //                         <ofit:Username>sttraveltest</ofit:Username>
  //                     </ofit:Login>
  //                     <ofit1:TimeStamp>?</ofit1:TimeStamp>
  //                     <ofit1:TourCatalogsCodes>
  //                         <!-- Primer código de catálogo -->
  //                         <arr:int>9</arr:int>
  //                     </ofit1:TourCatalogsCodes>
  //                     <ofit1:DepartureStartDateForSearch>2025-04-01</ofit1:DepartureStartDateForSearch>
  //                 </tem:request>
  //             </tem:GetPreviusDataFromDate>
  //         </soapenv:Body>
  //       </soapenv:Envelope>
  //     `;
  
  //     const soapRequest2 = `
  //       <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
  //                          xmlns:tem="http://tempuri.org/" 
  //                          xmlns:ofit="http://schemas.datacontract.org/2004/07/OfiTourXmlServerParsec.Entidades" 
  //                          xmlns:ofit1="http://schemas.datacontract.org/2004/07/OfiTourXmlServerParsec.Entidades.PreviusData" 
  //                          xmlns:arr="http://schemas.microsoft.com/2003/10/Serialization/Arrays">
  //         <soapenv:Header/>
  //         <soapenv:Body>
  //             <tem:GetPreviusDataFromDate>
  //                 <tem:request>
  //                     <ofit:LanguageIsoCode>?</ofit:LanguageIsoCode>
  //                     <ofit:Login>
  //                         <ofit:ConsumerId></ofit:ConsumerId>
  //                         <ofit:Password>st99ThGb</ofit:Password>
  //                         <ofit:Username>sttraveltest</ofit:Username>
  //                     </ofit:Login>
  //                     <ofit1:TimeStamp>?</ofit1:TimeStamp>
  //                     <ofit1:TourCatalogsCodes>
  //                         <!-- Segundo código de catálogo -->
  //                         <arr:int>20</arr:int>
  //                     </ofit1:TourCatalogsCodes>
  //                     <ofit1:DepartureStartDateForSearch>2025-04-01</ofit1:DepartureStartDateForSearch>
  //                 </tem:request>
  //             </tem:GetPreviusDataFromDate>
  //         </soapenv:Body>
  //       </soapenv:Envelope>
  //     `;
  
  //     // Realiza ambas solicitudes en paralelo
  //     const [response1, response2] = await Promise.all([
  //       axios.post(url, soapRequest1, {
  //         headers: {
  //           'Content-Type': 'text/xml; charset=utf-8',
  //           'SOAPAction': 'http://tempuri.org/IOfiTourServerPaquetesSurland/GetPreviusDataFromDate'
  //         }
  //       }),
  //       axios.post(url, soapRequest2, {
  //         headers: {
  //           'Content-Type': 'text/xml; charset=utf-8',
  //           'SOAPAction': 'http://tempuri.org/IOfiTourServerPaquetesSurland/GetPreviusDataFromDate'
  //         }
  //       })
  //     ]);
  
  //     // Obtén el XML de cada respuesta
  //     const xmlData1 = response1.data;
  //     const xmlData2 = response2.data;
  
  //     // Parsear cada respuesta a JSON
  //     const result1 = await parseStringAsync(xmlData1, { explicitArray: false, ignoreAttrs: true });
  //     const result2 = await parseStringAsync(xmlData2, { explicitArray: false, ignoreAttrs: true });
  
  //     // Extraer los tours de cada respuesta (ajusta la ruta según tu estructura)
  //     const toursData1 = result1['s:Envelope']['s:Body']['GetPreviusDataFromDateResponse']
  //       ['GetPreviusDataFromDateResult']['a:TourCatalogs']['a:TourCatalog']['a:TourPrograms']['a:TourProgram'];
  //     const toursData2 = result2['s:Envelope']['s:Body']['GetPreviusDataFromDateResponse']
  //       ['GetPreviusDataFromDateResult']['a:TourCatalogs']['a:TourCatalog']['a:TourPrograms']['a:TourProgram'];
  
  //     // Normalizar a arreglos y unirlos
  //     const normalize = data => Array.isArray(data) ? data : data ? [data] : [];
  //     const mergedToursData = [...normalize(toursData1), ...normalize(toursData2)];
  
  //     // Procesa el arreglo combinado de tours
  //     const extractedTours = toursData1.map(program => {
  //       const tourName = program['a:Name'];
  //       const tourCode = program['a:Code'];
        
    
  
  //       const departures = program['a:TourReferences']?.['a:TourReference']?.flatMap(reference => {


  //         const tourId = reference['a:Code'];
  //         const nombreCategoria = reference['a:Name'] || '';
  //         const productId = reference['a:ProductId'];

       
  //         const departureData = reference['a:Departures']?.['a:Departure'];
  //         const departuresArray = Array.isArray(departureData)
  //           ? departureData
  //           : departureData ? [departureData] : [];
  
  //         return departuresArray.map(departure => {
  //           const startDate = departure['a:StartDate'];
  //           const endDate = departure['a:EndDate'];
  
  //           const conceptsData = departure['a:Concepts']?.['a:Concept'];
  //           const conceptsArray = Array.isArray(conceptsData)
  //             ? conceptsData
  //             : conceptsData ? [conceptsData] : [];

  //            console.log(conceptsArray);
             
  
  //           const prices = conceptsArray
  //             .map(concept => parseFloat(concept['a:Amount']))
  //             .filter(price => isFinite(price));
  
  //           // Filtra los precios que son mayores a 300
  //           const filteredPrices = prices.filter(price => price > 300);
  
  //           // Si hay precios válidos, obtener el precio mínimo mayor a 300
  //           const lowestPrice = filteredPrices.length ? Math.min(...filteredPrices) : null;
  
  //           // Solo incluye el tour si el precio mínimo es mayor a 300
  //           if (lowestPrice) {
  //             return {
  //               id: tourId,
  //               nombreCategoria,
  //               productId,
  //               startDate,
  //               endDate,
  //               lowestPrice
  //             };
  //           } else {
  //             return null; // No incluir si no hay precios válidos mayores a 300
  //           }
  //         }).filter(departure => departure !== null); // Filtrar salidas nulas
  //       }) || [];
  
  //       return {
  //         tourName,
  //         tourCode,
  //         departures
  //       };
  //     });
  
  //     // Filtra para eliminar tours sin ninguna salida válida
  //     const filteredTours = extractedTours.flatMap(tour => {
  //       return tour.departures
  //         .filter(departure => {
  //           const nombreCategoria = departure.nombreCategoria;
  //           return !(
  //             nombreCategoria.includes("Cat. Lujo") || nombreCategoria.includes("Cat. Superior")
  //             || nombreCategoria.includes("Opción ´B´") || nombreCategoria.includes("Opción ´C´") 
  //             || nombreCategoria.includes("Opción ´D´") || nombreCategoria.includes("Opción ´E´") 
  //             || nombreCategoria.includes("Cat. Premium") || nombreCategoria.includes("Opción´D´ Oro Plus") 
  //             || nombreCategoria.includes("Opción´D´")
  //           );
  //         })
  //         .map(departure => ({
  //           nombre_tour: departure.nombreCategoria,
  //           tipo_tour: tour.tourCode,
  //           id_tour: departure.productId,
  //           tour_code: departure.id,
  //           nombreCategoria: tour.tourName,
  //           fecha_inicio: departure.startDate,
  //           fecha_fin: departure.endDate,
  //           precio: departure.lowestPrice
  //         }));
  //     });
  
  //     // // Envía la respuesta
  //       //  await TourModel.resetearBD();
  //       //  for (const departure of filteredTours) {
  //       //      await TourModel.insertTour(departure);
  //       //  }
       
  //        // Envía la respuesta. Por ejemplo, podrías enviar el primer tour y todos los datos extraídos
  //        res.json({ ok: true, tours: toursData1,cantidadTours:filteredTours.length });
  
       
  
  //   } catch (error) {
  //     console.error('Error al realizar la solicitud SOAP:', error);
  //     res.status(500).json({ ok: false, message: 'Error interno del servidor' });
  //   }
  // };



  obtenerToursSurland = async (req, res) => {
    try {
      const url = 'http://xmlserverproduccion.surland.com/OfiTourServerPaquetesSurland.svc?wsdl';
  
      // Define dos mensajes SOAP con la variable que difiere (por ejemplo, el código de catálogo)
      const soapRequest1 = `
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                           xmlns:tem="http://tempuri.org/" 
                           xmlns:ofit="http://schemas.datacontract.org/2004/07/OfiTourXmlServerParsec.Entidades" 
                           xmlns:ofit1="http://schemas.datacontract.org/2004/07/OfiTourXmlServerParsec.Entidades.PreviusData" 
                           xmlns:arr="http://schemas.microsoft.com/2003/10/Serialization/Arrays">
          <soapenv:Header/>
          <soapenv:Body>
              <tem:GetPreviusDataFromDate>
                  <tem:request>
                      <ofit:LanguageIsoCode>?</ofit:LanguageIsoCode>
                      <ofit:Login>
                          <ofit:ConsumerId></ofit:ConsumerId>
                          <ofit:Password>st99ThGb</ofit:Password>
                          <ofit:Username>sttraveltest</ofit:Username>
                      </ofit:Login>
                      <ofit1:TimeStamp>?</ofit1:TimeStamp>
                      <ofit1:TourCatalogsCodes>
                          <!-- Primer código de catálogo -->
                          <arr:int>9</arr:int>
                      </ofit1:TourCatalogsCodes>
                      <ofit1:DepartureStartDateForSearch>2025-10-01</ofit1:DepartureStartDateForSearch>
                  </tem:request>
              </tem:GetPreviusDataFromDate>
          </soapenv:Body>
        </soapenv:Envelope>
      `;
  
      const soapRequest2 = `
        <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
                           xmlns:tem="http://tempuri.org/" 
                           xmlns:ofit="http://schemas.datacontract.org/2004/07/OfiTourXmlServerParsec.Entidades" 
                           xmlns:ofit1="http://schemas.datacontract.org/2004/07/OfiTourXmlServerParsec.Entidades.PreviusData" 
                           xmlns:arr="http://schemas.microsoft.com/2003/10/Serialization/Arrays">
          <soapenv:Header/>
          <soapenv:Body>
              <tem:GetPreviusDataFromDate>
                  <tem:request>
                      <ofit:LanguageIsoCode>?</ofit:LanguageIsoCode>
                      <ofit:Login>
                          <ofit:ConsumerId></ofit:ConsumerId>
                          <ofit:Password>st99ThGb</ofit:Password>
                          <ofit:Username>sttraveltest</ofit:Username>
                      </ofit:Login>
                      <ofit1:TimeStamp>?</ofit1:TimeStamp>
                      <ofit1:TourCatalogsCodes>
                          <!-- Segundo código de catálogo -->
                          <arr:int>20</arr:int>
                      </ofit1:TourCatalogsCodes>
                      <ofit1:DepartureStartDateForSearch>2025-10-01</ofit1:DepartureStartDateForSearch>
                  </tem:request>
              </tem:GetPreviusDataFromDate>
          </soapenv:Body>
        </soapenv:Envelope>
      `;
  
      // Realiza ambas solicitudes en paralelo
      const [response1, response2] = await Promise.all([
        axios.post(url, soapRequest1, {
          headers: {
            'Content-Type': 'text/xml; charset=utf-8',
            'SOAPAction': 'http://tempuri.org/IOfiTourServerPaquetesSurland/GetPreviusDataFromDate'
          }
        }),
        axios.post(url, soapRequest2, {
          headers: {
            'Content-Type': 'text/xml; charset=utf-8',
            'SOAPAction': 'http://tempuri.org/IOfiTourServerPaquetesSurland/GetPreviusDataFromDate'
          }
        })
      ]);
  
      // Obtén el XML de cada respuesta
      const xmlData1 = response1.data;
      const xmlData2 = response2.data;
  
      // Parsear cada respuesta a JSON
      const result1 = await parseStringAsync(xmlData1, { explicitArray: false, ignoreAttrs: true });
      const result2 = await parseStringAsync(xmlData2, { explicitArray: false, ignoreAttrs: true });
  
      // Extraer los tours de cada respuesta (ajusta la ruta según tu estructura)
      const toursData1 = result1['s:Envelope']['s:Body']['GetPreviusDataFromDateResponse']
        ['GetPreviusDataFromDateResult']['a:TourCatalogs']['a:TourCatalog']['a:TourPrograms']['a:TourProgram'];
      const toursData2 = result2['s:Envelope']['s:Body']['GetPreviusDataFromDateResponse']
        ['GetPreviusDataFromDateResult']['a:TourCatalogs']['a:TourCatalog']['a:TourPrograms']['a:TourProgram'];
  
      // Normalizar a arreglos y unirlos
      const normalize = data => Array.isArray(data) ? data : data ? [data] : [];
      const mergedToursData = [...normalize(toursData1), ...normalize(toursData2)];
  
      // Procesa el arreglo combinado de tours
      const extractedTours = mergedToursData.map(program => {
        const tourName = program['a:Name'];
        const tourCode = program['a:Code'];
      
        const departures = program['a:TourReferences']?.['a:TourReference']?.flatMap(reference => {
          const tourId = reference['a:Code'];
          const nombreCategoria = reference['a:Name'] || '';
          const productId = reference['a:ProductId'];
      
          const departureData = reference['a:Departures']?.['a:Departure'];
          const departuresArray = Array.isArray(departureData)
            ? departureData
            : departureData ? [departureData] : [];
      
          return departuresArray.map(departure => {
            const startDate = departure['a:StartDate'];
            const endDate = departure['a:EndDate'];
      
            const conceptsData = departure['a:Concepts']?.['a:Concept'];
            const conceptsArray = Array.isArray(conceptsData)
              ? conceptsData
              : conceptsData ? [conceptsData] : [];
      
            // Obtener precios para 'adulto base' y 'persona' (que deben ser mayores a 300)
            const prices = conceptsArray
              .map(concept => {
                const description = concept['a:Description'] ? concept['a:Description'].toLowerCase() : '';
                const amount = parseFloat(concept['a:Amount']); // Obtener el precio
                const categoryCode = concept['a:TourCategoryCode'];
      
                // Verificar si cumple con las condiciones para 'adulto base' o 'persona'
                if ((description.includes('adulto base')) || description.includes('persona')) {
                  return amount;
                }
      
                return null;
              })
              .filter(price => isFinite(price) && price > 300); // Filtra precios válidos mayores a 300
      
            // Si hay precios válidos, obtener el precio mínimo mayor a 300
            const lowestPrice = prices.length ? Math.min(...prices) : null;
      
            // Obtener precios adicionales si la categoría es 'VA'
            const vaPrice = conceptsArray
              .filter(concept => concept['a:TourCategoryCode'] === 'VA')
              .map(concept => parseFloat(concept['a:Amount']))
              .filter(price => isFinite(price)); // Filtra precios válidos mayores a 300
      
            // Si encontramos precios válidos de 'VA', añadirlos al retorno
            if (lowestPrice) {
              return {
                id: tourId,
                nombreCategoria,
                productId,
                startDate,
                endDate,
                lowestPrice, // El precio más bajo de 'adulto base' o 'persona' mayor a 300
                vaPrice: vaPrice.length ? Math.min(...vaPrice) : 0 // El precio de 'VA' (si existe y es mayor a 300)
              };
            } else {
              return null; // No incluir si no hay precios válidos mayores a 300
            }
          }).filter(departure => departure !== null); // Filtrar salidas nulas
        }) || [];
      
        return {
          tourName,
          tourCode,
          departures
        };
      });
      
      // Filtra para eliminar tours sin ninguna salida válida
      const filteredTours = extractedTours.flatMap(tour => {
        return tour.departures.map(departure => {
          const nombreCategoria = departure.nombreCategoria;
      
          // Extraer el valor antes del primer guion en nombreCategoria
          const extractedValue = nombreCategoria.match(/^[^-\s]+/)?.[0] || ''; // Devuelve el valor antes del primer guion
      
          return {
            nombre_tour: departure.nombreCategoria,
            tipo_tour: tour.tourCode,
            id_tour: departure.productId,
            tour_code: departure.id,
            nombreCategoria: tour.tourName,
            identificador:extractedValue, // Añadir el valor extraído antes del guion
            fecha_inicio: departure.startDate,
            fecha_fin: departure.endDate,
            precio: departure.lowestPrice,
            vaPrecio: departure.vaPrice // Incluye el precio de la categoría 'VA' si es válido
          };
        });
      });
      
      
     
      // // Envía la respuesta
        //  await TourModel.resetearBD();
         for (const departure of filteredTours) {
             await TourModel.insertTour(departure);
         }
       
         // Envía la respuesta. Por ejemplo, podrías enviar el primer tour y todos los datos extraídos
         res.json({ ok: true, tours: filteredTours,cantidadTours:filteredTours.length });
  
       
  
    } catch (error) {
      console.error('Error al realizar la solicitud SOAP:', error);
      res.status(500).json({ ok: false, message: 'Error interno del servidor' });
    }
  };
  
  
  
  
 
  obtenerInfoToursSurland = async (req, res) => {
    try {
        const url = 'http://xmlserverproduccion.surland.com/OfiTourServerPaquetesSurland.svc';
        const soapRequest = `
            <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/" xmlns:ofit="http://schemas.datacontract.org/2004/07/OfiTourXmlServerParsec.Entidades" xmlns:ofit1="http://schemas.datacontract.org/2004/07/OfiTourXmlServerParsec.Entidades.AdditionalInfo">
              <soapenv:Header/>
              <soapenv:Body>
                 <tem:GetAdditionalInfo>
                    <!--Optional:-->
                    <tem:request>
                       <!--Optional:-->
                       <ofit:LanguageIsoCode></ofit:LanguageIsoCode>
                       <!--Optional:-->
                       <ofit:Login>
                          <!--Optional:-->
                          <ofit:ConsumerId></ofit:ConsumerId>
                          <!--Optional:-->
                          <ofit:Password>st99ThGb</ofit:Password>
                          <!--Optional:-->
                          <ofit:Username>sttraveltest</ofit:Username>
                       </ofit:Login>
                       <!--Optional:-->
                       <ofit1:BookingSeasonCode>14</ofit1:BookingSeasonCode>
                       <!--Optional:-->
                       <ofit1:TourCatalogCode>9</ofit1:TourCatalogCode>
                   
                    </tem:request>
                 </tem:GetAdditionalInfo>
              </soapenv:Body>
           </soapenv:Envelope>
        `;

        // Realizar la solicitud SOAP
        const response = await axios.post(url, soapRequest, {
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'SOAPAction': 'http://tempuri.org/IOfiTourServerPaquetesSurland/GetAdditionalInfo'
            }
        });

        const xmlData = response.data;

        // Convertir XML a JSON de manera asincrónica
        const result = await parseStringAsync(xmlData, { explicitArray: false, ignoreAttrs: true });

     
        const programs = result?.["s:Envelope"]?.["s:Body"]?.["GetAdditionalInfoResponse"]?.["GetAdditionalInfoResult"]?.["a:TourCatalogInfo"]?.["a:TourProgramsInfo"]?.["a:TourProgramInfo"] || [];

        const result2 = programs.map(program => {
            const references = program["a:TourReferencesInfo"]?.["a:TourReferenceInfo"] || [];

            // Agrupar la información de cada referencia con su código, descripción e itinerario
            const groupedInfo = references.map(ref => {
                const code = ref["a:Code"];
                const descriptions = ref["a:DescriptiveTexts"]?.["a:DescriptiveText"]?.map(desc => ({
                    title: desc["a:Title"],
                    description: desc["a:Description"]
                })) || [];

                const itinerary = ref["a:Itinerary"]?.["a:Day"]?.map(day => ({
                    dayNumber: day["a:DayNumber"],
                    title: day["a:Title"],
                    description: day["a:Description"]
                })) || [];

                return {
                    referenceCode: code,
                    informacion: {
                        descriptions: descriptions,
                        itinerary: itinerary
                    }
                };
            });

            return {
                name: program["a:Name"],
                referenceInfo: groupedInfo
            };
        });


        console.log("📢 Iniciando proceso de inserción de datos...");
        let progress = { descriptions: "0%", itineraries: "0%" };
    
        await TourModel.insertTourDescriptions(result2, progress);
        await TourModel.insertTourItinerary(result2, progress);
    
        console.log("🎉 Todos los datos fueron insertados correctamente.");
    
        res.json({
            ok: true,
            progress: progress,
            message: "Todos los datos fueron insertados correctamente.",
            info_adicional: result2[1]?.referenceInfo || [],
            resultado: result2 || []
        });
        // res.json({ ok: true, tours: filteredTours, cantidadTours: filteredTours.length});
    } catch (error) {
        console.error('Error al realizar la solicitud SOAP:', error);
        res.status(500).json({ ok: false, message: 'Error interno del servidor' });
    }
  }

  obtenerToursRecomendados = async (req, res) => {
    const body = req.body;
    const { region } = req.params;
     try {
      const toursRecomendados = await TourModel.obtenerToursRecomendados(region);
     
      if (toursRecomendados) {
          res.json({ ok: true, mensaje: "Tours Recomendados Obtenidos Correctamente",toursRecomendados });
      } else {
          res.status(500).json({ ok: false, mensaje: "Error al obtener el tours" });
      }
     } catch (error) {
      console.error("Error en la actualización de la base de datos:", error);
      res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
     }
  }

 


 

  eliminar = async (req, res) => {
    const id = req.params.id;

		try {
			await TourModel.findByIdAndDelete(id);
		} catch (error) {
      console.log(error)
    }

		res.json({
			ok: true
		});
  }

  actualizarDescripcionHotel = async (req, res) => {
    const body = req.body;
     const {id_descripcion,id_tour} = req.params;
     const { descripcion_editada } = req.body; // Recibe la descripción editada
    

     try {
       // Llamar a la función para actualizar la descripción en la base de datos
        const descripcionActualizada = await TourModel.actualizarDescripcionHotel(id_descripcion,id_tour, descripcion_editada);

      if (descripcionActualizada) {
        res.json({ ok: true, mensaje: "Descripción actualizada correctamente" });
      } else {
          res.status(500).json({ ok: false, mensaje: "Error al actualizar descripcion" });
      }
     } catch (error) {
      console.error("Error en la actualización de la base de datos:", error);
      res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
     }
  }


   publicarFotoPruebaAws = async (req, res) => {
    try {
      const filePath = "https://amhigo.com/images/amhiblog/expertos/Luis_Flores_/Foto_portada.jpg";
      const fileName = path.basename(filePath); // Obtén el nombre del archivo
  
      // Descarga el archivo desde la URL
      const response = await axios.get(filePath, { responseType: 'arraybuffer' });
      const fileContent = response.data;

      const bucketName = process.env.AWS_S3_BUCKET; // Nombre del bucket en S3

      const params = {
        Bucket: bucketName,  // Nombre del bucket en S3
        Key: fileName,       // Nombre que tendrá el archivo en S3
        Body: fileContent,   // El contenido del archivo
        ContentType: 'image/jpeg', // Tipo de contenido (ajústalo según el tipo de la imagen)
        // ACL: 'public-read'   // Puedes hacer el archivo público o privado
      };
  
      // Subir el archivo a S3
      s3.upload(params, (err, data) => {
        if (err) {
          console.log('Error subiendo la imagen:', err);
          res.status(500).send('Error subiendo la imagen');
        } else {
          console.log('Imagen subida exitosamente:', data.Location);
          res.status(200).send({ message: 'Imagen subida exitosamente', url: data.Location });
        }
      });
    } catch (error) {
      console.error('Error al descargar o subir la imagen:', error);
      res.status(500).send('Error al procesar la imagen');
    }
  }

  subirFiltros = async (req, res) => {
        try {
          // Directorio donde se va a guardar el archivo
          const uploadDir = path.join(__dirname, '..', 'uploads');

          // Verificar si el directorio existe, si no, crearlo
          if (!fs.existsSync(uploadDir)) {
              fs.mkdirSync(uploadDir, { recursive: true });
          }
          // Leer archivo de Excel subido
          const archivo = req.files.archivo;
          const rutaArchivo = path.join(__dirname, '..', 'uploads', archivo.name);
          await archivo.mv(rutaArchivo);    

          // Leer el contenido del archivo Excel
          const filtros = await this.leerExcel(rutaArchivo);  
          
          // Insertar los filtros en la base de datos
          await TourModel.resetearBDFiltros();
          await TourModel.insertarFiltrosDB(filtros);    

          // Eliminar el archivo después de procesarlo
          fs.unlinkSync(rutaArchivo);    

          res.status(200).json({ ok: true, mensaje: "Filtros subidos correctamente" });
      } catch (error) {
          console.error('Error al subir filtros:', error);
          res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
      }
  }

  leerExcel = async (rutaArchivo) => {
    const workbook = xlsx.readFile(rutaArchivo);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    const filtros = [];
    const columnasFiltros = [
        'Destinos exóticos', 'Auroras Boreales', 'Safaris', 'Experiencias en el desierto',
        'Playas', 'Experiencias Navideñas', 'Arte y Cultura', 'Camino de Santiago', 'Lo Nuevo',
        'Sitios medievales', 'Europa', 'Medio Oriente', 'Paris', 'Italia', 'Suiza', 
        'Los más solicitados', 'Tendencia 2025', 'Londres', 'Madrid', 'Amsterdam',
        'Ciudades Imperiales en Europa', 'Noruega', 'Finlandia', 'Asia', 'África', 
        'Nórdicos', 'Bélgica', 'Praga', 'Croacia', 'Los Balcanes', 'Gran Bretaña', 
        'Escocia', 'Grecia', 'Egipto', 'Marruecos', 'Dubai', 'Turquía','Prioridad'
    ];

    // Obtener los encabezados de la primera fila
    const headers = data[0];

    // Recorrer las filas y buscar los filtros
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const id_tour = row[0];  // Suponiendo que el id_tour está en la primera columna

        // Asegurarse de que el id_tour no esté vacío
        if (id_tour) {
          columnasFiltros.forEach(columna => {
              // Comprobar si la columna existe en los encabezados
              const columnIndex = headers.indexOf(columna);
              if (columnIndex !== -1) {
                  // Comprobar si el valor en row[columnIndex] es 'x' o un número
                  const cellValue = row[columnIndex];
                  if (cellValue === 'x' || !isNaN(Number(cellValue))) {
                      filtros.push({ id_tour, filtro: columna, valor: cellValue });
                  }
              }
          });
      }
    }

    return filtros;
};

obtenerConversion = async (req, res) => {
  const body = req.body;
   try {
    const conversion = await TourModel.obtenerConversion();
   
    if (conversion) {
        res.json({ ok: true, mensaje: "Conversión Obtenida Correctamente",conversion });
    } else {
        res.status(500).json({ ok: false, mensaje: "Error al obtener corversion" });
    }
   } catch (error) {
    console.error("Error en la actualización de la base de datos:", error);
    res.status(500).json({ ok: false, mensaje: "Error interno del servidor" });
   }
}



}

module.exports = new ToursController();
