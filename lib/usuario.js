var database = require('./database.js');

var Schema = database.Schema;
var UsuarioSchema = new Schema({
  user: String,
  nome: String,
  telegram_id: Number,
  type: String
}, {
  timestamps: true
});
var Usuario = database.model('Usuario', UsuarioSchema);
module.exports = Usuario;
