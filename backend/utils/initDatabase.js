const pool = require('../config/database');

const initDatabase = async () => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        // Users table
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                first_name VARCHAR(255) NOT NULL,
                last_name VARCHAR(255) NOT NULL,
                is_admin INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Positions table
        await client.query(`
            CREATE TABLE IF NOT EXISTS positions (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                is_executive INTEGER DEFAULT 0,
                number_of_positions INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Position responsibilities table
        await client.query(`
            CREATE TABLE IF NOT EXISTS position_responsibilities (
                id SERIAL PRIMARY KEY,
                position_id INTEGER NOT NULL,
                responsibility TEXT NOT NULL,
                FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE CASCADE
            )
        `);

        // Applications table
        await client.query(`
            CREATE TABLE IF NOT EXISTS applications (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                position_id INTEGER NOT NULL,
                photo_path VARCHAR(500),
                statement TEXT NOT NULL,
                submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE CASCADE,
                UNIQUE(user_id, position_id)
            )
        `);

        // Application terms table
        await client.query(`
            CREATE TABLE IF NOT EXISTS application_terms (
                id SERIAL PRIMARY KEY,
                application_id INTEGER NOT NULL,
                term VARCHAR(255) NOT NULL,
                FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
            )
        `);

        // Elections table
        await client.query(`
            CREATE TABLE IF NOT EXISTS elections (
                id SERIAL PRIMARY KEY,
                position_id INTEGER NOT NULL,
                is_active INTEGER DEFAULT 0,
                current_round INTEGER DEFAULT 1,
                started_at TIMESTAMP,
                ended_at TIMESTAMP,
                FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE CASCADE
            )
        `);

        // Election rounds table
        await client.query(`
            CREATE TABLE IF NOT EXISTS election_rounds (
                id SERIAL PRIMARY KEY,
                election_id INTEGER NOT NULL,
                round_number INTEGER NOT NULL,
                started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ended_at TIMESTAMP,
                FOREIGN KEY (election_id) REFERENCES elections(id) ON DELETE CASCADE
            )
        `);

        // Votes table
        await client.query(`
            CREATE TABLE IF NOT EXISTS votes (
                id SERIAL PRIMARY KEY,
                election_id INTEGER NOT NULL,
                round_number INTEGER NOT NULL,
                voter_id INTEGER NOT NULL,
                application_id INTEGER NOT NULL,
                voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (election_id) REFERENCES elections(id) ON DELETE CASCADE,
                FOREIGN KEY (voter_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
                UNIQUE(election_id, round_number, voter_id)
            )
        `);

        // Winners table
        await client.query(`
            CREATE TABLE IF NOT EXISTS winners (
                id SERIAL PRIMARY KEY,
                election_id INTEGER NOT NULL,
                application_id INTEGER NOT NULL,
                round_number INTEGER NOT NULL,
                vote_count INTEGER NOT NULL,
                declared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (election_id) REFERENCES elections(id) ON DELETE CASCADE,
                FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
            )
        `);

        await client.query('COMMIT');
        console.log('Database tables created successfully');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error initializing database:', err);
        throw err;
    } finally {
        client.release();
    }
};

// Run if called directly
if (require.main === module) {
    initDatabase()
        .then(() => {
            console.log('Database initialization complete');
            process.exit(0);
        })
        .catch((err) => {
            console.error('Database initialization failed:', err);
            process.exit(1);
        });
}

module.exports = initDatabase;