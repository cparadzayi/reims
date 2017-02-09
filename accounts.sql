DROP DATABASE IF EXISTS reimsdb;
CREATE DATABASE reimsdb;


CREATE TABLE accounts (
  ID SERIAL PRIMARY KEY,
  name VARCHAR,
  surname VARCHAR,
  accountnum VARCHAR,
  townshipid INTEGER
);

INSERT INTO accounts (name, surname, accountnum, townshipid)
  VALUES ('Charles', 'Paradzayi', '01-0000345-00', 1);
