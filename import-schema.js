const fs = require('fs');
const path = require('path');
const pool = require('./src/config/db');

async function importSchema() {
    console.log("Reading schema.sql...");
    try {
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        // Split queries by semicolon (making sure not to split inside values/strings if possible, 
        // but since it's a standard schema file, splitting by semicolon is generally fine)
        // We filter out comments and empty lines
        const queries = schemaSql
            .split(';')
            .map(q => q.trim())
            .filter(q => q.length > 0 && !q.startsWith('--') && !q.startsWith('/*'));

        console.log(`Found ${queries.length} queries to execute.`);

        for (let i = 0; i < queries.length; i++) {
            const query = queries[i];
            console.log(`Executing query ${i + 1}/${queries.length}...`);
            try {
                await pool.query(query);
                console.log("Success.");
            } catch (err) {
                console.error(`Error in query ${i + 1}:`, err.message);
            }
        }

        console.log("Schema import completed.");
        process.exit(0);
    } catch (error) {
        console.error("Schema import failed:", error);
        process.exit(1);
    }
}

importSchema();
