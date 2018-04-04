const express = require('express');
const bodyParser = require("body-parser");
const Mustache  = require('mustache');
const app = express();
const db = require('./models/db.js');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const sign_in = require('./routes/signIn.js');

const forgot_password = require('./routes/forgotPassword.js')

const dbName = 'accountKit';

const urlDB = 'mongodb://localhost:27017/' + dbName;

const port = 3000;

app.use('/sign_in',sign_in);

app.use('/forgot_password',forgot_password);

db.connect(urlDB, function(err) {
  if (err) {
    console.log('Unable to connect to Mongo.');
    db.close();
    process.exit(1);
  } else {
    app.listen(process.env.PORT || port, function() {
      console.log('Listening on port ', port);
    })
  }
})