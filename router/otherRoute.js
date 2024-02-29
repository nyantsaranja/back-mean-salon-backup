const otherRoute = [
    // common routes
    {
        path:'*',
        method:'use',
        handler:(req, res) => {
            res.status(404).send('404 not found');
        }
    }
]
exports.otherRoute = () => otherRoute;