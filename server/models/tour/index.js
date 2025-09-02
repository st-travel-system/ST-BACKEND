const db = require('../db/database');


async function obtenerToursBase() {
    try {
        // 1. Obtener todos los tours publicados
        const queryTours = 'SELECT * FROM tours';
        
        const [tours] = await db.query(queryTours);

        if (tours.length === 0) return null;

        // 2. Obtener todos los tour_descriptions que coincidan con los id_tour obtenidos
        const tourIds = tours.map(tour => tour.tour_code); // Extrae solo los IDs de los tours

        if (tourIds.length === 0) return tours; // Si no hay IDs, solo retorna los tours

        const queryDescriptions = `
            SELECT id AS id_descripcion,tour_code, titulo, descripcion, descripcion_editada
            FROM tour_descriptions 
            WHERE tour_code IN (${tourIds.map(() => '?').join(',')});
        `;

        const [descriptions] = await db.query(queryDescriptions, tourIds);

        // 3. Agrupar descripciones por tour_code en un objeto
        const descriptionsMap = {};
        descriptions.forEach(desc => {
            const { tour_code, titulo, descripcion } = desc;
            if (!descriptionsMap[tour_code]) {
                descriptionsMap[tour_code] = [];
            }
            descriptionsMap[tour_code].push({ titulo, descripcion });
        });

        // 4. Agregar las descripciones a cada tour
        const result = tours.map(tour => ({
            ...tour,
            descriptions: descriptionsMap[tour.tour_code] || [] // Si no tiene descripciones, devuelve un array vacío
        }));

        return result;

    } catch (error) {
        console.error("Error al obtener tours y descripciones:", error);
        return null;
    }
}


// async function obtenerTourPublicados(publicados) {
//     try {
//         const queryTours = `
//             SELECT 
//               t.*,
//               fotos_tour.fotos_galeria,
//               fotos_tour.foto_principal,
//               hoteles_tour.hoteles,
//               GROUP_CONCAT(
//                   DISTINCT CASE 
//                       WHEN filtros.filtro = 'Prioridad' THEN filtros.valor 
//                       ELSE filtros.filtro 
//                   END 
//                   ORDER BY filtros.filtro ASC
//               ) AS filtros
//           FROM 
//               tours t
//           LEFT JOIN 
//               fotos_tour ON t.id_tour = fotos_tour.id_tour
//           LEFT JOIN 
//               hoteles_tour ON t.id_tour = hoteles_tour.id_tour
//           LEFT JOIN 
//               filtros ON t.id_tour = filtros.id_tour
//           WHERE 
//               t.publicado = 1
//               AND t.precio = (
//                   SELECT MIN(precio)
//                   FROM tours
//                   WHERE id_tour = t.id_tour
//               )
//           GROUP BY 
//               t.id_tour;`;
            
    
//         const [tours] = await db.query(queryTours, [publicados]);

//         if (tours.length === 0) return null;

//         // 2. Obtener todos los tour_descriptions que coincidan con los tour_code obtenidos
//         const tourIds = tours.map(tour => tour.tour_code); // Extrae solo los IDs de los tours

//         if (tourIds.length === 0) return tours; // Si no hay IDs, solo retorna los tours

//         const queryDescriptions = `
//             SELECT tour_code, titulo, descripcion,descripcion_editada
//             FROM tour_descriptions 
//             WHERE tour_code IN (${tourIds.map(() => '?').join(',')});
//         `;

//         const [descriptions] = await db.query(queryDescriptions, tourIds);

//         // 3. Agrupar descripciones por tour_code en un objeto
//         const descriptionsMap = {};
//         descriptions.forEach(desc => {
//             const { tour_code, titulo, descripcion,descripcion_editada } = desc;
//             if (!descriptionsMap[tour_code]) {
//                 descriptionsMap[tour_code] = [];
//             }
//             descriptionsMap[tour_code].push({ titulo, descripcion,descripcion_editada });
//         });

//         // 4. Agregar las descripciones a cada tour
//         const result = tours.map(tour => ({
//             ...tour,
//             descriptions: descriptionsMap[tour.tour_code] || [] // Si no tiene descripciones, devuelve un array vacío
//         }));

//         return result;

//     } catch (error) {
//         console.error("Error al obtener tours y descripciones:", error);
//         return null;
//     }
// }

