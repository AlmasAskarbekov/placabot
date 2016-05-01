var mongoose = require('mongoose');
const database = 'mongodb://userbot:<user>@<server>.mlab.com:<pass>/placabot';
var connection = mongoose.connect(database);

module.exports = connection;
