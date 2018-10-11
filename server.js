const express = require('express');
const app = express();
const hb = require('express-handlebars');
const db = require('./database.js');
const csurf = require('csurf');
const cookieSession = require('cookie-session');

app.engine('handlebars', hb());

app.set('view engine', 'handlebars');

app.use(cookieSession({
    secret: `I'm always angry.`,
    maxAge: 1000 * 60 * 60 * 24 * 14
}));

app.use(require('body-parser').urlencoded({extended: false}));

app.use(csurf());

app.use(function(req, res, next) {
    res.locals.csrfToken = req.csrfToken();
    next();
});

function checkForUser(req, res, next) {
	if (!req.session.userId) {
		res.redirect('/register');
	} else {
		next();
	}
}

function checkForSig(req, res, next) {
    if(req.session.sigId) {
        res.redirect('/success');
    } else {
        next();
    }
}

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.redirect('/register');
});

app.get('/register', checkForSig, checkForSig, (req, res) => {
    res.render('register', {
        layout: 'main',
        title: 'Registration'
    })
});

app.post('/register', (req, res) => {
    db.hashPassword(req.body.password)
    .then(hash => {
        return db.insertNewUser(req.body.first, req.body.last, req.body.email, hash).then(results => {
            req.session.userId = results.rows[0].id;
            res.redirect('/profile');
        })
    })
    .catch(err => {
        res.render('register', {
            myErr: err.message,
            layout: 'main',
            title: 'Registration'
        })
    })
});

app.get('/login', checkForSig, (req, res) => {
    res.render('login', {
        layout: 'main',
        title: 'Login'
    })
});

app.post('/login', (req, res) => {
    db.showHashPw(req.body.email)
        .then(userPw => {
            if (!userPw) {
                res.redirect('/register');
            } else {
                return db.checkPassword(req.body.password, userPw)
            }
        })
        .then(doesMatch => {
            if(doesMatch) {
                db.getLoginId(req.body.email).then(id => {
                    req.session.userId = id;
                    return db.checkForSig(id).then(sigId => {
                        if (sigId) {
                            req.session.sigId = sigId;
                            res.redirect('/success');
                        } else {
                            res.redirect('/profile');
                        }
                    })
                })
            } else {
                res.redirect('/register');
            }
        })
        .catch(err => {console.log(err)})
});

app.get('/profile', checkForUser, checkForSig, (req, res) => {
    res.render('profile', {
        layout: 'main',
        title: 'Profile Page'
    })
});

app.post('/profile', (req, res) => {
    db.insertUserProfile(req.session.userId, req.body.age, req.body.city, req.body.url)
    .then(() => {
        res.redirect('/petition');
    })
})

app.get('/petition', checkForUser, checkForSig, (req, res) => {
    if (req.session.sigId) {
        res.redirect('/success');
    } else {
        db.getUserName(req.session.userId)
        .then(info => {
            res.render('petition', {
                layout: 'main',
                title: 'Petition Page',
                userFirst: info.first,
                userLast: info.last
            })
        })
    }
});

app.post('/petition', (req, res) => {
    if (!req.body.sig) {
        res.render('petition', {
            layout: 'main',
            title: 'Petition Page',
            error: "Please sign below."
        })
    } else {
        db.setSig(req.session.userId, req.body.sig)
        .then(id => {
            req.session.sigId = id;
            res.redirect('/success');
        })
    }
});

app.get('/success', checkForUser, (req, res) => {
    db.showTotalSigners().then(num => {
        db.showSig(req.session.sigId).then(sig => {
            res.render('success', {
                layout: 'main',
                title: 'Success Page',
                num: num,
                sig: sig
            });
        });
    });
});

app.get('/editprofile', checkForUser, (req, res) => {
    db.getUserData(req.session.userId).then(data => {
        res.render('editprofile', {
            layout: 'main',
            title: 'Edit Profile',
            data: data[0]
        });
    })
    .catch(err => {console.log(err)})
});

app.post('/editprofile', (req, res) => {
    if (req.body.password) {
        db.hashPassword(req.body.password)
        .then(hash => {
            Promise.all([
                db.pushUserData(req.session.userId, req.body.first, req.body.last, req.body.email, hash),
                db.pushUserProfileData(req.session.userId, req.body.age, req.body.city, req.body.url)
            ])
            .then(() => {res.redirect('/success')})
            .catch(err => {console.log(err)})
        })
        .catch(err => {console.log(err)})
    } else {
        Promise.all([
            db.pushUserDataNoPw(req.session.userId, req.body.first, req.body.last, req.body.email),
            db.pushUserProfileData(req.session.userId, req.body.age, req.body.city, req.body.url).catch(err => {
                console.log("asdf");
                throw err;
            })
        ])
        .then(() => {res.redirect('/success')})
        .catch(err => {console.log(err)})
    }
});

app.post('/removesig', checkForUser, (req, res) => {
    db.removeUserSig(req.session.userId)
    .then(() => {
        delete req.session.sigId;
        delete req.body.sig;
        res.redirect('/petition')})
    .catch(err => {console.log(err)})
});

app.post('/logout', checkForUser, (req, res) => {
    delete req.session.sigId;
    delete req.body.sig;
    delete req.session.userId;
    res.redirect('/login');
})

app.post('/deleteaccount', checkForUser, (req, res) => {
    db.removeUserFromDB(req.session.userId)
    .then(() => {
        delete req.session.sigId;
        delete req.body.sig;
        delete req.session.userId;
        res.redirect('/register');
    })
});

app.get('/signers', checkForUser, (req, res) => {
    db.showSigners().then(signers => {
        res.render('signers', {
            layout: 'main',
            title: 'Others Who Signed',
            signers: signers
        })
    });
});

app.get('/signers/:city', checkForUser, (req, res) => {
    db.showSignersByCity(req.params.city).then(signers => {
        res.render('signers', {
            layout: 'main',
            title: 'Others Who Signed In Your City',
            signers: signers
        })
    });
})

app.listen(process.env.PORT || 8080, () => console.log('Listening...'));
