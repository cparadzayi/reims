var promise = require('bluebird');

var options = {
  // Initialization Options
  promiseLib: promise
};

var port = process.en.port
var localConnectionString = 'postgres://postgres:admin@localhost:5432/reimsdb'
var herokuConnectionString = 'postgres://sxypinnkolkfxz:b6b60242418e2d42df4e3d6acac9c68636eac5f0b1b95e572133c3e532026689@ec2-50-17-220-223.compute-1.amazonaws.com:5432/dtmf5pma62kh2'
var pgp = require('pg-promise')(options);
var connectionString = port == 5000 ? localConnectionString: herokuConnectionString;
var db = pgp(connectionString);

// add query functions
function getAllAccounts(req, res, next) {
  db.any('select * from accounts')
    .then(function (data) {
      res.status(200)
        .json({
          status: 'success',
          data: data,
          messaccountnum: 'Retrieved ALL accounts'
        });
    })
    .catch(function (err) {
      return next(err);
    });
}

function getSingleAccount(req, res, next) {
  var accountID = parseInt(req.params.id);
  db.one('select * from accounts where id = $1', accountID)
    .then(function (data) {
      res.status(200)
        .json({
          status: 'success',
          data: data,
          messaccountnum: 'Retrieved ONE account'
        });
    })
    .catch(function (err) {
      return next(err);
    });
}

function createAccount(req, res, next) {
  req.body.townshipid = parseInt(req.body.townshipid);
  db.none('insert into accounts(name, surname, accountnum, townshipid)' +
      'values(${name}, ${surname}, ${accountnum}, ${townshipid})',
    req.body)
    .then(function () {
      res.status(200)
        .json({
          status: 'success',
          messaccountnum: 'Inserted one account'
        });
    })
    .catch(function (err) {
      return next(err);
    });
}

function updateAccount(req, res, next) {
  db.none('update accounts set name=$1, surname=$2, accountnum=$3, townshipid=$4 where id=$5',
    [req.body.name, req.body.surname, parseInt(req.body.townshipid),
      req.body.accountnum, parseInt(req.params.id)])
    .then(function () {
      res.status(200)
        .json({
          status: 'success',
          messaccountnum: 'Updated account'
        });
    })
    .catch(function (err) {
      return next(err);
    });
}

function removeAccount(req, res, next) {
  var accountID = parseInt(req.params.id);
  db.result('delete from accounts where id = $1', accountID)
    .then(function (result) {
      /* jshint ignore:start */
      res.status(200)
        .json({
          status: 'success',
          messaccountnum: `Removed ${result.rowCount} account`
        });
      /* jshint ignore:end */
    })
    .catch(function (err) {
      return next(err);
    });
}

module.exports = {
  getAllAccounts: getAllAccounts,
  getSingleAccount: getSingleAccount,
  createAccount: createAccount,
  updateAccount: updateAccount,
  removeAccount: removeAccount
};
