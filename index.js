var TelegramBot = require('node-telegram-bot-api'),
  request = require('request'),
  spawn = require('child_process').spawn,
  Veiculo = require('./lib/veiculo.js'),
  Usuario = require('./lib/usuario.js'),
  Sinesp = require('./lib/sinesp.js');
  util = require('./lib/util.js');

const token = '151494330:AAGoVTTIUCv4zjNn9Hx2kCjr1HuIMxvV2Dw',
      url = `https://a84573e3.ngrok.io/bot/${token}`;

var bot = new TelegramBot(token, {webHook: {port: process.env.PORT || 8080}});
bot.setWebHook(url);

// Start
bot.onText(/\/start$/, (msg) => {
  var fromId = msg.chat.id;
  bot.sendMessage(fromId, 'Qual a placa do veículo?');
});

// CheckPlaca
bot.onText(/^[A-z]{3}\s*?-?\s*?\d{4}$/, (msg, match) => {
  var fromId = msg.chat.id,
    placa = match[0].replace(/[\s-]/, "").toUpperCase();

  searchPlaca(placa).then((veiculo) => {
    var message = `<pre>${ util.buildResult(veiculo) }</pre>`;
    bot.sendMessage(fromId, message, {
      parse_mode: 'HTML'
    });
  }).catch((err) => {
    console.log('CheckPlaca ' + err);
    bot.sendMessage(fromId, 'Não foi possível consultar');
  });
});

// List
bot.onText(/\/lista?$/, (msg) => {
  var fromId = msg.chat.id;
  var date;

  Veiculo.find().sort({
      'data': -1
    })
    .limit(20)
    .exec(function(err, veiculos) {
      if (err) {
        return;
      }
      var message = 'Últimos veículos:\n';
      veiculos.forEach((veiculo) => {
        message += util.formatPlaca(veiculo.placa) + " - " + util.formatData(veiculo.data) + "\n";
      });
      bot.sendMessage(fromId, "<pre>" + message + "</pre>", {
        parse_mode: 'HTML'
      });
    });
});

// Recuperados
bot.onText(/\/recuperados$/, (msg) => {
  var fromId = msg.chat.id;

  var twentyMinutesLater = new Date();
      twentyMinutesLater.setMinutes(twentyMinutesLater.getMinutes() - 20);

  Veiculo.find({
      "updatedAt": {
        $lte: twentyMinutesLater
      },
      "boletim": {
        $ne: null
      }
    }).sort({
      'data': -1
    })
    .limit(20)
    .exec(function(err, veiculos) {
      if (err) {
        return;
      }
      var message = 'Recuperados:\n';
      veiculos.forEach((veiculo) => {
        message += util.formatPlaca(veiculo.placa) + " - " + util.formatData(veiculo.data) + "\n";
      });
      bot.sendMessage(fromId, "<pre>" + message + "</pre>", {
        parse_mode: 'HTML'
      });
    });
});

bot.on('voice', (msg) => {
  var fromId = msg.chat.id;

  if (msg.voice.duration > 15) return;
  var self = this;
  bot.getFileLink(msg.voice.file_id).then((link) => {

    var ffmpeg = spawn('ffmpeg', ['-i', link, '-f', 'flac', '-ar', '16000', '-']);
    var stdout = [];

    ffmpeg.stdout.on('data', function(data) {
      stdout.push(data);
    });

    ffmpeg.on('exit', function(code) {
      var newBuffer = Buffer.concat(stdout);
      var speech = util.transcript(newBuffer, {
        type: 'audio/x-flac',
        rate: 16000,
        api_key: 'AIzaSyDg7Jchpcd3JSytvbOGKhIuP8ItQwjRork',
        language: 'pt-br'
      }).then((translation) => {
        var words = translation.split(" ");
            placa = "";
        console.log(translation);

        words.forEach((word, idx) => {
          word = util.papaMike(word,idx,words);
          placa += util.isInt(parseInt(word)) ? word : word.charAt(0);

        });
        console.log(placa);
        searchPlaca(placa).then((veiculo) => {
          var message = `<pre>${ util.buildResult(veiculo) }</pre>`;
          bot.sendMessage(fromId, message, {
            parse_mode: 'HTML'
          });
        }).catch((err) => {
          console.log('CheckPlaca ' + err);
          bot.sendMessage(fromId, 'Não foi possível consultar: ' + placa);
        });

      }).catch((error) => {
        console.warn('stt:', error);
      });
    });
  });
});

// Inline
bot.on('inline_query', (inline_query) => {

  if (!/^[A-z]{3}\s*?-?\s*?\d{4}$/.test(inline_query.query)) {
    return;
  }
  var placa = inline_query.query.replace(/[\s-]/, "").toUpperCase();

  searchPlaca(placa).then((veiculo) => {
    var message = util.buildResult(veiculo),
      results = [{
        type: 'article',
        id: placa,
        title: veiculo.modelo + ', ' + veiculo.cor,
        message_text: message
      }];
    bot.answerInlineQuery(inline_query.id, results);
  });
});

// Adduser
bot.onText(/\/adduser (\d+) (\w+)$/, (msg, match) => {
  var fromId = msg.chat.id;

  Usuario.find({
    telegram_id: fromId,
    type: 'admin'
  }, (err, result) =>{

    if(!result)
      return bot.sendMessage(fromId, 'Desculpa, sem permissão para cadastrar');

    var user = {
      nome: msg.from.first_name + ' ' + msg.from.last_name,
      telegram_id: match[1],
      type: match[2]
    };

    Usuario.create(user,(err,result) => {
      if(err)
        return bot.sendMessage(fromId, 'Problema ao cadastrar');
      bot.sendMessage(fromId, 'Usuário cadastrado com sucesso');
    });
  });
});

// DelUser
bot.onText(/\/deluser (\d+)$/, (msg, match) => {
  var fromId = msg.chat.id;

  Usuario.find({
    telegram_id: fromId,
    type: 'admin'
  }, (err, result) =>{

    if(!result)
      return bot.sendMessage(fromId, 'Desculpa, sem permissão para remover');

    Usuario.remove({
      telegram_id: match[1]
    },(err,result) => {
      if(err)
        return bot.sendMessage(fromId, 'Problema ao apagar');
      bot.sendMessage(fromId, 'Usuário apagado com sucesso');
    });
  });
});


bot.onText(/\/meucodigo$/, (msg) => {
  var fromId = msg.chat.id;
  bot.sendMessage(fromId, msg.from.id);
});

function searchPlaca(placa) {
  return new Promise((resolve, reject) => {
    Veiculo.searchLocal(placa).then((veiculo) => {

      Sinesp.search(placa).then((sinesp) => {
        veiculo = util.merge(placa, veiculo, sinesp);
        Veiculo.saveLocal(veiculo);
        return resolve(veiculo);

      }).catch((err) => {
        if (veiculo) {
          return resolve(veiculo);
        }
        reject('Sinesp ' + err);
      });

    }).catch((err) => {
      Sinesp.search(placa).then((sinesp) => {
        veiculo = util.merge(placa, {}, sinesp);
        Veiculo.saveLocal(veiculo);
        resolve(veiculo);
      }).catch((err) => {
        reject('Local and Sinesp ' + err);
      });
    });
  });
}
