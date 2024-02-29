const { notificationService } = require('../service/notification/notification');

/** list of notification: the body format {page: {size, number}, client } */
const findAllNotificationByClient = async (req, res) => {
     const base64Criteria = req.query.criteria;
     let criteria = {}
     try {
          criteria = base64Criteria ? JSON.parse(Buffer.from(base64Criteria, 'base64').toString('ascii')) : req.body
     } catch (e) {
          //     do nothing
          criteria = req.body
     }
     const { page, client } = criteria;
     const db = req.db;
     const notifications = await notificationService.findAllNotificationByClient(page, client, db);
     res.status(200).json(
          {
               code: 200,
               message: "List of notifications",
               data: notifications
          }
          );
}

exports.notificationController = {
     findAllNotificationByClient
}
