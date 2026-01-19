const db = require('../config/database');
const bcrypt = require('bcryptjs');

const defaultPositions = [
    {
        title: 'President',
        description: 'Lead the fraternity and represent brothers in all matters',
        responsibilities: [
            'Oversee all fraternity operations',
            'Lead executive board meetings',
            'Represent chapter at national events'
        ],
        isExecutive: true,
        numberOfPositions: 1
    },
    {
        title: 'Vice President',
        description: 'Assist the President and manage internal affairs',
        responsibilities: [
            'Support President in leadership',
            'Coordinate between committees',
            'Step in when President is unavailable'
        ],
        isExecutive: true,
        numberOfPositions: 1
    },
    {
        title: 'Treasurer',
        description: 'Manage chapter finances and budget',
        responsibilities: [
            'Track all income and expenses',
            'Prepare financial reports',
            'Collect dues from members'
        ],
        isExecutive: true,
        numberOfPositions: 1
    },
    {
        title: 'Social Chair',
        description: 'Plan and execute social events',
        responsibilities: [
            'Organize mixers and social events',
            'Coordinate with other Greek organizations',
            'Manage event budgets'
        ],
        isExecutive: false,
        numberOfPositions: 3
    },
    {
        title: 'Rush Chair',
        description: 'Lead recruitment efforts',
        responsibilities: [
            'Plan recruitment events',
            'Coordinate with potential new members',
            'Manage rush budget'
        ],
        isExecutive: false,
        numberOfPositions: 4
    }
];

const seedPositions = () => {
    return new Promise((resolve, reject) => {
        console.log('🌱 Seeding positions...');
        
        // First, check if positions already exist
        db.get('SELECT COUNT(*) as count FROM positions', [], (err, result) => {
            if (err) {
                return reject(err);
            }
            
            if (result.count > 0) {
                console.log('ℹ️  Positions already exist in database. Skipping seed.');
                return resolve();
            }
            
            // Insert each position
            let completed = 0;
            const total = defaultPositions.length;
            
            defaultPositions.forEach((position, index) => {
                const { title, description, responsibilities, isExecutive, numberOfPositions } = position;
                const isExec = isExecutive ? 1 : 0;
                
                const query = `
                    INSERT INTO positions (title, description, is_executive, number_of_positions)
                    VALUES (?, ?, ?, ?)
                `;
                
                db.run(query, [title, description, isExec, numberOfPositions], function(err) {
                    if (err) {
                        console.error(`❌ Failed to insert ${title}:`, err.message);
                        return reject(err);
                    }
                    
                    const positionId = this.lastID;
                    console.log(`✅ Created position: ${title} (ID: ${positionId})`);
                    
                    // Insert responsibilities
                    if (responsibilities && responsibilities.length > 0) {
                        const respQuery = `INSERT INTO position_responsibilities (position_id, responsibility) VALUES (?, ?)`;
                        const stmt = db.prepare(respQuery);
                        
                        responsibilities.forEach(resp => {
                            stmt.run([positionId, resp]);
                        });
                        
                        stmt.finalize();
                    }
                    
                    completed++;
                    if (completed === total) {
                        console.log(`🎉 Successfully seeded ${total} positions!`);
                        resolve();
                    }
                });
            });
        });
    });
};

const seedAdmin = async () => {
    return new Promise(async (resolve, reject) => {
        console.log('🌱 Seeding admin user...');
        
        // Check if admin already exists
        db.get('SELECT id FROM users WHERE email = ?', ['admin@zetapsi.com'], async (err, existingAdmin) => {
            if (err) {
                return reject(err);
            }
            
            if (existingAdmin) {
                console.log('ℹ️  Admin user already exists. Skipping seed.');
                return resolve();
            }
            
            try {
                // Hash the admin password
                const hashedPassword = await bcrypt.hash('admin123!', 10);
                
                // Insert admin user
                const query = `
                    INSERT INTO users (email, password, first_name, last_name, is_admin)
                    VALUES (?, ?, ?, ?, 1)
                `;
                
                db.run(query, ['admin@zetapsi.com', hashedPassword, 'Admin', 'User'], function(err) {
                    if (err) {
                        console.error('❌ Failed to create admin user:', err.message);
                        return reject(err);
                    }
                    
                    console.log(`✅ Created admin user: admin@zetapsi.com (ID: ${this.lastID})`);
                    console.log('   Password: admin123!');
                    resolve();
                });
            } catch (error) {
                console.error('❌ Failed to hash password:', error.message);
                reject(error);
            }
        });
    });
};

// Run if called directly
if (require.main === module) {
    Promise.all([seedPositions(), seedAdmin()])
        .then(() => {
            console.log('✅ Database seeding complete');
            db.close();
            process.exit(0);
        })
        .catch(err => {
            console.error('❌ Database seeding failed:', err);
            db.close();
            process.exit(1);
        });
}

module.exports = { seedPositions, seedAdmin };