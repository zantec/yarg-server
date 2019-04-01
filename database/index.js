// Setting up the mysql database & connection and ORM (sequelize)

// 1) Database creation & Table schemas

const mysql = require('mysql');
const crypto = require('crypto');
const _ = require('lodash');
const Avatars = require('@dicebear/avatars').default;
const sprites = require('@dicebear/avatars-jdenticon-sprites').default;
require('dotenv').config();


let options = {};
let avatars = new Avatars(sprites(options));
// Create connection to the database //
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

// Connect to the database //
connection.connect((err) => {
  if (!err) {
    console.log('Houston, we have a db connection');
  } else {
    console.error('There was a problem connecting to the db. Error: ', err);
  }
});

module.exports.connection = connection;

// USER RELATIVE HELPER FUNCTIONS //

/**
 * @param {object} user - A user object containing vital user info
 * @returns {object} A filtered user onject
 */
const filterUserInfo = (user) => {
  const obj = {};
  const filters = ['password', 'salt'];
  _.forEach(user, (value, key) => {
    if (!_.includes(filters, key)) {
      obj[key] = value;
    }
  });
  return obj;
};

/**
 * @param {string} username - A user's name in the form of a string
 * @param {Function} callback - A function to be executed on the error (if exists) or the user object
 */
module.exports.selectFilteredUserInfoByUsername = (username, callback) => {
  module.exports.selectUserByUsername(username, (err, user) => {
    if (err) {
      callback(err, null);
    } else if (!user) {
      callback(null, []);
    } else {
      const fileredUser = filterUserInfo(user)
      module.exports.selectTreasuresByUsername(fileredUser.username, (err2, treasures) => {
        if (err2) {
          callback(err2, null);
        } else {
          fileredUser.treasures = treasures;
          module.exports.selectRiddlesByUsername(fileredUser.username, (err3, riddles) => {
            if (err3) {
              callback(err3, null);
            } else {
              fileredUser.riddles = riddles;
              module.exports.selectUserInventoryByUsername(fileredUser.username, (err4, inventory) => {
                if (err4) {
                  callback(err4, null);
                } else {
                  fileredUser.inventory = inventory;
                  callback(null, fileredUser);
                }
              });
            }
          });
        }
      });
    }
  });
};

/**
 * @param {string} username - A user's username in the form of a string
 * @param {string} password - A user's password in the from of a string
 * @param {Function} callback - A function to be executed on the new user
 */
module.exports.insertUser = (username, password, callback) => {
  module.exports.selectAllUsers((err, users) => {
    if (err) {
      callback(err, null);
    } else {
      module.exports.selectUserByUsername(username, (err2, user) => {
        if (err2) {
          callback(err2, null);
        } else if (user === undefined) {
          const salt = crypto.randomBytes(16).toString('hex');
          const avatar = avatars.create(username);
          const q = [username, crypto.pbkdf2Sync(password, salt, 1012, 50, 'sha512').toString('hex'), salt, 'https://imgur.com/KfhK2Br.png'];
          connection.query('INSERT INTO Users (username, password, salt, avatar) VALUES (?, ?, ?, ?)', q, (err3) => {
            if (err3) {
              callback(err3, null);
            } else {
              module.exports.selectUserByUsername(username, (err4, newUser) => {
                if (err4) {
                  callback(err4, null);
                } else {
                  callback(null, newUser);
                }
              })
            }
          });
        } else {
          callback(Error('User already exists'), user);
        }
      })
    }
  });
};

/**
 * @param {Array} users - An array of username's
 * @param {Function} callback - A function to be executed on the array of users
 */
module.exports.selectFilteredUsers = (users, callback) => {
  module.exports.selectAllUsers((err, currentUsers) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, _.filter(currentUsers, user => !_.includes(users, user.username)));
    }
  });
};

module.exports.selectAllUsers = (callback) => {
  connection.query('SELECT * FROM Users', (err, users) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, users);
    }
  })
};

module.exports.selectUserByUsername = (username, callback) => {
  connection.query(`SELECT * FROM Users WHERE username = '${username}'`, (err, singleUserArray) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, singleUserArray[0]);
    }
  })
};

module.exports.selectUserById = (id_user, callback) => {
  connection.query(`SELECT * FROM Users WHERE id = ${parseInt(id_user)}`, (err, singleUserArray) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, singleUserArray[0]);
    }
  })
};

/**
 * @param {Object} user requires either a id_user or username key
 * @param {Object} password requires a oldPassword AND newPassword key
 * @param {Function} callback
 */
