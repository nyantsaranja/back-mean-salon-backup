const {sendError} = require("../utilities/response");
const {ObjectId} = require("mongodb");
const {convertObjectId} = require("../utilities/objectId");
const {convertToDate} = require("../utilities/date");


const dictionary = {
    employee: 'personne',
    employe : 'personne',
    service: 'service',
    client: 'personne',
    status : 'statut_rendez_vous',
    type : 'type_personne'
}

const findAll = (entity, db, object) => {
    let search = {}
    let page = {}
    let limit = 10000000
    let skip = 0
    let sort = {}

    object = convertObjectId(object)
    object = convertToDate(object)

    // console.log('object', object, JSON.stringify(object))

    if (object !== undefined && object !== null && object.search !== undefined && object.search !== null) {
        search = object.search
    }

    if (object !== undefined && object !== null && object.page !== undefined && object.page !== null) {
        page = object.page
        if (page.size !== undefined && page.size !== null) {
            limit = parseInt(page.size)
        }
        if (page.number !== undefined && page.number !== null) {
            skip = parseInt(page.number * 10)
        }
    }

    if (object !== undefined && object !== null && object.sort !== undefined && object.sort !== null) {
        sort = object.sort
    }
    console.log('all', JSON.stringify(search), search, skip, limit, search["$and"])


    return db.collection(entity).find(search).sort(sort).skip(skip).limit(limit).toArray()
}

const findOne = (entity, db, id) => {
    return db.collection(entity).findOne({_id: new ObjectId(id)})
}

const create = (entity, db, object) => {
    object = convertObjectId(object)
    object = convertToDate(object)
    return db.collection(entity).insertOne(object)
}

const update = (entity, db, object, id) => {
    object = convertObjectId(object)
    object = convertToDate(object)
    return db.collection(entity).findOneAndUpdate({_id: new ObjectId(id)}, {$set: object}, {returnDocument: 'after'})
}

const deleteOne = (entity, db, id) => {
    return db.collection(entity).deleteOne({_id: new ObjectId(id)})
}

// recursive addObjectReferenced so all the child are processed until no ObjectId value remains


const addObjectReferenced = async (data, db) => {
    if (data === undefined || data === null) {
        return Promise.resolve(data)
    }
//     loop though the data, for each loop loop thought the object and check if it's of the type ObjectId and if it is, go to the database and get the object and add it to the object
    for (let i = 0; i < data.length; i++) {
        for (const key in data[i]) {
            // console.log('key', key, data[i][key] )
            // check if key is in the dictionary and if it is, replace it with the value in the dictionary
            let keyRealValue = key;
            if (dictionary[key] !== undefined) {
                // console.log('keyRealValue', keyRealValue, dictionary[key])
                keyRealValue = dictionary[key]
            }
            if (data[i][key] instanceof ObjectId && key!== '_id') {
                const findOneResponse = await db.collection(keyRealValue).findOne({_id: data[i][key]})
                data[i][key] = (await addObjectReferenced([findOneResponse],db))[0]
            }
        }
    }
    return Promise.resolve(data)
}


exports.crud = {
    findAll,
    findOne,
    create,
    update,
    deleteOne,
    addObjectReferenced
}
