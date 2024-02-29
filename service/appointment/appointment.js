const {convertObjectId} = require("../../utilities/objectId");
const {convertToDate} = require("../../utilities/date");
const {ObjectId} = require('mongodb');
const {sendError} = require("../../utilities/response");
const {ignore} = require("nodemon/lib/rules");
const {crud} = require('../../service/crud')
const {search_pattern} = require("../../pattern/employeeAppointmentAvailability");
const {search_pattern_update} = require("../../pattern/employeeAppointmentAvalaibilityUpdate");


let selectedEmployees = [];
// const create = async (req, res) => {
//     const clientdb = req.clientdb;
//     let body = req.body;
//
//     if (body === undefined || body === null) return sendError(res, 'No body', 500);
//     if (body.appointment === undefined || body.appointment === null) return sendError(res, 'No appointment', 500);
//     if (body.details === undefined || body.details === null) return sendError(res, 'No details', 500);
//
//     body = convertObjectId(body);
//     body = convertToDate(body);
//
//     let createdAppointmentId = null;
//     let session = null;
//     session = clientdb.startSession();
//     session.withTransaction(
//         async () => {
//             let result = await crud.create('rendez_vous', req.db, body.appointment);
//             createdAppointmentId = result.ops[0]._id;
//
//             await body.details.map(detail => {
//                     detail.rendez_vous = createdAppointmentId;
//                 }
//             )
//
//             // await crud.create('rendez_vous_details', req.db, body.details)
//             await req.db.collection('detail_rendez_vous').insertMany(body.details)
//         }
//     ).catch(error => {
//             sendError(res, error, 500)
//         }
//     )
//
//     console.log('All', body)
//
//     res.send('create appointment');
// }

const create = async (req, res) => {
    try {
        let body = req.body
        body = convertObjectId(body);
        body = convertToDate(body);
        if (body === undefined || body === null) return sendError(res, 'No body', 500);
        let appointment = body.appointment;
        if (appointment === undefined || appointment === null) return sendError(res, 'No appointment', 500);
        let details = body.details;
        if (details === undefined || details === null) return sendError(res, 'No details', 500);

        appointment.status = new ObjectId("65c23d803fe8b2bd4b8f7e0d");

        let startdate = new Date(appointment.date_heure_debut);

        let appointmentsDetails = [];
        let sumPrice = 0;
        selectedEmployees = [];

        for (let detail of details) {
            let availability = await getAvailability(detail, startdate, req.db);
            appointmentsDetails.push(availability);
            startdate = availability.date_heure_fin;
            sumPrice += availability.prix;
        }

        appointment.prix = sumPrice;
        appointment.date_heure_fin = startdate;

        let session = req.clientdb.startSession();
        session.withTransaction(
            async () => {
                let result = await crud.create('rendez_vous', req.db, appointment);
                let createdAppointmentId = result.ops[0]._id;
                appointmentsDetails.map(detail => {
                    detail.rendez_vous = createdAppointmentId;
                })
                await req.db.collection('detail_rendez_vous').insertMany(appointmentsDetails)
                res.send({
                    code: 200,
                    message: "Appointment created",
                    data: appointment
                });
            }
        ).catch(error => {
                sendError(res, error, 500)
            }
        )
    } catch (e) {
        console.log('Error:', e)
        sendError(res, e.message, 500)
    }

}

const getAvailableEmployee = async (date_heure_debut, enddate, db, avoidHimself = false, rendez_vous_id) => {
    const clients = await db.collection("personne").find({
        'type._id': new ObjectId("65c220963fe8b2bd4b8f7d78")
    }).toArray()
    // console.log('clients', clients)
    let detail = {};
    for (let client of clients) {
        detail.employee = client._id;
        let detail_rendez_vous = await db.collection('detail_rendez_vous').find(avoidHimself === false ? search_pattern(date_heure_debut, enddate, detail) : search_pattern_update(date_heure_debut, enddate, detail, rendez_vous_id)).toArray()

        // get the latest work time of the employee
        let horaire_travail = await db.collection('horaire_travail').find({employee: client._id}).sort({date_debut: -1}).limit(1).toArray()
        if (horaire_travail.length === 0) {
            return null;
        }

        let date_debut = new Date(horaire_travail[0].date_debut);
        let date_fin = new Date(horaire_travail[0].date_fin);
        if (date_heure_debut < date_debut || enddate > date_fin) {
            return null;
        }

        if (detail_rendez_vous.length === 0 && selectedEmployees.indexOf(client._id) === -1) {
            selectedEmployees.push(client._id);
            return client._id;
        }
    }
    return null;
}

