DROP DATABASE IF EXISTS pirates;
CREATE DATABASE pirates;
-- command for root user and no password
-- mysql -u root < database/QuarterPirates.sql
-- DROP TABLE IF EXISTS Users;

USE pirates;

CREATE TABLE Users (
  id INTEGER AUTO_INCREMENT NOT NULL,
  username VARCHAR(50) NOT NULL,
  password TEXT NOT NULL,
  salt TEXT NOT NULL,
  gold INTEGER NOT NULL DEFAULT 1000,
  avatar TEXT NOT NULL,
  PRIMARY KEY (id)
);

INSERT INTO Users (username, password, salt, avatar) VALUES ('sevrer', '1d3c5deb503f1ca052f9e6125b22549c1c505f5f2e2bfccf37cdd91947dc4463d5470ff60fb4fbca3b0b1c6323be377d2b9c', '073aa1325af8d0a4b8f4c2de01f41263', 'https://google.com.jpg');

CREATE TABLE Riddles (
  id INTEGER AUTO_INCREMENT NOT NULL,
  title TEXT DEFAULT NULL,
  date_created TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  views INTEGER NOT NULL DEFAULT 0,
  riddle TEXT NOT NULL,
  id_treasure INTEGER NOT NULL,
  id_location INTEGER NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE Treasures(
  id INTEGER AUTO_INCREMENT NOT NULL,
  gold_value INTEGER NOT NULL,
  date_created TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  date_claimed TIMESTAMP DEFAULT '2000-01-01 00:00:00',
  id_location INTEGER NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE Items(
  id INTEGER AUTO_INCREMENT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE GoldTransactions(
  id INTEGER AUTO_INCREMENT NOT NULL,
  type ENUM('gain', 'loss') NOT NULL,
  id_user INTEGER NOT NULL,
  gold_value INTEGER NOT NULL,
  date_transaction TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE TABLE UserRiddles(
  id INTEGER AUTO_INCREMENT NOT NULL,
  id_user INTEGER NOT NULL,
  id_riddle INTEGER NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE UserTreasures(
  id INTEGER AUTO_INCREMENT NOT NULL,
  id_user INTEGER NOT NULL,
  id_treasure INTEGER NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE RiddleViewers(
  id INTEGER AUTO_INCREMENT NOT NULL,
  id_user INTEGER NOT NULL,
  id_riddle INTEGER NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE UserInventory(
  id INTEGER AUTO_INCREMENT NOT NULL,
  category ENUM('riddle', 'item') NOT NULL,
  id_user INTEGER NOT NULL,
  id_item INTEGER DEFAULT NULL,
  id_riddle INTEGER DEFAULT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE Locations(
  id INTEGER AUTO_INCREMENT,
  category ENUM('riddle', 'treasure') NOT NULL,
  longitude FLOAT(11) DEFAULT NULL,
  latitude FLOAT(11) DEFAULT NULL,
  address TEXT DEFAULT NULL,
  city TEXT DEFAULT NULL,
  state TEXT DEFAULT NULL,
  zipcode INTEGER DEFAULT NULL,
  PRIMARY KEY (id)
)
