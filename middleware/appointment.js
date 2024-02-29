const {ObjectId} = require("mongodb");
const addStatutAppointmentMiddlewareForClient = async (req, res, next) => {
// get criteria, parse it from base64 and the above property and update the criteria in request
    let criteria = req.query.criteria
    try {
        criteria = JSON.parse(atob(criteria));
    } catch (e) {
        criteria = req.body
    }
    criteria.search['$and'].push({
        status: {
            "$ne": {
                "$oid": "65c23d5d3fe8b2bd4b8f7e0c"
            }
        }
    })
    req.query.criteria = btoa(JSON.stringify(criteria))
//     call next
    next()
}

exports.addStatutAppointmentMiddlewareForClient = addStatutAppointmentMiddlewareForClient;
