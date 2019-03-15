const server = require('./index');
const request = require('supertest');
const db = require('../database/index');
const _ = require('lodash');

test('health endpoint', (done) => {
  request(server).get('/health').then(res => {
    expect(typeof res.text).toBe('string');
    done();
  });
});

test('/signup', (done) => {
  let signup = {
    username: 'ihearyoulikememes',
    password: 'somethingsomethingjojoreferrence',
  };
  request(server).post('/signup').send({
    username: signup.username,
    password: signup.password,
  }).then(res => {
    db.connection.query(`DELETE FROM Users WHERE username = '${signup.username}'`, (err) => {
      expect(res.text).toBeTruthy();
      done();
    });
  });
});

test('get /user', (done) => {
  request(server).get('/user?username=server').then(res => {
    expect(_.includes(res.text, 'server')).toBe(true);
    done();
  });
});

test('get /login', (done) => {
  request(server).get('/login?username=server&password=pirates').then(res => {
    expect(_.includes(res.text, 'items') && _.includes(res.text, 'riddles')).toBe(true);
    done();
  });
});

test('patch /user/gold', (done) => {
  db.selectUserByUsername('server', (err, user) => {
    request(server).patch('/user/gold').send({
      username: 'server',
      amount: '500',
    }).then(res => {
      expect(_.includes(res.text, _.toString(user.gold + 500))).toBe(true);
      done();
    });
  });
});

test('patch /user/password', (done) => {
  db.selectUserByUsername('server', (err, user) => {
    const oldPass = user.password;
    request(server).patch('/user/password').send({
      user: {
        username: 'server'
      },
      password: {
        oldPassword: 'pirates',
        newPassword: 'yodawgiheardyouliketestssoweputtestsinsideyourtestssoyoucantestwhileyoutest',
      }
    }).set('Accept', 'application/json').then(res => {
      db.selectUserByUsername('server', (err2, updatedUser) => {
        const newPass = updatedUser.password;
        request(server).patch('/user/password').send({
          user: {
            username: 'server'
          },
          password: {
            oldPassword: 'yodawgiheardyouliketestssoweputtestsinsideyourtestssoyoucantestwhileyoutest',
            newPassword: 'pirates'
          }
        }).set('Accept', 'application/json').then(res2 => {
          console.log(newPass);
          expect(_.isEqual(oldPass, newPass)).toBe(false);
          done();
        });
      });
    });
  });
});
