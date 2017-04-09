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

router.get('/garagestores', function (req, res, next) {
    res.render('garagestores', {
        title: 'Garage Stores Information Management System 2017',
    });
});

// pagination
router.get('/pagination', function(req, res){

	//set default variables
	var totalStudents = 80,
		pageSize = 10,
		pageCount = 80/8,
		currentPage = 1,
		students = [],
		studentsArrays = [],
		studentsList = [];

	//genreate list of students
	for (var i = 1; i < totalStudents; i++) {
		students.push({name: 'Student Number ' + i});
	}

	//split list into groups
	while (students.length > 0) {
	    studentsArrays.push(students.splice(0, pageSize));
	}

	//set current page if specifed as get variable (eg: /?page=2)
	if (typeof req.query.page !== 'undefined') {
		currentPage = +req.query.page;
	}

	//show list of students from group
	studentsList = studentsArrays[+currentPage - 1];

	//render index.ejs view file
	res.render('pagination', {
		students: studentsList,
		pageSize: pageSize,
		totalStudents: totalStudents,
		pageCount: pageCount,
		currentPage: currentPage
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

router.get('/api/reservations', db.getReservations);

// stands api
router.get('/api/stands', db.getAllStands);
router.get('/api/stands/reservations', db.getReservedStands);
router.get('/api/stands/reservations/:id', db.getReservedStandDetails);

router.get('/api/stands/sold', db.getSoldStands);
router.get('/api/stands/available', db.getAvailableStands);
router.get('/api/stands/available/:id', db.getAvailableStandDetails);

// payments
router.get('/api/payments/history', db.getPayments);
router.get('/api/payments/summary', db.getPaymentsSummary);
router.get('/api/payments/history/:id', db.getClientPaymentHistory);

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