async function obtenerTourPublicados(publicados, limit, offset) {
    try {
        // const queryTours = `
        //     SELECT t.*, 
        //        fotos_tour.fotos_galeria, fotos_tour.foto_principal, hoteles_tour.hoteles,
        //        GROUP_CONCAT(
        //            DISTINCT CASE 
        //                WHEN filtros.filtro = 'Prioridad' THEN filtros.valor 
        //                ELSE filtros.filtro 
        //            END 
        //            ORDER BY filtros.filtro ASC
        //        ) AS filtros
        //       FROM tours t 
        //       LEFT JOIN fotos_tour ON t.id_tour = fotos_tour.id_tour 
        //       LEFT JOIN hoteles_tour ON t.id_tour = hoteles_tour.id_tour 
        //       LEFT JOIN filtros ON t.id_tour = filtros.id_tour 
        //       WHERE t.publicado = 1 AND t.mas_barato = 1 
        //      ;
        // `;

      const queryTours = `
            SELECT 
              t.*,
              fotos_tour.fotos_galeria,
              fotos_tour.foto_principal,
              hoteles_tour.hoteles,
              GROUP_CONCAT(
                  DISTINCT CASE 
                      WHEN filtros.filtro = 'Prioridad' THEN filtros.valor 
                      ELSE filtros.filtro 
                  END 
                  ORDER BY filtros.filtro ASC
              ) AS filtros
          FROM 
              tours t
          LEFT JOIN 
              fotos_tour ON t.id_tour = fotos_tour.id_tour
          LEFT JOIN 
              hoteles_tour ON t.id_tour = hoteles_tour.id_tour
          LEFT JOIN 
              filtros ON t.id_tour = filtros.id_tour
          WHERE t.publicado = 1 AND t.mas_barato = 1 
          GROUP BY 
              t.id_tour;`;
            

        // Ejecutar consulta con paginación
        const [tours] = await db.query(queryTours, [publicados, limit, offset]);

        if (tours.length === 0) return null;

        // 2. Obtener todos los tour_descriptions que coincidan con los tour_code obtenidos
        const tourIds = tours.map(tour => tour.tour_code); // Extrae solo los IDs de los tours

        if (tourIds.length === 0) return tours; // Si no hay IDs, solo retorna los tours

        const queryDescriptions = `
            SELECT tour_code, titulo, descripcion,descripcion_editada
            FROM tour_descriptions 
            WHERE tour_code IN (${tourIds.map(() => '?').join(',')});
        `;

        const [descriptions] = await db.query(queryDescriptions, tourIds);

        // 3. Agrupar descripciones por tour_code en un objeto
        const descriptionsMap = {};
        descriptions.forEach(desc => {
            const { tour_code, titulo, descripcion,descripcion_editada } = desc;
            if (!descriptionsMap[tour_code]) {
                descriptionsMap[tour_code] = [];
            }
            descriptionsMap[tour_code].push({ titulo, descripcion,descripcion_editada });
        });

        // 4. Agregar las descripciones a cada tour
        const result = tours.map(tour => ({
            ...tour,
            descriptions: descriptionsMap[tour.tour_code] || [] // Si no tiene descripciones, devuelve un array vacío
        }));

        return result;

    } catch (error) {
        console.error("Error al obtener tours y descripciones:", error);
        return null;
    }
}

