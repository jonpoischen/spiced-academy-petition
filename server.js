const express = require('express');
const app = express();
const hb = require('express-handlebars');
const database = require('./database.js');
app.engine('handlebars', hb());
app.set('view engine', 'handlebars');

app.use(express.static('public'));
app.use(require('body-parser').urlencoded({
    extended: false
}));
app.use(require('cookie-parser')());

app.get('/', (req, res) => {
    res.render('home', {
        layout: 'main',
        title: 'Home Page'
    })
});

app.get('/success', (req, res) => {
    res.render('success', {
        layout: 'main',
        title: 'Success Page'
    })
});

app.post('/', (req, res) => {
    console.log(req.body.first);
    console.log(req.body.last);
    console.log(req.body.sig);
    database.setSig(req.body.first,req.body.last,req.body.sig).then(
        result => console.log(result)
    )
})


/*

{{#if error}}
    <div class="error">You messed up</div>
<form method = "POST">
    <input>
    <input>
    <input>
    <button></button>
</form>


// exports.getCityByName(name) {
//     return db.query(
//         `SELECT * FROM cities WHERE name = $1`,
//         [name]
//     )
// };

3 get routes and 1 post route (submit button)
*/

app.listen(8080, () => console.log('Listening on port 8080'));
