// Js Compilation and Clean-Code-Assumptions: 
// - function declarations are "hoisted", meaning that the asyn function main() declaration will automatically be put to the top
// - so: first outside code and finally functions in alphabetical order to make it more readable!

// Importing necessary libraries
const config = require('dotenv').config();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');

// Basic Configurations
// Assign port if not set in env
const port = process.env.PORT || 3000;
// handle url encoded data
app.use(bodyParser.urlencoded({extended: false}))
// Corse settings activate
app.use(cors());

// Wait for Mongo database to connect, logging an error if there is a problem
main().catch((err) => {
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
  let last = await findLastElementAndReturnNextId();
  // save the url as a document to mongodb
  const createAndSaveUrlInstance = (last, done) => {
    let urlInstance = new Urltable({
      fullurl: req.params.shorturl,
      shorturl: last
    });
    urlInstance.save((err, data) => {
       if(err){
         console.log(err);
       }
       // send response
       done(null, data);
       
     });
  }
  res.json({ original_url: req.body.url, short_url: last });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

// Return shorturl per id and redirect
app.get('/api/shorturl/:id', (req, res) => {
  // find url belonging to id in database
  let id = req.params.id;
  const findUrlById = (id, done) => {
   Urltable.findById(id, (err, data) => {
     if(err){  
       console.log('taaaa');
       console.log(err);
     }
     // redirect to the found url
     console.log('Redirecting to: ' + data);
     res.redirect(data);
     done(null, data);
   });
   };
});

// Functions in Alphabetical order
async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to the database');
  } catch (err) { 
    throw new Error('Failed to connect to the database: ' + err.message);
  }
}

async function findLastElementAndReturnNextId() {
  const lastElement = await Urltable.findOne().sort('-_id');
    return lastElement.shorturl + 1;
  if (!lastElement) {
    return 1;
  }

  return lastElement;
}
