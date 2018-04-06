const express = require('express');
const bodyParser = require("body-parser");
const Mustache  = require('mustache');
const app = express();
const db = require('./models/db');
const connect = require('./config/database')

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const sign_in = require('./routes/signIn.js');

const forgot_password = require('./routes/forgotPassword.js')

const port = 3000;

app.use('/sign_in',sign_in);

app.use('/forgot_password',forgot_password);

db.connect(connect.database, function(err) {
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