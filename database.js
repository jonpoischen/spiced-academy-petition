const spicedPg = require('spiced-pg');
const bcrypt = require('bcryptjs');
let secrets;
let dbUrl;
if (process.env.NODE_ENV === 'production') {
    secrets = process.env
    dbUrl = secrets.DATABASE_URL
} else {
    secrets = require('./secrets.json')
    dbUrl = `postgres:${secrets.dbUser}:${secrets.dbPassword}@localhost:5432/sage`;
}
const db = spicedPg(dbUrl);

exports.setSig = function (user_id, sig) {
    return db.query(`INSERT INTO signatures (user_id, signature) VALUES ($1, $2) RETURNING id;`,
    [user_id || null, sig || null])
    .then((results) => {
        return results.rows[0].id;
    })
    .catch((err) => {
        console.log(err);
    })
}

exports.showSig = function (id) {
    return db.query(`SELECT signature FROM signatures WHERE id = $1`, [id])
        .then(function(result) {
            return result.rows[0].signature;})
        .catch(err => {
            console.log(err);
        })
}

exports.getLoginId = function (email) {
    return db.query(`SELECT id FROM users WHERE email = $1`, [email])
        .then(function(result) {
            return result.rows[0].id;
        })
        .catch(err => {
            console.log(err);
        })
}

exports.getUserName = function (id) {
    return db.query(`SELECT first, last FROM users WHERE id = $1`, [id])
        .then(function(results) {
            return results.rows[0];
        })
        .catch(err => {
            console.log(err);
        })
}

exports.showTotalSigners = function() {
    return db.query(`SELECT COUNT (*) FROM signatures`)
        .then(result => {
            return result.rows[0].count;
        })
        .catch(function(err) {
            console.log(err);
        });
};

exports.checkForSig = function(id) {
    return db.query(
            `SELECT id FROM signatures WHERE user_id = $1`,
            [id])
        .then(function(results) {
            return results.rows[0].id;
        })
}

exports.showSigners = function() {
    return db.query(
        `SELECT users.first, users.last, user_profiles.user_id,
        user_profiles.age, user_profiles.city, user_profiles.url
        FROM users
        JOIN user_profiles
        ON users.id = user_profiles.user_id
        JOIN signatures
        ON users.id = signatures.user_id;
        `
    )
        .then(function(results) {
            return results.rows;
        })
        .catch(function(err) {
            console.log(err);
        });
};

exports.showSignersByCity = function(city) {
    return db.query(
        `SELECT users.first, users.last, user_profiles.user_id,
        user_profiles.age, user_profiles.url
        FROM users
        JOIN user_profiles
        ON users.id = user_profiles.user_id
        JOIN signatures
        ON users.id = signatures.user_id
        WHERE LOWER(city) = LOWER($1);
        `,
        [city]
    )
        .then(function(results) {
            return results.rows;
        })
        .catch(function(err) {
            console.log(err);
        });
};

exports.hashPassword = function(plainTextPassword) {
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

exports.checkPassword = function(textEnteredInLoginForm, hashedPasswordFromDatabase) {
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

exports.insertNewUser = function(first, last, email, hashedPw) {
    const q = `INSERT INTO users (first, last, email, password) VALUES ($1, $2, $3, $4) RETURNING id`;
    const params = [first || null, last || null, email || null, hashedPw || null];

    return db.query(q, params);
}

exports.insertUserProfile = function(user_id, age, city, url) {
    const q = `INSERT INTO user_profiles (user_id, age, city, url) VALUES ($1, $2, $3, $4)`;
    const params = [user_id || null, age || null, city || null, url || null];

    return db.query(q, params);
}

exports.showHashPw = function (email) {
    return db.query(`SELECT password FROM users WHERE email = $1`, [email])
    .then(function(result) {
        return result.rows[0] && result.rows[0].password;
    })
    .catch(function(err) {console.log(err)})
}

exports.getUserData = function (id) {
    return db.query(
        `SELECT users.first, users.last, users.email,
        user_profiles.age, user_profiles.city, user_profiles.url
        FROM users
        JOIN user_profiles
        ON users.id = user_profiles.user_id
        WHERE users.id = $1;
        `,
        [id]
    )
    .then(function(results) {
        return results.rows;
    })
    .catch(function(err) {
        console.log(err);
    });
}

exports.pushUserData = function (id, first, last, email, hashedPw) {
    const q = `
    UPDATE users
    SET first = $1, last = $2, email = $3, password = $4
    WHERE id = $5;
    `;
    const params = [first || null, last || null, email || null, hashedPw || null, id || null];

    return db.query(q, params);
}

exports.pushUserDataNoPw = function (id, first, last, email) {
    const q = `
    UPDATE users
    SET first = $1, last = $2, email = $3
    WHERE id = $4;
    `;
    const params = [first || null, last || null, email || null, id || null];

    return db.query(q, params);
}

exports.pushUserProfileData = function (id, age, city, url) {
    const q = `
    INSERT INTO user_profiles (user_id, age, city, url)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (user_id)
    DO UPDATE SET user_id = $1, age = $2, city = $3, url = $4;
    `;
    const params = [id || null, age || null, city || null, url || null];

    return db.query(q, params);
}

exports.removeUserSig = function (id) {
    const q = `
    DELETE FROM signatures
    WHERE user_id = $1;
    `;
    const params = [id || null];

    return db.query(q, params);
}

exports.removeUserFromDB = function (id) {
    const q = `
    DELETE FROM users
    WHERE id = $1;
    `;
    const params = [id || null];

    return db.query(q, params);
}