module.exports.updateUserPassword = (user, password, callback) => {
  if (user.username) {
    module.exports.selectUserByUsername(user.username, (err, user) => {
      if (err) {
        callback(err, null);
      } else if (!user) {
        callback(Error('User Does Not Exist'), []);
      } else {
        if (crypto.pbkdf2Sync(password.oldPassword, user.salt, 1012, 50, 'sha512').toString('hex') === user.password) {
          connection.query(`UPDATE Users SET password = '${crypto.pbkdf2Sync(password.newPassword, user.salt, 1012, 50, 'sha512').toString('hex')}' WHERE username = '${user.username}'`, (err2) => {
            if (err2) {
              callback(err2, null);
            } else {
              module.exports.selectUserByUsername(user.username, (err3, updatedUser) => {
                if (err3) {
                  callback(err3, null);
                } else {
                  callback(null, filterUserInfo(updatedUser));
                }
              });
            }
          });
        } else {
          callback(Error('Passwords did not match'), null);
        }
      }
    });
  } else if (user.id_user) {
    module.exports.selectUserById(user.id_user, (err4, user) => {
      if (err4) {
        callback(err4, null);
      } else {
        if (crypto.pbkdf2Sync(password.oldPassword, user.salt, 1012, 50, 'sha512').toString('hex') === user.password) {
          connection.query(`UPDATE users SET password = '${crypto.pbkdf2Sync(password.newPassword, user.salt, 1012, 50, 'sha512').toString('hex')}' WHERE username = '${user.username}'`, (err5) => {
            if (err5) {
              callback(err5, null);
            } else {
              module.exports.selectUserById(user.username, (err6, updatedUser) => {
                if (err6) {
                  callback(err6, null);
                } else {
                  callback(null, updatedUser);
                }
              });
            }
          });
        } else {
          callback(Error('Passwords did not match'), null);
        }
      }
    });
  }
};

module.exports.updateUserGold = (username, amount, callback) => {
  module.exports.selectUserByUsername(username, (err, user) => {
    if (err) {
      callback(err, null);
    } else if (!user) {
      callback(Error('User does not exist!'), null);
    } else if (parseInt(amount) < 0 && user.gold + parseInt(amount) < 0) {
      callback(Error('Not enough gold'), null);
    } else {
      connection.query(`UPDATE Users SET gold = ${user.gold + parseInt(amount)} WHERE username = '${username}'`, (err2) => {
        if (err2) {
          callback(err2, null);
        } else {
          module.exports.selectUserByUsername(username, (err3, updatedUser) => {
            if (err3) {
              callback(err3, null);
            } else {
              callback(null, filterUserInfo(updatedUser));
            }
          });
        }
      });
    }
  });
};

module.exports.updateUserImage = (username, avatar, callback) => {
  module.exports.selectUserByUsername(username, (err, user) => {
    if (err) {
      callback(err, null);
    } else if (!user) {
      callback(Error('User does not exist'), null);
    } else {
      const extensions = ['.jpg', '.png', 'jpeg', 'svg>'];
      if (_.includes(extensions, _.slice(avatar, avatar.length - 4).join(''))) {
        connection.query(`UPDATE Users Set avatar = '${avatar}' WHERE username = '${username}'`, (err) => {
          if (err) {
            callback(err, null);
          } else {
            module.exports.selectUserByUsername(username, (err2, updatedUser) => {
              if (err2) {
                callback(err2, null);
              } else {
                callback(null, filterUserInfo(updatedUser));
              }
            });
          }
        });
      } else {
        callback(Error('Invalid image file/link'), null);
      }
    }
  });
};

module.exports.verifyUserPassword = (username, password, callback) => {
  module.exports.selectUserByUsername(username, (err, user) => {
    if (err) {
      callback(err, null);
    } else if (!user) {
      callback(Error('User does not exist!'), null);
    } else {
      if (user.password === crypto.pbkdf2Sync(password, user.salt, 1012, 50, 'sha512').toString('hex')) {
        const fileredUser = filterUserInfo(user)
        module.exports.selectTreasuresByUsername(fileredUser.username, (err2, treasures) => {
          if (err2) {
            callback(err2, null);
          } else {
            fileredUser.treasures = treasures;
            module.exports.selectRiddlesByUsername(fileredUser.username, (err3, riddles) => {
              if (err3) {
                callback(err3, null);
              } else {
                fileredUser.riddles = riddles;
                module.exports.selectUserInventoryByUsername(fileredUser.username, (err4, inventory) => {
                  if (err4) {
                    callback(err4, null);
                  } else {
                    fileredUser.inventory = inventory;
                    callback(null, fileredUser);
                  }
                });
              }
            });
          }
        });
      } else {
        callback(Error('Invalid Username or Password'), null);
      }
    }
  });
};

