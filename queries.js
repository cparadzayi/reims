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

    //var availablestandssql = "SELECT 'FeatureCollection' AS type, array_to_json(array_agg(f)) AS features FROM (SELECT 'Feature' AS type, ST_AsGeoJSON(lg.geom, 6)::json As geometry, row_to_json((SELECT l FROM (SELECT dsg_num, cityid, townshipid) AS l)) AS properties FROM cadastre AS lg ) AS f";
    //var allstandssql = "SELECT row_to_json(fc) FROM (SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features  FROM (SELECT 'Feature' As type, ST_AsGeoJSON(lg.geom)::json As geometry, row_to_json  ((SELECT l FROM (SELECT lg.standid AS standid, c.name AS city, t.name AS township FROM cities c, townships t WHERE c.cityid= lg.cityid AND t.townshipid = lg.townshipid) As l)) As properties FROM cadastre  As lg) As f ) As fc";
    var allStandsSql = "SELECT 'FeatureCollection' AS type, array_to_json(array_agg(f)) AS features FROM (SELECT 'Feature' AS type, ST_AsGeoJSON(lg.geom, 6)::json As geometry, row_to_json((SELECT l FROM (SELECT dsg_num, cityid, townshipid) AS l)) AS properties FROM cadastre AS lg ) AS f";

    db.any(allStandsSql)
      .then(function (data){
        res.status(200)
        .header('Access-Control-Allow-Origin','*')
        .json({
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
    //var allstandssql = "SELECT cadastre.standid AS StandID, cadastre.dsg_num AS Stand, cities.name AS City, townships.name AS Township FROM cadastre, cities, townships WHERE cadastre.townshipid = townships.townshipid AND cadastre.cityid = cities.cityid";
    //var leakagequery = "SELECT 'FeatureCollection' AS type, array_to_json(array_agg(f)) AS features FROM (SELECT 'Feature' AS type,   ST_AsGeoJSON(leakages.geom, 6)::json As geometry,    row_to_json((SELECT l FROM (SELECT townships.name AS townshipname,leakages.source AS source, leakages.status AS status, leakages.intensity AS intensity, leakages.datereported as datereported, leakages.recorder as reporter, townships.geom) AS l)) AS properties FROM townships, leakages     WHERE  ST_Within(leakages.geom, townships.geom)   GROUP BY leakages.geom,townships.name ,leakages.source , leakages.status , leakages.intensity,leakages.recorder, leakages.datereported,townships.geom ) AS f";
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

function getReservedStands(req, res, next){

  if (req.query.map)
  {

    //var availablestandssql = "SELECT 'FeatureCollection' AS type, array_to_json(array_agg(f)) AS features FROM (SELECT 'Feature' AS type, ST_AsGeoJSON(lg.geom, 6)::json As geometry, row_to_json((SELECT l FROM (SELECT dsg_num, cityid, townshipid) AS l)) AS properties FROM cadastre AS lg ) AS f";
  //  var reservedstands = "SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features  FROM (SELECT 'Feature' As type, ST_AsGeoJSON(lg.geom)::json As geometry, row_to_json  ((SELECT l FROM (    SELECT         cadastre.standid standid,          cities.name city_name,          townships.name township_name,          reservations.clientid clientid,          reservations.reservationdate reservationdate,          clients.name firstname,          clients.surname surname,          clients.email email         FROM          reservations         INNER JOIN cadastre on reservations.standid = cadastre.standid         INNER JOIN cities ON cities.cityid = cadastre.cityid         INNER JOIN townships ON townships.townshipid = cadastre.townshipid         INNER JOIN clients ON reservations.clientid = clients.clientid) As l)) As properties FROM cadastre  As lg) As f";

    var reservedstands = "SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features FROM (SELECT 'Feature' As type, ST_AsGeoJSON(cadastre.geom)::json As geometry, row_to_json  ((SELECT l FROM (SELECT cadastre.standid AS standid, cities.name AS city, townships.name AS township, reservations.reservationdate AS reservationdate, reservations.reservationdate+period*INTERVAL'1 day' AS expirydate) AS l)) AS properties  FROM cadastre, cities, townships, reservations WHERE cadastre.standid IN (SELECT standid FROM reservations WHERE (reservationdate+period*interval '0 day', reservationdate+period*interval '1 day') OVERLAPS (reservationdate+period*interval '1 day', LOCALTIMESTAMP)) AND cadastre.standid = reservations.standid AND cadastre.cityid = cities.cityid AND cadastre.townshipid = townships.townshipid) As f";

      db.any(reservedstands)
      .then(function (data){
        res.status(200)
        .header('Access-Control-Allow-Origin','*')
        .json({
          reservedstandsmap: data

        })
      })
      .catch(function(err){
        console.log('Geojson trouble here !!')
        if (err) {return next()}
      })

  }
  else
  {
  //  var reservedstands = "SELECT cadastre.standid standid, cities.name city_name, townships.name township_name,  reservations.clientid clientid,  reservations.reservationdate reservationdate,  clients.name firstname, clients.surname surname, clients.email email FROM  cadastre INNER JOIN cities ON cities.cityid = cadastre.cityid INNER JOIN townships ON townships.townshipid = cadastre.townshipid INNER JOIN reservations on reservations.standid = cadastre.standid INNER JOIN clients ON reservations.clientid = clients.clientid";
    var reservedstands ="SELECT cadastre.standid AS standid, cities.name AS city, townships.name AS township, reservations.reservationdate AS reservationdate, reservations.reservationdate+period*INTERVAL'1 day' AS expirydate  FROM cadastre, cities, townships, reservations WHERE cadastre.standid IN (SELECT standid FROM reservations WHERE (reservationdate+period*interval '0 day', reservationdate+period*interval '1 day') OVERLAPS (reservationdate+period*interval '1 day', LOCALTIMESTAMP)) AND cadastre.standid = reservations.standid AND cadastre.cityid = cities.cityid AND cadastre.townshipid = townships.townshipid";

    //var leakagequery = "SELECT 'FeatureCollection' AS type, array_to_json(array_agg(f)) AS features FROM (SELECT 'Feature' AS type,   ST_AsGeoJSON(leakages.geom, 6)::json As geometry,    row_to_json((SELECT l FROM (SELECT townships.name AS townshipname,leakages.source AS source, leakages.status AS status, leakages.intensity AS intensity, leakages.datereported as datereported, leakages.recorder as reporter, townships.geom) AS l)) AS properties FROM townships, leakages     WHERE  ST_Within(leakages.geom, townships.geom)   GROUP BY leakages.geom,townships.name ,leakages.source , leakages.status , leakages.intensity,leakages.recorder, leakages.datereported,townships.geom ) AS f";

    db.any(reservedstands)
    .then(function (data){
      res.status(200)
      .header('Access-Control-Allow-Origin','*')
      .json({
        reservedstands: data

      })
    })
    .catch(function(err){
      console.log('problems with getting data from database!')
      if (err) {return next()}
    })

  };

}

function getAvailableStands(req, res, next){

  if (req.query.map)
  {

    var availablestands = "SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features FROM (SELECT 'Feature' As type, ST_AsGeoJSON(cadastre.geom)::json As geometry, row_to_json  ((SELECT l FROM (SELECT cadastre.standid AS standid, cities.name AS city, townships.name AS township) AS l)) AS properties  FROM cadastre, cities, townships WHERE NOT EXISTS (SELECT * FROM reservations r WHERE r.standid = cadastre.standid AND (reservationdate+period*interval '0 day', reservationdate+period*interval '1 day') OVERLAPS (reservationdate+period*interval '1 day', LOCALTIMESTAMP)) AND NOT EXISTS (select null from soldstands where soldstands.standid = cadastre.standid) AND cadastre.cityid = cities.cityid AND cadastre.townshipid = townships.townshipid ORDER BY cadastre.standid, townships.name, cities.name) As f";
      db.any(availablestands)
      .then(function (data){
        res.status(200)
        .header('Access-Control-Allow-Origin','*')
        .json({
          availablestandsmap: data

        })
      })
      .catch(function(err){
        console.log('Available stands with map trouble here !!')
        if (err) {return next()}
      })

  }
  else
  {
  //  return no map component
    var availablestands ="SELECT c.standid AS standid, cities.name AS city, townships.name AS township  FROM cadastre c, cities, townships WHERE NOT EXISTS (SELECT * FROM reservations r WHERE r.standid = c.standid AND (reservationdate+period*interval '0 day', reservationdate+period*interval '1 day') OVERLAPS (reservationdate+period*interval '1 day', LOCALTIMESTAMP)) AND NOT EXISTS (select null from soldstands where soldstands.standid = c.standid) AND c.cityid = cities.cityid AND c.townshipid = townships.townshipid ORDER BY c.standid, townships.name, cities.name";

    //var leakagequery = "SELECT 'FeatureCollection' AS type, array_to_json(array_agg(f)) AS features FROM (SELECT 'Feature' AS type,   ST_AsGeoJSON(leakages.geom, 6)::json As geometry,    row_to_json((SELECT l FROM (SELECT townships.name AS townshipname,leakages.source AS source, leakages.status AS status, leakages.intensity AS intensity, leakages.datereported as datereported, leakages.recorder as reporter, townships.geom) AS l)) AS properties FROM townships, leakages     WHERE  ST_Within(leakages.geom, townships.geom)   GROUP BY leakages.geom,townships.name ,leakages.source , leakages.status , leakages.intensity,leakages.recorder, leakages.datereported,townships.geom ) AS f";

    db.any(availablestands)
    .then(function (data){
      res.status(200)
      .header('Access-Control-Allow-Origin','*')
      .json({
        availablestands: data

      })
    })
    .catch(function(err){
      console.log('problems with getting data from database!')
      if (err) {return next()}
    })

  };

}

function getSoldStands(req, res, next){

  if (req.query.map)
  {

    var soldstands = "SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features FROM (SELECT 'Feature' As type, ST_AsGeoJSON(cadastre.geom)::json As geometry, row_to_json  ((SELECT l FROM (SELECT cadastre.standid standid, cities.name city_name, townships.name township_name,  soldstands.clientid clientid, clients.name firstname, clients.surname surname, clients.email email) AS l)) AS properties  FROM  cadastre INNER JOIN cities ON cities.cityid = cadastre.cityid INNER JOIN townships ON townships.townshipid = cadastre.townshipid INNER JOIN soldstands on soldstands.standid = cadastre.standid INNER JOIN clients ON soldstands.clientid = clients.clientid) As f";

      db.any(soldstands)
      .then(function (data){
        res.status(200)
        .header('Access-Control-Allow-Origin','*')
        .json({
          soldstandsmap: data

        })
      })
      .catch(function(err){
        console.log('Geojson trouble here !!')
        if (err) {return next()}
      })

  }
  else
  {

    var soldstands ="SELECT cadastre.standid standid, cities.name city_name, townships.name township_name,  soldstands.clientid clientid, clients.name firstname, clients.surname surname, clients.email email FROM  cadastre INNER JOIN cities ON cities.cityid = cadastre.cityid INNER JOIN townships ON townships.townshipid = cadastre.townshipid INNER JOIN soldstands on soldstands.standid = cadastre.standid INNER JOIN clients ON soldstands.clientid = clients.clientid";

    db.any(soldstands)
    .then(function (data){
      res.status(200)
      .header('Access-Control-Allow-Origin','*')
      .json({
        soldstands: data

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
  getAllStands: getAllStands,
  getAvailableStands: getAvailableStands,
  getReservedStands: getReservedStands,
  getSoldStands: getSoldStands

};
