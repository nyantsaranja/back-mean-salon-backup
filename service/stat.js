

const numberOfAppointment = (db, startDate, endDate, byWhat = "day") => {
     const newStartDate = new Date(startDate);
     const newEndDate = new Date(endDate);
     newStartDate.setHours(0, 0, 0, 0);
     newEndDate.setHours(23, 59, 59, 999);
     const champDate = byWhat !== "day" ? {
          yearMonth: { $dateToString: { format: "%Y-%m", date: "$date_heure_debut" } } // Créer un champ année-mois
     } : { day: { $dateToString: { format: "%Y-%m-%d", date: "$date_heure_debut" } } };
     const groupBy = byWhat !== "day" ? "$yearMonth" : "$day";


     // Liste des jours/mois dans l'intervalle
     const listOfDate = [];
     let tempStartDate = new Date(startDate);

     // Générer une liste de tous les jours dans l'intervalle
     while (tempStartDate <= newEndDate) {
          const tempDate = tempStartDate.toISOString().slice(0, byWhat !== 'day' ? 7 : 10); // Récupérer YYYY-MM-DD
          listOfDate.push(tempDate);
          tempStartDate.setDate(byWhat !== 'day' ? (tempStartDate.getMonth()) : (tempStartDate.getDate()) + 1);
     }

     return new Promise((resolve, reject) => {
          db.collection('rendez_vous').aggregate([
               {
                    $match: {
                         "status.code": { $ne: 'ANL' }, // Filtrer les documents où le statut n'est pas annulé
                         date_heure_debut: { $gte: newStartDate, $lte: newEndDate }
                    }
               },
               {
                    $project: champDate
               },
               {
                    $group: {
                         _id: groupBy, // Regrouper par année-mois
                         count: { $sum: 1 } // Compter le nombre de documents par groupe
                    }
               },
               {
                    $project: {
                         _id: 0, // Exclure l'id du résultat
                         date: "$_id", // Renommer le champ _id en annee_mois
                         count: 1 // Inclure le comptage
                    }
               },
               {
                    $sort: { "date": 1 } // Trie par jour de manière ascendante
               }
          ]).toArray().then(result => {
               // Créer un dictionnaire à partir du résultat pour une recherche plus rapide
               const appointments = Object.fromEntries(result.map(({ date, count }) => [date, count]));

               // Parcourir tous les jours dans l'intervalle pour remplir les jours manquants avec un compteur à 0
               const resultFinal = listOfDate.map(date => ({ date, count: appointments[date] || 0 }));
               resolve(resultFinal);

          }).catch(error => reject(error));
     });
}

exports.statService = {
     numberOfAppointment
}
