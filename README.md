# REIMS API

An api that seeks to provide CRUD functionality to real estate managing systems.

Installation
===================

Make sure you have [nodejs](https://nodejs.org), [git](https://git-scm.com) and [postgresql](https://postgresql.org) installed.

### First Steps

1. **Setup the database**

    Install postgresql and configure it with the following:
      * Port: 5432
      * Host: localhost
      * Password: admin
      * a new database: reimsdb

    > These are initial values that can be changed later in the [queries.js](https://github.com/cparadzayi/reims/blob/master/queries.js) file.

    Now download the backup file from [pgdump.herokuapp.com](http://pgdump.herokuapp.com) and restore it to the reimsdb database.

2. **Getting the api onto you computer**

    Clone this repository (or [download zip](https://github.com/cparadzayi/reims/archive/master.zip))
    ```bash
    $ git clone https://github.com/cparadzayi/reims.git
    ```
    After it completes,

    ```bash
    $ npm install
    $ npm run build
    $ npm start
    ```
    When all is said and done the api should be running on [localhost:3000](http://localhost:3000)

Documentation
=============
## API design principles
---
[API Design Principles](./Documentation/API-Design-Principles.md)

## API Documentation
---

### GET requests

   1. **/api/clients/**

        Returns all the clients in the database in the JSON format as follows

        ```javascript
         [
             {
                name: String,
                surname: String,
                accountnum: String,
                townshipid: Integer,"cityid":7,"nid":"70-071864-T-18","address":"6322 Southview"
              },
              {..},
          ]
        ```

    2. **/api/clients/:id**
    3. **/api/cities/**
    4. **/api/cadastre/**
    5. **/api/reservations/**

### POST requests

:
:
