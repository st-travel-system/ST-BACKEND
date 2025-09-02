const PRODUCCION = process.env.PRODUCCION || false;

const PORT_APP = process.env.PORT || 3002;

const DOMAIN = process.env.DOMAIN || "http://localhost:3002";
const DOMAIN_FRONT = process.env.DOMAIN_FRONT || "http://localhost:3000";

const SEED = process.env.SEED || "seed-demo";

const DB_MONGO = process.env.DB_MONGO || "carruzo";
const PORT_MONGO = process.env.PORT_MONGO || "27017";
const USER_MONGO = process.env.USER_MONGO || "root";
const PASS_MONGO = process.env.PASS_MONGO || "";

// const MONGO_URL = PRODUCCION
//   ? `mongodb://${USER_MONGO}:${PASS_MONGO}@127.0.0.1:${PORT_MONGO}/admin`
//   : `mongodb://127.0.0.1:${PORT_MONGO}/admin`;

const MONGO_URL = `mongodb+srv://ssanguinetti14:zdmvbiv1TjxnypN7@cluster0.9y2s1.mongodb.net/`;


const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "";

const IV = process.env.IV || "";

module.exports = {
  PRODUCCION,
  SEED,
  MONGO_URL,
  DOMAIN,
  DOMAIN_FRONT,
  ENCRYPTION_KEY,
  IV,
  PORT_APP,
  DB_MONGO,
  PORT_MONGO,
  USER_MONGO,
  PASS_MONGO
};



 
