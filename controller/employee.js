const { checkFormatHour, compareHours } = require("../utilities/formatCheck")
const { sendError } = require("../utilities/response");
const { ObjectId } = require('mongodb');

/* employe/id/schedule post */
const insertNewSchedule = async (req, res) => {
     const db = req.db;
     const id = req.params.id;

     const body = req.body;
     if (!checkFormatHour(body.heure_debut) || !checkFormatHour(body.heure_fin)) sendError(res, "Format de heure non valide", 500)
     if (compareHours(body.heure_debut, body.heure_fin) >= 0) sendError(res, "Les heures ne sont pas cohérentes", 500)
     const date = new Date();

     try {
          const session = req.clientdb.startSession();
          session.startTransaction();

          // get the current schedule and modify it
          const currentSchedule = await db.collection("horaire_travail").find({ date_fin: null, employee: new ObjectId(id) }).toArray();
          if (currentSchedule != null && currentSchedule.length > 0) {
               for (const schedule of currentSchedule) {
                    await db.collection("horaire_travail").updateOne({ _id: new ObjectId(schedule._id) }, { $set: { date_fin: date } });
               }
          }

          //insert the new schedule
          const newSchedule = {
               employee: new ObjectId(id),
               heure_debut: body.heure_debut,
               heure_fin: body.heure_fin,
               date_debut: date,
               date_fin: null
          }
          await db.collection("horaire_travail").insertOne(newSchedule);

          session.commitTransaction();
          res.send({
               code: 201,
               message: "Le nouvel horaire a été enregistré avec succès",
               data: newSchedule
          });
     } catch (error) {
          console.log(error);
          sendError(res, error, 500)
     }
}
const findCurrentSchedule = async (req, res) => {
     const db = req.db;
     const id = req.params.id;
     try {
          const schedule = await db.collection("horaire_travail").find({ employee: new ObjectId(id), date_fin: null }).toArray();
          res.send({
               code: 200,
               message: "Les horaires de travail ont été récupérés avec succès",
               data: schedule.length > 0 ? schedule[0] : null
          });
     } catch (error) {
          console.log(error);
          sendError(res, error, 500)
     }
}
const findSchedule = async (req, res) => {
     const db = req.db;
     const id = req.params.id;
     try {
          const schedule = await db.collection("horaire_travail").find({ employee: new ObjectId(id) }).sort({ date_debut: -1 })
               .toArray();
          res.send({
               code: 200,
               message: "Les horaires de travail ont été récupérés avec succès",
               data: schedule
          });
     } catch (error) {
          console.log(error);
          sendError(res, error, 500)
     }
}
exports.employeeController = {
     insertNewSchedule, findCurrentSchedule, findSchedule
}
