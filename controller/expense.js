const { ObjectId } = require('mongodb');
const { sendError } = require("../utilities/response");

/*
 de la forme depense post
*/
const insertDepense = async (req, res) => {
     const db = req.db;
     const body = req.body;

     //vérifier que le type de dépense existe
     db.collection("type_depense").findOne({ _id: new ObjectId(body.type_depense) }).then(async (result) => {
          if (result == null) sendError(res, "Le type de dépense n'existe pas", 500);
          var depense = null;

          //vérifier si la dépense existe déjà
          // depense = await db.collection("depense").findOne({ type_depense: new ObjectId(body.type_depense), annee_mois: body.annee_mois })
          if ( body._id!=undefined) {
               db.collection("depense").updateOne({ _id: new ObjectId(body._id ) }, { $set: { montant: body.montant } }).then((result2) => {
                    res.status(201).send(result2);
               }).catch((error) => sendError(res, error, 500));
          } else {
               db.collection("depense").insertOne({
                    montant: body.montant,
                    type_depense: result,
                    annee_mois: body.annee_mois
               }).then((result3) => {
                    res.status(201).send({
                         code: 201,
                         message: "La dépense à été mise à jour",
                         data: result3
                    });
               }).catch((error) => sendError(res, error, 500));
          }
     })

}

exports.expenseController = {
     insertDepense
}
