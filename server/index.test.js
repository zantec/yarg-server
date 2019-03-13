const axios = require('axios');

test('health endpoint', (done) => {
  axios({
    method: 'GET',
    url: '/health',
  })
    .then((success) => {
      expect(success).toBe('UP!');
      done();
    })
});
