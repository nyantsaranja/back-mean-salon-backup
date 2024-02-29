const { statService } = require('../service/stat');

const numberOfAppointment = (req, res) => {
     const db = req.db;
     const base64Criteria = req.query.criteria;
     let criteria = {}
     try {
          criteria = base64Criteria ? JSON.parse(Buffer.from(base64Criteria, 'base64').toString('ascii')) : req.body
     } catch (e) {
          //     do nothing
          criteria = req.body
     }
     if (!criteria.startDate || !criteria.endDate) {
          res.status(400).send({ code: 400, message: "startDate and endDate are required" });
          return;
     }
     statService.numberOfAppointment(db, criteria.startDate, criteria.endDate, criteria.byWhat || 'day').then((result) => {
          res.status(200).send({code:200, message:"Number of appointment",data:result});
     }).catch(error => sendError(res, error, 500));
}
exports.statController={
     numberOfAppointment
}
