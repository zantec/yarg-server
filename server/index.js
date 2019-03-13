// main server file where server setup is done using Express and with request handler functions

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const db = require('../database/index');
require('dotenv').config();
require('../TestFunctions');

// const helper = require('../helpers/apiHelpers');

const app = express();

// Probably not needed //
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// app.use(express.static(__dirname + '../client/'));
// Needed for React at Some Point // 
// app.use(express.static(path.join(__dirname, [REACT DIRECTORY])));

app.get('/', (req, res) => {
  res.send('Hello World');
});

app.get('/health', (req, res) => {
  res.send('UP!');
});

app.get('user', (req, res) => {
  db.selectFilteredUserInfoByUsername(req.query.username, (err, user) => {
    if (err) {
      res.status(500).send('UNABLE TO RETRIEVE USER');
    } else {
      res.status(200).send(user);
    }
  });
})

/**
 * Log-In User
 * @requires req.body.username - a username
 * @requires req.body.password = a password
 * Sends Back User Info
 */
app.get('/login', (req, res) => {
  if (req.query.username.length === 0 || req.query.password.length === 0) {
    res.status(404).send('Invalid Username or Pasword Entry');
  } else {
    db.verifyUserPassword(req.query.username, req.query.password, (err, user) => {
      if (err) {
        res.status(500).send('COULD NOT LOG IN USER');
      } else {
        res.status(202).send(user);
      }
    });
  }
});

/**
 * @requires req.body.username - a username
 * @requires req.body.password - a password
 */
app.post('/signup', (req, res) => {
  if (req.body.username.length === 0 || req.body.password.length === 0) {
    res.status(404).send('Invalid Username or Pasword Entry');
  } else {
    db.insertUser(req.body.username, req.body.password, (err, user) => {
      if (err) {
        res.status(500).send('COULD NOT SIGN UP USER');
      } else {
        res.status(202).send(user);
      }
    });
  }
});

app.patch('/user/password', (req, res) => {
  db.updateUserPassword(req.body.user, req.body.password, (err, user) => {
    if (err) {
      res.status(500).send('Unable to update password');
    } else {
      res.status(202).send(user);
    }
  });
});

app.patch('/user/gold', (req, res) => {
  db.updateUserGold(req.body.username, req.body.ammount, (err, user) => {
    if (err) {
      res.status(500).send('UNABLE TO UPDATE USER GOLD');
    } else {
      db.insertGoldTransaction(user.id, req.body.ammount, (err2, res) => {
        if (!err2) {
          console.log('Transaction Complete!');
        }
      });
      res.status(202).send(user);
    }
  });
});

app.patch('/user/avatar', (req, res) => {
  db.updateUserImage(req.body.username, req.body.avatar, (err, user) => {
    if (err) {
      res.status(500).send('UNABLE TO UPDATE USER AVATAR');
    } else {
      res.status(202).send(user);
    }
  });
});

// Able to set port and still work //
const port = process.env.PORT || 3001;

// Listen and console log current port //
app.listen(port, () => {
  console.log(`listening on port ${port}!`);
});
