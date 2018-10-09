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
            return db.checkPassword(req.body.password, userPw)
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
        .catch(err => {
            console.log(err);
        })
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
    db.setSig(req.session.userId, req.body.sig)
    .then(id => {
        req.session.sigId = id;
        res.redirect('/success');
    })
});

app.get('/success', checkForUser, (req, res) => {
    db.showTotalSigners().then(num => {
        db.showSig(req.session.sigId).then(sig => {
            res.render('success', {
                layout: 'main',
                title: 'Success Page',
                sig: sig
            });
        });
    });
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

app.listen(8080, () => console.log('Listening on port 8080'));
