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
          expect(_.isEqual(oldPass, newPass)).toBe(false);
          done();
        });
      });
    });
  });
});

test('patch /user/avatar', (done) => {
  const images = ['https://google.com.jpg', 'https://google.com.png'];
  db.selectUserByUsername('server', (err, user) => {
    const oldAvatar = user.avatar;
    request(server).patch('/user/avatar').send({
      username: 'server',
      avatar: _.includes(user.avatar, 'jpg') ? images[1] : images[0]
    }).set('Accept', 'application/json').then(res => {
      db.selectUserByUsername('server', (err, updatedUser) => {
        const newAvatar = updatedUser.avatar;
        expect(_.isEqual(oldAvatar, newAvatar)).toBe(false);
        done();
      });
    });
  });
});

test('get /user/riddles', (done) => {
  request(server).get('/user/riddles?username=server').set('Accept', 'application/json').then(res => {
    expect(Array.isArray(res.body)).toBe(true);
    done();
  });
});

test('post /user/riddles', (done) => {
  db.selectFilteredUserInfoByUsername('server', (err, user) => {
    const numRiddles = user.riddles.length;
    request(server).post('/user/riddles').send({
      title: 'What am I?',
      latitude: '29.929470',
      longitude: '-90.093109',
      address: '1725 Delachaise St.',
      city: 'New Orleans',
      state: 'LA',
      zipcode: '70115',
      riddle: 'The booty be hidden,\nWhen found ye\' will sing,\nBe in a bowl on a table,\nBeneath ye\' olde\' orange thing!',
      id_treasure: '9',
      id_user: user.id
    }).set('Accept', 'application/json').then(res => {
      db.selectRiddlesByUsername('server', (err, riddles) => {
        const newNumRiddles = riddles.length;
        db.deleteRiddle(user.id, riddles[riddles.length - 1].id, (err) => {
          expect(Math.abs(numRiddles - newNumRiddles)).toBe(1);
          done();
        });
      });
    });
  });
});

test('delete /user/riddle', (done) => {
  db.selectFilteredUserInfoByUsername('server', (err, info) => {
    const numRiddles = info.riddles.length;
    db.insertRiddle("It's literally right in front of you", -90.093109, 29.929470, '1725 Delachaise St.', 'New Orleans', 'LA', '70115', 'Come at me bro \n and to you I will show \n riches that will make you king of the town \n lest fate bury you in the ground', '8', info.id, (err, riddle) => {
      request(server).delete('/user/riddle').send({
        id_user: info.id,
        id_riddle: riddle.id
      }).set('Accept', 'application/json').then(res => {
        expect(res.body.length).toBe(numRiddles);
        done();
      });
    });
  });
});

test('get /user/treasures', (done) => {
  request(server).get('/user/treasures?username=server').set('Accept', 'application/json').then(res => {
    expect(Array.isArray(res.body)).toBe(true);
    done();
  });
});

test('post /user/treasures', (done) => {
  db.selectFilteredUserInfoByUsername('server', (err, userInfo) => {
    const numOfTreasures = userInfo.treasures.length;
    request(server).post('/user/treasures').send({
      gold_value: '400',
      longitude: '-90.093109',
      latitude: '29.929470',
      address: '1725 Delachaise St.',
      city: 'New Orleans',
      state: 'LA',
      zipcode: '70115',
      id_user: userInfo.id 
    }).set('Accept', 'application/json').then(res => {
      db.selectTreasuresByUsername('server', (err, treasures) => {
        const newNum = treasures.length;
        db.deleteTreasure(userInfo.id, res.body.id, (err) => {
          expect(_.isEqual(newNum, numOfTreasures)).toBe(false);
          done();
        });
      });
    });
  });
});

test('delete /user/treasure', (done) => {
  db.selectFilteredUserInfoByUsername('server', (err, user) => {
    db.insertTreasure(1000, -90.093109, 29.929470, '1725 Delachaise St.', 'New Orleans', 'LA', '70115', user.id, (err, treasure) => {
      request(server).delete('/user/treasure').send({
        id_user: user.id,
        id_treasure: treasure.id
      }).set('Accept', 'application/json').then(res => {
        expect(res.body.length).toBe(user.treasures.length);
        done();
      });
    });
  });
});

test('get /user/inventory', (done) => {
  request(server).get('/user/inventory?username=server').set('Accept', 'application/json').then(res => {
    expect(typeof res.body).toBe('object');
    done();
  });
});