module.exports.updateUserNumericStat = (username, stat, amount, callback) => {
  module.exports.selectUserByUsername(username, (err, user) => {
    if (err) {
      callback(err, null);
    } else if (!user) {
      callback(Error('USER DOES NOT EXIST'), null);
    } else {
      connection.query(`UPDATE Users SET ${stat} = ${user[stat] + parseInt(amount)} WHERE id = ${user.id}`, (err2) => {
        if (err2) {
          callback(err2, null);
        } else {
          module.exports.selectFilteredUserInfoByUsername(user.username, (err3, updatedUser) => {
            if (err3) {
              callback(err3, null);
            } else {
              callback(null, updatedUser);
            }
          });
        }
      });
    }
  });
};

// END OF USER RELATIVE HELPER FUNCTIONS //

// TREASURE RELATIVE HELPER FUNCIONS //

module.exports.insertTreasure = (gold_value, longitude, latitude, address, city, state, zipcode, id_user, callback) => {
  module.exports.selectUserById(parseInt(id_user), (err, user) => {
    if (err) {
      callback(err, null);
    } else {
      module.exports.selectTreasuresByUsername(user.username, (err2, treasures) => {
        if (err2) {
          callback(err2, null);
        } else if (treasures.length > 4 && user.id !== 1) {
          callback(Error('USER ALREADY HAS FIVE TREASURES'), null);
        } else {
          module.exports.insertLocation('treasure', parseFloat(longitude), parseFloat(latitude), address, city, state, parseInt(zipcode), (err, location) => {
            const q = [parseInt(gold_value), location.id, user.id];
            connection.query(`INSERT INTO Treasures (gold_value, id_location, id_user) VALUES (?, ?, ?)`, q, (err3) => {
              if (err3) {
                callback(err3, null);
              } else {
                module.exports.selectTreasuresByUsername(user.username, (err4, updatedTreasures) => {
                  if (err4) {
                    callback(err4, null);
                  } else {
                    connection.query(`UPDATE Users SET treasures_placed = ${user.treasures_placed + 1} WHERE id = ${user.id}`);
                    callback(null, updatedTreasures[updatedTreasures.length - 1]);
                  }
                });
              }
            });
          });
        }
      });
    }
  });
};

module.exports.selectAllTreasure = (callback) => {
  connection.query('SELECT * FROM Treasures', (err, treasures) => {
    if (err) {
      callback(err, null);
    } else {
      module.exports.selectLocationsByCategory('treasure', (err2, locations) => {
        if (err2) {
          callback(err2, null);
        } else {
          callback(null, _.map(treasures, treasure => {
            treasure.location_data = _.find(locations, location => location.id === treasure.id_location);
            return treasure;
          }));
        }
      });
    }
  });
};

module.exports.selectTreasuresByUsername = (username, callback) => {
  module.exports.selectUserByUsername(username, (err1, user) => {
    if (err1) {
      callback(err1, null);
    } else {
      module.exports.selectAllTreasure((err, riddles) => {
        if (err) {
          callback(err, null);
        } else {
          callback(null, _.filter(riddles, riddle => riddle.id_user === user.id));
        }
      });
    }
  });
};

module.exports.selectTreasureById = (id_treasure, callback) => {
  connection.query(`SELECT * FROM Treasures WHERE id = ${id_treasure}`, (err, singleTreasureArray) => {
    if (err) {
      callback(err, null);
    } else if (singleTreasureArray[0] === undefined) {
      callback(null, undefined);
    } else {
      module.exports.selectLocationById(singleTreasureArray[0].id_location, (err2, location) => {
        if (err2) {
          callback(err2, null);
        } else {
          const treasure = singleTreasureArray[0];
          treasure.location_data = location
          callback(null, treasure);
        }
      });
    }
  });
};

module.exports.selectTreasureByLocationId = (id_location, callback) => {
  connection.query(`SELECT * FROM Treasures WHERE id_location = ${id_location}`, (err, singleTreasureArray) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, singleTreasureArray[0]);
    }
  });
};

module.exports.selectTreasuresByZipcode = (username, zipcode, callback) => {
  module.exports.selectUserByUsername(username, (err, user) => {
    if (!user) {
      callback(Error('USER DOES NOT EXIST'), null);
    } else {
      module.exports.selectTreasuresByUsername(username, (err, userTreasures) => {
        if (err) {
          callback(err, null);
        } else {
          const userTreasureIds = _.map(userTreasures, treasure => treasure.id);
          connection.query(`SELECT * FROM Locations WHERE zipcode = ${parseInt(zipcode)} AND category = 'treasure'`, (err, locations) => {
            if (err) {
              callback(err, null);
            } else if (locations.length === 0) {
              callback(null, []);
            } else {
              const treasures = [];
              _.forEach(locations, (location, index) => {
                module.exports.selectTreasureByLocationId(location.id, (err2, treasure) => {
                  if (err2) {
                    callback(err2, null);
                  } else {
                    if (!_.includes(userTreasureIds, treasure.id)) {
                      treasure.location_data = location;
                      treasures.push(treasure);
                      if (index === locations.length - 1) {
                        callback(null, treasures);
                      }
                    } else {
                      if (index === locations.length - 1) {
                        callback(null, treasures);
                      }
                    }
                  }
                });
              });
            }
          });
        }
      });
    }
  });
};

