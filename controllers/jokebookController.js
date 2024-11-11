const { getCategories } = require('../models/categoriesModel');
const { getJokesByCategory, addJoke } = require('../models/jokesModel');

const listCategories = (req, res) => {
    getCategories((err, rows) => {
        if (err) res.status(500).send('Error retrieving categories');
        else res.json(rows);
    });
};

const getJokes = (req, res) => {
    const { category } = req.params;
    const limit = req.query.limit || 10;

    getJokesByCategory(category, limit, (err, rows) => {
        if (err) res.status(500).send('Error retrieving jokes');
        else if (!rows.length) res.status(404).send('Category not found or no jokes available');
        else res.json(rows);
    });
};

const createJoke = (req, res) => {
    const { category, setup, delivery } = req.body;
    if (!category || !setup || !delivery) {
        res.status(400).send('Missing required fields: category, setup, or delivery');
        return;
    }

    addJoke(category, setup, delivery, function (err) {
        if (err) res.status(500).send('Error adding joke');
        else getJokesByCategory(category, 10, (err, rows) => {
            if (err) res.status(500).send('Error retrieving updated jokes');
            else res.json(rows);
        });
    });
};

module.exports = { listCategories, getJokes, createJoke };
