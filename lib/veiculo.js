var database = require('./database.js');

var Schema = database.Schema;
var VeiculoSchema = new Schema({
  boletim: String,
  regional: String,
  placa: String,
  modelo: String,
  municipio: String,
  uf: String,
  cor: String,
  ano: String,
  chassi: String,
  data: Date,
  sinesp: Boolean
}, {
  timestamps: true
});
var Veiculo = database.model('Veiculo', VeiculoSchema);

Veiculo.saveLocal = function(veiculo) {
  veiculo.sinesp = true;
  Veiculo.update({
    placa: veiculo.placa
  }, veiculo, {
    upsert: true,
    new: true
  }, (err, result) => {});
};

Veiculo.searchLocal = function(placa) {

  var twentyMinutesLater = new Date();
      twentyMinutesLater.setMinutes(twentyMinutesLater.getMinutes() - 20);

  return new Promise((resolve, reject) => {
    Veiculo.findOne({
      placa: placa,
      "updatedAt": {
        $gte: twentyMinutesLater
      }
    }, (err, veiculo) => {
      if (err) return reject('Não foi possível consultar no SIGO');
      resolve(veiculo);
    });
  });
};

module.exports = Veiculo;
