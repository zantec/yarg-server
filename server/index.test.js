const axios = require('axios');

test('health endpoint', (done) => {
  axios({
    method: 'GET',
    url: '/localhost:3001/health',
  })
    .then((success) => {
      expect(success).toBe('UP!');
      done();
    })
});
