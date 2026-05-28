require('dotenv').config();
const express = require('express');
const path = require('path');
const mysql = require('mysql2/promise');
const { google } = require('googleapis'); // Import Google APIs

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Initialize MySQL Database Connection Pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// 2. Configure the Personal Emails of the Huns
//  REPLACED THESE WITH ACTUAL PERSONAL EMAILS TO TEST THE INVITES!
const HUNS_EMAILS = [
    { email: 'carysrebecawilliams@gmail.com' },
    { email: 'alicefranklinmail@gmail.com' },
    { email: 'emily@purdham.com' },
    { email: 'siobhansaralawless@gmail.com'},
    { email: 'jazminesleman7@gmail.com'},
    { email: 'immymcandrew@gmail.com'}
];

// 3. Initialize the Google OAuth2 Client
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground' // Redirect URI
);

// Hand the permanent Refresh Token to the Google Client
oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});

const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

// Test DB Connection on startup
pool.getConnection()
    .then(connection => {
        console.log('Successfully connected to the MySQL database! 🎉');
        connection.release();
    })
    .catch(err => console.error('❌ Database Connection Error:', err.message));

// Middleware Configuration
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// 4. API Route: Handle Booking Form Submission & Google Automation
app.post('/api/bookings', async (req, res) => {
    const { clientName, eventName, eventCity, eventDate, setTime, budget, additionalInfo } = req.body;

    // --- STEP A: Save to MySQL Database ---
    const dbQuery = `
        INSERT INTO bookings (client_name, event_name, event_city, event_date, set_time, budget, additional_info)
        VALUES (?, ?, ?, ?, ?, ?, ?);
    `;
    const dbValues = [clientName, eventName, eventCity, eventDate, setTime, budget, additionalInfo];

    try {
        const [dbResult] = await pool.execute(dbQuery, dbValues);
        const newBookingId = dbResult.insertId;
        console.log(`🚀 Step 1: Booking saved to MySQL with ID: ${newBookingId}`);

        // --- STEP B: Create the Google Calendar Event ---
        // Construct the event details based on your product requirements

        // --- STEP B: Create the Google Calendar Event ---
        
        // Google requires all-day end dates to be EXCLUSIVE (the day AFTER the event ends)
        const nextDay = new Date(eventDate);
        nextDay.setDate(nextDay.getDate() + 1);
        const exclusiveEndDate = nextDay.toISOString().split('T')[0];

        const calendarEvent = {
            summary: `TENTATIVE: ${eventName} - ${eventCity}`,
            location: eventCity,
            description: `New booking request received via website!\n\nClient: ${clientName}\nSet Time: ${setTime}\nBudget: £${budget}\nNotes: ${additionalInfo}`,
            start: {
                date: eventDate, // Start day (inclusive)
            },
            end: {
                date: exclusiveEndDate, // End day (exclusive -> next day)
            },
            attendees: HUNS_EMAILS, 
            visibility: 'private'
        };

        console.log('⏳ Step 2: Communicating with Google Calendar API...');
        
        // Push the event to the primary calendar of the Huns account
        const googleResponse = await calendar.events.insert({
            calendarId: 'primary',
            resource: calendarEvent,
            sendUpdates: 'all', // Crucial: This triggers the native Google email notifications
        });

        console.log(`✨ Step 3: Google Calendar event created successfully! Event Link: ${googleResponse.data.htmlLink}`);

        // --- STEP C: Send Success Response to Browser ---
        res.status(201).json({ 
            success: true, 
            message: "Booking saved and Huns notified via Google Calendar! 🌹", 
            bookingId: newBookingId,
            calendarLink: googleResponse.data.htmlLink
        });

    } catch (error) {
        console.error('❌ Full-Stack Execution Error:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// Start the Server
app.listen(PORT, () => {
    console.log(`Huns n' Roses engine roaring on http://localhost:${PORT} 🌹`);
});