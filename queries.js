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

  db.one('SELECT * FROM clients WHERE clientid = $1', accountID)
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
  db.none('insert into clients(name, surname, clientid, townshipid)' +
      'values(${name}, ${surname}, ${clientid}, ${townshipid})',
    req.query)
    .then(function () {
      res.status(200)
        .header('Access-Control-Allow-Origin','*')
        .json({
          status: 'success',
          messaccountnum: 'Inserted one account'
        });
    })
    .catch(function (err) {
      res.json({
        query: req.query
      })
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

    var allStandsSql = "SELECT 'FeatureCollection' AS type, array_to_json(array_agg(f)) AS features FROM (SELECT 'Feature' AS type, ST_AsGeoJSON(lg.geom, 6)::json As geometry, row_to_json((SELECT l FROM (SELECT standid, cityid, townshipid) AS l)) AS properties FROM cadastre AS lg ) AS f";

    db.any(allStandsSql)
      .then(function (data){
        res.status(200)
        .header('Access-Control-Allow-Origin','*')
        .json({
          data: data,
          message: "geojson"

        })
      })
      .catch(function(err){
        console.log('Geojson trouble here !!')
        if (err) {return next()}
      })

  }
  else
  {

 var allStandsSql = "SELECT cadastre.standid AS standid, cities.name AS City, townships.name AS Township FROM cadastre, cities, townships WHERE cadastre.townshipid = townships.townshipid AND cadastre.cityid = cities.cityid";
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

function getReservedStandDetails(req, res, next){

  if (req.query.map)
  {

var reservedstand = req.params.id;

console.log('Reserved stand: ', reservedstand);

      db.one("SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features FROM (SELECT 'Feature' As type, ST_AsGeoJSON(cadastre.geom)::json As geometry, row_to_json  ((SELECT l FROM (SELECT clients.name firstname, clients.surname, clients.address, clients.email, cadastre.dsg_num stand, townships.name township, cities.name city, reservations.reservationdate AS reservationdate, reservations.reservationdate+period*INTERVAL'1 day' AS expirydate) AS l)) AS properties  FROM cadastre, reservations, clients, townships, cities WHERE clients.clientid = reservations.clientid AND cadastre.standid = reservations.standid AND cadastre.townshipid =  townships.townshipid AND cities.cityid = cadastre.cityid AND (reservationdate+period*interval '0 day', reservationdate+period*interval '1 day') OVERLAPS (reservationdate+period*interval '1 day', LOCALTIMESTAMP) AND reservations.standid = $1) As f", reservedstand)
      .then(function (data){
        res.status(200)
        .header('Access-Control-Allow-Origin','*')
        .json({
          reservedstandmap: data

        })
      })
      .catch(function(err){
        console.log('Geojson trouble here !!')
        if (err) {return next()}
      })

  }
  else
  {
    var reservedstand = req.params.id;

    db.one("SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features FROM (SELECT 'Feature' As type, ST_AsGeoJSON(cadastre.geom)::json As geometry, row_to_json  ((SELECT l FROM (SELECT clients.name firstname, clients.surname, clients.address, clients.email, cadastre.dsg_num stand, townships.name township, cities.name city, reservations.reservationdate AS reservationdate, reservations.reservationdate+period*INTERVAL'1 day' AS expirydate) AS l)) AS properties  FROM cadastre, reservations, clients, townships, cities WHERE clients.clientid = reservations.clientid AND cadastre.standid = reservations.standid AND cadastre.townshipid =  townships.townshipid AND cities.cityid = cadastre.cityid AND (reservationdate+period*interval '0 day', reservationdate+period*interval '1 day') OVERLAPS (reservationdate+period*interval '1 day', LOCALTIMESTAMP) AND reservations.standid = $1) As f", reservedstand)
    .then(function (data){
      res.status(200)
      .header('Access-Control-Allow-Origin','*')
      .json({
        reservedstanddata: data

      })
    })
    .catch(function(err){
      console.log('problems with getting data from database!', err)
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


function getAvailableStandDetails(req, res, next){

  if (req.query.map)
  // return the spatial component here
  {
    var selectedstand = req.params.id;

      db.one("SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features FROM (SELECT 'Feature' As type, ST_AsGeoJSON(cadastre.geom)::json As geometry, row_to_json  ((SELECT l FROM (SELECT cadastre.standid AS standid, cities.name AS city, townships.name AS township) AS l)) AS properties  FROM cadastre, cities, townships WHERE  cadastre.standid = $1 AND NOT EXISTS (SELECT * FROM reservations r WHERE r.standid = cadastre.standid AND (reservationdate+period*interval '0 day', reservationdate+period*interval '1 day') OVERLAPS (reservationdate+period*interval '1 day', LOCALTIMESTAMP)) AND NOT EXISTS (select null from soldstands where soldstands.standid = cadastre.standid) AND cadastre.cityid = cities.cityid AND cadastre.townshipid = townships.townshipid ORDER BY cadastre.standid, townships.name, cities.name) As f", selectedstand)
      .then(function (data){
        res.status(200)
        .header('Access-Control-Allow-Origin','*')
        .json({
          selectedstandmap: data
        })
      })
      .catch(function(err){
        console.log('Problem getting selected stand map data from database!!')
        if (err) {return next()}
      })

  }
  else
  {
  //  return non-spatial component
  var selectedstand = req.params.id;

    db.one("SELECT c.standid AS standid, cities.name AS city, townships.name AS township  FROM cadastre c, cities, townships WHERE c.standid = $1 AND NOT EXISTS (SELECT * FROM reservations r WHERE r.standid = c.standid AND (reservationdate+period*interval '0 day', reservationdate+period*interval '1 day' ) OVERLAPS (reservationdate+period*interval '1 day', LOCALTIMESTAMP)) AND NOT EXISTS (select null from soldstands where soldstands.standid = c.standid ) AND c.cityid = cities.cityid AND c.townshipid = townships.townshipid", selectedstand)

    .then(function (data){
      res.status(200)
      .header('Access-Control-Allow-Origin','*')
      .json({
        selectedstanddata: data

      })
    })
    .catch(function(err){
      console.log('problems with getting selected stand data from database!')
      if (err) {return next()}
    })

  };

}

function getSoldStands(req, res, next){

  if (req.query.map)
  {

    var soldstands = "SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features FROM (SELECT 'Feature' As type, ST_AsGeoJSON(cadastre.geom)::json As geometry, row_to_json  ((SELECT l FROM (SELECT cadastre.standid standid, cities.name city, townships.name township,  soldstands.clientid clientid, clients.name firstname, clients.surname surname, clients.email email) AS l)) AS properties  FROM  cadastre INNER JOIN cities ON cities.cityid = cadastre.cityid INNER JOIN townships ON townships.townshipid = cadastre.townshipid INNER JOIN soldstands on soldstands.standid = cadastre.standid INNER JOIN clients ON soldstands.clientid = clients.clientid) As f";

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

    var soldstands ="SELECT cadastre.standid standid, cities.name city, townships.name township,  soldstands.clientid clientid, clients.name firstname, clients.surname surname, clients.email email FROM  cadastre INNER JOIN cities ON cities.cityid = cadastre.cityid INNER JOIN townships ON townships.townshipid = cadastre.townshipid INNER JOIN soldstands on soldstands.standid = cadastre.standid INNER JOIN clients ON soldstands.clientid = clients.clientid";

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

function getPayments(req, res, next){

  if (req.query.map)
  {

    var paymenthistory = "SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features FROM (SELECT 'Feature' As type, ST_AsGeoJSON(cadastre.geom)::json As geometry, row_to_json  ((SELECT l FROM (SELECT cadastre.standid standid, cities.name city, townships.name township,  soldstands.clientid clientid, clients.name firstname, clients.surname surname, clients.email email) AS l)) AS properties  FROM  cadastre INNER JOIN cities ON cities.cityid = cadastre.cityid INNER JOIN townships ON townships.townshipid = cadastre.townshipid INNER JOIN soldstands on soldstands.standid = cadastre.standid INNER JOIN clients ON soldstands.clientid = clients.clientid) As f";

      db.any(paymenthistory)
      .then(function (data){
        res.status(200)
        .header('Access-Control-Allow-Origin','*')
        .json({
          paymenthistorymap: data

        })
      })
      .catch(function(err){
        console.log('Geojson trouble here !!')
        if (err) {return next()}
      })

  }
  else
  {

    var paymenthistory ="SELECT cadastre.standid standid, cities.name city, townships.name township,  soldstands.clientid clientid, soldstands.price price, receipts.amount amount, receipts.recnum receiptnum, paymentmode.type paymentmode, receipts.date paymentdate, clients.name firstname, clients.surname surname, clients.email email FROM  cadastre INNER JOIN cities ON cities.cityid = cadastre.cityid INNER JOIN townships ON townships.townshipid = cadastre.townshipid INNER JOIN soldstands on soldstands.standid = cadastre.standid INNER JOIN clients ON soldstands.clientid = clients.clientid INNER JOIN receipts ON receipts.standid = cadastre.standid INNER JOIN paymentmode ON receipts.paymentcode = paymentmode.code GROUP BY cadastre.standid, cities.name, cities.name, townships.name,  soldstands.clientid, soldstands.price, receipts.amount, receipts.recnum, paymentmode.type, receipts.date, clients.name, clients.surname, clients.email ORDER BY cadastre.standid DESC";

    db.any(paymenthistory)
    .then(function (data){
      res.status(200)
      .header('Access-Control-Allow-Origin','*')
      .json({
        paymenthistory: data

      })
    })
    .catch(function(err){
      console.log('problems with getting payments data from database!')
      if (err) {return next()}
    })

  };

}


function getClientPaymentHistory(req, res, next) {
  var client = req.params.id;
  db.any('select receipts.date, receipts.clientid, receipts.amount, receipts.standid, receipts.recnum as receiptnum, transactionmode.mode paymentmode FROM receipts, transactionmode  WHERE receipts.paymentcode = transactionmode.code AND receipts.clientid = $1', client)

    .then(function (data) {
      res
        .status(200)
        .header('Access-Control-Allow-Origin','*')
        .json({
          status: 'success',
          data: data,
          messaccountnum: 'Retrieved payments'
        });
    })

    .catch(function (err) {
      return next(err);
    });
}

function getPaymentsSummary(req, res, next){

  if (req.query.map)
  {

    var paymentssummary = "SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features FROM (SELECT 'Feature' As type, ST_AsGeoJSON(cadastre.geom)::json As geometry, row_to_json  ((SELECT l FROM (SELECT cadastre.standid standid, cities.name city, townships.name township,  soldstands.clientid clientid, clients.name firstname, clients.surname surname, clients.email email) AS l)) AS properties  FROM  cadastre INNER JOIN cities ON cities.cityid = cadastre.cityid INNER JOIN townships ON townships.townshipid = cadastre.townshipid INNER JOIN soldstands on soldstands.standid = cadastre.standid INNER JOIN clients ON soldstands.clientid = clients.clientid) As f";

      db.any(paymentssummary)
      .then(function (data){
        res.status(200)
        .header('Access-Control-Allow-Origin','*')
        .json({
          paymentssummarymap: data

        })
      })
      .catch(function(err){
        console.log('Geojson trouble here !!')
        if (err) {return next()}
      })

  }
  else
  {

    var paymentssummary ="SELECT cities.name city, townships.name township, receipts.standid, clients.name, clients.surname, soldstands.price, sum(receipts.amount) totalpayment FROM receipts INNER JOIN cadastre ON receipts.standid = cadastre.standid INNER JOIN cities ON cadastre.cityid = cities.cityid INNER JOIN townships ON cadastre.townshipid = townships.townshipid INNER JOIN clients ON receipts.clientid = clients.clientid INNER JOIN soldstands ON cadastre.standid = soldstands.standid GROUP BY receipts.standid, cities.name, townships.name, clients.name, clients.surname, soldstands.price";

    db.any(paymentssummary)
    .then(function (data){
      res.status(200)
      .header('Access-Control-Allow-Origin','*')
      .json({
        paymentssummary: data

      })
    })
    .catch(function(err){
      console.log('problems with getting payments data from database!')
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
  getReservedStandDetails: getReservedStandDetails,
  getCadastralData: getCadastralData,
  getAllStands: getAllStands,
  getAvailableStands: getAvailableStands,
  getAvailableStandDetails: getAvailableStandDetails,
  getReservedStands: getReservedStands,
  getPayments: getPayments,
  getPaymentsSummary: getPaymentsSummary,
  getSoldStands: getSoldStands,
  getClientPaymentHistory: getClientPaymentHistory

};