module.exports.selectTreasuresByCity = (city, callback) => {
  module.exports.selectAllTreasure((err, treasures) => {
    if (err) {
      callback(err, null);
    } else {
      const returnTreasures = [];
      module.exports.selectLocationsByCity(city, (err2, locations) => {
        if (err2) {
          callback(err2, null);
        } else {
          _.forEach(_.filter(treasures, treasure => _.includes(_.map(_.filter(locations, location => location.city === city), location => location.id), treasure.id_location)), (treasure) => {
            treasure.location_data = _.find(locations, location => location.id === treasure.id_location);
            returnTreasures.push(treasure);
          });
          callback(null, returnTreasures);
        }
      });
    }
  });
};

module.exports.updateTreasureDateClaimed = (id_treasure, callback) => {
  connection.query(`UPDATE Treasures SET date_claimed = CURRENT_TIMESTAMP WHERE id = ${parseInt(id_treasure)}`, (err) => {
    if (err) {
      callback(err, null);
    } else {
      module.exports.selectTreasureById(parseInt(id_treasure), (err2, updatedTreasure) => {
        if (err2) {
          callback(err2, null);
        } else {
          callback(null, updatedTreasure);
        }
      });
    }
  });
};

module.exports.updateTreasureGold = (id_treasure, gold_value, callback) => {
  module.exports.selectTreasureById(id_treasure, (err, treasure) => {
    if (err) {
      callback(err, null);
    } else if (!treasure) {
      callback(Error('TREASURE DOES NOT EXIST'), null);
    } else {
      if (treasure.gold_value + parseInt(gold_value) < 0) {
        callback(Error('UNABLE TO MODIFY VALUE TO NEGATIVE'), null);
      } else {
        connection.query(`UPDATE Treasures SET gold_value = ${treasure.gold_value + parseInt(gold_value)} WHERE id = ${id_treasure}`, (err2) => {
          if (err) {
            callback(err2, null);
          } else {
            module.exports.selectTreasureById(id_treasure, (err3, updatedTreasure) => {
              if (err3) {
                callback(err3, null);
              } else {
                callback(null, updatedTreasure);
              }
            });
          }
        });
      }
    }
  });
};

module.exports.selectNoRiddleTreasuresByUsername = (username, callback) => {
  module.exports.selectTreasuresByUsername(username, (err, treasures) => {
    if (err) {
      callback(err, null);
    } else {
      module.exports.selectRiddlesByUsername(username, (err2, riddles) => {
        if (err2) {
          callback(err2, null); 
        } else {
          const treasuresToExclude = _.map(riddles, riddle => riddle.id_treasure);
          callback(null, _.filter(treasures, treasure => !_.includes(treasuresToExclude, treasure.id)));
        }
      });
    }
  });
};

