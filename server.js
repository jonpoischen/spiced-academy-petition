const express = require('express');
const app = express();
const hb = require('express-handlebars');
const db = require('./database.js');
const csurf = require('csurf');
app.engine('handlebars', hb());
app.set('view engine', 'handlebars');

var cookieSession = require('cookie-session');
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

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.redirect('/register');
});

app.get('/register', (req, res) => {
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
            res.redirect('/home');
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

app.get('/login', (req, res) => {
    res.render('login', {
        layout: 'main',
        title: 'Login'
    })
});

app.post('/login', (req, res) => {
    db.showHashPw(req.body.email).then(userPw => {
        db.checkPassword(req.body.password, userPw);
        db.getLoginId(req.body.email).then(id => {
            req.session.userId = id;
            res.redirect('/home');
        })
        .catch(err => {
            res.render('login', {
                myErr: err.message,
                layout: 'main',
                title: 'Login'
            })
        })
    })
    .catch(err => {
        console.log("yo made it!");
        res.render('login', {
            myErr: err.message,
            layout: 'main',
            title: 'Login'
        })
    })
});

app.get('/home', checkForUser, (req, res) => {
    if (req.session.sigId) {
        res.redirect('/success');
    } else {
        db.getUserName(req.session.userId)
        .then(info => {
            console.log(info);
            res.render('home', {
                layout: 'main',
                title: 'Home Page',
                userFirst: info.first,
                userLast: info.last
            })
        })
    }
});

app.post('/home', (req, res) => {
    db.setSig(req.body.first,req.body.last,req.body.sig)
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
    db.showNames().then(signers => {
        res.render('signers', {
            layout: 'main',
            title: 'Others Who Signed',
            signers: signers
        })
    });
});

app.listen(8080, () => console.log('Listening on port 8080'));
