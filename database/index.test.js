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
