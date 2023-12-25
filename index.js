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
  shorturl: Number
});
let UrlSchema = mongoose.model('UrlSchema', UrlSchema);

// Your first API endpoint
app.post('/api/shorturl:url', function(req, res) {
  res.json({ original_url: req.body.url, short_url: 1 });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
