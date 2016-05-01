var request = require('request');

var buildResult = function(veiculo) {
  if (veiculo.boletim) {
    veiculo.situacao = "Com restrição no Acre\n" +
    "BO " + veiculo.boletim + " - " + formatData(veiculo.data) + "\n";
  }

  return formatPlaca(veiculo.placa) + "\n" +
  veiculo.modelo + ", " +
  veiculo.cor + ", " +
  veiculo.ano + "\n" +
  veiculo.municipio + " - " + veiculo.uf + "\n" +
  'Chassi: ' + veiculo.chassi + "\n" +
  (veiculo.situacao || '');
};

var merge = function(placa, sigo, sinesp) {
  if (!sigo) {
    sigo = {};
  }
  var veiculo = {
    boletim: sigo.boletim || null,
    regional: sigo.regional || null,
    placa: placa,
    municipio: sinesp.municipio,
    uf: sinesp.uf,
    modelo: sinesp.modelo,
    cor: sinesp.cor,
    ano: sinesp.ano,
    chassi: sinesp.chassi,
    situacao: sinesp.situacao,
    data: sigo.data || null
  };
  return veiculo;
};

var formatData = function(data) {
  var date = new Date(data),
  month = date.getUTCMonth() > 8 ? date.getUTCMonth() + 1 : '0' + (date.getUTCMonth() + 1),
  day = date.getUTCDate() > 9 ? date.getUTCDate() : '0' + date.getUTCDate();

  return day + "/" + month + "/" + date.getFullYear();
};

var formatPlaca = function(placa) {
  return placa.substr(0, 3) + '-' + placa.substr(3, 6);
};

function transcript(audio, options) {
  const baseurl = 'https://www.google.com/speech-api/full-duplex/v1';
  var pair = parseInt(Math.random() * Math.pow(2, 32)).toString(16),
      download = `${baseurl}/down?pair=${pair}&key=${options.api_key}`,
      upload = `${baseurl}/up?key=${options.api_key}&pair=${pair}&lang=${options.language}&client=chromium&interim&continuous&pfilter=0&output=json`;

  return new Promise((resolve, reject) => {
    request.post(upload, {
      body: audio,
      timeout: 10000,
      headers: {
        'Content-Type': `${options.type}; rate=${options.rate}`,
        'Transfer-Encoding': 'chunked'
      }
    }, () => {});

    request(download, {
      timeout: 10000
    }, (err, response, body) => {
      if(err || response.statusCode != 200) reject(err);
      try {
        var results = body.split('\n'),
        last_result = JSON.parse(results[results.length - 2]);
        resolve(last_result.result[0].alternative[0].transcript);
      }catch(error) {
        reject('Falha na transcrição do áudio');
      }
    });
  });
}

var isInt = function isInt(n){
    return Number(n) === n && n % 1 === 0;
};

var papaMike = function(word, idx, words){
  switch (word) {
    case 'um': word = 1;break;
    case 'primeiro': word = 1; break;
    case 'dois': word = 2; break;
    case 'segundo': word = 2; break;
    case 'três': word = 3; break;
    case 'terceiro': word = 3; break;
    case 'quatro': word = 4; break;
    case 'quarto': word = 4; break;
    case 'cinco': word = 5; break;
    case 'quinto': word = 5; break;
    case 'seis': word = 6; break;
    case 'sexto': word = 6; break;
    case 'sétimo': word = 7; break;
    case 'sete': word = 7; break;
    case 'oito': word = 8; break;
    case 'oitavo': word = 8; break;
    case 'nove': word = 9; break;
    case 'nono': word = 9; break;
    case 'zero': word = 0; break;
    case 'negativo': word = 0; break;
    case 'dobrado': word = papaMike(words[idx-1]); break;
  }
  return word;
};


module.exports = {
  buildResult: buildResult,
  formatData: formatData,
  formatPlaca: formatPlaca,
  merge: merge,
  transcript: transcript,
  isInt: isInt,
  papaMike: papaMike
};
