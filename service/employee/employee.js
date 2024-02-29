const {ObjectId} = require('mongodb');
const getFavouriteEmployees = async (req, res) => {
    const clientId = req.params.clientId;
    const db = req.db;
    const preferences = await db.collection('preference').find({client: new ObjectId(clientId)}).toArray()
    // console.log('preferences: ', preferences)
    const employees = preferences.map(preference => {
        if (preference.employe !== null) {
            return preference.employe.toString()
        }
    });
    // console.log('employees: ', employees)
//     get all employees
    const allEmployees = await db.collection("personne").find({
        'type._id': new ObjectId("65c220963fe8b2bd4b8f7d78")
    }).toArray()
    // console.log('allEmployees: ', allEmployees)
    const favouriteEmployees = allEmployees.filter(employee => employees.includes(employee._id.toString()))
    // console.log('favouriteEmployees: ', favouriteEmployees)
// add favourite property to each employee
    favouriteEmployees.forEach(employee => {
            employee.favourite = true
        }
    )
//     add the other employees to the list
    const otherEmployees = allEmployees.filter(employee => !employees.includes(employee._id.toString()))
//     add not favourite property to each employee
    otherEmployees.forEach(employee => {
            employee.favourite = false
        }
    )
//     merge the two lists
    const result = favouriteEmployees.concat(otherEmployees)
    res.send({
        code: 200,
        message: "Favourite employees",
        data: result
    })
}

exports.employeeService = {
    getFavouriteEmployees
}