// Función para obtener el total de tours
async function obtenerTotalTours(publicados) {
    try {
        const queryCount = `
           SELECT COUNT(DISTINCT t.id_tour) AS totalTours
           FROM tours t
           WHERE t.publicado = ?;
        `;

        const [result] = await db.query(queryCount, [publicados]);

        return result[0].totalTours; // Retorna el total de tours
    } catch (error) {
        console.error("Error al obtener el total de tours:", error);
        return 0;
    }
}
async function obtenerOpcionesTours(identificador) {
    try {
        // 1. Obtener todos los tours agrupados por identificador
        const queryTours = `
            SELECT 
                tours.*
            FROM 
                tours
            WHERE 
                tours.identificador = ?
            GROUP BY 
                tours.id_tour;  -- Agrupar por id_tour para eliminar duplicados
        `;
    
        const [tours] = await db.query(queryTours, [identificador]);

        if (tours.length === 0) return null;

        return tours;

    } catch (error) {
        console.error("Error al obtener tours:", error);
        return null;
    }
}
async function obtenerCategoriasPreciosTours(identificador) {
    try {
        // 1. Obtener todos los tours agrupados por identificador
        const queryTours = `
            SELECT 
                t.*,
                ht.hoteles
            FROM 
                tours t
            LEFT JOIN 
                hoteles_tour ht ON t.id_tour = ht.id_tour
            WHERE 
                t.identificador = ?
                AND t.precio = (
                    SELECT MIN(precio)
                    FROM tours
                    WHERE id_tour = t.id_tour
                )
            GROUP BY 
                t.id_tour;`;
  
      
    
        const [tours] = await db.query(queryTours, [identificador]);

        if (tours.length === 0) return null;

        // 2. Obtener todos los tour_descriptions que coincidan con los tour_codes obtenidos
        const tourCodes = tours.map(tour => tour.tour_code); // Extrae solo los tour_codes

        // 3. Obtener las descripciones de los tours
        const queryDescriptions = `
            SELECT id AS id_descripcion, tour_code, titulo, descripcion, descripcion_editada
            FROM tour_descriptions 
            WHERE tour_code IN (${tourCodes.map(() => '?').join(',')});
        `;
        const [descriptions] = await db.query(queryDescriptions, tourCodes);

        // 4. Agrupar descripciones por tour_code
        const descriptionsMap = {};
        descriptions.forEach(desc => {
            const { id_descripcion, tour_code, titulo, descripcion, descripcion_editada } = desc;
            if (!descriptionsMap[tour_code]) {
                descriptionsMap[tour_code] = [];
            }
            descriptionsMap[tour_code].push({ id_descripcion, titulo, descripcion, descripcion_editada });
        });

        // 5. Obtener los itinerarios de los tours
        const queryItineraries = `
            SELECT tour_code, day_number, titulo, descripcion 
            FROM tour_itinerary 
            WHERE tour_code IN (${tourCodes.map(() => '?').join(',')});
        `;
        const [itineraries] = await db.query(queryItineraries, tourCodes);

        // 6. Agrupar itinerarios por tour_code
        const itinerariesMap = {};
        itineraries.forEach(itinerary => {
            const { tour_code, day_number, titulo, descripcion } = itinerary;
            if (!itinerariesMap[tour_code]) {
                itinerariesMap[tour_code] = [];
            }
            itinerariesMap[tour_code].push({ day_number, titulo, descripcion });
        });

        // 7. Agregar descripciones e itinerarios a cada tour
        const result = tours.map(tour => {
            let descriptionsForTour = descriptionsMap[tour.tour_code] || [];
            let itinerariesForTour = itinerariesMap[tour.tour_code] || [];

            return {
                ...tour,
                descriptions: descriptionsForTour,
                itineraries: itinerariesForTour
            };
        });

        return result;

    } catch (error) {
        console.error("Error al obtener tours, descripciones e itinerarios:", error);
        return null;
    }
}



async function obtenerTourPublicadosCategoria(categoria) {
    try {
        // 1. Obtener todos los tours categoria
        const queryTours = `
        SELECT 
            tours.*, 
            fotos_tour.fotos_galeria,
            hoteles_tour.hoteles
        FROM 
            tours
        LEFT JOIN 
            fotos_tour ON tours.id_tour = fotos_tour.id_tour
        LEFT JOIN 
             hoteles_tour ON tours.id_tour = hoteles_tour.id_tour  
        WHERE 
           LOWER(nombre_categoria) = LOWER(?) AND publicado = 1;
        `;
        const [tours] = await db.query(queryTours, [categoria.toLowerCase()]);


        if (tours.length === 0) return null;

        // 2. Obtener todos los tour_descriptions que coincidan con los id_tour obtenidos
        const tourIds = tours.map(tour => tour.tour_code); // Extrae solo los IDs de los tours

        if (tourIds.length === 0) return tours; // Si no hay IDs, solo retorna los tours

        const queryDescriptions = `
            SELECT tour_code, titulo, descripcion 
            FROM tour_descriptions 
            WHERE tour_code IN (${tourIds.map(() => '?').join(',')});
        `;

        const [descriptions] = await db.query(queryDescriptions, tourIds);

        // 3. Agrupar descripciones por tour_code en un objeto
        const descriptionsMap = {};
        descriptions.forEach(desc => {
            const { tour_code, titulo, descripcion } = desc;
            if (!descriptionsMap[tour_code]) {
                descriptionsMap[tour_code] = [];
            }
            descriptionsMap[tour_code].push({ titulo, descripcion });
        });

        // 4. Agregar las descripciones a cada tour
        const result = tours.map(tour => ({
            ...tour,
            descriptions: descriptionsMap[tour.tour_code] || [] // Si no tiene descripciones, devuelve un array vacío
        }));

        return result;

    } catch (error) {
        console.error("Error al obtener tours y descripciones:", error);
        return null;
    }
}

