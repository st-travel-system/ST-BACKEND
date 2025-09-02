const VehiculoModel = require("../../models/tour/index");

const UsuarioModel = require("../../models/usuario/index");

const LoteModel = require("../../models/lote/index");

const SolicitudAutoModel = require("../../models/solicitudes-auto/index");

const mongoose = require("mongoose");

// const fs = require("fs");
// const path = require("path");

// const { limpiarUrl } = require("../../utils/url");

class ReportesController {
  constructor() { }

  reportes_vendedor = async (req, res) => {
    try {
      const usuario = req.params.usuario;
  
      // Obtener los últimos 5 vehículos ordenados por fecha de creación
      const vehiculos = await VehiculoModel.aggregate([
        { $match: { usuario } }, // Filtrar por el usuario proporcionado
        { $sort: { fecha_creacion: -1 } }, // Ordenar por fecha de creación descendente
        { $limit: 5 } // Limitar a los últimos 5 vehículos
      ]);
  
      // Contar el total de vehículos del usuario
      const totalVehiculos = await VehiculoModel.countDocuments({ usuario });
  
      // Contar el total de vehículos validados del usuario
      const totalVehiculosValidados = await VehiculoModel.countDocuments({ usuario, validado: 1 });

      // Contar la cantidad de lotes del vendedor
      const totalLotes = await LoteModel.countDocuments({ usuario });

        // Obtener los últimos 4 lotes ordenados por fecha de creación
        const lotes = await LoteModel.aggregate([
         { $match: { usuario } }, // Filtrar por el usuario proporcionado
         { $sort: { fecha_creacion: -1 } }, // Ordenar por fecha de creación descendente
         { $limit: 5 } // Limitar a los últimos 5 vehículos
       ]);
  
  
  
      return res.json({
        ok: true,
        vehiculos,
        totalVehiculos,
        totalVehiculosValidados,
        totalLotes,
        lotes
      });
    } catch (error) {
      console.error("Error al obtener los últimos vehículos:", error);
      return res.status(500).json({
        ok: false,
        message: "Error al obtener los últimos vehículos",
      });
    }
  };
  
  
  reportes_admin = async (req, res) => {
    try {
  
       // Contar el total de vendedores
       const totalVendedores = await UsuarioModel.countDocuments({ rol : 'VENDEDOR' });

       const totalSolicitudesAutos = await SolicitudAutoModel.countDocuments({});

       const totalVehiculosPorValidar = await VehiculoModel.countDocuments({ validado: 0 });

       const totalVendedoresPorValidar = await UsuarioModel.countDocuments({ validado : 0 });
  
      // Obtener los últimos 10 solicitudes de compra
      const solicitudes = await SolicitudAutoModel.aggregate([
        { $sort: { fecha_creacion: -1 } }, // Ordenar por fecha de creación descendente
        { $limit: 10 } // Limitar a los últimos 5 vehículos
      ]);
  
  
      return res.json({
        ok: true,
        totalVendedores,
        totalSolicitudesAutos,
        totalVehiculosPorValidar,
        totalVendedoresPorValidar,
        solicitudes
      });
    } catch (error) {
      console.error("Error al obtener los reportes:", error);
      return res.status(500).json({
        ok: false,
        message: "Error al obtener los reportes",
      });
    }
  };

  reportes_admin_estadisticas = async (req, res) => {
    try {
      const totalSolicitudesAutos = await SolicitudAutoModel.countDocuments({});
      const totalVehiculosValidados = await VehiculoModel.countDocuments({ validado: 1 });
  
      const startDate = new Date(new Date().getFullYear(), 0, 1); // 1 de enero del año actual
      const endDate = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59, 999); // 31 de diciembre del año actual
  
      // Agregación para obtener datos por mes
      const resultados = await VehiculoModel.aggregate([
        {
          $match: {
            fecha_creacion: { $gte: startDate, $lte: endDate }, // Rango de fechas
          },
        },
        {
          $addFields: {
            validadoInt: { $toInt: "$validado" }, // Convertir `validado` a número
          },
        },
        {
          $group: {
            _id: { month: { $month: "$fecha_creacion" } },
            totalVerificados: {
              $sum: { $cond: [{ $eq: ["$validadoInt", 1] }, 1, 0] },
            },
            totalPorVerificar: {
              $sum: { $cond: [{ $eq: ["$validadoInt", 0] }, 1, 0] },
            },
          },
        },
        {
          $sort: { "_id.month": 1 }, // Ordenar por mes
        },
      ]);
  
      console.log("Resultados de la agregación:", JSON.stringify(resultados, null, 2)); // Log intermedio
  
      // Mapear resultados para todos los meses
      const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
      const vehiculosPorMes = meses.map((mes, index) => {
        const datosMes = resultados.find((r) => r._id.month === index + 1) || {
          totalVerificados: 0,
          totalPorVerificar: 0,
        };
        console.log(`Mes: ${mes}, Datos:`, datosMes); // Log por mes
        return {
          mes,
          totalVerificados: datosMes.totalVerificados,
          totalPorVerificar: datosMes.totalPorVerificar,
        };
      });
  
      // Respuesta al cliente
      return res.json({
        ok: true,
        totalSolicitudesAutos,
        totalVehiculosValidados,
        vehiculosPorMes,
      });
    } catch (error) {
      console.error("Error al obtener los reportes:", error);
      return res.status(500).json({
        ok: false,
        message: "Error al obtener los reportes",
      });
    }
  };
  
  
  
  
}

module.exports = new ReportesController();