const ObjectId = require('mongodb');

const search_pattern = (date_heure_debut, enddate, detail, rendez_vous) => {
    return {
        "$and": [
            {
                "$or": [
                    {
                        "$and": [
                            {
                                date_heure_debut: {"$lte": date_heure_debut}
                            }
                            ,
                            {
                                date_heure_fin: {"$gt": date_heure_debut}
                            }
                        ]
                    }
                    ,
                    {

                        "$and": [
                            {
                                date_heure_debut: {"$lte": enddate}
                            }
                            ,
                            {
                                date_heure_fin: {"$gt": enddate}
                            }
                        ]
                    }
                ]
            },
            {
                employee: detail.employee
            },
            {
                rendez_vous: {
                    "$ne": rendez_vous
                }
            }
        ]
    }
}

exports.search_pattern_update = search_pattern;