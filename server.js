const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware configuration
app.use(cors());
app.use(express.json());

// Serves index.html and dashboard.html directly from the root directory
app.use(express.static(__dirname));

// Initialize and connect to SQLite Database
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error("❌ Database connection error:", err.message);
    } else {
        console.log("🔒 Connected to SQLite database successfully.");
    }
});

// Create the bookings table automatically if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_name TEXT,
    patient_phone TEXT,
    doctor_name TEXT,
    date TEXT,
    time TEXT
)`);

// API Route: Fetch all appointments for the Doctor Dashboard
app.get('/api/appointments', (req, res) => {
    db.all(`SELECT * FROM bookings ORDER BY date ASC, time ASC`, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ data: rows });
    });
});

// API Route: Save a new booking sent from the client website
app.post('/api/book', (req, res) => {
    const { patient_name, patient_phone, doctor_name, date, time } = req.body;
    
    if (!patient_name || !patient_phone || !doctor_name || !date || !time) {
        return res.status(400).json({ error: "Missing required booking details." });
    }

    const sql = `INSERT INTO bookings (patient_name, patient_phone, doctor_name, date, time) VALUES (?, ?, ?, ?, ?)`;
    db.run(sql, [patient_name, patient_phone, doctor_name, date, time], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: "Booking recorded successfully!", id: this.lastID });
    });
});

// API Route: Delete/Clear an appointment when a doctor finishes a consultation
app.delete('/api/appointments/:id', (req, res) => {
    const id = req.params.id;
    db.run(`DELETE FROM bookings WHERE id = ?`, id, function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: "Appointment cleared successfully!" });
    });
});

// Wildcard fallback to serve index.html for unknown routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the network listener
app.listen(PORT, () => {
    console.log(`🚀 Server is live and running on port ${PORT}`);
});