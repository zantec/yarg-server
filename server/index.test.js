const axios = require('axios');

test('health endpoint', (done) => {
  axios({
    method: 'GET',
    url: '/',
  })
    .then((success) => {
      expect(success).toBe('UP!');
      done();
    })
});
