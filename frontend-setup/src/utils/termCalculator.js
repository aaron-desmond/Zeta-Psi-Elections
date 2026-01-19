export function getCurrentTerm() {
    const now = new Date();
    const month = now.getMonth() + 1; // 1-12
    const day = now.getDate();
    const year = now.getFullYear();

    // Determine current term based on date
    if ((month === 9 && day >= 9) || month === 10 || month === 11 || month === 12) {
        return { term: 'Fall', year };
    } else if (month === 1 || month === 2 || month === 3) {
        return { term: 'Winter', year };
    } else if (month === 4 || month === 5 || (month === 6 && day <= 19)) {
        return { term: 'Spring', year };
    } else {
        // June 20 - Sept 8
        return { term: 'Summer', year };
    }
}

export function getNextFourTerms() {
    const current = getCurrentTerm();
    const terms = ['Fall', 'Winter', 'Spring', 'Summer'];
    const termOrder = {
        'Fall': 0,
        'Winter': 1,
        'Spring': 2,
        'Summer': 3
    };

    const startIndex = termOrder[current.term];
    const result = [];
    let year = current.year;

    // Generate next 4 terms FOLLOWING the current term
    for (let i = 1; i <= 4; i++) {  // Start from 1 instead of 0
        const termIndex = (startIndex + i) % 4;
        const termName = terms[termIndex];
        
        // Increment year when we wrap around from Winter back to Fall
        if (termIndex === 0 && i > 1) {
            year++;
        } else if (i === 1 && termIndex <= startIndex) {
            year++;
        }
        
        result.push({
            value: `${termName} ${year}`,
            label: `${termName} ${year}`
        });
    }

    return result;
}