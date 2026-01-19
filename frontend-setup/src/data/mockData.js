export const positions = [
    {
        id: 1,
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
        id: 2,
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
        id: 3,
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
        id: 4,
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
        id: 5,
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

// Mock users - including admin
export const mockUsers = [
    {
        id: 1,
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        isAdmin: false
    },
    {
        id: 2,
        email: 'admin@zetapsi.com',
        password: 'admin123!',
        firstName: 'Admin',
        lastName: 'User',
        isAdmin: true
    }
];