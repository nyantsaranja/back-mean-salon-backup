// const getCommission = async () => {
//     const db = req.db
//
//
//     // get criteria from query parameters
//     const base64Criteria = req.query.criteria
//     let criteria = {}
//     try {
//         criteria = base64Criteria ? JSON.parse(Buffer.from(base64Criteria, 'base64').toString('ascii')) : req.body
//     } catch (e) {
//         //     do nothing
//         criteria = req.body
//     }
//     const result = await rendezVousDetailCollection.aggregate([
//         {
//             $lookup: {
//                 from: 'rendez_vous',
//                 localField: 'rendez_vous',
//                 foreignField: '_id',
//                 as: 'rendez_vous'
//             }
//         },
//         {
//             $match: {
//                 'rendez_vous.status.code': status
//             }
//         },
//         {
//             $skip: (page - 1) * pageSize
//         },
//         {
//             $limit: pageSize
//         }
//     ]).toArray();
//
//     res.json(result);
//
// }