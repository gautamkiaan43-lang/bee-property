const pool = require('./src/config/db');

async function migrate() {
    console.log("Starting Phase 1 Database Migrations...");
    const queries = [
        // 1. Properties
        "ALTER TABLE `properties` ADD COLUMN `gallery_images` TEXT DEFAULT NULL AFTER `image`;",
        
        // 2. Tenants
        "ALTER TABLE `tenants` ADD COLUMN `profile_photo` VARCHAR(255) DEFAULT NULL AFTER `status`, ADD COLUMN `emergency_contact_name` VARCHAR(150) DEFAULT NULL AFTER `profile_photo`, ADD COLUMN `emergency_contact_phone` VARCHAR(20) DEFAULT NULL AFTER `emergency_contact_name`, ADD COLUMN `notes` TEXT DEFAULT NULL AFTER `emergency_contact_phone`;",
        
        // 3. Leases
        "ALTER TABLE `leases` ADD COLUMN `renewal_status` ENUM('Pending','Renewed','Not Renewing') DEFAULT 'Pending' AFTER `status`;",
        
        // 4. Invoices
        "ALTER TABLE `invoices` ADD COLUMN `payment_method` VARCHAR(50) DEFAULT NULL AFTER `status`, ADD COLUMN `payment_reference` VARCHAR(100) DEFAULT NULL AFTER `payment_method`, ADD COLUMN `late_fee` DECIMAL(10,2) DEFAULT 0.00 AFTER `payment_reference`, ADD COLUMN `reminder_status` ENUM('None','Sent','Escalated') DEFAULT 'None' AFTER `late_fee`;",
        
        // 5. Maintenance
        "ALTER TABLE `maintenance` ADD COLUMN `vendor_name` VARCHAR(150) DEFAULT NULL AFTER `status`, ADD COLUMN `vendor_notes` TEXT DEFAULT NULL AFTER `vendor_name`;",
        
        // 6. Leads (New Table)
        `CREATE TABLE IF NOT EXISTS \`leads\` (
          \`id\` int(11) NOT NULL AUTO_INCREMENT,
          \`name\` varchar(150) NOT NULL,
          \`email\` varchar(100) DEFAULT NULL,
          \`phone\` varchar(20) DEFAULT NULL,
          \`source\` enum('Zillow','Website','Facebook','Referral','Manual') DEFAULT 'Manual',
          \`status\` enum('New','Contacted','Qualified','Lost','Converted') DEFAULT 'New',
          \`notes\` text DEFAULT NULL,
          \`assigned_to\` int(11) DEFAULT NULL,
          \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
          PRIMARY KEY (\`id\`),
          KEY \`assigned_to\` (\`assigned_to\`),
          CONSTRAINT \`leads_ibfk_1\` FOREIGN KEY (\`assigned_to\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
        
        // 7. Communication Logs (New Table)
        `CREATE TABLE IF NOT EXISTS \`communication_logs\` (
          \`id\` int(11) NOT NULL AUTO_INCREMENT,
          \`type\` enum('SMS','Email') NOT NULL,
          \`recipient\` varchar(150) NOT NULL,
          \`message\` text NOT NULL,
          \`status\` enum('Sent','Failed','Delivered') DEFAULT 'Sent',
          \`related_entity\` varchar(50) DEFAULT NULL,
          \`entity_id\` int(11) DEFAULT NULL,
          \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
          PRIMARY KEY (\`id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
        
        // 8. AI Logs (New Table)
        `CREATE TABLE IF NOT EXISTS \`ai_logs\` (
          \`id\` int(11) NOT NULL AUTO_INCREMENT,
          \`user_id\` int(11) DEFAULT NULL,
          \`prompt\` text NOT NULL,
          \`response\` text NOT NULL,
          \`context\` text DEFAULT NULL,
          \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
          PRIMARY KEY (\`id\`),
          KEY \`user_id\` (\`user_id\`),
          CONSTRAINT \`ai_logs_ibfk_1\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
        
        // 9. Settings (Seed Integrations)
        "INSERT IGNORE INTO `settings` (`key`, `value`) VALUES ('ghl_api_key', ''), ('ghl_location_id', ''), ('openai_api_key', '');"
    ];

    try {
        for (let i = 0; i < queries.length; i++) {
            console.log(`Executing query ${i + 1}...`);
            try {
                await pool.query(queries[i]);
                console.log(`Success.`);
            } catch (err) {
                // Ignore "Duplicate column name" errors
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log(`Column already exists, skipping.`);
                } else if (err.code === 'ER_TABLE_EXISTS_ERROR') {
                    console.log(`Table already exists, skipping.`);
                } else {
                    console.error(`Error executing query ${i + 1}:`, err.message);
                }
            }
        }
        console.log("Migration complete.");
        process.exit(0);
    } catch (error) {
        console.error("Migration failed.", error);
        process.exit(1);
    }
}

migrate();
