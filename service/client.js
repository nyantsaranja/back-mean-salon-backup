const {convertObjectId} = require("../utilities/objectId");
const bcrypt = require("bcrypt");
const {crud} = require("./crud");
const {sendError} = require("../utilities/response");
const register = async (req, res) => {
    let client = req.body;
    // console.log('client: ', client)
    client = convertObjectId(client);

    // console.log('client: ', client)

    let hashedPassword = bcrypt.hashSync(client.password, 10);
    client.password = hashedPassword;

    // get the gender
    const gender = crud.findOne('genre', req.db, client.genre._id);
    client.genre = await gender;
    // get the type
    const type = crud.findOne('type_personne', req.db, client.type._id);
    client.type = await type;
    // set date_creation
    client.date_creation = new Date();
    // set status to active 1
    client.status = 1;

    // console.log('client: ', client)
    const db = req.db;
    db.collection('personne').insertOne(client).then(result => {
        // newly created object
        let object = result.ops[0]
        res.send({
            code: 200,
            message: "Client created",
            data: object
        })
    })
        .catch(error => sendError(res, error, 500))
}

exports.clientService = {
    register
}