const { generateReferencePayment } = require('../service/util')
const { sendError } = require("../utilities/response");
const { ObjectId } = require('mongodb');
const {notificationService} = require('../service/notification/notification')
const collection = 'rendez_vous'

/* Payment for appointment
* @param {Object} req (body: mode_paiement), url with id of appointment
*/
const payAppointment = async (req, res) => {
     const id = req.params.id;
     const db = req.db;
     const objectId = new ObjectId(id);
     try {
          const appointment = await db.collection(collection).findOne({ _id: objectId });
          if (appointment.status!=null && appointment.status.code === 'TEP') sendError(res,'Payment already done', 500);

          const mode_paiement = await db.collection('mode_paiement').findOne({ _id: ObjectId(req.body.mode_paiement) });
          if (!mode_paiement) return sendError(res, 'Mode paiement not found', 404);

          const status = await db.collection('statut_rendez_vous').findOne({ code: 'TEP' });
          if (!status) return sendError(res, 'Status not found', 404);
          const session = req.clientdb.startSession();
          session.startTransaction();
          /* change the status of the appointment to "terminé et payé" */
          await db.collection(collection).updateOne({ _id: objectId }, { $set: { status: status } });

          /* save the payment */
          await db.collection('paiement').insertOne(
               {
                    rendez_vous: objectId,
                    date_heure_paiement: new Date(),
                    mode_paiement: mode_paiement,
                    reference: generateReferencePayment(mode_paiement)
               });

          session.commitTransaction();
          try{
               notificationService.paymentNotificationAndEmail(id,mode_paiement.nom,db)
          }catch(error){
               console.error(error);
          }
          res.send({
               code: 201,
               message: "Le paiement a été effectué avec succès"
          });
     } catch (error) {
          sendError(res, error, 500)
     }
}

const findById = async (req, res) => {
     const id = req.path.split("/")[2];
     const db = req.db;
     // console.log(id);
     db.collection(collection).findOne({ _id: new ObjectId(id) }).then(async (result) => {
          if (result == null) return sendError(res, 'Appointment not found', 404);
          const services = await db.collection('detail_rendez_vous').aggregate([
               {
                    $match: {
                         rendez_vous: new ObjectId(result._id)
                    }
               },
               {
                    $lookup: {
                         from: "service",
                         localField: "service",
                         foreignField: "_id",
                         as: "service"
                    }
               },
               {
                    $unwind: "$service"
               },
               {
                    $lookup: {
                         from: "personne",
                         localField: "employee",
                         foreignField: "_id",
                         as: "employee"
                    }
               },
               {
                    $unwind: "$employee"
               },
               {
                    $project: {
                         "service": "$service",
                         "employee": "$employee",
                         _id: "$_id",
                    }
               }
          ]).toArray();
          result.services = services;
          res.status(200).json(result);
     }).catch((err) => {
          sendError(res, err, 500);
     });
}

exports.appointmentService = {
     payAppointment,
     findById
} 
