const {ObjectId} = require("mongodb");
const {sendError} = require('../../utilities/response')
const {crud} = require('../../service/crud')
const bcrypt = require('bcrypt')
const findAll = async (req, res) => {
    checkEntity(req, res)
    const db = req.db


    // get criteria from query parameters
    const base64Criteria = req.query.criteria
    let criteria = {}
    try {
        criteria = base64Criteria ? JSON.parse(Buffer.from(base64Criteria, 'base64').toString('ascii')) : req.body
    } catch (e) {
        //     do nothing
        criteria= req.body
    }

    const data = await crud.findAll(req.entity, db, criteria);
    res.send({
        code: 200,
        message: "List of " + req.entity,
        data: await crud.addObjectReferenced(data,req.db)
    })
}

const findOne = async (req, res) => {
    checkEntity(req, res)
    let id = req.params[0]
    const findOne = await crud.findOne(req.entity, req.db, id)
    if (findOne === null) {
        sendError(res, 'No document found', 500)
    }
    res.send({
        code: 200,
        message: "Document found",
        data: (await crud.addObjectReferenced([findOne],req.db))[0]
    })
}

const create = (req, res) => {
    checkEntity(req, res)
    const body = req.body
    // if body contains property password then hash it
    if (body.password !== undefined) {
        body.password = bcrypt.hashSync(body.password, 10)
    }
    crud.create(req.entity, req.db, body).then(result => {
        // newly created object
        let object = result.ops[0]
        res.send(object)
    })
        .catch(error => sendError(res, error, 500))
}

const update = (req, res) => {
    checkEntity(req, res)
    let id = req.params[0]

    const body = req.body
    // if body contains property password then hash it
    if (body.password !== undefined) {
        body.password = bcrypt.hashSync(body.password, 10)
    }

    crud.update(req.entity, req.db, body, id).then(result => {
            // newly created object
            result == null || result.value === null ? sendError(res, 'No document found', 500) :
                res.send(result.value)
        }
    )
        .catch(error => sendError(res, error, 500))
}

const deleteOne = async (req, res) => {
    checkEntity(req, res)
    let id = req.params[0]

    // Find the document before deleting
    const element = await crud.findOne(req.entity, req.db, id)
    if (element === null) {
        sendError(res, 'No document to delete', 500)
    } else if (element.status === undefined) {
        // Find the document before deleting
        crud.deleteOne(req.entity, req.db, id).then(result => {
            if (result.deletedCount === 0) {
                sendError(res, 'No document to delete', 500)
            }
            res.send({
                    code: 200,
                    message: "Document deleted",
                    id: id
                }
            )
        }).catch(error => sendError(res, error, 500));
    } else if (element.status !== undefined) {
        element.status = 0
        crud.update(req.entity, req.db, element, id).then(result => {
            // newly created object
            result == null || result.value === null ? sendError(res, 'No document found', 500) :
                res.send({
                    code: 200,
                    message: "Document deleted",
                    id: id
                })
        }).catch(error => sendError(res, error, 500));
    }
}

const checkEntity = (req, res) => {
    if (req.entity == null) {
        res.send({
            code: 400,
            message: "Invalid crud url for crud mapped route"
        })
    }
}


exports.generic = {
    findAll,
    findOne,
    create,
    update,
    deleteOne,
}
