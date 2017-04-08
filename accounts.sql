DROP DATABASE IF EXISTS reimsdb;
CREATE DATABASE reimsdb;


CREATE TABLE clients (
  ID SERIAL PRIMARY KEY,
  name VARCHAR,
  surname VARCHAR,
  accountnum VARCHAR,
  townshipid INTEGER
);

INSERT INTO clients (name, surname, accountnum, townshipid)
  VALUES ('Charles', 'Paradzayi', '01-0000345-00', 1);