// async function obtenerTourPublicado(id_tour) {
//     const query = 'SELECT * FROM tours WHERE id_tour = ?';
//     const [rows] = await db.query(query, [id_tour]);
//     return rows.length > 0 ? rows : null;
// }
async function obtenerTourPublicado(id_tour) { 
    try {
        // 1. Obtener el tour
        const queryTours = `
            SELECT 
                tours.*, 
                fotos_tour.fotos_galeria,
                hoteles_tour.hoteles 
            FROM 
                tours
            LEFT JOIN 
                fotos_tour ON tours.id_tour = fotos_tour.id_tour
            LEFT JOIN 
                hoteles_tour ON tours.id_tour = hoteles_tour.id_tour
            WHERE 
                tours.id_tour = ?;
        `;
        
        const [tours] = await db.query(queryTours, [id_tour]);

        // Si no hay tours, retorna un array vacío
        if (!tours || tours.length === 0) return [];

        // 2. Obtener los IDs de los tours, eliminando duplicados
        const tourCodes = [...new Set(tours.map(tour => tour.tour_code.toString()))]; // Asegura que tour_code sea string para evitar problemas de comparación
        // console.log('Tour Codes:', tourCodes); // Verifica los tour_codes

        if (tourCodes.length === 0) return tours; 

        // 3. Obtener las descripciones de los tours
        const queryDescriptions = `
            SELECT id AS id_descripcion, tour_code, titulo, descripcion, descripcion_editada
            FROM tour_descriptions 
            WHERE tour_code IN (${tourCodes.map(() => '?').join(',')});
        `;
        const [descriptions] = await db.query(queryDescriptions, tourCodes);

        // Mostrar en consola las descripciones obtenidas
        // console.log('Descripciones obtenidas:', descriptions);

        // Agrupar descripciones por tour_code
        const descriptionsMap = {};
        descriptions.forEach(desc => {
            const { id_descripcion, tour_code, titulo, descripcion, descripcion_editada } = desc;
            if (!descriptionsMap[tour_code]) {
                descriptionsMap[tour_code] = [];
            }
            descriptionsMap[tour_code].push({ id_descripcion, titulo, descripcion, descripcion_editada });
        });

        // console.log('Descripciones agrupadas por tour_code:', descriptionsMap); // Verifica las descripciones agrupadas

        // 4. Obtener los itinerarios de los tours
        const queryItineraries = `
            SELECT tour_code, day_number, titulo, descripcion 
            FROM tour_itinerary 
            WHERE tour_code IN (${tourCodes.map(() => '?').join(',')});
        `;
        const [itineraries] = await db.query(queryItineraries, tourCodes);

        // Mostrar en consola los itinerarios obtenidos
        // console.log('Itinerarios obtenidos:', itineraries);

        // Agrupar itinerarios por tour_code
        const itinerariesMap = {};
        itineraries.forEach(itinerary => {
            const { tour_code, day_number, titulo, descripcion } = itinerary;
            if (!itinerariesMap[tour_code]) {
                itinerariesMap[tour_code] = [];
            }
            itinerariesMap[tour_code].push({ day_number, titulo, descripcion });
        });

        // console.log('Itinerarios agrupados por tour_code:', itinerariesMap); // Verifica los itinerarios agrupados

        // 5. Agregar descripciones e itinerarios a cada tour, asegurando que los tour_codes adicionales sean tomados en cuenta
        const result = tours.map(tour => {
            console.log('Procesando tour:', tour); // Verifica cada tour
            let descriptionsForTour = [];
            let itinerariesForTour = [];

            // Asegurarse de que las descripciones e itinerarios se asignen por cada tour_code asociado
            tourCodes.forEach(tourCode => {
                if (descriptionsMap[tourCode]) {
                    descriptionsForTour = descriptionsForTour.concat(descriptionsMap[tourCode]);
                }
                if (itinerariesMap[tourCode]) {
                    itinerariesForTour = itinerariesForTour.concat(itinerariesMap[tourCode]);
                }
            });

            // console.log(`Descripciones para ${tour.tour_code}:`, descriptionsForTour); // Verifica las descripciones para el tour
            // console.log(`Itinerarios para ${tour.tour_code}:`, itinerariesForTour); // Verifica los itinerarios para el tour

            return {
                ...tour,
                descriptions: descriptionsForTour,
                itineraries: itinerariesForTour
            };
        });

        // console.log('Resultado final:', result);

        return result;

    } catch (error) {
        console.error("Error al obtener tours, descripciones e itinerarios:", error);
        return [];
    }
}





