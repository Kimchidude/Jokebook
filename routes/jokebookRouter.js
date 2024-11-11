const express = require('express');
const router = express.Router();
const axios = require('axios');

module.exports = (db) => {
    // Attach db instance to request object
    router.use((req, res, next) => {
        req.db = db;  // Attach the db to each request
        next();
    });

    // Show all categories
    router.get('/categories', (req, res) => {
        req.db.all('SELECT * FROM categories', (err, rows) => {
            if (err) {
                console.error('Error fetching categories:', err);
                return res.status(500).send('Error loading categories.');
            }
            res.render('categories', { categories: rows });
        });
    });

    // Serve the homepage with a random joke
    router.get('/', (req, res) => {
        req.db.get('SELECT * FROM jokes ORDER BY RANDOM() LIMIT 1', (err, row) => {
            if (err) {
                return res.status(500).send('Error fetching random joke');
            }
            // Pass the random joke to the view
            res.render('index', { joke: row });
        });
    });

    // Search categories by name
    router.get('/search', async (req, res) => {
        const searchQuery = req.query.query;
        console.log('Searching for categories matching:', searchQuery);

        // Perform a case-insensitive search using LIKE in SQL
        req.db.get('SELECT * FROM categories WHERE name LIKE ?', [`%${searchQuery}%`], async (err, category) => {
            if (err) {
                console.error('Error searching for categories:', err);
                return res.status(500).send('Error searching categories.');
            }

            if (category) {
                // If a category is found, fetch jokes for this category from the database
                req.db.all('SELECT * FROM jokes WHERE category = ?', [category.name], (err, jokes) => {
                    if (err) {
                        console.error('Error fetching jokes:', err);
                        return res.status(500).send('Error fetching jokes.');
                    }

                    // Check if jokes exist for the category
                    if (jokes.length > 0) {
                        // Render jokes for the matched category from the database
                        res.render('jokes', { category: category.name, jokes: jokes });
                    } else {
                        // If no jokes found in the database, display message
                        res.render('index', { categories: [], jokes: [], message: `No jokes found in the "${category.name}" category.` });
                    }
                });
            } else {
                // If no category found in the database, search from JokeAPI
                try {
                    const apiUrl = `https://v2.jokeapi.dev/joke/${searchQuery}?type=twopart&amount=3`;
                    const response = await axios.get(apiUrl);

                    // Check if JokeAPI response contains jokes
                    let jokes = [];
                    if (response.data && response.data.jokes) {
                        jokes = response.data.jokes.map(joke => ({
                            setup: joke.setup,
                            delivery: joke.delivery,
                            category: searchQuery,
                        }));
                    }

                    if (jokes.length > 0) {
                        // Render jokes from the JokeAPI
                        res.render('jokes', { category: searchQuery, jokes: jokes });
                    } else {
                        // If no jokes are found from JokeAPI, render the message on the index page
                        res.render('index', { categories: [], jokes: [], message: `No jokes found in the "${searchQuery}" category from JokeAPI.` });
                    }
                } catch (err) {
                    res.render('index', { categories: [], jokes: [], message: `No jokes found in the "${searchQuery}" category from JokeAPI.` });
                }
            }
        });
    });

    // Show form to add a new joke
    router.get('/newjoke', (req, res) => {
        console.log('GET /jokebook/newjoke route hit');

        // Fetch categories from the database
        req.db.all('SELECT * FROM categories', (err, rows) => {
            if (err) {
                console.error('Error fetching categories:', err);
                return res.status(500).send('Error loading categories.');
            }

            // Pass categories to the view
            res.render('new-joke', { categories: rows });
        });
    });

    // Handle adding a new joke
    router.post('/newjoke', (req, res) => {
        console.log('POST /jokebook/newjoke route hit');
        console.log('Form data:', req.body);

        const { category, setup, delivery } = req.body;
        if (!category || !setup || !delivery) {
            console.error('Validation failed: Missing fields');
            return res.status(400).send('All fields are required.');
        }

        // Insert the joke into the database
        req.db.run('INSERT INTO jokes (category, setup, delivery) VALUES (?, ?, ?)', [category, setup, delivery], function (err) {
            if (err) {
                console.error('Error adding joke:', err);
                return res.status(500).send('Error adding joke.');
            }
            console.log('New joke added successfully');

            res.redirect('/jokebook'); 
        });
    });

    // Show jokes by category
    router.get('/joke/:category', (req, res) => {
        const { category } = req.params;
        console.log('Fetching jokes for category:', category);

        req.db.all('SELECT * FROM jokes WHERE category = ?', [category], (err, rows) => {
            if (err) {
                return res.status(500).send('Error loading jokes.');
            }
            res.render('jokes', { category, jokes: rows });
        });
    });

    // Route to add a joke to the database
    router.post('/addJoke', (req, res) => {
        const { setup, delivery, category } = req.body;

        // Validate the joke data
        if (!setup || !delivery || !category) {
            return res.status(400).send('Missing required joke data.');
        }

        // Insert the joke into the jokes table
        req.db.run('INSERT INTO jokes (setup, delivery, category) VALUES (?, ?, ?)', [setup, delivery, category], (err) => {
            if (err) {
                console.error('Error adding joke to database:', err);
                return res.status(500).send('Error adding joke to database.');
            }

            // Redirect back to the page showing jokes for this category
            res.redirect(`/jokebook/joke/${category}`);
        });
    });

    return router;
};