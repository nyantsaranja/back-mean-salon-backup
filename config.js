// config.js

const config = {
  development: {
    mongoURI: 'mongodb+srv://ranjalahynyantsa:y6SEIUJTvmJlJx0y@cluster0.cdwza34.mongodb.net/',
    dbName: 'mbs-dev',
    secretKey:'secretKeyDev2024!',
    // Add other development-specific configuration here

    configGmail:{
      service:"gmail",
      host:"smtp.gmail.com",
      port:587,
      secure:false,
      auth:{
        user:"m1p11beauty@gmail.com",
        pass:"prpiynzmqeelfvia"
      }
    }
  },
  production: {
    mongoURI: 'mongodb+srv://ranjalahynyantsa:y6SEIUJTvmJlJx0y@cluster0.cdwza34.mongodb.net/',
    dbName: 'mbs-prod',
    secretKey:'secretKeyProd2024!',
    // Add other production-specific configuration here

    configGmail:{
      service:"gmail",
      host:"smtp.gmail.com",
      port:587,
      secure:false,
      auth:{
        user:"m1p11beauty@gmail.com",
        pass:"prpiynzmqeelfvia"
      }
    }
  }
};

module.exports = config;
