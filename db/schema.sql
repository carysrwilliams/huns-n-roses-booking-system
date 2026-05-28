-- Huns n' Roses Booking System Database Schema
-- Run this script inside your existing database tool (e.g., DBeaver)

CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    client_name VARCHAR(255) NOT NULL,
    event_name VARCHAR(255) NOT NULL,
    event_city VARCHAR(100) NOT NULL,
    event_date DATE NOT NULL,
    set_time VARCHAR(100) NOT NULL,
    budget INT NOT NULL,
    additional_info TEXT,
    google_event_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);