const pool = require('./src/config/db');
const bcrypt = require('bcryptjs');

async function seed() {
    console.log("Seeding Admin & Manager users...");
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('123456', salt);

        // Delete existing user if email matches to avoid duplicate error or update it
        await pool.query("DELETE FROM `users` WHERE `email` IN ('admin@gmail.com', 'tanu@gmail.com', 'admin@peachstate.com');");

        // Insert admin@gmail.com
        await pool.query(
            "INSERT INTO `users` (`name`, `email`, `password`, `role`) VALUES (?, ?, ?, ?)",
            ['System Admin', 'admin@gmail.com', hashedPassword, 'admin']
        );
        console.log("✅ Seeded admin@gmail.com with password '123456'");

        // Insert tanu@gmail.com
        await pool.query(
            "INSERT INTO `users` (`name`, `email`, `password`, `role`) VALUES (?, ?, ?, ?)",
            ['Property Manager', 'tanu@gmail.com', hashedPassword, 'manager']
        );
        console.log("✅ Seeded tanu@gmail.com with password '123456'");

        console.log("Seeding completed successfully.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    }
}

seed();