async function obtenerDescripcionesTour(id_tour) {
    const query = 'SELECT * FROM tour_descriptions WHERE tour_code = ?';
    const [rows] = await db.query(query, [tour_code]);
    return rows.length > 0 ? rows : null;
}
async function obtenerItinerarioTour(tour_code) {
    const query = 'SELECT * FROM tour_itinerary WHERE tour_code = ?';
    const [rows] = await db.query(query, [tour_code]);
    return rows.length > 0 ? rows : null;
}

// Verificar si el departure ya existe
async function getTourById(id_tour, fecha_inicio) {
    const query = 'SELECT * FROM tours WHERE id_tour = ? AND DATE(fecha_inicio) = ? LIMIT 1';
    const [rows] = await db.query(query, [id_tour, fecha_inicio]);
    return rows.length > 0 ? rows[0] : null;
}
// RESETAR BD
async function resetearBD() {
    try {
        // Borrar todos los registros de la tabla
        const query = 'DELETE FROM tours';
        await db.query(query);

        // Reiniciar el valor del AUTO_INCREMENT a 1
        const query2 = 'ALTER TABLE tours AUTO_INCREMENT = 1';
        await db.query(query2);

        console.log("Base de datos reseteada exitosamente");
    } catch (error) {
        console.error("Error al resetear la base de datos:", error);
        throw error; // Re-lanzar el error para manejarlo en otro lugar si es necesario
    }
}


// Insertar un nuevo departure
async function insertTour(departureData) {
    const { id_tour,tour_code, nombre_tour,nombreCategoria,identificador, tipo_tour, fecha_inicio, fecha_fin, precio,vaPrecio } = departureData;
    await db.query(
        'INSERT INTO tours (id_tour,tour_code, nombre_tour,nombre_categoria,identificador, tipo_tour, fecha_inicio, fecha_fin, precio,vaPrecio) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?,?)',
        [id_tour,tour_code, nombre_tour,nombreCategoria,identificador, tipo_tour, fecha_inicio, fecha_fin, precio,vaPrecio]
    );
    console.log(`Departure insertado: ${id_tour}`);
}


// Función para actualizar un tour si es necesario
async function actualizarTourSiEsNecesario(departureData) {
    const { id_tour, nombre_tour, nombreCategoria, tipo_tour, fecha_inicio, fecha_fin, precio } = departureData;

    try {
        // 1. Verificar si el tour ya existe en la base de datos
        const tourExistente = await getTourById(id_tour, fecha_inicio);
        if (!tourExistente) {
            // Si no existe el tour, insertar uno nuevo
            await insertTour(departureData);
            console.log(`Tour insertado: ${id_tour}`);
            return;
        }

        // 2. Comparar los campos y actualizar si es necesario
        let actualizar = false;
        const camposAActualizar = {};

        // Comparar cada campo
        if (tourExistente.nombre_tour !== nombre_tour) {
            camposAActualizar.nombre_tour = nombre_tour;
            actualizar = true;
        }
        if (tourExistente.nombre_categoria !== nombreCategoria) {
            camposAActualizar.nombre_categoria = nombreCategoria;
            actualizar = true;
        }
        if (tourExistente.tipo_tour !== tipo_tour) {
            camposAActualizar.tipo_tour = tipo_tour;
            actualizar = true;
        }
        if (tourExistente.fecha_inicio !== fecha_inicio) {
            camposAActualizar.fecha_inicio = fecha_inicio;
            actualizar = true;
        }
        if (tourExistente.fecha_fin !== fecha_fin) {
            camposAActualizar.fecha_fin = fecha_fin;
            actualizar = true;
        }
        if (tourExistente.precio !== precio) {
            camposAActualizar.precio = precio;
            actualizar = true;
        }

        // 3. Si algún campo es diferente, realizar la actualización
        if (actualizar) {
            const setStatements = Object.keys(camposAActualizar)
                .map(key => `${key} = ?`)
                .join(", ");
            const query = `UPDATE tours SET ${setStatements} WHERE id_tour = ?`;
            const values = [...Object.values(camposAActualizar), id_tour];

            // Ejecutar la actualización
            const [result] = await db.query(query, values);

            if (result.affectedRows > 0) {
                console.log(`Tour actualizado: ${id_tour}`);
            } else {
                console.log(`No se actualizó el tour: ${id_tour}`);
            }
        } else {
            console.log(`No se requiere actualización para el tour: ${id_tour}`);
        }
    } catch (error) {
        console.error(`Error al actualizar el tour ${id_tour}:`, error);
    }
}