module.exports.deleteTreasure = (id_treasure, callback) => {
  module.exports.selectTreasureById(parseInt(id_treasure), (err, treasure) => {
    if (err) {
      callback(err, null);
    } else if (!treasure) {
      callback(Error('TREASURE DOES NOT EXIST'), null);
    } else {
      module.exports.selectUserById(treasure.id_user, (err2, user) => {
        if (err2) {
          callback(err2, null);
        } else {
          module.exports.selectRiddleByTreasure(treasure.id, (err3, riddle) => {
            if (err3) {
              callback(err3, null);
            } else {
              module.exports.deleteRiddle(!riddle ? undefined : riddle.id, (err4) => {
                if (err4) {
                  console.log(err4);
                }
              });
            }
          });
          connection.query(`DELETE FROM Locations WHERE id = ${treasure.id_location}`);
          connection.query(`DELETE FROM Treasures WHERE id = ${treasure.id}`);
          module.exports.selectAllTreasure((err4, treasures) => {
            if (err4) {
              callback(err4, null);
            } else {
              callback(null, treasures);
            }
          })
        }
      });
    }
  });
  // connection.query(`SELECT * FROM UserTreasures WHERE id_treasure = ${parseInt(id_treasure)}`, (err, pairs) => {
  //   if (err) {
  //     callback(err, null);
  //   } else if (pairs.length === 0) {
  //     callback(Error('TREASURE DOES NOT EXIST'), null);
  //   } else {
  //     module.exports.selectUserById(pairs[0].id_user, (err2, user) => {
  //       if (err2 || !user) {
  //         callback(err2 || Error('User does not exist'), null);
  //       } else {
  //         module.exports.selectRiddleByTreasure(parseInt(id_treasure), (err3, riddle) => {
  //           if (err3) {
  //             callback(err3, null);
  //           } else {
  //             module.exports.selectTreasureById(parseInt(id_treasure), (err5, treasure) => {
  //               if (err5) {
  //                 callback(err5, null);
  //               } else {
  //                 module.exports.deleteRiddle(riddle.id, (err4) => {
  //                   if (err4) {
  //                     console.log(err4);
  //                   }
  //                 });
  //                 connection.query(`DELETE FROM UserTreasures WHERE id_treasure = ${treasure.id}`);
  //                 connection.query(`DELETE FROM Locations WHERE id = ${treasure.id_location}`);
  //                 connection.query(`DELETE FROM Treasures WHERE id = ${treasure.id}`);
  //                 module.exports.selectAllTreasure((err5, treasures) => {
  //                   if (err5) {
  //                     callback(err5, null);
  //                   } else {
  //                     callback(null, treasures);
  //                   }
  //                 });
  //               }
  //             });
  //           }
  //         });
  //       }
  //     });
  //   }
  // });
};

// END OF TREASURE RELATIVE HELPER FUNCTIONS //

// RIDDLE RELATIVE HELPER FUNCTIONS //

module.exports.insertRiddle = (title, latitude, longitude, address, city, state, zipcode, riddle, id_treasure, id_user, callback) => {
  connection.query(`SELECT * FROM Riddles WHERE id_treasure = ${parseInt(id_treasure)}`, (err, riddleArray) => {
    if (err) {
      callback(err, null);
    } else if (riddleArray.length > 0) {
      callback(Error('Treasure Already Has Riddle Attached To It'));
    } else {
      module.exports.selectUserById(parseInt(id_user), (err, user) => {
        if (err) {
          callback(err, null);
        } else {
          module.exports.selectRiddlesByUsername(user.username, (err2, riddles) => {
            if (err2) {
              callback(err2, null);
            } else if (riddles.length > 4 && user.id !== 1) {
              callback(Error('USER ALREADY HAS 5 RIDDLES'), null);
            } else {
              module.exports.insertLocation('riddle', parseFloat(longitude), parseFloat(latitude), address, city, state, zipcode, (err3, location) => {
                if (err3) {
                  callback(err3, null);
                } else {
                  const q = [title, riddle, parseInt(id_treasure), location.id, parseInt(id_user)];
                  connection.query('INSERT INTO Riddles (title, riddle, id_treasure, id_location, id_user) VALUES (?, ?, ?, ?, ?)', q, (err4) => {
                    if (err4) {
                      callback(err4, null);
                    } else {
                      module.exports.selectRiddlesByUsername(user.username, (err5, updateRiddles) => {
                        if (err5) {
                          callback(err5, null);
                        } else {
                          callback(null, updateRiddles[updateRiddles.length - 1]);
                        }
                      });
                    }
                  });
                }
              });
            }
          });
        }
      });
    }
  });
};

module.exports.selectAllRiddles = (callback) => {
  connection.query('SELECT * FROM Riddles', (err, riddles) => {
    if (err) {
      callback(err, null);
    } else {
      module.exports.selectLocationsByCategory('riddle', (err2, locations) => {
        if (err2) {
          callback(err2, null)
        } else {
          callback(null, _.map(riddles, riddle => {
            riddle.location_data = _.find(locations, location => location.id === riddle.id_location);
            return riddle;
          }));
        }
      });
    }
  });
};

module.exports.selectRiddleByTreasure = (id_treasure, callback) => {
  connection.query(`SELECT * FROM Riddles WHERE id_treasure = ${parseInt(id_treasure)}`, (err, singleTreasureArray) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, singleTreasureArray[0]);
    }
  });
};

module.exports.selectRiddlesByZipcode  = (username, zipcode, callback) => {
  module.exports.selectUserByUsername(username, (err, user) => {
    if (err) {
      callback(err, null);
    } else {
      module.exports.selectAllRiddles((err2, riddles) => {
        if (err2) {
          callback(err2, riddles);
        } else {
          callback(null, _.filter(riddles, riddle => {
            return riddle.location_data.zipcode === parseInt(zipcode) && riddle.id_user !== (!user ? undefined : user.id);
          }));
        }
      });
    }
  });
};

