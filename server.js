const express = require('express');
const cors = require('cors');
const thirdpartyCtrl = require('./controllers/thirdpartyCtrl');
const coverageCtrl = require('./controllers/coverageCtrl');
const PORT = process.env.PORT || 8080;

const app = express();

app.use(cors());

// router 
app.get('/get3p', thirdpartyCtrl.get3p);
app.get('/coverage',coverageCtrl.getCoverage);



app.listen(PORT, function () {
  console.log(`App is listening on port ${PORT}`);
});


// Make sure node server process stops if we get a terminating signal.
function processTerminator(sig) {
  if (typeof sig === 'string') {
    process.exit(1);
  }
  console.log('%s: Node server stopped.', Date(Date.now()));
}

const signals = [
  'SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT', 'SIGBUS',
  'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
];

signals.forEach(sig => {
  process.once(sig, () => processTerminator(sig));
});