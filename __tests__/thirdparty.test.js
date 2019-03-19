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

    // setting up test specific route : 
    app.get('/controllHomePage', (req, res) => res.sendFile(__dirname + '/assets/thirdparty/home.html'));
    app.get('/controllHomePageSlowedDown',  (req, res) =>  setTimeout( () => res.sendFile(__dirname + '/assets/thirdparty/home.html'), 34000) );

 

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

    beforeEach(() => {
        jest.setTimeout(200000);
    });

    
    it('should return a 4xx when the url patameter is missing', async () => {

        const response = await request(app).get('/get3p');
        expect(response.status).toEqual(400);

    });


    it('should send an error with a 500 status', async () => {

        const response = await request(app).get('/get3p?url=google.fr');

        expect(response.status).toEqual(500);
        expect(response.text).toEqual("Error: Protocol error (Page.navigate): Cannot navigate to invalid URL");

    });


    it('should return a 200 HTTP code on the asset page', async () => {

        const response = await request(app).get('/controllHomePage');
        expect(response.status).toEqual(200);

    });


    it('should detect third party on the controll page', async () => {

        const response = await request(app).get(`/get3p?url=http://localhost:${process.env.PORT }/controllHomePage`);
        expect(response.status).toEqual(200);
        expect(response.text).toEqual('{\"shouldBeBlocked\":[\"zopim.com\",\"google-analytics.com\",\"facebook.net\"],\"shouldntBeBlocked\":[]}');

    });


    it('shouldn\'t return a timeout', async() => {

        const response = await request(app).get(`/get3p?url=http://localhost:${process.env.PORT }/controllHomePageSlowedDown`);
        expect(response.status).toEqual(200);
        expect(response.text).toEqual('{\"shouldBeBlocked\":[\"zopim.com\",\"google-analytics.com\",\"facebook.net\"],\"shouldntBeBlocked\":[]}');

    });

});