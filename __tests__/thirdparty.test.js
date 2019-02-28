//routes.test.js
const request = require('supertest');
const app = require('../app');

process.env.PORT = 4300

/**
 * beforeAll 
 * 
 * Runs before running all the tests
 */
beforeAll(() => {

    const listener = app.listen(process.env.PORT, () => console.log('Your app is listening on port ' + listener.address().port))

});


/**
 * afterAll 
 * 
 * Runs after running all the tests
 */
afterAll(() => {

    console.log('server closed!');
});


describe('Test the third party endpoint', () => {

    test('get thrid party without required parameters sends a 4xx status', async () => {

        const response = await request(app).get('/get3p');
        expect(response.status).toEqual(400);

    });


});