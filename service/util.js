const generateReferencePayment=(modePaie)=>{
     const ref = Math.floor(1000 + Math.random() * 9000);
     return `ref-${modePaie.code}-${ref}`;
}

function orderDates(result) {
    return result.sort((a, b) => {
        return new Date(a._id.date) - new Date(b._id.date)
    }
    )
}

function fillMissingDates(result, startDate, endDate, filter, column) {
    let date = new Date(startDate)

    let dateEnd = new Date(endDate)

    while (date<=dateEnd) {
        let dateStr = filter === "M" ? date.toISOString().slice(0,7) : date.toISOString().slice(0,10)
        if (!result.find(r => r._id.date === dateStr)) {
            result.push({_id: {date: dateStr}, [column]: 0})
        }
        filter === "M" ? date.setMonth(date.getMonth() + 1) : date.setDate(date.getDate() + 1)
    }

    return orderDates(result)
}

function format(fillMissingDates1, column) {
    let result ={
        labels: [],
        data: []
    }
    console.log(fillMissingDates1, column)
    fillMissingDates1.forEach(r => {
        result.labels.push(r._id.date)
        result.data.push(r[column])
    })
    return result;
}

exports.format=format

exports.fillMissingDates=fillMissingDates

exports.orderDates=orderDates
exports.generateReferencePayment=generateReferencePayment
