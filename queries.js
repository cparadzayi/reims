var promise = require('bluebird');

var options = {
  // Initialization Options
  promiseLib: promise
};

var pgp = require('pg-promise')(options);

// move the two database connection options into the aoo,js and set development and production environments respectiveky
//var connectionString = 'postgres://postgres:admin@localhost:5432/reimsdb'
var connectionString = process.env.DATABASE_URL || 'postgres://postgres:admin@localhost:5432/reimsdb'
var db = pgp(connectionString);

/* connecting to Heroku postgresql database
var pg = require('pg').native;
var herokuconnectionString = 'postgres://gztwokgbqbqqnm:259213bfe9057460f3a31f8f550890ed782f2899a85edb6a0a35b35c9c1b83fe@ec2-54-243-214-198.compute-1.amazonaws.com:5432/dv2k3bi29i3q1';
var db = pg(herokuconnectionString);
*/
// add query functions
function getAllclients(req, res, next) {
  db.any('select * from clients')
    .then(function (data) {
      res.status(200)
        .header('Access-Control-Allow-Origin','*')
        .json({
          status: 'success',
          data: data,
          messaccountnum: 'Retrieved ALL clients'
        });
    })
    .catch(function (err) {
      return next(err);
    });
}

function getSingleAccount(req, res, next) {
  var accountID = req.params.id;
  db.one('select * from clients where clientid = $1', accountID)
    .then(function (data) {
      res
        .status(200)
        .header('Access-Control-Allow-Origin','*')
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
  db.none('insert into clients(name, surname, accountnum, townshipid)' +
      'values(${name}, ${surname}, ${accountnum}, ${townshipid})',
    req.body)
    .then(function () {
      res.status(200)
        .header('Access-Control-Allow-Origin','*')
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
  db.none('update clients set name=$1, surname=$2, accountnum=$3, townshipid=$4 where id=$5',
    [req.body.name, req.body.surname, parseInt(req.body.townshipid),
      req.body.accountnum, parseInt(req.params.id)])
    .then(function () {
      res.status(200)
        .header('Access-Control-Allow-Origin','*')
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
  db.result('delete from clients where id = $1', accountID)
    .then(function (result) {
      /* jshint ignore:start */
      res.status(200)
        .header('Access-Control-Allow-Origin','*')
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

function getCitiesData(req, res, next){
  var citiesquery = "SELECT 'FeatureCollection' AS type, array_to_json(array_agg(f)) AS features FROM (SELECT 'Feature' AS type, ST_AsGeoJSON(lg.geom, 6)::json As geometry, row_to_json((SELECT l FROM (SELECT name, cityid) AS l)) AS properties FROM cities AS lg ) AS f";

  db.any(citiesquery)
  .then(function (data) {
      res.status(200)
        .header('Access-Control-Allow-Origin','*')
        .json({
          status: 'success',
          data: data,
        });
    })
    .catch(function(err){
      if (err) {return next()}
    })
}

function getReservations(req, res, next){
  var reservaationsQuery = "    SELECT 'FeatureCollection' AS type, array_to_json(array_agg(f)) AS features FROM (SELECT 'Feature' AS type, ST_AsGeoJSON(cadastre.geom, 6)::json As geometry, row_to_json((SELECT l FROM (SELECT reservations.standid,clients.clientid, clients.surname, clients.name) AS l)) AS properties FROM cadastre, reservations, clients WHERE   reservations.standid = cadastre.standid AND reservations.clientid = clients.clientid) AS f";

  db.any(reservaationsQuery)
  .then(function (data) {
      res.status(200)
        .header('Access-Control-Allow-Origin','*')
        .json({
          status: 'success',
          data: data,
        });
    })
    .catch(function(err){
      if (err) {return next()}
    })
}

function getCadastralData(req, res, next){
  var cadastresql = "SELECT 'FeatureCollection' AS type, array_to_json(array_agg(f)) AS features FROM (SELECT 'Feature' AS type, ST_AsGeoJSON(lg.geom, 6)::json As geometry, row_to_json((SELECT l FROM (SELECT dsg_num, cityid, townshipid) AS l)) AS properties FROM cadastre AS lg ) AS f";

  db.any(cadastresql)
  .then(function (data){
    res.status(200)
    .header('Access-Control-Allow-Origin','*')
    .json({
      status: 'success',
      data: data,
    })
  })
  .catch(function(err){
    if (err) {return next()}
  })
}

function getAllStands(req, res, next){

  if (req.query.map)
  {

    var allStandsSql = "SELECT 'FeatureCollection' AS type, array_to_json(array_agg(f)) AS features FROM (SELECT 'Feature' AS type, ST_AsGeoJSON(lg.geom, 6)::json As geometry, row_to_json((SELECT l FROM (SELECT dsg_num, cityid, townshipid) AS l)) AS properties FROM cadastre AS lg ) AS f";

    db.any(allStandsSql)
      .then(function (data){
        res.status(200)
        .header('Access-Control-Allow-Origin','*')
        .json({
          status: 'success',
          data: data,
          message: "I have detected the map parameter"

        })
      })
      .catch(function(err){
        console.log('Geojson trouble here !!')
        if (err) {return next()}
      })

  }
  else
  {
    var allStandsSql = "SELECT cadastre.dsg_num AS Stand, cities.name AS City, townships.name AS Township FROM cadastre, cities, townships WHERE cadastre.townshipid = townships.townshipid AND cadastre.cityid = cities.cityid";

    db.any(allStandsSql)
    .then(function (data){
      res.status(200)
      .header('Access-Control-Allow-Origin','*')
      .json({
        message: "I am not seeing the map parameter",
        status: 'success',
        data: data

      })
    })
    .catch(function(err){
      console.log('problems with getting data from database!')
      if (err) {return next()}
    })

  };

}
module.exports = {
  getAllclients: getAllclients,
  getSingleAccount: getSingleAccount,
  createAccount: createAccount,
  updateAccount: updateAccount,
  removeAccount: removeAccount,
  dbConnection: db,
  getCitiesData: getCitiesData,
  getReservations: getReservations,
  getCadastralData: getCadastralData,
  getAllStands: getAllStands
};