const getAvailability = async (detail, date_heure_debut, db, avoidHimself = false, rendez_vous_id) => {
    // get the service
    const service = await crud.findOne('service', db, detail.service);
    const enddate = new Date(date_heure_debut.getTime() + (service.duree * 60000));
    //     set automatic employee if not provided
    if (detail.employee === undefined || detail.employee === null) {
        detail.employee = await getAvailableEmployee(date_heure_debut, enddate, db, avoidHimself, rendez_vous_id)
        // console.log('employee', detail.employee)
        if (detail.employee === null) {
            throw new Error('No employee available')
        }
    }
    //     get the availability of the employee for the date_heure_debut and date_heure_fin
    let appointments = await db.collection('detail_rendez_vous').find(avoidHimself === false ? search_pattern(date_heure_debut, enddate, detail) : search_pattern_update(date_heure_debut, enddate, detail, rendez_vous_id)).toArray()
    if (appointments.length !== 0) {
        throw new Error('Not available')
    }

    // check if there is a special offer on the dates and for the service
    let special_offer = await db.collection('offre_speciale').findOne({
        service: detail.service,
        date_debut: {"$lte": date_heure_debut},
        date_fin: {"$gte": date_heure_debut}
    })

    let appointment = {
        date_heure_debut: date_heure_debut,
        date_heure_fin: enddate,
        employee: detail.employee,
        service: detail.service,
        prix: service.prix,
    }

    if (special_offer !== null) {
        appointment.prix = appointment.prix - (appointment.prix * special_offer.remise / 100)
    }

// check if date_heure_debut and date_heure_fin are not in the weekend
    if (date_heure_debut.getDay() === 0 || date_heure_debut.getDay() === 6) {
        throw new Error('Weekend')
    }

    return appointment
}

const cancel = async (req, res) => {
    const id = req.params.id;
    const db = req.db;
    const status = new ObjectId("65c23d5d3fe8b2bd4b8f7e0c")
    let rendez_vous = await crud.findOne('rendez_vous', db, id)
    if (rendez_vous === null) return sendError(res, 'No appointment found', 500);
    rendez_vous.status = status;
    let result = await crud.update('rendez_vous', db, rendez_vous, id)
    res.send(result.value)
}

const update = async (req, res) => {
    const id = req.params.id;
    try {
        let body = req.body
        body = convertObjectId(body);
        body = convertToDate(body);
        if (body === undefined || body === null) return sendError(res, 'No body', 500);
        let appointment = body.appointment;
        if (appointment === undefined || appointment === null) return sendError(res, 'No appointment', 500);
        let details = body.details;
        if (details === undefined || details === null) return sendError(res, 'No details', 500);

        appointment.status = new ObjectId("65c23d803fe8b2bd4b8f7e0d")

        let startdate = new Date(appointment.date_heure_debut);

        let appointmentsDetails = [];
        let sumPrice = 0;
        selectedEmployees = [];

        for (let detail of details) {
            let availability = await getAvailability(detail, startdate, req.db, true, new ObjectId(id));
            appointmentsDetails.push(availability);
            startdate = availability.date_heure_fin;
            sumPrice += availability.prix;
        }

        appointment.prix = sumPrice;
        appointment.date_heure_fin = startdate;

        let session = req.clientdb.startSession();
        session.withTransaction(
            async () => {
                let result = await crud.update('rendez_vous', req.db, appointment, id);
                let createdAppointmentId = result.value._id;
                appointmentsDetails.map(detail => {
                    detail.rendez_vous = createdAppointmentId;
                    // return req.db.collection('detail_rendez_vous').findOneAndUpdate({_id: detail._id}, {$set: detail}, {returnDocument: 'after'})
                })

                // delete all details of the appointment
                await req.db.collection('detail_rendez_vous').deleteMany({rendez_vous: new ObjectId(id)})
                // insert the new details
                await req.db.collection('detail_rendez_vous').insertMany(appointmentsDetails)

                // await req.db.collection('detail_rendez_vous').updateMany(appointmentsDetails)
                res.send({
                    code: 200,
                    message: "Appointment updated",
                    data: appointment
                });
            }
        ).catch(error => {
                throw error
            }
        )
    } catch (e) {
        console.log('Error:', e)
        sendError(res, e.message, 500);
    }
}

const findAllAppointmentForEmployee = async (req, res) => {
    // get criteria from query parameters
    const base64Criteria = req.query.criteria
    let criteria
    try {
        criteria = base64Criteria !== undefined ? JSON.parse(Buffer.from(base64Criteria, 'base64').toString('ascii')) : req.body
    } catch (e) {
        //     do nothing
        criteria = req.body
    }
    criteria = convertObjectId(criteria);
    criteria = convertToDate(criteria);
    // console.log('criteria', criteria)
    const rendez_vous_details = await crud.findAll("detail_rendez_vous", req.db, criteria)
    //     check if has value
    if (rendez_vous_details === undefined && rendez_vous_details === null && rendez_vous_details.length === 0) {
        res.send({
                code: 404,
                message: "No appointment found",
                data: []
            }
        )
    }

    for (let rendez_vous_detail of rendez_vous_details) {
        let rendez_vous = await crud.findOne("rendez_vous", req.db, rendez_vous_detail.rendez_vous)
        // console.log('rendez_vous', rendez_vous)
        if (rendez_vous !== null && rendez_vous._id === new ObjectId("65c23da33fe8b2bd4b8f7e0f")) {
            //     delete the rendez_vous_detail from the list
            rendez_vous_details.splice(rendez_vous_details.indexOf(rendez_vous_detail), 1)
        } else {
            rendez_vous_detail.rendez_vous = rendez_vous
        }
    }

    const referencedObject = await crud.addObjectReferenced(rendez_vous_details, req.db)

    res.send({
            code: 200,
            message: "Appointments found",
            data: referencedObject
        }
    )
}

