const _ = require('./index');
const db = require('./index');

test('expect database connectiong to exist', (done) => {
  expect(typeof db.connection.state).toBe('string');
  done();
});

test('db.insertUser', (done) => {
  db.insertUser('john', 'doe', (err, user) => {
    expect(typeof user).toBe('object');
    done();
  });
});

test('db.selectAllUsers', (done) => {
  db.connection.query('SELECT * FROM Users', (err, users) => {
    db.selectAllUsers((err2, theUsers) => {
      expect(users.length).toBe(theUsers.length);
      done();
    });
  });
});

test('db.selectUserByUsername', (done) => {
  db.selectUserByUsername('somethingsomethingjojoreference', (err, res) => {
    expect(res).toBe(undefined);
    done();
  });
});

test('db.selectUserById', (done) => {
  db.selectUserById('9999999999999999999999999999999999999', (err, res) => {
    expect(res).toBe(undefined);
    done();
  });
});

test('db.selectFilteredUserInfoByUsername', (done) => {
  db.selectFilteredUserInfoByUsername('server', (err, res) => {
    expect(typeof res).toBe('object');
    done();
  });
});

test('db.updateUserGold', (done) => {
  db.selectUserByUsername('server', (err, user) => {
    db.updateUserGold('server', 500, (err, res) => {
      expect(res.gold).toBe(user.gold + 500);
      done();
    });
  });
});

test('db.verifyUserPassword', (done) => {
  db.verifyUserPassword('acreed1998', 'tigerlamb345', (err, res) => {
    expect(typeof res).toBe('object');
    done();
  });
});

test('db.selectUserInventoryByUsername', (done) => {
  db.selectUserInventoryByUsername('server', (err, inventory) => {
    expect(typeof inventory).toBe('object');
    done();
  });
});

test('db.insertUserInventoryItem', (done) => {
  db.selectFilteredUserInfoByUsername('server', (err, user) => {
    db.insertUserInventoryItem(user.id, 1, (err, items) => {
      db.connection.query(`DELETE FROM UserInventory WHERE id_user = ${user.id}`, (err) => {
        expect(items.length - 1).toBe(user.inventory.items.length);
        done();
      });
    });
  });
});

test('db.insertUserInventoryRiddle', (done) => {
  db.selectFilteredUserInfoByUsername('acreed1998', (err, otherUser) => {
    db.selectFilteredUserInfoByUsername('server', (err, user) => {
      db.insertTreasure(1000, -90.093109, 29.929470, '1725 Delachaise St.', 'New Orleans', 'LA', '70115', user.id, (err, treasure) => {
        db.insertRiddle("It's literally right in front of you", -90.093109, 29.929470, '1725 Delachaise St.', 'New Orleans', 'LA', '70115', 'Come at me bro \n and to you I will show \n riches that will make you king of the town \n lest fate bury you in the ground', treasure.id, user.id, (err, riddle) => {
          db.insertUserInventoryRiddle(otherUser.id, riddle.id, (err, riddles) => {
            db.deleteRiddle(user.id, riddle.id, (err) => {
              expect(riddles.length - 1).toBe(otherUser.inventory.riddles.length);
              done();
            });
          });
        });
      });
    });
  });
});

test('db.selectItemById', (done) => {
  db.connection.query('SELECT * FROM Items', (err, items) => {
    db.selectItemById(items[0].id, (err, item) => {
      expect(typeof item).toBe('object');
      done();
    });
  });
});

test('db.selectItemByName', (done) => {
  db.connection.query('SELECT * FROM Items', (err, items) => {
    db.selectItemByName(items[0].name, (err, item) => {
      expect(typeof item).toBe('object');
      done();
    });
  });
});

test('db.insertItem', (done) => {
  db.insertItem('ha!', 'gotteeeeem!', (err, item) => {
    db.connection.query(`DELETE FROM Items WHERE id = ${item.id}`, (err) => {
      expect(typeof item).toBe('object');
      done();
    });
  });
});

test('db.insertGoldTransaction', (done) => {
  db.selectFilteredUserInfoByUsername('server', (err, user) => {
    db.selectAllGoldTransactions((err, transactions) => {
      db.insertGoldTransaction(user.id, 500, (err) => {
        db.selectAllGoldTransactions((err, newTransactions) => {
          expect(transactions.length + 1).toBe(newTransactions.length);
          done();
        });
      });
    });
  });
  });

test('db.selectAllGoldTransactions', (done) => {
  db.selectAllGoldTransactions((err, transactions) => {
    expect(typeof transactions).toBe('object');
    done();
  });
});

test('db.selectGoldTransactionsByUsername', (done) => {
  db.selectGoldTransactionsByUsername('server',  (err, transactions) => {
    expect(Array.isArray(transactions)).toBe(true);
    done();
  });
});