module.exports.selectRiddlesByUsername = (username, callback) => {
  module.exports.selectUserByUsername(username, (err, user) => {
    if (err) {
      callback(err, null);
    } else {
      module.exports.selectAllRiddles((err2, riddles) => {
        if (err2) {
          callback(err2, null);
        } else {
          callback(null, _.filter(riddles, riddle => riddle.id_user === user.id));
        }
      });
    }
  });
};

module.exports.selectRiddlesByCity = (city, callback) => {
  module.exports.selectAllRiddles((err, riddles) => {
    if (err) {
      callback(err, null);
    } else {
      module.exports.selectLocationsByCity(city, (err2, locations) => {
        if (err2) {
          callback(err2, null);
        } else {
          const locationIds = _.map(locations, location => location.id);
          const returnRiddles = _.map(_.filter(riddles, riddle => _.includes(locationIds, riddle.id_location)), (riddle) => {
            riddle.location_data = _.find(locations, location => location.id === riddle.id_location);
            return riddle;
          });
          callback(null, returnRiddles);
        }
      });
    }
  });
};

module.exports.updateRiddleViews = (username, id_riddle, callback) => {
  module.exports.selectFilteredUserInfoByUsername(username, (err, user) => {
    if (err) {
      callback(err, null);
    } else {
      connection.query(`SELECT * FROM RiddleViewers WHERE id_user = ${user.id}`, (err2, pairs) => {
        const userIds = _.map(pairs, pair => pair.id_user);
        if (err2) {
          callback(err2, null);
        } else if (_.includes(userIds, user.id)) {
          callback(Error('USER HAS ALREADY SEEN RIDDLE'), null);
        } else {
          module.exports.selectRiddleById(parseInt(id_riddle), (err, riddle) => {
            const riddleToUpdate = riddle;
            if (err) {
              callback(err, null);
            }
            else if (!riddleToUpdate) {
              callback(Error('UNABLE TO FIND RIDDLE'), null);
            } else {
              connection.query(`UPDATE Riddles SET views = ${riddleToUpdate.views + 1} WHERE id = ${riddleToUpdate.id}`);
              connection.query(`INSERT INTO RiddleViewers (id_riddle, id_user) VALUES (?, ?)`, [riddleToUpdate.id, user.id], (err3) => {
                if (err3) {
                  callback(err3, null);
                } else {
                  module.exports.selectRiddleById(riddleToUpdate.id, (err4, updatedRiddle) => {
                    if (err4) {
                      callback(err4, null);
                    } else {
                      callback(null, updatedRiddle);
                    }
                  });
                }
              });
            }
          });
        }
      });
    }
  });
};

module.exports.selectRiddleById = (id_riddle, callback) => {
  connection.query(`SELECT * FROM Riddles WHERE id = ${parseInt(id_riddle)}`, (err, singleRiddleArray) => {
    if (err) {
      callback(err, null);
    } else {
      module.exports.selectLocationById(singleRiddleArray[0].id_location, (err2, location) => {
        if (err2) {
          callback(err2, null);
        } else {
          singleRiddleArray[0].location_data = location;
          callback(null, singleRiddleArray[0]);
        }
      })
    }
  });
};

module.exports.deleteRiddle = (id_riddle, callback) => {
  if (!id_riddle) {
    callback(Error('INVALID RIDDLE ID'), null);
  } else {
    module.exports.selectRiddleById(parseInt(id_riddle), (err, riddle) => {
      if (err) {
        callback(err, null);
      } else {
        module.exports.selectUserById(riddle.id_user, (err2, user) => {
          if (err2) {
            callback(err2, null);
          } else {
            connection.query(`DELETE FROM UserInventory WHERE id_riddle = ${riddle.id}`);
            connection.query(`DELETE FROM RiddleViewers WHERE id_riddle = ${riddle.id}`);
            connection.query(`DELETE FROM Locations WHERE id = ${riddle.id_location}`);
            connection.query(`DELETE FROM Riddles WHERE id = ${riddle.id}`);
            module.exports.selectAllRiddles((err3, updatedRiddles) => {
              if (err3) {
                callback(err3, null);
              } else {
                callback(null, updatedRiddles);
              }
            });
          }
        });
      }
    });
  }
  // connection.query(`SELECT * FROM UserRiddles WHERE id_riddle = ${parseInt(id_riddle)}`, (err, pairs) => {
  //   if (err || pairs.length === 0) {
  //     callback(err || Error('UNABLE TO RETRIEVE PAIRS'), null);
  //   } else {
  //     module.exports.selectUserById(pairs[0].id_user, (err2, user) => {
  //       if (err2) {
  //         callback(err2, null);
  //       } else {
  //         module.exports.selectRiddleById(parseInt(id_riddle), (err3, riddle) => {
  //           if (err3) {
  //             callback(err3, null);
  //           } else {
  //             connection.query(`DELETE FROM UserInventory WHERE id_riddle = ${riddle.id}`);
  //             connection.query(`DELETE FROM RiddleViewers WHERE id_riddle = ${riddle.id}`);
  //             connection.query(`DELETE FROM UserRiddles WHERE id_riddle = ${riddle.id}`);
  //             connection.query(`DELETE FROM Locations WHERE id = ${riddle.id_location}`);
  //             connection.query(`DELETE FROM Riddles WHERE id = ${riddle.id}`);
  //             module.exports.selectAllRiddles((err4, riddles) => {
  //               if (err4) {
  //                 callback(err4, null); 
  //               } else {
  //                 callback(null, riddles);
  //               }
  //             });
  //           }
  //         });
  //       }
  //     });
  //   }
  // });
};

