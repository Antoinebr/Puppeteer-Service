const express = require('express');
const cors = require('cors');
const thirdpartyCtrl = require('./controllers/thirdpartyCtrl');
const coverageCtrl = require('./controllers/coverageCtrl');


const app = express();
app.use(cors());

// router 
app.get('/get3p', thirdpartyCtrl.get3p);
app.get('/coverage',coverageCtrl.sendCoverage);


module.exports = app;