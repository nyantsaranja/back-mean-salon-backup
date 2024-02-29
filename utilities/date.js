const { ObjectId } = require('mongodb');

function convertToDate(obj) {
  if (obj && typeof obj === 'object') {
    // If the object has a key "$oid", replace it with new ObjectId
    if ('$date' in obj) {
      return new Date(obj['$date']);
    }
    // Recursively process nested objects or arrays
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        obj[key] = convertToDate(obj[key]);
      }
    }
  } else if (Array.isArray(obj)) {
    // Recursively process each element in an array
    obj = obj.map(convertToDate);
  }
  return obj;
}

exports.convertToDate = convertToDate;
