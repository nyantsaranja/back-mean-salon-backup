const {format, fillMissingDates} = require("./util");
const {turnoverService} = require("./turnover");
const incomePerMonth = async (req, res) => {
    const db = req.db;
    const depense_coll = db.collection('depense');
    let body = null;

    try {
        body = JSON.parse(atob(req.query.criteria))
    } catch (e) {
        body = req.body
    }

    console.log("body",body)

    const startDate = new Date(body.startDate)
    const endDate = new Date(body.endDate)
    const filter = body.filter
    const result = await depense_coll.aggregate([
        {
            $match: {
                annee_mois: {
                    $gte: startDate.toISOString().substring(0, 7), // Extracting YYYY-MM from the date
                    $lte: endDate.toISOString().substring(0, 7)
                }
            }
        },
        {
            $group: {
                _id: {
                    date : "$annee_mois"
                },
                totalDepense: {$sum: "$prix"}
            }
        },
        {
            $sort: {"_id": 1}
        }
    ]).toArray();
    const column = "totalDepense"
    const response = format(fillMissingDates(result, startDate, endDate, filter, column), column)
    console.log(response)
    const rendez_vous_detail_coll = db.collection('detail_rendez_vous');

    const turnover = await turnoverService.computeTurnover(rendez_vous_detail_coll, "", new Date(body.startDate), new Date(body.endDate), filter)
    console.log(turnover)

//     replace turnover.data[index] with turnover.data[index]- response.data[index]
    for (let i = 0; i < response.data.length; i++) {
        response.data[i] = turnover.data[i] - response.data[i]
    }
    res.send({
        code: 200,
        message: "Income per month",
        data: response
    })
}

exports.incomeService = {
    incomePerMonth
}