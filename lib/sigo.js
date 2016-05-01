var cheerio = require('cheerio'),
    request = require('request'),
    Veiculo = require('../lib/veiculo.js');

var listSigo = function() {
  return new Promise((resolve, reject) => {
    request = request.defaults({
      jar: true
    });
    request.post({
      url: 'http://www.sigo.ac.gov.br/acesso.php',
      form: {
        CPF: '<usuario>',
        Senha: '<senha>',
        idUni: 54
      }
    }, (err, response, body) => {
      if (err || response.statusCode != 200) {
        reject('listSigo login ' + err);
      }

      var date = new Date(),
          year = date.getFullYear();

      request.post({
        url: 'http://www.sigo.ac.gov.br/situacao_veiculo.listagem.php',
        form: {
          tipo: 1,
          dt_inicial: '01/01/' + (year - 100),
          dt_final: '01/01/' + (year + 1)
        }
      }, (error, response, body) => {
        if (err || response.statusCode != 200) {
          return reject('listSigo list ' + err);
        }
        resolve(body);
      });
    });
  });
};

module.exports.getUpdates = function () {
  return new Promise((resolve, reject) => {
    listSigo().then((lista) => {

      $ = cheerio.load(lista);
      var veiculo, data, date, x = 0;
      var lines = $("table > tr").length - 2;

      $("table > tr").next().each((i, row) => {
        data = $('td', row);

        veiculo = {
          boletim: data.eq(0).text(),
          regional: data.eq(1).text(),
          placa: data.eq(2).text().replace(/[\s-]/, ""),
          modelo: data.eq(3).text(),
          chassi: data.eq(6).text(),
          data: data.eq(7).text().split('/').reverse().join('-')
        };

        Veiculo.update({
          placa: veiculo.placa
        }, {
          $set: veiculo,
          $inc: {
            __v: 1
          }
        }, {
          upsert: true,
          new: true
        },
        (err, success) => {
          if (x++ == lines) {
            return resolve('Atualizou com ' + lines + ' veículos');
          }
        });
      });
    }).catch((err) => {
      return reject('getUpdates ' + err);
    });
  });
};
