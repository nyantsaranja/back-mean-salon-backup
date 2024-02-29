const {crud} = require("./crud");
const {ObjectId} = require("mongodb")
const {orderDates, fillMissingDates, format} = require("./util");


function format2(result) {
    let array = []
    result.forEach(r => {
            array.push({
                personne: r._id.employee !== undefined ? r._id.employee : r._id,
                totalWorkHours: r.totalWorkHours
            })
        }
    )
    return array
}

function removeDuplicatedWithZero(r) {
//     add the person in a new array : do not add if already in the array exept if the totalWorkHours is not 0 then replace the totalWorkHours
    let array = []
    console.log("r", r)
    r.forEach(r1 => {
            let index = array.findIndex(a => a.personne.toString() === r1.personne.toString())
            console.log("index", index)
            if (index === -1) {
                console.log("push", r1)
                array.push(r1)
            } else {
                console.log("totalWorkHours", r1.totalWorkHours)
                if (r1.totalWorkHours !== 0) {
                    array[index].totalWorkHours = r1.totalWorkHours
                }
            }
        }
    )

    // order by totalWorkHours desc
    array.sort((a, b) => {
            return b.totalWorkHours - a.totalWorkHours
        }
    )
    return array

}

const getWorkTimeByMonths = async (req, res) => {
    const employeeId = req.params.employeeId;
    console.log(employeeId)
    let body = null;

    try {
        body = JSON.parse(atob(req.query.criteria))
    } catch (e) {
        body = req.body
    }

    body = body.search

    const db = req.db;
    const startDate = new Date(body.startDate)
    const endDate = new Date(body.endDate)
    const filter = body.filter
    console.log(startDate, endDate)
    const rendez_vous_detail_coll = db.collection('detail_rendez_vous');

    const result = await rendez_vous_detail_coll.aggregate([
        {
            $match: {
                date_heure_fin: {$gte: startDate, $lte: endDate}
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
                    employee: "$employee",
                },
                totalWorkHours: {
                    $sum: {
                        $divide: [
                            {$subtract: ["$date_heure_fin", "$date_heure_debut"]},
                            3600000  // Convert milliseconds to hours
                        ]
                    }
                }
            }
        },
        {
            $sort: {"_id.date": 1}
        },
        {
            $unionWith: {
                coll: "personne", // Replace "employees" with the actual name of your employee collection
                pipeline: [
                    {
                        $match: {
                            // Add any additional conditions if needed
                            type: new ObjectId("65c220963fe8b2bd4b8f7d78")
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            totalWorkHours: {$literal: 0} // Set totalWorkHours to 0 for employees without rendez_vous_detail entries
                        }
                    }
                ]
            }
        },
        {
            $sort: {"_id.employee": 1}
        }
    ]).toArray();

    console.log("result", result)
    const response = removeDuplicatedWithZero(format2(result))
    console.log("reponse ", response)
    const r = await crud.addObjectReferenced(response, req.db)
    // console.log("r",r)

    res.send({
        code: 200,
        message: "Success",
        data: r
    })
    // console.log(result)
    // const column = "totalWorkHours"
    // const response = format(fillMissingDates(result, startDate, endDate, filter, column), column)
    // res.send({
    //     code: 200,
    //     message: "Success",
    //     data: response
    // })
}

exports.workTimeStats = {
    getWorkTimeByMonths
}