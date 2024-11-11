const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const pug = require('pug');
const jokebookRouter = require('./routes/jokebookRouter');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure /db directory exists
const dbDir = path.join(__dirname, 'db');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir);
}

// Initialize the database
const dbPath = path.join(dbDir, 'jokes.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to database:', err);
    } else {
        console.log('Connected to jokes.db');
    }
});

// Set the views directory to 'views' 
app.set('views', path.join(__dirname, 'public'));
app.set('view engine', 'pug'); // Use Pug as the view engine
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the 'views' directory
app.use(express.static(path.join(__dirname, 'public')));

// Initialize the database by calling the function from jokebookModel.js
const { initializeDB } = require('./models/jokebookModel');
initializeDB();

// Pass the `db` to the router **after** it's initialized
app.use('/jokebook', jokebookRouter(db));

// Routes
app.get('/', (req, res) => {
    db.get('SELECT * FROM jokes ORDER BY RANDOM() LIMIT 1', (err, row) => {
        if (err) {
            console.error('Error fetching random joke:', err);
            return res.status(500).send('Error fetching random joke');
        }
        res.render('index', { joke: row });
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
