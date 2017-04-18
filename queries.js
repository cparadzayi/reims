var promise = require('bluebird');
var moment = require('moment');

var options = {
  // Initialization Options
  promiseLib: promise
};

var pgp = require('pg-promise')(options);
var types = pgp.pg.types;
// 1114 is OID for timestamp in Postgres
// return string as is
//types.setTypeParser(1114, str => moment.utc(str).format());
// 1114 is OID for timestamp in Postgres
// return string as is
//types.setTypeParser(1114, str => str);

//The incoming timestamps without timezone are parsed in local time instead of UTC -- I'd call this a bug in node-postgres. Anyway, you can override it to do the right thing by adding the following code:

types.setTypeParser(1114, function(stringValue) {
  //console.log("Date from database: ", stringValue);
  return new Date(Date.parse(stringValue + "+0000"));
})

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
  //var firstname = req.query.firstname.toLowerCase();
  db.any(`select * from clients`)
//db.any(`select * from clients WHERE lower(name) LIKE '%${firstname}%' $1`)
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

function getSearchClientData(req, res, next) {
  var firstname = req.query.firstname;
  var surname = req.query.surname;
  var id = req.query.clientid;
  let sqlSearch = ''
  if (firstname && surname && id) {
    // sql to search with all
    sqlSearch = `select * from clients WHERE lower(name) LIKE '%${firstname}%' OR lower(surname) LIKE '%${surname}%'  OR lower(clientid) LIKE '%${id}%'`

  } else if (firstname && surname) {
    sqlSearch = `select * from clients WHERE lower(name) LIKE '%${firstname}%' OR lower(surname) LIKE '%${surname}%'`

  } else if (firstname && !id && !surname) {
    sqlSearch = `select * from clients WHERE lower(name) LIKE '%${firstname}%'`
  } else if (surname && !id && !firstname) {
    sqlSearch = `select * from clients WHERE lower(surname) LIKE '%${surname}%'`

  }else if (id && !surname && !firstname) {
    sqlSearch = `select * from clients WHERE lower(clientid) LIKE '%${id}%'`

  }

  //db.any(`select * from clients`)
  db.any(sqlSearch)
    .then(function (data) {
      res.status(200)
        .header('Access-Control-Allow-Origin','*')
        .json({
          data: data
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

    var allStandsSql = "SELECT 'FeatureCollection' AS type, array_to_json(array_agg(f)) AS features FROM (SELECT 'Feature' AS type, ST_AsGeoJSON(lg.geom, 6)::json As geometry, row_to_json((SELECT l FROM (SELECT lg.standid, c.name AS city, t.name as township) AS l)) AS properties FROM cadastre AS lg, cities as c, townships as t WHERE lg.townshipid = t.townshipid AND lg.cityid = c.cityid ) AS f";

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


    var reservedstands = "SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features FROM (SELECT 'Feature' As type, ST_AsGeoJSON(cadastre.geom)::json As geometry, row_to_json  ((SELECT l FROM (SELECT cadastre.standid AS standid,  townships.name AS township, cities.name AS city, reservations.reservationdate AT TIME ZONE 'GMT-2' AS reservationdate, reservations.reservationdate+period*INTERVAL'1 day' AS expirydate, clients.name AS firstname, clients.surname AS surname) AS l)) AS properties  FROM cadastre, cities, townships, reservations, clients WHERE cadastre.standid IN (SELECT standid FROM reservations WHERE (reservationdate+period*interval '0 day', reservationdate+period*interval '1 day') OVERLAPS (reservationdate+period*interval '1 day', LOCALTIMESTAMP)) AND cadastre.standid = reservations.standid AND cadastre.cityid = cities.cityid AND cadastre.townshipid = townships.townshipid AND reservations.clientid = clients.clientid) As f";

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

  //  added time zone (GMT-2) to the database time so that its not always one day behind
    var reservedstands ="SELECT cadastre.standid AS standid, townships.name AS township, cities.name AS city,  reservations.reservationdate AT TIME ZONE 'GMT-2' AS reservationdate, reservations.reservationdate+period*INTERVAL'1 day' AS expirydate, clients.name AS firstname, clients.surname AS surname FROM cadastre, cities, townships, reservations, clients WHERE cadastre.standid IN (SELECT standid FROM reservations WHERE (reservationdate+period*interval '0 day', reservationdate+period*interval '1 day') OVERLAPS (reservationdate+period*interval '1 day', LOCALTIMESTAMP)) AND cadastre.standid = reservations.standid AND cadastre.cityid = cities.cityid AND cadastre.townshipid = townships.townshipid AND reservations.clientid = clients.clientid";

    db.any(reservedstands)
    .then(function (data){
      res.status(200)
      .header('Access-Control-Allow-Origin','*')
      .json({
        reservedstands: data

      })
      //var parseddata = JSON.parse(data);
      //console.log(parseddata.reservationdate);
    })
    .catch(function(err){
      console.log('problems with getting data from database!')
      if (err) {return next()}
    })

  };

}

function getSearchReservationsData(req, res, next) {
  var datereserved = req.query.reservationdate;
  var id = req.query.clientid;
  var stand = req.query.standid;
  var reservationperiod = parseInt(req.query.period);
  let sqlSearch = '';

  // console.log("reservation period: ", reservationperiod, ' of type', typeof reservationperiod);

  if (datereserved && id && stand) {
    // sql to search with all
  // sqlSearch = `select reservations.standid, reservations.clientid, reservations.reservationdate AT TIME ZONE 'GMT-2' AS reservationdate, clients.name firstname, clients.surname as surname from reservations, clients WHERE reservationdate = '%${datereserved}%' AND reservations.clientid LIKE '%${id}%'  AND lower(reservations.standid) LIKE '%${stand}%' AND clients.clientid = reservations.clientid`
  sqlSearch = `SELECT cadastre.standid AS standid, townships.name AS township, cities.name AS city,  reservations.reservationdate AT TIME ZONE 'GMT-2' AS reservationdate, reservations.reservationdate+period*INTERVAL'1 day' AS expirydate, clients.name AS firstname, clients.surname AS surname FROM cadastre, cities, townships, reservations, clients WHERE cadastre.standid IN (SELECT standid FROM reservations WHERE (reservationdate+period*interval '0 day', reservationdate+period*interval '1 day') OVERLAPS (reservationdate+period*interval '1 day', LOCALTIMESTAMP)) AND cadastre.standid = reservations.standid AND cadastre.cityid = cities.cityid AND cadastre.townshipid = townships.townshipid AND reservations.clientid = clients.clientid AND reservationdate = '%${datereserved}%' AND reservations.clientid LIKE '%${id}%'  AND reservations.standid LIKE '%${stand}%'`

  } else if (datereserved && id) {
    sqlSearch = `SELECT cadastre.standid AS standid, townships.name AS township, cities.name AS city,  reservations.reservationdate AT TIME ZONE 'GMT-2' AS reservationdate, reservations.reservationdate+period*INTERVAL'1 day' AS expirydate, clients.name AS firstname, clients.surname AS surname FROM cadastre, cities, townships, reservations, clients WHERE cadastre.standid IN (SELECT standid FROM reservations WHERE (reservationdate+period*interval '0 day', reservationdate+period*interval '1 day') OVERLAPS (reservationdate+period*interval '1 day', LOCALTIMESTAMP)) AND cadastre.standid = reservations.standid AND cadastre.cityid = cities.cityid AND cadastre.townshipid = townships.townshipid AND reservations.clientid = clients.clientid AND reservationdate = '%${datereserved}%' AND reservations.clientid LIKE '%${id}%'`
  }else if (id && stand) {
    sqlSearch = `SELECT cadastre.standid AS standid, townships.name AS township, cities.name AS city,  reservations.reservationdate AT TIME ZONE 'GMT-2' AS reservationdate, reservations.reservationdate+period*INTERVAL'1 day' AS expirydate, clients.name AS firstname, clients.surname AS surname FROM cadastre, cities, townships, reservations, clients WHERE cadastre.standid IN (SELECT standid FROM reservations WHERE (reservationdate+period*interval '0 day', reservationdate+period*interval '1 day') OVERLAPS (reservationdate+period*interval '1 day', LOCALTIMESTAMP)) AND cadastre.standid = reservations.standid AND cadastre.cityid = cities.cityid AND cadastre.townshipid = townships.townshipid AND reservations.clientid = clients.clientid AND reservations.clientid LIKE '%${id}%' AND reservations.standid LIKE '%${stand}%'`

  } else if (datereserved && !id && !stand) {
    sqlSearch = `SELECT cadastre.standid AS standid, townships.name AS township, cities.name AS city,  reservations.reservationdate AT TIME ZONE 'GMT-2' AS reservationdate, reservations.reservationdate+period*INTERVAL'1 day' AS expirydate, clients.name AS firstname, clients.surname AS surname FROM cadastre, cities, townships, reservations, clients WHERE cadastre.standid IN (SELECT standid FROM reservations WHERE (reservationdate+period*interval '0 day', reservationdate+period*interval '1 day') OVERLAPS (reservationdate+period*interval '1 day', LOCALTIMESTAMP)) AND cadastre.standid = reservations.standid AND cadastre.cityid = cities.cityid AND cadastre.townshipid = townships.townshipid AND reservations.clientid = clients.clientid AND reservationdate = '%${datereserved}%'`
  } else if (stand && !id && !datereserved) {
    sqlSearch = `SELECT cadastre.standid AS standid, townships.name AS township, cities.name AS city,  reservations.reservationdate AT TIME ZONE 'GMT-2' AS reservationdate, reservations.reservationdate+period*INTERVAL'1 day' AS expirydate, clients.name AS firstname, clients.surname AS surname FROM cadastre, cities, townships, reservations, clients WHERE cadastre.standid IN (SELECT standid FROM reservations WHERE (reservationdate+period*interval '0 day', reservationdate+period*interval '1 day') OVERLAPS (reservationdate+period*interval '1 day', LOCALTIMESTAMP)) AND cadastre.standid = reservations.standid AND cadastre.cityid = cities.cityid AND cadastre.townshipid = townships.townshipid AND reservations.clientid = clients.clientid AND reservations.standid LIKE '%${stand}%'`

  }else if (reservationperiod && !id && !datereserved) {
    sqlSearch = `SELECT cadastre.standid AS standid, townships.name AS township, cities.name AS city,  reservations.reservationdate AT TIME ZONE 'GMT-2' AS reservationdate, reservations.reservationdate+period*INTERVAL'1 day' AS expirydate, clients.name AS firstname, clients.surname AS surname FROM cadastre, cities, townships, reservations, clients WHERE cadastre.standid IN (SELECT standid FROM reservations WHERE (reservationdate+period*interval '0 day', reservationdate+period*interval '1 day') OVERLAPS (reservationdate+period*interval '1 day', LOCALTIMESTAMP)) AND cadastre.standid = reservations.standid AND cadastre.cityid = cities.cityid AND cadastre.townshipid = townships.townshipid AND reservations.clientid = clients.clientid AND period = '${reservationperiod}'`

  }else if (id && !datereserved && !stand) {
    sqlSearch = `SELECT cadastre.standid AS standid, townships.name AS township, cities.name AS city,  reservations.reservationdate AT TIME ZONE 'GMT-2' AS reservationdate, reservations.reservationdate+period*INTERVAL'1 day' AS expirydate, clients.name AS firstname, clients.surname AS surname FROM cadastre, cities, townships, reservations, clients WHERE cadastre.standid IN (SELECT standid FROM reservations WHERE (reservationdate+period*interval '0 day', reservationdate+period*interval '1 day') OVERLAPS (reservationdate+period*interval '1 day', LOCALTIMESTAMP)) AND cadastre.standid = reservations.standid AND cadastre.cityid = cities.cityid AND cadastre.townshipid = townships.townshipid AND reservations.clientid = clients.clientid AND  reservations.clientid = '${id}'`

  }

  //db.any(`select * from clients`)
  db.any(sqlSearch)
    .then(function (data) {
      res.status(200)
        .header('Access-Control-Allow-Origin','*')
        .json({
          data: data
        });
    })
    .catch(function (err) {
      return next(err);
    });
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

function postNewReservation(req, res, next) {
  req.body.period = parseInt(req.body.period);
  db.none('insert into reservations(reservationdate, clientid, standid, period)' +
      'values(${reservationdate}, ${clientid}, ${standid}, ${period})',
    req.body)
    .then(function () {
      res.status(200)
        .json({
          status: 'success',
          message: 'Added one reservation'
        });
    })
    .catch(function (err) {
      return next(err);
    });
}

module.exports = {
  getAllclients: getAllclients,
  getSingleAccount: getSingleAccount,
  getSearchClientData: getSearchClientData,
  createAccount: createAccount,
  updateAccount: updateAccount,
  removeAccount: removeAccount,
  dbConnection: db,
  getCitiesData: getCitiesData,
  getSearchReservationsData: getSearchReservationsData,
  postNewReservation: postNewReservation,
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
