const server = require('./index');
const request = require('supertest');

test('health endpoint', (done) => {
  request(server).get('/health').then(res => {
    expect(typeof res.text).toBe('string');
    done();
  });
});

test('/signup', (done) => {
  request(server).post('/signup').send({
    username: 'persona45569116',
    password: 'dancingallnight',
  }).then(res => {
    expect(res.text).toBeTruthy();
    done();
  });
});
