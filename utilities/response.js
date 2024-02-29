const sendError = (res, error, code) => {
    console.log('Error:', error)
    res.status(code).json({
        code: code,
        message: error
    })
}

module.exports = {
    sendError
}
