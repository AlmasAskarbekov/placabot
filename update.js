var Sigo = require('./lib/sigo.js');
Sigo.getUpdates().then((success)=>{
  console.log(success);
}).catch((error) => {
  console.warn(error);
});
