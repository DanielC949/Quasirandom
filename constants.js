const fs = require('fs');
const CONSTANTS = JSON.parse(fs.readFileSync('data/Quasirandom/constants.json'));

module.exports = CONSTANTS;
