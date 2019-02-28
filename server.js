const app = require('./app');

const PORT = process.env.PORT || 8080;

app.listen(PORT, function () {
  console.log(`App is listening on port ${PORT}`);
});


