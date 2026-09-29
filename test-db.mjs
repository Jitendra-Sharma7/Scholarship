@'
require("dotenv").config();

const postgres = require("postgres");

async function test(name, url) {
    console.log(`Testing ${name}...`);

    if (!url) {
        console.log(`${name}: URL is missing`);
        return;
    }

    const sql = postgres(url, {
        connect_timeout: 10,
    });

    try {
        const result = await sql.unsafe("SELECT 1");
        console.log(`${name}: CONNECTION OK`, result);
    } catch (error) {
        console.log(`${name}: CONNECTION FAILED`);
        console.log("Message:", error.message);
        console.log("Code:", error.code);
    } finally {
        await sql.end();
    }
}

async function main() {
    await test("DIRECT_URL", process.env.DIRECT_URL);
    await test("DATABASE_URL", process.env.DATABASE_URL);
}

main();
'@ | Set-Content test-db.mjs
