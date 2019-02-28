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

    it('should return a 4xx when the url patameter is missing', async () => {

        const response = await request(app).get('/get3p');
        expect(response.status).toEqual(400);

    });


    it('should send an error with a 500 status', async () => {

        const response = await request(app).get('/get3p?url=google.fr');
 
        expect(response.status).toEqual(500);
        expect(response.text).toEqual("Error: Protocol error (Page.navigate): Cannot navigate to invalid URL");

    });



});