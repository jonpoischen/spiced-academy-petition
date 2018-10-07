const spicedPg = require('spiced-pg');
const {dbUser, dbPassword} = require('./secrets.json')
const db = spicedPg(`postgres:${dbUser}:${dbPassword}@localhost:5432/sage`);

const setSig = function (first, last, sig) {
    return db.query(`INSERT INTO signatures (first, last, signature) VALUES ($1, $2, $3) RETURNING id;`,
    [first || null, last || null, sig || null]
    ).then((results) => {
        return results.rows[0].id;
    }).catch((err) => {
        console.log(err);
    })
}

const showSig = function (id) {
    return db.query(`SELECT signature FROM signatures WHERE id = $1`, [id])
        .then(function(result) {
            return result.rows[0].signature;})
        .catch(err => {
            console.log(err);
        })
}

const showTotalSigners = function() {
    return db.query(`SELECT COUNT (*) FROM signatures`)
        .then(result => {
            return result.rows[0].count;
        })
        .catch(function(err) {
            console.log(err);
        });
};

const showNames = function() {
    return db.query(`SELECT first, last FROM signatures`)
        .then(function(result) {
            return result.rows;
        })
        .catch(function(err) {
            console.log(err);
        });
};

exports.setSig = setSig;
exports.showSig = showSig;
exports.showTotalSigners = showTotalSigners;
exports.showNames = showNames;
