const search_pattern = (date_heure_debut, enddate, detail) => {
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
            }
        ]
    }
}

exports.search_pattern = search_pattern;


const s = {
    "search": {
        "$or": [
            {
                "$and": [
                    {
                        "date_heure_debut": {
                            "gte": {
                                "$date": "2024-03-11T06:00:00.000Z"
                            }
                        }
                    }, {
                        "date_heure_debut": {
                            "lt": {
                                "$date": "2025-03-11T06:00:00.000Z"
                            }
                        }
                    }
                ]
            }, {
                "$and": [
                    {
                        "date_heure_fin": {
                            "gte": {
                                "$date": "2024-03-11T06:00:00.000Z"
                            }
                        }
                    }, {
                        "date_heure_fin": {
                            "lt": {
                                "$date": "2025-03-11T06:00:00.000Z"
                            }
                        }
                    }
                ]
            }
        ]
    }
}