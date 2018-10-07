const express = require('express');
const app = express();
const hb = require('express-handlebars');
const database = require('./database.js');
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

app.use(express.static('public'));

app.get('/', (req, res) => {
    if (req.session.sigId) {
        res.redirect('/success')
    } else {
        res.render('home', {
            layout: 'main',
            title: 'Home Page'
        })
    }
});

app.get('/success', (req, res) => {
    database.showTotalSigners().then(num => {
        database.showSig(req.session.sigId).then(sig => {
            res.render('success', {
                layout: 'main',
                title: 'Success Page',
                sig: sig
            });
        });
    });
});

app.post('/', (req, res) => {
    database.setSig(req.body.first,req.body.last,req.body.sig)
    .then(id => {
        req.session.sigId = id;
        res.redirect('/success');
    })
});

app.get('/signers', (req, res) => {
    database.showNames().then(signers => {
        res.render('signers', {
            layout: 'main',
            title: 'Others Who Signed',
            signers: signers
        })
    });
});

app.listen(8080, () => console.log('Listening on port 8080'));

/*
CREATE TABLE signatures(
   id SERIAL PRIMARY KEY,
   first VARCHAR(100) NOT NULL,
   last VARCHAR(200) NOT NULL,
   signature TEXT NOT NULL
);
*/
