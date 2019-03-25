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

app.get('/user', (req, res) => {
  db.selectFilteredUserInfoByUsername(req.query.username, (err, user) => {
    if (err) {
      res.status(500).send('UNABLE TO RETRIEVE USER');
    } else {
      res.status(200).send(user);
    }
  });
});

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
        res.status(200).send(user);
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
  db.updateUserGold(req.body.username, req.body.amount, (err, user) => {
    if (err) {
      res.status(500).send('UNABLE TO UPDATE USER GOLD');
    } else {
      db.insertGoldTransaction(user.id, req.body.amount, (err2, res) => {
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

app.get('/user/riddles', (req, res) => {
  db.selectRiddlesByUsername(req.query.username, (err, riddles) => {
    if (err) {
      res.status(500).send('UNABLE TO RETRIEVE RIDDLES');
    } else {
      res.status(200).send(riddles);
    }
  });
});

app.post('/user/riddles', (req, res) => {
  db.insertRiddle(req.body.title, req.body.latitude, req.body.longitude, req.body.address, req.body.city, req.body.state, req.body.zipcode, req.body.riddle, req.body.id_treasure, req.body.id_user, (err, riddle) => {
    if (err) {
      res.status(500).send('UNABLE TO ADD RIDDLE');
    } else {
      res.status(202).send(riddle);
    }
  });
});

app.delete('/user/riddle', (req, res) => {
  db.deleteRiddle(req.query.id_riddle, (err, riddles) => {
    if (err) {
      res.status(500).send('ERROR OCCURRED WHILE DELETING RIDDLE');
    } else {
      res.status(202).send(riddles);
    }
  });
});

app.get('/user/treasures', (req, res) => {
  db.selectTreasuresByUsername(req.query.username, (err, treasures) => {
    if (err) {
      res.status(500).send('UNABLE TO RETRIEVE USER TREASURES');
    } else {
      res.status(200).send(treasures);
    }
  });
});

app.post('/user/treasures', (req, res) => {
  db.insertTreasure(req.body.gold_value, req.body.longitude, req.body.latitude, req.body.address, req.body.city, req.body.state, req.body.zipcode, req.body.id_user, (err, treasure) => {
    if (err) {
      res.status(500).send('UNABLE TO ADD TREASURE');
    } else {
      res.status(202).send(treasure);
    }
  });
});

app.delete('/user/treasure', (req, res) => {
  setTimeout(db.deleteTreasure(req.query.id_treasure, (err, treasures) => {
    if (err) {
      res.status(500).send('UNABLE TO DELETE TREASURE');
    } else {
      res.status(202).send(treasures);
    }
  }), 300000);
});

app.get('/user/inventory', (req, res) => {
  db.selectUserInventoryByUsername(req.query.username, (err, inventory) => {
    if (err) {
      res.send(500, 'UNABLE TO GET USER INVENTORY');
    } else {
      res.send(200, inventory);
    }
  });
});

app.post('/user/inventory', (req, res) => {
  if (req.body.id_item) {
    db.insertUserInventoryItem(req.body.id_user, req.body.id_item, (err, items) => {
      if (err) {
        res.send(500, 'UNABLE TO ADD ITEM TO INVENTORY');
      } else {
        res.send(202, items);
      }
    });
  } else if (req.body.id_riddle) {
    db.insertUserInventoryRiddle(req.body.id_user, req.body.id_riddle, (err, riddles) => {
      if (err) {
        res.send(500, 'UNABLE TO ADD RIDDLE TO INVENTORY');
      } else {
        res.send(202, riddles)
      }
    });
  } else {
    res.status(500).send('INVALID INPUT');
  }
});

app.get('/riddles/city', (req, res) => {
  db.selectRiddlesByCity(req.query.city, (err, riddles) => {
    if (err) {
      res.status(500).send('UNABLE TO GET RIDDLES');
    } else {
      res.status(200).send(riddles);
    }
  });
});

app.get('/riddles/zipcode', (req, res) => {
  db.selectRiddlesByZipcode(req.query.username, req.query.zipcode, (err, riddles) => {
    if (err) {
      res.send(500, 'UNABLE TO GET RIDDLES BY ZIPCODE');
    } else {
      res.send(200, riddles);
    }
  });
});

app.patch('/riddle/views', (req, res) => {
  db.updateRiddleViews(req.body.username, req.body.id_riddle, (err, riddle) => {
    if (err) {
      res.send(500, "UNABLE TO UPDATE THE RIDDLE'S VIEWS")
    } else {
      res.send(202, riddle);
    }
  });
});

app.get('/treasures/city', (req, res) => {
  db.selectTreasuresByCity(req.query.city, (err, treasures) => {
    if (err) {
      res.status(500).send('UNABLE TO GET TREASURES');
    } else {
      res.status(200).send(treasures);
    }
  });
});

app.get('/treasures/zipcode', (req, res) => {
  db.selectTreasuresByZipcode(req.query.username, req.query.zipcode, (err, treasures) => {
    if (err) {
      res.send(500, 'UNABLE TO GET TREASURES BY ZIPCODE');
    } else {
      res.send(200, treasures);
    }
  });
});

app.patch('/treasure/date', (req, res) => {  
  db.updateTreasureDateClaimed(req.body.id_treasure, (err, treasure) => {
    if (err) {
      res.status(500).send('UNABLE TO UPDATE TRASURE CLAIMED DATE');
    } else {
      res.send(202, treasure);
    }
  });
});

app.patch('/treasure/gold', (req, res) => {
  db.updateTreasureGold(req.body.id_treasure, req.body.gold_value, (err, treasure) => {
    if (err) {
      res.send(500, 'UNABLE TO UPDATE TREASURE GOLD VALUES');
    } else {
      res.send(202, treasure);
    }
  });
});

// LEADERBOARD GET REQUEST===============================

app.get('/leaderboard/:sortBy', (req, res) => {
  if (req.params.sortBy === 'gold') {
    db.selectAllUsers((err, users) => {
      if (err) {
        console.log(err);
      } else {
        const topTen = users.sort((left, right) => {
          return right[req.params.sortBy] - left[req.params.sortBy];
        }).slice(0, 10).map((user) => {
          return {
            username: user.username,
            gold: user.gold,
            treasures_placed: user.treasures_placed,
            avatar: user.avatar,
          };
        });
        res.status(200).send(topTen);
      }
    });
  }
});

// USER-STATS GET REQUEST================================

app.get('/user/stats', (req, res) => {
  const stats = {};
  db.selectFilteredUserInfoByUsername(req.query.username, (err, userInfo) => {
    console.log(userInfo);
    if (err) {
      res.status(500).send('uh oh');
    } else {
      stats.username = userInfo.username;
      stats.avatar = userInfo.avatar;
      stats.gold = userInfo.gold;
      res.status(200).send(stats);
    }
  });
})


// Able to set port and still work //
const port = process.env.PORT || 3001;

// Listen and console log current port //
app.listen(port, () => {
  console.log(`listening on port ${port}!`);
});

module.exports = app;