// END OF RIDDLE RELATIVE HELPER FUNCTIONS //

// GOLD TRANSACTION HELPER FUNCTIONS //

module.exports.insertGoldTransaction = (id_user, gold_value, callback) => {
  const q = [(parseInt(gold_value) > 0) ? 'gain' : 'loss', parseInt(id_user), parseInt(gold_value)];
  connection.query(`INSERT INTO GoldTransactions (type, id_user, gold_value) VALUES (?, ?, ?)`, q, (err) => {
    if (err) {
      callback(err, null);
    } else {
      module.exports.selectAllGoldTransactions((err2, transactions) => {
        if (err2) {
          callback(err2, null);
        } else {
          callback(null, transactions[transactions.length - 1]);
        }
      });
    }
  });
};

module.exports.selectAllGoldTransactions = (callback) => {
  connection.query('SELECT * FROM GoldTransactions', (err, gold_transactions) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, gold_transactions);
    }
  });
};

module.exports.selectGoldTransactionsByUsername = (username, callback) => {
  module.exports.selectUserByUsername(username, (err, user) => {
    if (err) {
      callback(err, null);
    } else if (!user) {
      callback(null, []);
    } else {
      connection.query(`SELECT * FROM GoldTransactions WHERE id_user = ${user.id}`, (err2, transactions) => {
        if (err2) {
          callback(err2, null);
        } else {
          callback(null, transactions);
        }
      });
    }
  });
};

// END OF GOLD TRANSACTION RELATIVE HELPER FUNCTIONS //

// LOCATIONS HELPER FUNCTIONS //

module.exports.selectAllLocations = (callback) => {
  connection.query('SELECT * FROM Locations', (err, locations) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, locations);
    }
  });
};

module.exports.selectLocationsByCategory = (category, callback) => {
  connection.query(`SELECT * FROM Locations WHERE category = '${category}'`, (err, locations) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, locations);
    }
  });
};

module.exports.selectLocationsByCity = (city, callback) => {
  connection.query(`SELECT * FROM Locations WHERE city = '${city}'`, (err, locations) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, locations);
    }
  });
};

module.exports.selectLocationById = (id_location, callback) => {
  connection.query(`SELECT * FROM Locations WHERE id = ${id_location}`, (err, singleLocationArray) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, singleLocationArray[0]);
    }
  });
};

module.exports.insertLocation = (category, longitude, latitude, address, city, state, zipcode, callback) => {
  const q = [category, parseFloat(longitude), parseFloat(latitude), address, city, state, parseInt(zipcode)];
  connection.query('INSERT INTO Locations (category, longitude, latitude, address, city, state, zipcode) VALUES (?, ?, ?, ?, ?, ?, ?)', q, (err) => {
    if (err) {
      callback(err, null);
    } else {
      connection.query('SELECT * FROM Locations', (err2, locations) => {
        if (err2, null) {
          callback(err2, null);
        } else {
          callback(null, locations[locations.length - 1]);
        }
      });
    }
  })
};

module.exports.deleteLocation = (id_location, callback) => {
  connection.query(`DELETE FROM Locations WHERE id = ${id_location}`, (err) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null);
    }
  });
};

// END OF LOCATION RELATIVE HELPER FUNCTIONS //

// ITEMS HELPER FUNCTIONS //

module.exports.insertItem = (name, description, callback) => {
  module.exports.selectItemByName(name, (err, item) => {
    if (err) {
      callback(err, null);
    } else if (item) {
      callback(Error('Item Already Exists!'), item);
    } else {
      const q = [name, description];
      connection.query('INSERT INTO Items (name, description) VALUES (?, ?)', q, (err) => {
        if (err) {
          callback(err, null);
        } else {
          module.exports.selectItemByName(name, (err2, insertedItem) => {
            if (err2) {
              callback(err2, null);
            } else {
              callback(null, insertedItem);
            }
          });
        }
      });
    }
  });
};

