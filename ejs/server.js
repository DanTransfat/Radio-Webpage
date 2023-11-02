var express = require('express');
var app = express();

// set the view engine to ejs
app.set('view engine', 'ejs');

// djhome page
app.get('/', function(req, res) {
  var dj = {firstName: 'John', lastName: 'Smith'}
    res.render('djhome',{
    dj:dj,
});
  });

// djprofiles page
app.get('/djprofile', function(req, res) {
    res.render('djprofile');
  });

// djsettings page
app.get('/djsettings', function(req, res) {
    res.render('djsettings');
  });

// topsongs page
app.get('/topsongs', function(req, res) {
    res.render('topsongs');
  });

app.listen(8080);
console.log('Server is listening on port 8080');