// const update = async (req, res) => {
//     const id = req.params.id;
//     const db = req.db;
//     let body = req.body;
//     if (body === undefined || body === null) return sendError(res, 'No body', 500);
//     if (body.interval === undefined || body.interval === null) return sendError(res, 'No interval', 500);
//     let interval = body.interval;
//
//     let appointment = await crud.findOne('rendez_vous', db, id)
// //  add interval to appointment date_heure_debut and date_heure_fin
//     appointment.date_heure_debut = new Date(appointment.date_heure_debut.getTime() + interval);
//     appointment.date_heure_fin = new Date(appointment.date_heure_fin.getTime() + interval);
//
//
// //     get the details of the appointment
//     let details = await db.collection('detail_rendez_vous').find({rendez_vous: new ObjectId(id)}).toArray()
// //     add interval to the date_heure_debut and date_heure_fin of each detail
//     details.map(detail => {
//             let unit_date_heure_debut = new Date(detail.date_heure_debut);
//             let unit_date_heure_fin = new Date(detail.date_heure_fin);
//             detail.date_heure_debut = new Date(unit_date_heure_debut.getTime() + interval);
//             detail.date_heure_fin = new Date(unit_date_heure_fin.getTime() + interval);
//         }
//     )
//
//     await details.map(async detail => {
//             let search_pattern = {
//                 "$and": [
//                     {
//                         "$or": [
//                             {
//                                 "$and": [
//                                     {
//                                         date_heure_debut: {"$lte": detail.date_heure_debut}
//                                     },
//                                     {
//                                         date_heure_fin: {"$gte": detail.date_heure_debut}
//                                     },
//                                 ]
//                             },
//                             {
//                                 "$and": [
//                                     {
//                                         date_heure_debut: {"$lte": detail.date_heure_fin}
//                                     },
//                                     {
//                                         date_heure_fin: {"$gte": detail.date_heure_fin}
//                                     }
//                                 ]
//                             }
//                         ]
//                     },
//                     {
//                         employee: detail.employee
//                     },
//                     {
//                         rendez_vous: {"$ne": new ObjectId(id)}
//                     }
//                 ]
//             }
//             let availableDetail = await db.collection('detail_rendez_vous').find(search_pattern).toArray()
//             console.log('availableDetail', availableDetail, availableDetail.length > 0)
//             if (availableDetail.length === 0) {
//                 console.log('update detail', appointment, detail)
//                 let session = req.clientdb.startSession();
//                 session.withTransaction(
//                     async () => {
//                         await crud.update('rendez_vous', db, appointment, id)
//                         await details.map(detail => {
//                                 crud.update('detail_rendez_vous', db, detail, detail._id)
//                             }
//                         )
//                         res.send({
//                             code: 200,
//                             message: "Appointment updated",
//                             data: appointment
//                         });
//                     }
//                 ).catch(error => {
//                         sendError(res, error, 500)
//                     }
//                 )
//             } else {
//                 sendError(res, 'Not available', 500)
//             }
//         }
//     )
// }

const findById = (id, db) => {
    return db.collection('rendez_vous').findOne({_id: new ObjectId(id)}).then(async (result) => {
        if (result == null) return null;
        const client = await db.collection('personne').findOne({_id: new ObjectId(result.client)})
        result.client = client;
        const services = await db.collection('detail_rendez_vous').aggregate([
            {
                $match: {
                    rendez_vous: new ObjectId(result._id)
                }
            },
            {
                $lookup: {
                    from: "service",
                    localField: "service",
                    foreignField: "_id",
                    as: "service"
                }
            },
            {
                $unwind: "$service"
            },
            {
                $lookup: {
                    from: "personne",
                    localField: "employee",
                    foreignField: "_id",
                    as: "employee"
                }
            },
            {
                $unwind: "$employee"
            },
            {
                $project: {
                    "service": "$service",
                    "employee": "$employee",
                    _id: "$_id",
                }
            }
        ]).toArray();
        result.services = services;
        return result;
    }).catch((err) => {
        throw err;
    });

}
exports.appointmentServiceCrud = {
    create,
    cancel,
    update,
    findAllAppointmentForEmployee,
    findById
}
