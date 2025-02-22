const express = require('express');
const router = express.Router();
const db = require('../database/db'); // Assuming db.js exports a configured connection

const multer = require('multer');
const path = require('path');


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
    }
});

const upload = multer({ storage: storage });


// Endpoint untuk menambahkan tugas baru dengan gambar
router.post('/', upload.single('image'), (req, res) => {
    const { task } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null; // Save the file path if there's an image

    if (!task || task.trim() === '') {
        return res.status(400).send('Task cannot be empty');
    }

    db.query('INSERT INTO todos (task, image_url) VALUES (?, ?)', [task.trim(), imageUrl], (err, results) => {
        if (err) return res.status(500).send('Internal Server Error');
        const newTodo = { id: results.insertId, task: task.trim(), image_url: imageUrl, completed: false };
        res.status(201).json(newTodo);
    });
});

router.get('/', (req, res) => {
    db.query('SELECT * FROM todos', (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Internal Server Error');
        }
        res.json(results);
    });
});

// Endpoint to get a todo by ID
router.get('/:id', (req, res) => {
    const todoId = req.params.id;
    db.query('SELECT * FROM todos WHERE id = ?', [todoId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Internal Server Error');
        }
        if (results.length === 0) {
            return res.status(404).send('Todo not found');
        }
        res.json(results[0]);
    });
});

// Endpoint to add a new todo
router.post('/', (req, res) => {
    const { task } = req.body;

    // Validate input
    if (!task || task.trim() === '') {
        return res.status(400).send('Task cannot be empty');
    }

    db.query('INSERT INTO todos (task) VALUES (?)', [task.trim()], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Internal Server Error');
        }
        const newTodo = { id: results.insertId, task: task.trim(), completed: false };
        res.status(201).json(newTodo); // Respond with 201 for successful creation
    });
});

// Endpoint to update an existing todo
router.put('/:id', (req, res) => {
    const { task, completed } = req.body;
    const todoId = req.params.id;

    // Ensure the task is not empty
    if (!task || task.trim() === '') {
        return res.status(400).send('Task cannot be empty');
    }

    db.query('UPDATE todos SET task = ?, completed = ? WHERE id = ?', [task.trim(), completed, todoId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Internal Server Error');
        }
        if (results.affectedRows === 0) {
            return res.status(404).send('Todo not found');
        }
        res.json({ id: todoId, task: task.trim(), completed: completed });
    });
});

// Endpoint to delete a todo by ID
router.delete('/:id', (req, res) => {
    const todoId = req.params.id;
    
    db.query('DELETE FROM todos WHERE id = ?', [todoId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Internal Server Error');
        }
        if (results.affectedRows === 0) {
            return res.status(404).send('Todo not found');
        }
        res.status(204).send(); // No content response for successful deletion
    });
});

module.exports = router;
