const { ObjectId } = require("mongodb");
const { sendError } = require('../utilities/response')
const { notificationService } = require('../service/notification/notification')

const findCurrentsSpecialOffer = (req, res) => {
     const db = req.db;
     const currentDate = (new Date()).toISOString().substring(0, 16);
     db.collection("offre_speciale")
          .find({ date_heure_debut: { $lte: currentDate }, date_heure_fin: { $gte: currentDate } })
          .sort({ date_heure_debut: -1 })
          .toArray().then((result) => {
               res.status(200).send({code:200, message:"List special offer",data:result});
          }).catch(error => sendError(res, error, 500));
}

const createSpecialOffer = (req, res) => {
     const db = req.db;
     var offre = req.body;
     db.collection('service').findOne({_id: new ObjectId(offre.service)}).then((result) => {
          if (!result) {
               sendError(res, "Le service n'existe pas", 500);
          }
          offre={...offre, service: result}
          delete offre._id
          db.collection("offre_speciale").insertOne(offre).then((result) => {
               try {
                    notificationService.specialOfferNotification(offre, db);
               } catch (e) {
                    console.error(e);
               }
               res.status(201).send({code:200, message:"Offre spécial créée",data:result});
          }).catch(error => sendError(res, error, 500));
     }) 
}

module.exports = {
     findCurrentsSpecialOffer,
     createSpecialOffer
}
