require('dotenv').config();
const express = require('express');
const path = require('path');
const mysql = require('mysql2/promise'); // Uses modern async/await for MySQL

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Initialize MySQL Database Connection Pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 3306, // 3306 is the standard MySQL port
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test Database Connection on startup
pool.getConnection()
    .then(connection => {
        console.log('Successfully connected to the MySQL database! 🎉');
        connection.release();
    })
    .catch(err => {
        console.error('❌ Error connecting to the database:', err.message);
    });

// 2. Middleware Configuration
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve your frontend HTML form files automatically
app.use(express.static(path.join(__dirname, 'public')));

// 3. API Route: Handle Booking Form Submission
app.post('/api/bookings', async (req, res) => {
    // Extract fields from the incoming frontend form payload
    const { clientName, eventName, eventCity, eventDate, setTime, budget, additionalInfo } = req.body;

    // MySQL Query using safe '?' positioning to prevent SQL injection attacks
    const queryText = `
        INSERT INTO bookings (client_name, event_name, event_city, event_date, set_time, budget, additional_info)
        VALUES (?, ?, ?, ?, ?, ?, ?);
    `;

    const values = [clientName, eventName, eventCity, eventDate, setTime, budget, additionalInfo];

    try {
        // Execute query against the pool
        const [result] = await pool.execute(queryText, values);
        
        // MySQL automatically returns the generated ID inside 'insertId'
        const newBookingId = result.insertId;
        
        console.log(`🚀 Booking successfully saved to database with ID: ${newBookingId}`);
        
        // Return a clean success response back to the frontend browser
        res.status(201).json({ 
            success: true, 
            message: "Booking request received!", 
            bookingId: newBookingId 
        });
    } catch (error) {
        console.error('❌ Database insertion error:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// Start the Web Server Engine
app.listen(PORT, () => {
    console.log(`Huns n' Roses engine running on http://localhost:${PORT} 🌹`);
});