async function actualizarFotoPortada(id_tour, foto_portada) {
    const query = "UPDATE tours SET foto_portada = ? WHERE id_tour = ?";
    const [result] = await db.query(query, [foto_portada, id_tour]);

    return result.affectedRows > 0; // Retorna true si se actualizó correctamente
}


// Función para obtener las fotos de la galería por id_tour
async function obtenerFotosPorIdTour(id_tour) {
    const query = "SELECT * FROM fotos_tour WHERE id_tour = ?";
    const [rows] = await db.query(query, [id_tour]);
    return rows.length > 0 ? rows[0] : null;
}

// Función para crear un nuevo registro en fotos_galeria
async function crearFotosGaleria(id_tour, fotos) {
    const fotosJson = JSON.stringify(fotos);
    const query = "INSERT INTO fotos_tour (id_tour, fotos_galeria) VALUES (?, ?)";
    const [result] = await db.query(query, [id_tour, fotosJson]);
    return result.affectedRows > 0;
}

// Función para actualizar las fotos de la galería de un tour
async function actualizarFotosGaleria(id_tour, fotos) {
    const fotosJson = JSON.stringify(fotos);  // Convertimos el array de fotos a JSON
    const query = "UPDATE fotos_tour SET fotos_galeria = ? WHERE id_tour = ?";
    const [result] = await db.query(query, [fotosJson, id_tour]);
    return result.affectedRows > 0;  // Retornamos true si la actualización fue exitosa
}

// Función para actualizar las fotos de la galería en fotos_galeria
 
async function publicarTour(id_tour,publicado) {
    const query = "UPDATE tours SET publicado = ? WHERE id_tour = ?";
    const [result] = await db.query(query, [publicado, id_tour]);
    return result.affectedRows > 0;
}

// Función en el modelo para actualizar la foto principal
async function actualizarFotoPrincipal(id_tour, foto_principal) {
    const query = "UPDATE fotos_tour SET foto_principal = ? WHERE id_tour = ?";
    const [result] = await db.query(query, [foto_principal, id_tour]);
    return result.affectedRows > 0;
  }
  

// DESCRIPCIONES

// Función para verificar si una descripción ya existe en la BD
async function existsTourDescription(id_tour, titulo, descripcion) {
    const query = 'SELECT * FROM tour_descriptions WHERE tour_code = ? AND titulo = ? AND descripcion = ? LIMIT 1';
    const [rows] = await db.query(query, [id_tour, titulo, descripcion]);
    return rows.length > 0;
}

// Función para insertar descripciones con logs de progreso y retorno de estado
async function insertTourDescriptions(tourData, progress) {
    let total = tourData.reduce((acc, tour) => acc + tour.referenceInfo.length, 0);
    let count = 0;

    for (const tour of tourData) {
        for (const ref of tour.referenceInfo) {
            for (const desc of ref.informacion.descriptions) {
                const exists = await existsTourDescription(ref.referenceCode, desc.title, desc.description);
                if (!exists) {
                    await db.query(
                        'INSERT INTO tour_descriptions (tour_code, titulo, descripcion) VALUES (?, ?, ?)',
                        [ref.referenceCode, desc.title, desc.description]
                    );
                }
            }
            count++;
            let percentage = (count / total * 100).toFixed(2);
            progress.descriptions = `${percentage}%`;
            console.log(`Progreso de descripciones: ${percentage}%`);
        }
    }
    console.log("✅ Proceso de inserción de descripciones completado.");
}

