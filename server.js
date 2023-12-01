var express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/', { useNewUrlParser: true, useUnifiedTopology: true });
const app = express();
const Schema = mongoose.Schema;
const bodyParser = require('body-parser');
// const cors = require('cors');
// app.use(cors());

// NOT MY SECRET KEY
// Use express-session middleware
app.use(session({
    secret: '74cb55fca7f26c37c0feb8321aedc64e5dd8146e648f2b288c7423871f16b68f',
    resave: false,
    saveUninitialized: true,
}));

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

const djSchema = new Schema({
    username: String,
    password: String,
    firstName: String,
    email: String,
    songQueue: [{
      type: Schema.Types.ObjectId,
      ref: 'Song',
    }],
});

const songSchema = new Schema({
    name: String,
    artist: String,
    album: String,
    duration: Number
});

// create user model
const DJ = mongoose.model('DJ', djSchema);
const Song = mongoose.model('Song', songSchema);

// const newDJ = new DJ({
//     username: 'dan',
//     password: '123',
//     firstName: 'Daniel',
//     email: 'dan@gmail.com',
//     songQueue: [],
// });

// newDJ.save();

const newSong = Song({
    name: 'jingle bells',
    artist: 'santa',
    album: 'christmas',
    duration: 125
})

newSong.save();

async function updateExistingDJs() {
    try {
        const djs = await DJ.find();

        for (const dj of djs) {
            // If queue is not an array, convert it to an array
            if (!Array.isArray(dj.queue)) {
                dj.queue = [dj.queue];
            }

            await dj.save();
        }

        console.log('Existing djs updated successfully.');
    } 
    catch (error) {
        console.error('Error updating existing djs:', error);
    }
}

updateExistingDJs();

app.get('/', function (req, res) {
    // Check if the user is logged in before rendering the home page
    if (req.session.username) {
        res.render('pages/djhome', { username: req.session.username });
    }
    else {
        res.redirect('/login');
    }
});

app.get('/djprofile', function (req, res) {
    // Check if the user is logged in before rendering the profile page
    if (req.session.username) {
        res.render('pages/djprofile', { username: req.session.username });
    }
    else {
        res.redirect('/login');
    }
});

app.get('/djsettings', function (req, res) {
    res.render('pages/djsettings');
});


// app.get('/topsongs', function (req, res) {
//     if (req.session.currentSongId) {
//         res.render('pages/topsongs', { songId: req.session.currentSongId });
//     }
// });

// Login page route
app.get('/login', function (req, res) {
    res.render('pages/login', { message: '' });
});

// Login post route
app.post('/login', function (req, res) {
    const { username, password } = req.body;

    DJ.findOne({ username: username, password: password }).exec()
        .then(dj => {
            if (dj) {
                // Store username in the session
                req.session.username = username;
                res.redirect('/');
            }
            else {
                res.render('pages/login', { message: 'Login failed. Please try again.' });
            }
        })
        .catch(err => {
            console.error(err);
            res.redirect('/login');
        });
});

// Add this route to your server code
app.get('/logout', function (req, res) {
    // Clear the session
    req.session.destroy(function (err) {
        if (err) {
            console.error(err);
        }
        // Redirect to the login page after clearing the session
        res.redirect('/login');
    });
});


app.get('/search', async (req, res) => {
    const searchTerm = req.query.term;

    if (!searchTerm) {
        return res.status(400).json({ error: 'Please provide a search term' });
    }

    try {
        const result = await Song.findOne({ name: new RegExp(searchTerm, 'i') });

        if (result) {
            res.json(result);
        }
        else {
            res.json({ message: 'Song not found' });
        }
    }
    catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.get('/getRandomSong', async (req, res) => {
    try {
        const result = await Song.aggregate([{ $sample: { size: 1 } }]);
        const randomSong = result[0];

        // Include the song ID in the session
        req.session.currentSongId = randomSong._id;

        // Include the song details in the response
        res.json({
            name: randomSong.name,
            artist: randomSong.artist,
            album: randomSong.album || '',
            _id: randomSong._id, // Include the song ID
        });
    }
    catch (error) {
        console.error('Error fetching random song:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.get('/getAllSongs', async (req, res) => {
    try {
        const songs = await Song.find();
        // console.log('Songs:', songs); // Add this line for logging
        res.json(songs);
    }
    catch (error) {
        console.error('Error fetching songs:', error); // Add this line for logging
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/getQueue', async (req, res) => {
    try {
        // Get the user's preferences based on the session
        const username = req.session.username;
        const dj = await DJ.findOne({ username }).exec();

        if (!dj) {
            return res.status(404).json({ message: 'DJ not found.' });
        }

        // Fetch the user's preferences directly from the user document
        const queue = dj.songQueue;

        if (queue && queue.length > 0) {
            // If queue exist, you may want to populate the song details
            // using a separate query if the song details are in a separate 'Song' collection
            // Replace 'Song' with the actual model name if different
            const populatedQueue = await Song.find({ _id: { $in: queue } }).exec();
            res.json(populatedQueue);
        } else {
            res.json([]); // Return an empty array if no preferences found
        }
    } catch (error) {
        console.error('Error fetching queue:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



app.get('/getAllDJs', async (req, res) => {
    try {
        const djs = await DJ.find();
        // console.log('Songs:', songs); // Add this line for logging
        res.json(djs);
    }
    catch (error) {
        console.error('Error fetching DJs:', error); // Add this line for logging
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/getRandomDJ', async (req, res) => {
    try {
        const count = await DJ.countDocuments();
        const randomIndex = Math.floor(Math.random() * count);

        const randomDJ = await DJ.findOne().skip(randomIndex);

        res.json({ name: randomDJ.name }); // Adjust the response format
    }
    catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/changePassword', async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    // Check if the old password matches the user's current password (you may need to modify this based on your authentication logic)
    const dj = await DJ.findOne({ username: req.session.username, password: oldPassword }).exec();

    if (dj) {
        // Update the user's password
        dj.password = newPassword;
        await dj.save();

        res.json({ message: 'Password changed successfully.' });
    }
    else {
        res.status(401).json({ message: 'Incorrect old password.' });
    }
});

// Add this route to your server code
app.post('/addSong', async (req, res) => {
    try {
        const username = req.session.username;
        const dj = await DJ.findOne({ username }).exec();

        if (!dj) {
            return res.status(404).json({ message: 'DJ not found.' });
        }

        const songId = req.body.songId;
        console.log('Received request body:', req.body.songId);

        if (dj.preferences.includes(songId)) {
            return res.status(400).json({ message: 'Song is already in preferences.' });
        }
        else {
            dj.songQueue.push(songId);
        }
        await dj.save();

        res.json({ message: 'Song added to queue.' });
    }
    catch (error) {
        console.error('Error adding song to queue:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/removeSong', async (req, res) => {
    try {
        const username = req.session.username;
        const dj = await DJ.findOne({ username }).exec();

        if (!dj) {
            return res.status(404).json({ message: 'DJ not found.' });
        }

        const songId = req.body.songId;

        // Check if the song is in the user's preferences
        const songIndex = dj.preferences.indexOf(songId);
        if (songIndex !== -1) {
            // Remove the song from preferences
            dj.songQueue.splice(songIndex, 1);
            await dj.save();

            res.json({ message: 'Song removed from queue.' });
        } 
        else {
            res.status(400).json({ message: 'Song is not in queue.' });
        }
    } 
    catch (error) {
        console.error('Error removing song from queue:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(8080);
console.log('Server listening on port 8080');