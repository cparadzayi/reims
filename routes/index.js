var express = require('express');
var router = express.Router();

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


module.exports = router;