// Función para verificar si un itinerario ya existe en la BD
async function existsTourItinerary(id_tour, day_number, titulo, descripcion) {
    const query = 'SELECT * FROM tour_itinerary WHERE tour_code = ? AND day_number = ? AND titulo = ? AND descripcion = ? LIMIT 1';
    const [rows] = await db.query(query, [id_tour, day_number, titulo, descripcion]);
    return rows.length > 0;
}

// Función para insertar itinerario con logs de progreso y retorno de estado
async function insertTourItinerary(tourData, progress) {
    let total = tourData.reduce((acc, tour) => acc + tour.referenceInfo.length, 0);
    let count = 0;

    for (const tour of tourData) {
        for (const ref of tour.referenceInfo) {
            for (const itin of ref.informacion.itinerary) {
                // Validar que el título no esté vacío
                if (!itin.title || itin.title.trim() === "") {
                    console.log(`⏭️ Itinerario ignorado por título vacío - Día ${itin.dayNumber}`);
                    continue;
                }

                const exists = await existsTourItinerary(ref.referenceCode, itin.dayNumber, itin.title, itin.description);
                if (!exists) {
                    await db.query(
                        'INSERT INTO tour_itinerary (tour_code, day_number, titulo, descripcion) VALUES (?, ?, ?, ?)',
                        [ref.referenceCode, itin.dayNumber, itin.title, itin.description]
                    );
                }
            }
            count++;
            let percentage = (count / total * 100).toFixed(2);
            progress.itineraries = `${percentage}%`;
            console.log(`Progreso de itinerarios: ${percentage}%`);
        }
    }
    console.log("✅ Proceso de inserción de itinerarios completado.");
}


// TOURS RECOMENDADOS PUBLICADOS

const regionCountries = {
    "medio-oriente": ["DUBA", "MOTU", "GREC", "LOAP"],
    "asia": ["CHIN"],
    "africa": ["JORD", "EGIP", "MARR"],
    "europa": ["ESP","ALEM"],
};


async function obtenerToursRecomendados(region) {
    const publicado = 1;
    try {
        // Convertir la cadena de países en un array
        let paises = region.split(",").map(p => p.trim());

        // Verificar en qué categoría está el primer país de la lista
        let categoria = Object.keys(regionCountries).find(cat => 
            regionCountries[cat].some(pais => paises.includes(pais))
        );

        // Si se encuentra la categoría, incluir todos los países de la misma categoría
        if (categoria) {
            paises = [...new Set([...paises, ...regionCountries[categoria]])];
        }

        if (paises.length === 0) return null;

        // 1. Obtener todos los tours publicados que coincidan con los países filtrados
        const queryTours = `
        SELECT 
            tours.*, 
            fotos_tour.fotos_galeria 
        FROM 
            tours
        LEFT JOIN 
            fotos_tour ON tours.id_tour = fotos_tour.id_tour
         WHERE 
             publicado = ? AND tipo_tour IN (${paises.map(() => "?").join(",")})
        `;
       
        
        const [tours] = await db.query(queryTours, [publicado, ...paises]);

        if (tours.length === 0) return null;

        // Eliminar duplicados por id_tour
        const uniqueTours = Array.from(new Map(tours.map(tour => [tour.tour_code, tour])).values());

        // 2. Obtener todas las descripciones de los tours obtenidos
        const tourIds = uniqueTours.map(tour => tour.tour_code);

        const queryDescriptions = `
            SELECT tour_code, titulo, descripcion,descripcion_editada
            FROM tour_descriptions 
            WHERE tour_code IN (${tourIds.map(() => "?").join(",")})
        `;

        const [descriptions] = await db.query(queryDescriptions, tourIds);

        // 3. Agrupar descripciones por tour_code
        const descriptionsMap = {};
        descriptions.forEach(desc => {
            const { tour_code, titulo, descripcion,descripcion_editada } = desc;
            if (!descriptionsMap[tour_code]) {
                descriptionsMap[tour_code] = [];
            }
            descriptionsMap[tour_code].push({ titulo, descripcion,descripcion_editada });
        });

        // 4. Agregar las descripciones a cada tour
        let result = uniqueTours.map(tour => ({
            ...tour,
            descriptions: descriptionsMap[tour.tour_code] || []
        }));

        // 5. Seleccionar 6 tours de forma aleatoria sin duplicados
        if (result.length > 6) {
            result = result.sort(() => Math.random() - 0.5).slice(0, 6);
        }

        return result;
    } catch (error) {
        console.error("Error al obtener tours y descripciones:", error);
        return null;
    }

  
}

