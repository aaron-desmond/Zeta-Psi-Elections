const db = require('../config/database');

const initDatabase = () => {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Users table
            db.run(`
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    first_name TEXT NOT NULL,
                    last_name TEXT NOT NULL,
                    is_admin INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Positions table
            db.run(`
                CREATE TABLE IF NOT EXISTS positions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    description TEXT NOT NULL,
                    is_executive INTEGER DEFAULT 0,
                    number_of_positions INTEGER DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Position responsibilities table
            db.run(`
                CREATE TABLE IF NOT EXISTS position_responsibilities (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    position_id INTEGER NOT NULL,
                    responsibility TEXT NOT NULL,
                    FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE CASCADE
                )
            `);

            // Applications table
            db.run(`
                CREATE TABLE IF NOT EXISTS applications (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    position_id INTEGER NOT NULL,
                    photo_path TEXT,
                    statement TEXT NOT NULL,
                    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE CASCADE,
                    UNIQUE(user_id, position_id)
                )
            `);

            // Application terms table
            db.run(`
                CREATE TABLE IF NOT EXISTS application_terms (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    application_id INTEGER NOT NULL,
                    term TEXT NOT NULL,
                    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
                )
            `);

            // Elections table
            db.run(`
                CREATE TABLE IF NOT EXISTS elections (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    position_id INTEGER NOT NULL,
                    is_active INTEGER DEFAULT 0,
                    current_round INTEGER DEFAULT 1,
                    started_at DATETIME,
                    ended_at DATETIME,
                    FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE CASCADE
                )
            `);

            // Election rounds table (for multi-round elections)
            db.run(`
                CREATE TABLE IF NOT EXISTS election_rounds (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    election_id INTEGER NOT NULL,
                    round_number INTEGER NOT NULL,
                    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    ended_at DATETIME,
                    FOREIGN KEY (election_id) REFERENCES elections(id) ON DELETE CASCADE
                )
            `);

            // Winners table (for positions with multiple seats)
            db.run(`
                CREATE TABLE IF NOT EXISTS winners (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    election_id INTEGER NOT NULL,
                    application_id INTEGER NOT NULL,
                    round_number INTEGER NOT NULL,
                    vote_count INTEGER NOT NULL,
                    declared_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (election_id) REFERENCES elections(id) ON DELETE CASCADE,
                    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
                )
            `);

            // Votes table
            db.run(`
                CREATE TABLE IF NOT EXISTS votes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    election_id INTEGER NOT NULL,
                    round_number INTEGER NOT NULL,
                    voter_id INTEGER NOT NULL,
                    application_id INTEGER NOT NULL,
                    voted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (election_id) REFERENCES elections(id) ON DELETE CASCADE,
                    FOREIGN KEY (voter_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
                    UNIQUE(election_id, round_number, voter_id)
                )
            `);

            // Create indexes for better performance
            db.run('CREATE INDEX IF NOT EXISTS idx_applications_user ON applications(user_id)');
            db.run('CREATE INDEX IF NOT EXISTS idx_applications_position ON applications(position_id)');
            db.run('CREATE INDEX IF NOT EXISTS idx_votes_election ON votes(election_id)');
            db.run('CREATE INDEX IF NOT EXISTS idx_votes_voter ON votes(voter_id)');
            db.run('CREATE INDEX IF NOT EXISTS idx_elections_position ON elections(position_id)');

            console.log('✅ Database schema created successfully');
            resolve();
        });
    });
};

// Run if called directly
if (require.main === module) {
    initDatabase()
        .then(() => {
            console.log('Database initialization complete');
            process.exit(0);
        })
        .catch(err => {
            console.error('Database initialization failed:', err);
            process.exit(1);
        });
}

module.exports = initDatabase;