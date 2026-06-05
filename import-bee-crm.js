const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function importDatabase() {
    console.log("Checking database connection settings in .env...");
    console.log(`Host: ${process.env.DB_HOST}`);
    console.log(`Port: ${process.env.DB_PORT || 3306}`);
    console.log(`User: ${process.env.DB_USER}`);
    console.log(`Database: ${process.env.DB_NAME}`);

    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 1,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000,
        connectTimeout: 60000
    });

    try {
        // Test connection
        const conn = await pool.getConnection();
        console.log("✅ Database connected successfully!");
        conn.release();

        // Read bee_property_crm.sql from workspace root or parent directories
        let sqlPath = path.join(__dirname, '..', '..', 'bee_property_crm.sql');
        if (!fs.existsSync(sqlPath)) {
            sqlPath = path.join(__dirname, '..', 'bee_property_crm.sql');
        }
        if (!fs.existsSync(sqlPath)) {
            sqlPath = path.join(__dirname, 'bee_property_crm.sql');
        }

        console.log(`Reading SQL file from: ${sqlPath}`);
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');

        // Split queries by semicolon
        // We handle comments and clean whitespace
        const rawQueries = sqlContent.split(';');
        const queries = [];
        
        for (let q of rawQueries) {
            let trimmed = q.trim();
            // Remove comments starting with -- or /*
            trimmed = trimmed
                .split('\n')
                .filter(line => {
                    const l = line.trim();
                    return l.length > 0 && !l.startsWith('--') && !l.startsWith('/*') && !l.startsWith('#');
                })
                .join('\n')
                .trim();
                
            if (trimmed.length > 0) {
                queries.push(trimmed);
            }
        }

        console.log(`Found ${queries.length} queries to execute.`);

        for (let i = 0; i < queries.length; i++) {
            const query = queries[i];
            const preview = query.substring(0, 100).replace(/\n/g, ' ') + (query.length > 100 ? '...' : '');
            console.log(`[${i + 1}/${queries.length}] Executing: ${preview}`);
            
            try {
                await pool.query(query);
            } catch (err) {
                console.error(`❌ Error in query ${i + 1}:`, err.message);
                // We keep going for drop/create errors, or stop depending on severity
            }
        }

        console.log("🎉 Database import completed!");
        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error("❌ Database import failed:", error);
        await pool.end();
        process.exit(1);
    }
}

importDatabase();
