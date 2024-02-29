const commonRoute = require('./commonRoute');
const genericRoute = require('./genericRoute');
const otherRoute = require('./otherRoute');

const routes =[
    ...commonRoute.commonRoute(),
    ...genericRoute.genericRoute(),
    ...otherRoute.otherRoute()
]

exports.routes = () => routes;