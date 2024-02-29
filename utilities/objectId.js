const { ObjectId } = require('mongodb');

function convertObjectId(obj) {
  if (obj && typeof obj === 'object') {
    // If the object has a key "$oid", replace it with new ObjectId
    if ('$oid' in obj) {
      return new ObjectId(obj['$oid']);
    }

    // Recursively process nested objects or arrays
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        obj[key] = convertObjectId(obj[key]);
      }
    }
  } else if (Array.isArray(obj)) {
    // Recursively process each element in an array
    obj = obj.map(convertObjectId);
  }

  return obj;
}

// Example usage:
const inputObject = {
  "_id": {
    "$oid": "65c220173fe8b2bd4b8f7d73"
  },
  "name": "John Doe",
  "address": {
    "city": "New York",
    "postalCode": {
      "$oid": "65c220173fe8b2bd4b8f7d74"
    }
  },
  "friends": [
    {
      "$oid": "65c220173fe8b2bd4b8f7d75"
    },
    {
      "name": "Jane Doe"
    }
  ]
};

const convertedObject = convertObjectId(inputObject);
// console.log(convertedObject);

exports.convertObjectId = convertObjectId;
