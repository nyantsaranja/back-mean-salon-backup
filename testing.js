const bcrypt = require('bcrypt');
console.log(bcrypt.hashSync("passwordNotCryptedYet123!", 10));