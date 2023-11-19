var express = require('express');
var app = express();
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');

const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/SWE432', { useNewUrlParser: true, useUnifiedTopology: true });
const User = require('./models/user-dbSchema');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// set the view engine to ejs
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Use express-session
app.use(session({
  secret: 'mysecretkey',
  resave: false,
  saveUninitialized: true
}));

// Create a default admin user if not present
const createDefaultAdmin = async () => {
  const adminExists = await User.findOne({ username: 'admin' });
  if (!adminExists) {
    await User.create({ username: 'admin', password: 'password' });
  }
};
createDefaultAdmin();

const Song = require('./models/song-dbSchema');

const addSongs = async () => {
  try {
    // Create songs if they don't exist
    const song1 = await Song.findOne({ title: 'Song Title 1' });
    if (!song1) {
      await Song.create({
        id_song: 1,
        title: 'Song Title 1',
        song_artist: 'Artist 1',
        album: 'Album 1',
        debut: 'Debut 1',
      });
    }

    const song2 = await Song.findOne({ title: 'Song Title 2' });
    if (!song2) {
      await Song.create({
        id_song: 2,
        title: 'Song Title 2',
        song_artist: 'Artist 2',
        album: 'Album 2',
        debut: 'Debut 2',
      });
    }

  } catch (err) {
    console.error('Error adding songs:', err);
  }
};

addSongs();

// Home page (login)
app.get('/', async function(req, res) {
  try {
    const songs = await Song.aggregate([{ $sample: { size: 5 } }]);

    if (req.session.username) {
      res.render('djhome', { username: req.session.username, songs: songs });
    } else {
      res.render('login');
    }
  } catch (err) {
    console.error(err);
    return res.status(500).send('Server Error');
  }
});
app.get('/logout', function(req, res) {
  req.session.destroy(function(err) {
    if (err) {
      console.error(err);
      return res.status(500).send('Server Error');
    }
    // Redirect the user to the login page after logout
    res.render('login');
  });
});

// Login route - Handle POST request for login
app.post('/login', async function(req, res) {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });

    if (!user) {
      return res.render('login', { errorMessage: 'Invalid username or password' });
    }
    if (user.password === password) {
      req.session.username = user.username; // Set the username in the session
      return res.redirect('/');
    } else {
      return res.render('login', { errorMessage: 'Invalid username or password' });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).send('Server Error');
  }
});

// dj profiles page
app.get('/djprofile', async function(req, res) {
  try {
    const songs = await Song.aggregate([{ $sample: { size: 5 } }]);

    res.render('djprofile', { username: req.session.username, songs: songs });
  } catch (err) {
    console.error(err);
    return res.status(500).send('Server Error');
  }
});

// dj settings page
app.get('/djsettings', async function(req, res) {
  try {
    const songs = await Song.aggregate([{ $sample: { size: 5 } }]);

    res.render('djsettings', { username: req.session.username, songs: songs });
  } catch (err) {
    console.error(err);
    return res.status(500).send('Server Error');
  }
});

// top songs page
app.get('/topsongs', async function(req, res) {
  try {
    const songs = await Song.aggregate([{ $sample: { size: 5 } }]);

    res.render('topsongs', { username: req.session.username, songs: songs });
  } catch (err) {
    console.error(err);
    return res.status(500).send('Server Error');
  }
});

app.listen(8080);
console.log('Server is listening on port 8080');