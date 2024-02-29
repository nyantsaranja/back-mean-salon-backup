const bcrypt = require('bcrypt');
const { sendError } = require("../utilities/response");
const { convertObjectId } = require("../utilities/objectId");
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');

const register = (req, res) => {
    let user = req.body;

    let hashedPassword = bcrypt.hashSync(user.password, 10);

    user.password = hashedPassword;

    user = convertObjectId(user)

    // check user
    // console.log('user: ', user)
    // check that the user has 18 years old
    const date = new Date(user.date_naissance);
    const now = new Date();
    let age = now.getFullYear() - date.getFullYear();
    if(now.getMonth() < date.getMonth() || (now.getMonth() === date.getMonth() && now.getDate() < date.getDate())) age--;
    if (age < 18) {
        res.send({ code: 500, message: "You must be 18 years old to register" })
    }

    const db = req.db;
    db.collection('personne').insertOne(user).then(result => {
        // newly created object
        let object = result.ops[0]
        res.send(object)
    })
        .catch(error => console.log(error))
}

const login = (req, res) => {
    const user = req.body;

    const db = req.db;
    const person = req.path.split("/")[1]
    const types = {
        client: "CUSTOMER",
        employee: "EMP",
        manager: "ADMIN"
    }
    var filter = { email: user.email }
    if (types[person]) filter["type.code"] = types[person]
    // console.log(filter, person);

    db.collection('personne').findOne(filter).then(result => {
        if (result) {
            console.log('result: ', user.password, result.password)
            if (bcrypt.compareSync(user.password, result.password)) {
                const token = jwt.sign({ id: result._id }, req.envConfig.secretKey, { expiresIn: 86400 });
                res.status(200).send({
                    auth: true, token: token, user: {
                        id: result._id,
                        email: result.email,
                        role: result.type.code,
                        nom: result.nom,
                        prenom: result.prenom,
                        photo: result.photo,
                        telephone: result.telephone
                    }
                });
            } else {
                sendError(res, 'Login failed: wrong password', 500)
            }
        } else {
            sendError(res, 'Login failed: no account matches to the email provided', 500)
        }
    })
        .catch(error => sendError(res, error, 500))
}

const findOne = (req, res) => {
    let id = req.path.split("/")[1]
    const db = req.db;
    crud.findOne("personne", req.db, id).then(result => {
        if (result === null) sendError(res, 'No document found', 500);
        delete result.password;

        //TO DO order by date debut desc
        db.collection("horaire_travail").find({ employee: result._id }).then((result2) => {
            result.horaires = result2;
            res.send(result)
        }).catch(error => sendError(res, error, 500))
    })
        .catch(error => sendError(res, error, 500))
}
const modifyInfoClient = async (req, res) => {
    let id = req.params.id
    let user = req.body;
    const db = req.db;
    delete user.password;
    delete user.type;
    const client = await db.collection('personne').findOne({ _id: new ObjectId(id) });
    if (client == null || client.type.code != "CUSTOMER") sendError(res, 'No client found', 500);
    db.collection('personne').updateOne({ _id: new ObjectId(id) }, { $set: user }).then(result => {
        res.send({ code: 200, data: result, message: "modification" })
    }).catch(error => sendError(res, error, 500));
}
const modifyInfoAdmin = async (req, res) => {
    let id = req.params.id
    let user = req.body;
    const db = req.db;
    delete user.password;
    delete user.type;
    const admin = await db.collection('personne').findOne({ _id: new ObjectId(id) });
    if (admin == null || admin.type.code != "ADMIN") sendError(res, 'No admin found', 500);
    db.collection('personne').updateOne({ _id: new ObjectId(id) }, { $set: user }).then(result => {
        res.send({ code: 200, data: result, message: "modification" })
    }).catch(error => sendError(res, error, 500));
}
module.exports = {
    register,
    login,
    findOne,
    modifyInfoClient,
    modifyInfoAdmin
}