module.exports.selectAllItems = (callback) => {
  connection.query('SELECT * FROM Items', (err, items) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, items);
    }
  });
};

module.exports.selectItemByName = (item_name, callback) => {
  connection.query(`SELECT * FROM Items WHERE name = '${item_name}'`, (err, singleItemArray) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, singleItemArray[0]);
    }
  });
};

module.exports.selectItemById = (id_item, callback) => {
  connection.query(`SELECT * FROM Items WHERE id = ${id_item}`, (err, singleItemArray) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, singleItemArray[0]);
    }
  });
};

// END OF ITEMS RELATIVE HELPER FUNCTIONS //

// USERINVENTORY HELPER FUNCTION //

module.exports.selectUserInventoryByUsername = (username, callback) => {
  module.exports.selectUserByUsername(username, (err, user) => {
    if (err) {
      callback(err, null);
    } else if (!user) {
      callback(Error('USER DOES NOT EXIST'), null);
    } else {
      module.exports.selectAllRiddles((err2, riddles) => {
        if (err2) {
          callback(err2, null);
        } else {
          module.exports.selectAllItems((err3, items) => {
            if (err3) {
              callback(err3, null);
            } else {
              connection.query(`SELECT * FROM UserInventory WHERE id_user = ${user.id}`, (err4, inventoryList) => {
                if (err4) {
                  callback(err4, null);
                } else {
                  const userInventory = {items: [], riddles: []};
                  _.forEach(inventoryList, data => {
                    data.category === 'riddle' ? userInventory.riddles.push(_.find(riddles, riddle => riddle.id === data.id_riddle)) : userInventory.items.push(_.find(items, item => item.id === data.id_item));
                  });
                  callback(null, userInventory);
                }
              });
            }
          });
        }
      });
    }
  });
};

module.exports.insertUserInventoryItem = (id_user, id_item, callback) => {
  module.exports.selectUserById(parseInt(id_user), (err, user) => {
    if (err) {
      callback(err, null);
    } else if (!user) {
      callback(Error('User does not exist!'), null);
    } else {
      module.exports.selectUserInventoryByUsername(user.username, (err4, inventory) => {
        if (err4) {
          callback(err4, null);
        } else {
          if (!_.includes(_.map(inventory.items, item => item.id), parseInt(id_item))) {
            const q = [parseInt(id_user), parseInt(id_item)];
            connection.query("INSERT INTO UserInventory (category, id_user, id_item) VALUES ('item', ?, ?)", q, (err2) => {
              if (err2) {
                callback(err2, null);
              } else {
                module.exports.selectUserInventoryByUsername(user.username, (err3, inventory) => {
                  if (err3) {
                    callback(err3, null);
                  } else {
                    callback(null, inventory.items);
                  }
                });
              }
            });
          } else {
            callback(Error('USER ALREADY HAS ITEM'), _.find(inventory.items, item => item.id === id_item));
          }
        }
      });
    }
  });
};

module.exports.insertUserInventoryRiddle = (id_user, id_riddle, callback) => {
  module.exports.selectUserById(parseInt(id_user), (err, user) => {
    if (err) {
      callback(err, null);
    } else if (!user) {
      callback(Error('User does not exist!'), null);
    } else {
      const q = [parseInt(id_user), parseInt(id_riddle)];
      module.exports.selectRiddlesByUsername(user.username, (err4, riddles) => {
        if (err4) {
          callback(err4, null);
        } else {
          module.exports.selectUserInventoryByUsername(user.username, (err5, inventory) => {
            if (err5) {
              callback(err5, null);
            } else {
              const parsedIdRiddle = parseInt(id_riddle);
              if (!_.includes(_.map(riddles, riddle => riddle.id), parsedIdRiddle) && !_.includes(_.map(inventory.riddles, riddle => riddle.id), parsedIdRiddle)) {
                connection.query("INSERT INTO UserInventory (category, id_user, id_riddle) VALUES ('riddle', ?, ?)", q, (err2) => {
                  if (err2) {
                    callback(err2, null);
                  } else {
                    module.exports.selectUserInventoryByUsername(user.username, (err3, updatedInventory) => {
                      if (err3) {
                        callback(err3, null);
                      } else {
                        callback(null, updatedInventory.riddles);
                      }
                    });
                  }
                });
              } else {
                callback(Error('RIDDLE ALREADY IN INVENTORY'), null);
              }
            }
          });
        }
      });
    }
  });
};

// END OF USERINVENTORY RELATIVE HELPER FUNCTIONS //
