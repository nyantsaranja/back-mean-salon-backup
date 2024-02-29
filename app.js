const router = require('./router/route');


const express = require('express');
const app = express()
const MongoClient = require('mongodb').MongoClient
const cron = require('node-cron');

const {parseCrudEntity} = require('./utilities/urlParser')
const bodyParser = require('body-parser');

const dotenv = require('dotenv');
const config = require('./config');

const jwt = require('jsonwebtoken');

const {sendError} = require('./utilities/response')

const {notProtectedRoutes} = require('./router/notProtectedRoute');

dotenv.config();

const cors = require('cors');
const {addStatutAppointmentMiddlewareForClient} = require("./middleware/appointment");
const {notificationService} = require("./service/notification/notification");
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const envConfig = config[process.env.NODE_ENV];

const connectionString = envConfig.mongoURI;


app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json({limit: '50mb'}));

app.use(express.urlencoded({extended: false}));
app.use(express.json());


app.use(cors())


MongoClient.connect(connectionString, {useUnifiedTopology: true})
    .then(client => {
            try {
                console.log('Connected to Database ', envConfig.dbName)
                const db = client.db(envConfig.dbName)
                /*middleware to verify token authentification*/
                const verifyToken = (req, res, next) => {
                    if (notProtectedRoutes().includes(req.path)) {
                        next();
                        return;
                    }
                    const token = req.headers.authorization;

                    if (!token) {
                        return sendError(res, 'No token provided', 403)
                    }

                    jwt.verify(token, envConfig.secretKey, (err, decodedToken) => {
                        if (err) {
                            return res.status(401).json({message: 'Invalid token'});
                        }
                        req.userId = decodedToken.userId;
                        next();
                    });
                };

                const dbMiddleware = (req, res, next) => {
                    console.log(`DB Middleware for path : ${req.method} ${req.path}`);
                    let entity = parseCrudEntity(req.path);
                    req.entity = entity;
                    req.db = db;
                    req.clientdb = client;
                    req.envConfig = envConfig;
                    next();
                }
                //le rappel des rendze vous
                const cron10h = '0 10 * * *';
                const cron2min = '*/10 * * * * *';
                cron.schedule(cron10h, async () => {
                    notificationService.rappel(db);
                });
                app.use(verifyToken);
                app.use(dbMiddleware);
                app.get("/rendez_vous-crud", addStatutAppointmentMiddlewareForClient)
                // app.get("/rendez_vous-crud/employee", addStatutAppointmentMiddlewareForClient)

                router.routes().map(route => {
                    // use the middle for everything
                    app[route.method](route.path, route.handler);
                })

                app.listen(3000, () => {
                        console.log('Server is listening on port 3000');
                    }
                );
            } catch (e) {
                console.error('Error occurred:', error);
            }
            //le rappel des rendze vous
            const cron10h = '0 10 * * *';
            const cron2min = '*/30 * * * * *';
            cron.schedule(cron10h, async () => {
                notificationService.rappel(db);
            });
            app.use(verifyToken);
            app.use(dbMiddleware);
            app.get("/rendez_vous-crud", addStatutAppointmentMiddlewareForClient)
            // app.get("/rendez_vous-crud/employee", addStatutAppointmentMiddlewareForClient)

            router.routes().map(route => {
                // use the middle for everything
                app[route.method](route.path, route.handler);
            })

            app.listen(3000, () => {
                    console.log('Server is listening on port 3000');
                }
            );
        }
    )
    .catch(error => console.error(error))
