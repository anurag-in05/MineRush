function generateMines(mineCount) {
    const positions = [...Array(25).keys()];

    for (let i = positions.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    return positions.slice(0, mineCount);
}

function calculateMultiplier(revealedCount, mineCount) {
    let probability = 1;

    for (let i = 0; i < revealedCount; i += 1) {
        probability *= (25 - mineCount - i) / (25 - i);
    }

    return 0.98 / probability;
}

module.exports = {
    calculateMultiplier,
    generateMines
};
