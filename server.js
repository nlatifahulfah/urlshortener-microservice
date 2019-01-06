'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');

var cors = require('cors');

var app = express();

var url = require("url")
var dns = require('dns')  
var bodyParser = require('body-parser')
var Schema = mongoose.Schema

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
mongoose.connect(process.env.MONGOLAB_URI);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({extended: false}))
app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

// Short URL schema
var shortURLSchema = new Schema({
  original_url: {type: String, required: true},
  short_url: Number
})
/* = <Your Model> */
var ShortURL = mongoose.model('ShortURL', shortURLSchema)

// create URL
var createShortURL = function(original_url, done) {
  var shortenURL = new ShortURL
  shortenURL.original_url = original_url
  
  ShortURL.count(function(err, c) {
    shortenURL.short_url = c + 1
    
    shortenURL.save(function(err,data){
      if (err) return done(err)
      done(null, data);
    })
  })
  
};

// Short URL Creation
app.post("/api/shorturl/new", function (req, res) {
  var urlparse = url.parse(req.body.url).hostname
  dns.lookup(urlparse, function (err) {
    if (err) {
      res.json({"error":"invalid URL" + err}) 
    } else {
      createShortURL(urlparse, function(err, data) {
        res.json({"original_url":data.original_url,"short_url":data.short_url})
      })
    }
  })
  
  
})

// find URL
var findURL = function (id, callback) {
  var query = ShortURL.find({ short_url: id })
  query.exec(callback)
}

// short url usage
app.get("/api/shorturl/:id", function (req, res) {
  findURL(req.params.id, function(err, docs) {
    // res.json({"docs": docs[0].original_url})
    res.redirect("http://"+ docs[0].original_url)
  })
})


app.listen(port, function () {
  console.log('Node.js listening ...');
});