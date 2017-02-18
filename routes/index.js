var express = require('express');
var router = express.Router();
var pg = require('pg');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Real Estate Information Management System 2017' });
});

router.get('/about', function (req, res, next) {
    res.render('about', {
        title: 'Real Estate Information Management System 2017'

    });
});

var db = require('../queries');


router.get('/api/accounts', db.getAllAccounts);
router.get('/api/accounts/:id', db.getSingleAccount);
router.post('/api/accounts', db.createAccount);
router.put('/api/accounts/:id', db.updateAccount);
router.delete('/api/accounts/:id', db.removeAccount);



app.get('/db', function (request, response) {
  pg.connect(process.env.DATABASE_URL, function(err, client, done) {
    client.query('SELECT * FROM test_table', function(err, result) {
      done();
      if (err)
       { console.error(err); response.send("Error " + err); }
      else
       { response.render('pages/db', {results: result.rows} ); }
    });
  });
});


module.exports = router;
