var parseString = require('xml2js').parseString,
    publicIp = require('public-ip'),
    crypto = require('crypto'),
    cheerio = require('cheerio'),
    request = require('request');

var searchSinesp = function(placa) {
  return new Promise((resolve, reject) => {
    publicIp.v4((err, ip) => {

      if (err || !ip) {
        ip = '23.21.102.163';
      }

      const key = placa + '7lYS859X6fhB5Ow',
      token = crypto.createHmac('sha1', key).update(placa).digest('hex');

      const data = {
        url: 'https://sinespcidadao.sinesp.gov.br/sinesp-cidadao/ConsultaPlacaNovo02102014',
        body: `<v:Envelope xmlns:i="http://www.w3.org/2001/XMLSchema-instance" xmlns:d="http://www.w3.org/2001/XMLSchema" xmlns:c="http://schemas.xmlsoap.org/soap/encoding/" xmlns:v="http://schemas.xmlsoap.org/soap/envelope/"><v:Header><b>SM-G925V</b><c>Android</c><d>5.1.1</d><e>4.0</e><f>${ ip }</f><g>${ token }</g><h></h><i></i><j></j></v:Header><v:Body><n0:getStatus xmlns:n0="http://soap.ws.placa.service.sinesp.serpro.gov.br/"><a>${ placa }</a></n0:getStatus></v:Body></v:Envelope>`,
        headers: {
          'User-Agent': 'ksoap2-android/2.6.0+',
          'Content-Type': 'text/xml',
          'SOAPAction': ''
        }
      };
      request({
        method: 'post',
        uri: data.url,
        body: data.body,
        rejectUnauthorized: false,
        headers: data.headers,
        encoding: 'binary'
      }, (err, response) => {
        if (err) {
          return reject(err);
        }

        parseResult(response.body).then((veiculo) => {
          resolve(veiculo);
        }).catch((err) => {
          reject(err);
        });
      });
    });
  });
};

var parseResult = function(input) {
  return new Promise((resolve, reject) => {
    parseString(input, (err, result) => {

      var dados = result['soap:Envelope']['soap:Body'][0]['ns2:getStatusResponse'][0]["return"][0];
      if (err || !dados.situacao) {
        return reject('Parse ' + err);
      }

      dados = {
        situacao: dados.situacao[0],
        modelo: dados.modelo[0],
        marca: dados.marca[0],
        cor: dados.cor[0],
        ano: dados.ano[0],
        uf: dados.uf[0],
        municipio: dados.municipio[0],
        chassi: dados.chassi[0]
      };
      resolve(dados);
    });
  });
};

module.exports.search = searchSinesp;
