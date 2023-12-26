require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;
let bodyParser = require('body-parser');
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// handle url encoded data
app.use(bodyParser.urlencoded({extended: false}))


// First routes and corse settings
app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Mongo schemas and Models

// url Schema
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

// Your first API endpoint
app.post('/api/:shorturl', function(req, res) {
  // save the url as a document to mongodb
  let urlInstance = new Urltable({
    fullurl: req.params.shorturl
  });
  urlInstance.save((err, data) => {
     if(err){
       console.log(err);
     }
     done(null, data);
   });
  
  // send response
  res.json({ original_url: req.body.url, short_url: urlInstance.shorturl });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
