const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../db/jokes.db');
const db = new sqlite3.Database(dbPath);

const initializeDB = () => {
    db.serialize(() => {
        // Create Categories Table
        db.run(`CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE
        )`);

        // Create Jokes Table (no category_id, category is directly stored)
        db.run(`CREATE TABLE IF NOT EXISTS jokes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            setup TEXT NOT NULL,
            delivery TEXT NOT NULL,
            category TEXT NOT NULL,
            UNIQUE(setup, delivery)
        )`);

        // Insert default categories if they don't exist
        const categories = ['funny', 'lame'];
        categories.forEach((category) => {
            db.run(`INSERT OR IGNORE INTO categories (name) VALUES (?)`, [category]);
        });

        // Insert default jokes if they don't exist
        const defaultJokes = [
            { setup: 'Why did the student eat his homework?', delivery: 'Because the teacher told him it was a piece of cake!', category: 'funny' },
            { setup: 'What kind of tree fits in your hand?', delivery: 'A palm tree', category: 'funny' },
            { setup: 'What is worse than raining cats and dogs?', delivery: 'Hailing taxis', category: 'funny' },
            { setup: 'Which bear is the most condescending?', delivery: 'Pan-DUH', category: 'lame' },
            { setup: 'What would the Terminator be called in his retirement?', delivery: 'The Exterminator', category: 'lame' }
        ];

        defaultJokes.forEach(({ setup, delivery, category }) => {
            db.run(
                `INSERT OR IGNORE INTO jokes (setup, delivery, category) VALUES (?, ?, ?)`,
                [setup, delivery, category]
            );
        });
    });
};

// Fetch categories
const getCategories = (callback) => {
    db.all(`SELECT * FROM categories`, callback);
};

// Fetch jokes by category
const getJokesByCategory = (category, limit, callback) => {
    const query = `
        SELECT setup, delivery 
        FROM jokes 
        WHERE category = ? 
        LIMIT ?`;
    db.all(query, [category, limit], callback);
};

// Add a new joke
const addJoke = (category, setup, delivery, callback) => {
    db.run(
        `INSERT INTO jokes (setup, delivery, category) 
         VALUES (?, ?, ?)`,
        [setup, delivery, category],
        function (err) {
            if (err) return callback(err);
            callback(null, { id: this.lastID });
        }
    );
};

module.exports = {
    db,
    initializeDB,
    getCategories,
    getJokesByCategory,
    addJoke
};
