const {ObjectId} = require('mongodb');
const {fillMissingDates, format} = require("./util");

const computeTurnover = async (rendez_vous_detail_coll, employeeId, startDate, endDate, filter) => {
    const result = await rendez_vous_detail_coll.aggregate([
        {
            $match: {
                // 'employee': new ObjectId(employeeId),
                // $or: [
                //     {
                date_heure_fin: {$gte: startDate, $lte: endDate}
                // }
                // ]
            }
        },
        {
            $lookup: {
                from: 'rendez_vous',
                localField: 'rendez_vous',
                foreignField: "_id",
                as: "rendezVousDetails"
            },
        },
        {
            $match: {
                "rendezVousDetails.status": new ObjectId("65c23da33fe8b2bd4b8f7e0f")
            }
        },
        {
            $group: {
                _id: {
                    date: {
                        $dateToString: {
                            format: filter === "D" ? "%Y-%m-%d" : "%Y-%m",
                            date: "$date_heure_fin"
                        }
                    }
                },
                totalPrix: {
                    $sum: "$prix"
                }
            }
        },
        {
            $sort: {"_id.date": 1}
        }
    ]).toArray();

    const column = "totalPrix"
    return format(fillMissingDates(result, startDate, endDate, filter, column), column)
}

const turnoverPerMonthsAndDays = async (req, res) => {
    const employeeId = req.params.employeeId;
    console.log(employeeId)

    let body = null;

    try {
        body = JSON.parse(atob(req.query.criteria))
    } catch (e) {
        body = req.body
    }

    console.log("body",body)

    const db = req.db;
    const startDate = new Date(body.startDate)
    const endDate = new Date(body.endDate)
    const filter = body.filter
    console.log(startDate, endDate)
    const rendez_vous_detail_coll = db.collection('detail_rendez_vous');

    const result = await computeTurnover(rendez_vous_detail_coll, employeeId, startDate, endDate, filter)
    res.send({
        code: 200,
        message: "Turnover per months and days",
        data: result
    })
}

exports.turnoverService = {
    turnoverPerMonthsAndDays,
    computeTurnover
}