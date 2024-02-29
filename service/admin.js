const findAll = async (db) => {
     return db.collection('personne').find({"type.code":"ADMIN"}).toArray();
}
exports.adminService = {
     findAll
 }
