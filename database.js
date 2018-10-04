const spicedPg = require('spiced-pg');
const {dbUser, dbPassword} = require('./secrets.json')
const db = spicedPg(`postgres:${dbUser}:${dbPassword}@localhost:5432/sage`);

const setSig = function (first,last,sig) {
    return db.query(`INSERT INTO signatures (first, last, signature) VALUES ($1, $2, $3);`,
    [first,last,sig]
    );
}

exports.setSig = setSig;
