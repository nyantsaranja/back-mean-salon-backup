const {ObjectId} = require("mongodb");
const {crud} = require("../crud");
const getFavouriteServices = async (req, res) => {
    const clientId = req.params.clientId;
    const db = req.db;
    const preferences = await db.collection('preference').find({client: new ObjectId(clientId)}).toArray()
    // console.log('preferences: ', preferences)
    const services = preferences.map(preference => {
        if (preference.service !== null) {
            return preference.service.toString()
        }
    });
    // console.log('services: ', services)
//     get all services
    const allServices = await db.collection("service").find({}).toArray()
    // console.log('allServices: ', allServices)
    const favouriteServices = allServices.filter(service => services.includes(service._id.toString()))
    // console.log('favouriteServices: ', favouriteServices)
// add favourite property to each employee
    favouriteServices.forEach(service => {
            service.favourite = true
        }
    )
//     add the other services to the list
    const otherServices = allServices.filter(employee => !services.includes(employee._id.toString()))
//     add not favourite property to each employee
    otherServices.forEach(employee => {
            employee.favourite = false
        }
    )
//     merge the two lists
    const result = favouriteServices.concat(otherServices)
    res.send({
        code: 200,
        message: "Favourite services",
        data: result
    })
}

const updateStatus = async (req, res) => {
    const client = req.params.clientId;
    const service = req.query.serviceId;
    const employee = req.query.employeeId;

    if(service === undefined && employee === undefined){
        res.send({
            code: 400,
            message: "Service or employee is required"
        })
        return
    }

    let query = {
        "$and": [
            {"client": new ObjectId(client)},
            {
                "$or": [
                    {
                        "employe": new ObjectId(employee)
                    },
                    {
                        "service": new ObjectId(service)
                    }
                ]
            }
        ]
    }

//     get the preference that matches
    const preference = await req.db.collection('preference').findOne(query)
    if (preference === null || preference === undefined) {
        crud.create('preference', req.db, {
            client: new ObjectId(client),
            employe: employee ? new ObjectId(employee) : null,
            service: service ? new ObjectId(service) : null,
        }).then(result => {
            res.send({
                code:200,
                message: "Preference saved",
                data: true
            })
        })
    } else {
        //     delete the preference
        crud.deleteOne('preference', req.db, preference._id).then(result => {
                res.send({
                    code: 200,
                    message: "Preference deleted",
                    data : false
                })
            }
        )
    }
}

exports.serviceService = {
    getFavouriteServices,
    updateStatus
}