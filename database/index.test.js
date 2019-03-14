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
