const spicedPg = require('spiced-pg');
const bcrypt = require('bcryptjs');
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

const getLoginId = function (email) {
    return db.query(`SELECT id FROM users WHERE email = $1`, [email])
        .then(function(result) {
            return result.rows[0].id;
        })
        .catch(err => {
            console.log(err);
        })
}

const getUserName = function (id) {
    return db.query(`SELECT first, last FROM users WHERE id = $1`, [id])
        .then(function(results) {
            return results.rows[0];
        })
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

function hashPassword(plainTextPassword) {
    return new Promise(function(resolve, reject) {
        bcrypt.genSalt(function(err, salt) {
            if (err) {
                return reject(err);
            }
            bcrypt.hash(plainTextPassword, salt, function(err, hash) {
                if (err) {
                    return reject(err);
                }
                resolve(hash);
            });
        });
    });
}

function checkPassword(textEnteredInLoginForm, hashedPasswordFromDatabase) {
    return new Promise(function(resolve, reject) {
        bcrypt.compare(textEnteredInLoginForm, hashedPasswordFromDatabase, function(err, doesMatch) {
            if (err) {
                reject(err);
            } else {
                resolve(doesMatch);
            }
        });
    });
}

function insertNewUser(first, last, email, hashedPw) {
    const q = `INSERT INTO users (first, last, email, password) VALUES ($1, $2, $3, $4) RETURNING id`;
    const params = [first || null, last || null, email || null, hashedPw || null];

    return db.query(q, params);
}

const showHashPw = function (email) {
    return db.query(`SELECT password FROM users WHERE email = $1`, [email])
        .then(function(result) {
            return result.rows[0].password;
        })
}

exports.setSig = setSig;
exports.showSig = showSig;
exports.showTotalSigners = showTotalSigners;
exports.showNames = showNames;
exports.hashPassword = hashPassword;
exports.checkPassword = checkPassword;
exports.insertNewUser = insertNewUser;
exports.showHashPw = showHashPw;
exports.getLoginId = getLoginId;
exports.getUserName = getUserName;
