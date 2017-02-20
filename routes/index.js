var express = require('express');
var router = express.Router();
var dbgeo = require('dbgeo');
 var GeoJSON = require('geojson');

var async = require('async');

var db = require('../queries');
var dbConnection = db.dbConnection;

var app = express();


//MY MIDDLEWARE TO ALLOW THE APIS TO BE ACCESD FOM ANY DOMAIN
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin','*')
  next()
})

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Real Estate Information Management System 2017' });
});

router.get('/about', function (req, res, next) {
    res.render('about', {
        title: 'Real Estate Information Management System 2017'

    });
});

router.get('/cities', function (req, res, next) {
    res.render('cities', {
        title: 'Real Estate Information Management System 2017',
    });
});

/*Api registrations*/

//client apis
router.get('/api/clients', db.getAllclients);
router.get('/api/clients/:id', db.getSingleAccount);
router.post('/api/clients', db.createAccount);
router.put('/api/clients/:id', db.updateAccount);
router.delete('/api/clients/:id', db.removeAccount);

//Cadatral apis
router.get('/api/cities', db.getCitiesData);
router.get('/api/cadastre', db.getCadastralData);




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