// async function actualizarDescripcionHotel(id_descripcion,id_tour, descripcion_editada) {
//     const query = "UPDATE tour_descriptions SET descripcion_editada = ? WHERE id = ? AND id_tour = ?";
//     const [result] = await db.query(query, [descripcion_editada,id_descripcion,id_tour]);
//     return result.affectedRows > 0; // Retorna true si la actualización fue exitosa
//   }

async function actualizarDescripcionHotel(id_descripcion, id_tour, descripcion_editada) {
    // Primero verificamos si el id_tour existe en la tabla hoteles_tour
    const querySelect = "SELECT * FROM hoteles_tour WHERE id_tour = ?";
    const [existingHotel] = await db.query(querySelect, [id_tour]);

    if (existingHotel.length > 0) {
        // Si existe, actualizamos la descripcion_editada
        const queryUpdate = "UPDATE hoteles_tour SET hoteles = ? WHERE id_tour = ?";
        const [result] = await db.query(queryUpdate, [descripcion_editada, id_tour]);

        return result.affectedRows > 0; // Retorna true si la actualización fue exitosa
    } else {
        // Si no existe, insertamos un nuevo registro
        const queryInsert = "INSERT INTO hoteles_tour (id_tour, hoteles) VALUES (?, ?)";
        const [result] = await db.query(queryInsert, [id_tour, descripcion_editada]);

        return result.affectedRows > 0; // Retorna true si la inserción fue exitosa
    }
}

// Función para insertar los filtros en la base de datos
async function insertarFiltrosDB(filtros) {
    const query = "INSERT INTO filtros (id_tour, filtro,valor) VALUES (?, ?,?)";
    
    for (const filtro of filtros) {
        await db.query(query, [filtro.id_tour, filtro.filtro,filtro.valor]);
    }
}

// RESETAR BD
async function resetearBDFiltros() {
    try {
        // Borrar todos los registros de la tabla
        const query = 'DELETE FROM filtros';
        await db.query(query);

        // Reiniciar el valor del AUTO_INCREMENT a 1
        const query2 = 'ALTER TABLE filtros AUTO_INCREMENT = 1';
        await db.query(query2);

        console.log("Base de datos reseteada exitosamente");
    } catch (error) {
        console.error("Error al resetear la base de datos:", error);
        throw error; // Re-lanzar el error para manejarlo en otro lugar si es necesario
    }
}

async function obtenerConversion() {
    try {
        const query = `SELECT precio FROM conversion_surland WHERE id = 1`;
        const [rows] = await db.query(query);

        if (rows.length === 0) return null;

        return rows[0].precio;
    } catch (error) {
        console.error("Error al obtener el precio de conversión:", error);
        return null;
    }
}


module.exports = {
    obtenerToursBase,
    obtenerTourPublicados,
    obtenerTotalTours,
    obtenerOpcionesTours,
    obtenerCategoriasPreciosTours,
    obtenerTourPublicadosCategoria,
    obtenerTourPublicado,
    getTourById,
    resetearBD,
    insertTour,
    actualizarTourSiEsNecesario,
    actualizarFotoPortada,
    actualizarFotosGaleria,
    obtenerFotosPorIdTour,
    crearFotosGaleria,
    publicarTour,
    actualizarFotoPrincipal,
    existsTourDescription,
    insertTourDescriptions,
    existsTourItinerary,
    insertTourItinerary,
    obtenerDescripcionesTour,
    obtenerItinerarioTour,
    obtenerToursRecomendados,
    actualizarDescripcionHotel,
    insertarFiltrosDB,
    resetearBDFiltros,
    obtenerConversion
};
