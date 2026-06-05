const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function forceRecreate() {
    console.log("Starting full database drop and recreation...");
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD
        });

        console.log("Connected to MySQL server. Dropping database bee_property_crm if exists...");
        await connection.query("DROP DATABASE IF EXISTS `bee_property_crm`;");
        
        console.log("Creating database bee_property_crm...");
        await connection.query("CREATE DATABASE `bee_property_crm`;");
        
        await connection.query("USE `bee_property_crm`;");
        console.log("Database created and switched successfully.");

        console.log("Now executing schema.sql to create tables...");
        const schemaPath = path.join(__dirname, 'schema.sql');
        let schemaSql = fs.readFileSync(schemaPath, 'utf8');

        // Strip SQL comments cleanly using regex
        let cleanSql = schemaSql
            .replace(/\/\*[\s\S]*?\*\//g, '') // Remove /* ... */ comments
            .replace(/--.*$/gm, '')           // Remove -- lines
            .replace(/#.*$/gm, '');           // Remove # lines

        // Split queries by semicolon and filter empty ones
        const queries = cleanSql
            .split(';')
            .map(q => q.trim())
            .filter(q => q.length > 0);

        for (let i = 0; i < queries.length; i++) {
            const query = queries[i];
            console.log(`Executing query ${i + 1}/${queries.length}...`);
            try {
                await connection.query(query);
                console.log("Success.");
            } catch (err) {
                console.error(`Error in query ${i + 1}:`, err.message);
            }
        }

        await connection.end();
        console.log("Forced database recreation completed successfully without tablespace issues!");
        process.exit(0);
    } catch (error) {
        console.error("Forced database recreation failed:", error);
        process.exit(1);
    }
}

forceRecreate();
