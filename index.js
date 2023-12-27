// Js Compilation and Clean-Code-Assumptions: 
// - function declarations are "hoisted", meaning that the asyn function dbmain() declaration will automatically be put to the top
// - so: first outside code and finally functions in alphabetical order to make it more readable!

// Importing necessary libraries
const config = require('dotenv').config();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const dns = require('dns');
const mongoose = require('mongoose');

// Basic Configurations
// Assign port if not set in env
const port = process.env.PORT || 3000;
// Middleware handle url encoded data
app.use(bodyParser.urlencoded({extended: false}))
// Corse settings activate
app.use(cors());
// Set app port listner
app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

// Wait for Mongo database to connect, logging an error if there is a problem
dbmain().catch((err) => {
  console.error('Database connection error:', err);
  process.exit(1);
});

// Mongo schemas and Models
const urlSchema = new mongoose.Schema({
  fullurl: {
    type: String,
    required: true
  },
  shorturl: {
    type: Number,
    unique: true,
    required: true
  }
});
let Urltable = mongoose.model('Urltable', urlSchema);

// First routes
app.use('/public', express.static(`${process.cwd()}/public`));
app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Return saved url and shorturl_id
app.post('/api/shorturl', async function(req, res) {
  // check validity of url otherwise return error response and quit
  let fullurl = new URL(req.body.url);
  let errormessage = { error: 'invalid url' };
  dns.lookup(fullurl.hostname, async (err, address) => {
    if (err) {
      console.error(errormessage);
      res.json(errormessage);
    }
    console.log("Url could be resolved to following IPs: " + address)
  });

  // save the url as a document to mongodb
  let last = await findLastElementAndReturnNextId();
  createAndSaveUrlInstance(last, fullurl, (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Error saving URL' });
    } else {
      res.json({ original_url: fullurl, short_url: last });
    }
  });
});

// Return shorturl per id and redirect
app.get('/api/shorturl/:id', (req, res) => {

  let shorturl_number = req.params.id;
  
  // find url belonging to id in database and then redirect to fullurl of document
  findUrlById(shorturl_number, (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Error finding id and redirecting URL' });
    } else {
      res.redirect(data.fullurl);
    }
  });
});

// Functions in Alphabetical order
const createAndSaveUrlInstance = (last, fullurl, done) => {
  let urlInstance = new Urltable({
    fullurl: fullurl,
    shorturl: last
  });
  urlInstance.save((err, data) => {
    if (err) {
      console.log(err);
      done(err);
    } else {
      done(null, data);
      console.log("successfully wrote to db");
    }
  });
};

async function findLastElementAndReturnNextId() {
  const lastElement = await Urltable.findOne().sort('-_id');
  if (lastElement === null || lastElement === undefined || !lastElement) {
    return 1;
  }
  return lastElement.shorturl + 1;
}

const findUrlById = (shorturl_number, done) => {
  Urltable.findOne({ shorturl: shorturl_number }, (err, data) => {
    if(err){
      console.log(err);
    }
    // redirect to the found url
    console.log('Found url: ' + data.fullurl);
    done(null, data);
  });
  };

  async function dbmain() {
    try {
      await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
      console.log('Connected to the database');
    } catch (err) { 
      throw new Error('Failed to connect to the database: ' + err.message);
    }
  }
