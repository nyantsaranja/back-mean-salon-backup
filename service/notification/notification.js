const { sendError } = require("../../utilities/response");
const { appointmentServiceCrud } = require("../appointment/appointment");
const { adminService } = require("../admin");
const { emailSender } = require("./emailSender");
const { ObjectId } = require('mongodb');

const insertNotification = async (notification, db) => {
     return db.collection('notification').insertOne(notification);
}

const findAllNotificationByClient = async (page, client, db) => {
     return db.collection('notification').find({
          $or: [{ client: new ObjectId(client) }, { client: null }]
     }
     ).sort({ date_creation: -1 }).skip(page.size * page.number).limit(page.size).toArray();
}
const paymentNotificationAndEmail = async (idAppointment, modepaiment, db) => {
     try {
          const type_notification = await db.collection('type_notification').findOne({ code: "RPL" });
          if (type_notification == null) sendError(res, 'Type notification not found', 404);

          //get All appointment details
          const appointment = await appointmentServiceCrud.findById(idAppointment, db);
          if (appointment == null) sendError(res, 'Appointment not found', 404);

          //get the admin
          const admins = await adminService.findAll(db);

          //insert the notification for the client
          const notification = {
               contenu: `Cher ${appointment.client.nom}, votre rendez-vous a été payé avec succès. \n
               Vous avez payé ${appointment.prix} Ar pour le rendez-vous du ${appointment.date_heure_debut}, par ${modepaiment} \n
               Merci de votre confiance. \n
               Cordialement, \n
               l'équipe de RANDRIANARISON Mendrika ETU001639 et de RANJALAHY Ny Antsa ETU001645.`,
               client: appointment.client._id,
               date_creation: new Date(),
               type_notification: type_notification,
          }
          insertNotification(notification, db);

          //send the email to the client
          const subject = "Paiement rendez-vous";
          const text = `Cher ${appointment.client.nom}, votre rendez-vous a été payé avec succès. \n
          Vous avez payé ${appointment.prix} Ar pour le rendez-vous du ${appointment.date_heure_debut}, par ${modepaiment} \n
          Merci de votre confiance. \n
          Cordialement, \n
          l'équipe de RANDRIANARISON Mendrika ETU001639 et de RANJALAHY Ny Antsa ETU001645.`;
          emailSender.sendEmail(appointment.client.email, subject, text);

          //send the email to the admin
          const subjectAdmin = "Paiement rendez-vous";
          const textAdmin = `Le rendez-vous de ${appointment.client.nom},le ${appointment.date_heure_debut}, d'une somme de ${appointment.prix} Ar a été payé avec succès. \n
          ref: ${appointment.reference} \n
          Cordialement \n`;
          for (admin of admins) {
               emailSender.sendEmail(admin.email, subjectAdmin, textAdmin);
          }

     } catch (error) {
          console.error(error);
     }

}
/**
 * 
 * @param {*, le service doit être détaillé} specialOffer 
 * @param {*} db 
 */
const specialOfferNotification = async (specialOffer, db) => {
     try {
          const type_notification = await db.collection('type_notification').findOne({ code: "PUB" });
          if (type_notification == null) sendError(res, 'Type notification not found', 404);

          const notification = {
               contenu: `Nous avons une offre spécial du ${specialOffer.date_heure_debut} au ${specialOffer.date_heure_fin}. ${specialOffer.description}`,
               client: null,
               date_creation: new Date(),
               type_notification: type_notification,
          }
          insertNotification(notification, db);

     } catch (error) {
          console.error(error);
     }
}

const appointmentNotification = async (appointment, db) => {
     try {
          const type_notification = await db.collection('type_notification').findOne({ code: "RPL" });

          const content = `Ceci est un rappel de votre rendez-vous dans notre salon de beauté qui se déroulera` +
               ` le ${appointment.date_heure_debut} à ${appointment.date_heure_fin}. \n`
               + `Merci de votre confiance. \n`;
          const subject = "Rappel rendez-vous";
          const notification = {
               contenu: content,
               client: appointment.client,
               date_creation: new Date(),
               type_notification: type_notification
          }
          insertNotification(notification, db);
          await emailSender.sendEmail(appointment.client.email, subject, content);
     } catch (e) {
          console.error(e);
     }
}


/**Rappel des rendez vous client en cours */
const rappel = async (db) => {
     // console.log("ca passe ici");
     try {
          let demain = new Date();
          demain.setDate(demain.getDate() + 1); // Incrémente la date d'un jour

          const appointments = await db.collection('rendez_vous').find(
               {
                    $expr: {
                         $eq: [
                              { $dateToString: { format: "%Y-%m-%d", date: "$date_heure_debut" } },
                              { $dateToString: { format: "%Y-%m-%d", date: demain } }
                         ]
                    }

               }
          ).toArray();

          if (appointments == null) return;
          for (appointment of appointments) {
               appointmentNotification(appointment, db);
          }
     } catch (e) {
          console.error(e);
     }
     // Votre fonction à exécuter
     console.log('La fonction s\'exécute tous les jours à 10h');
};

exports.notificationService = {
     insertNotification,
     findAllNotificationByClient,
     paymentNotificationAndEmail,
     specialOfferNotification,
     rappel
}

