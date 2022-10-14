//Přidání služeb
const { spawn } = require("child_process");
const http = require("/Maturita/node_modules/express");
const io = require("/Maturita/node_modules/socket.io");
const sensor = require("/home/pi/node_modules/node-dht-sensor").promises;
const PiGpio = require("/Maturita/node_modules/pigpio").Gpio;
const Gpio = require("/Maturita/node_modules/onoff").Gpio;
//Přídání pinů (pomocí knihovny onoff)
const predsin = new Gpio(19, 'out');
const garaz = new Gpio(13, 'out');
const kuchyn = new Gpio(6, 'out');
const obyvak = new Gpio(17, 'out');
const jidelna = new Gpio(12, 'out');
const koupelna = new Gpio(24, 'out');
const pokojM = new Gpio(25, 'out');
const koupelnaH = new Gpio(23, 'out');
const loznice = new Gpio(9, 'out');
//Přidání pinů (knihova piGpio)
const modra = new PiGpio(27, {mode: PiGpio.OUTPUT});
const zelena = new PiGpio(11, {mode: PiGpio.OUTPUT});
const cervena = new PiGpio(10, {mode: PiGpio.OUTPUT});
//Proměnné (error / sumcheck)
var puvodniHodnota = 0;
var modraHodnota = 0;
var zelenaHodnota = 0;
var cervenaHodnota =  0;
var koupelnaLightValue = koupelna.readSync();
var jidelnaLightValue = jidelna.readSync();
var obyvakLightValue = obyvak.readSync();
var kuchynLightValue = kuchyn.readSync();
var predsinLightValue = predsin.readSync();
var garazLightValue = garaz.readSync();
var pokojMLightValue = pokojM.readSync(); 
var koupelnaHLightValue = koupelnaH.readSync();
var lozniceLightValue = loznice.readSync();

//Definuji port
const port = 8080;
const app = http();
//Zapínám službu
const server = app.listen(port, function(){
    console.log("Služba běží na adrese: http://192.168.25.1:" + port);
});
app.use(http.static("public"));

const socket = io(server);
socket.listen(8081);

async function exec() {
  const res = await sensor.read(11, 5);
  socket.emit('temp',
    `${res.temperature}`);
}  

  socket.on('connection', function(socket){
  console.log("Navázáno socketové spojení");
  //exec();
  //setInterval(exec, 5000);
  socket.on('giveStatus',function(){
    socket.emit('getStatus', koupelnaLightValue, jidelnaLightValue, obyvakLightValue, kuchynLightValue, predsinLightValue, garazLightValue);
  });
  socket.on('predsin',function(data){
    predsinLightValue = data;
    predsin.writeSync(predsinLightValue);
    console.log("Předsíň - " + data)
  });
  socket.on('garaz', function(data){
    garazLightValue = data;
    garaz.writeSync(garazLightValue);
    console.log("Garáž - " + data);
  });
  socket.on('kuchyn', function(data){
    kuchynLightValue = data;
    kuchyn.writeSync(kuchynLightValue);
    console.log("Kuchyň - " + data);
  });
  socket.on('obyvak', function(data){
    obyvakLightValue = data;
    obyvak.writeSync(obyvakLightValue);
    console.log("Obývák - " + data);
  });
  socket.on('jidelna', function(data){
    jidelnaLightValue = data;
    jidelna.writeSync(jidelnaLightValue);
    console.log("Jídelní kout - " + data);
  });
  socket.on('koupelna', function(data){
    koupelnaLightValue = data;
    koupelna.writeSync(koupelnaLightValue);
    console.log("Koupelna - " + data);
  });
  socket.on('pokojM', function(data){
    pokojMLightValue = data;
    pokojM.writeSync(pokojMLightValue);
    console.log("Marečkův pokoj - " + data);
  });
  socket.on('koupelnaH', function(data){
    koupelnaHLightValue = data;
    koupelnaH.writeSync(koupelnaHLightValue);
    console.log("Horní koupelna - " + data);
  });
  socket.on('loznice', function(data){
    lozniceLightValue = data;
    loznice.writeSync(lozniceLightValue);
    console.log("Ložnice - " + data);
  });
  socket.on('rgbLED', function(data){
    cervena.pwmWrite(255 - data.red);
    modra.pwmWrite(255 - data.blue);
    zelena.pwmWrite(255 - data.green);
  });
  socket.on('garazMotor', function(data){
    var hodnota = data
    if(hodnota > puvodniHodnota){
      var otocka = hodnota - puvodniHodnota;
      var bool = False; //True - Zavírání, False - Otvírání
    } 
    if(hodnota < puvodniHodnota){
      var otocka = puvodniHodnota - hodnota;
      var bool = True;
    }
    const python = spawn("python", ['public/stepMotor.py', otocka, bool]);
    python.stdout.on('data', function (data, bool) {
      console.log('Pipe data from python script ...');
      dataToSend = data.toString();
      python.on('close', (code) => {
        console.log(`child process close all stdio with code ${code}`);
      socket.emit('garazNmr', data); 
      });
    });
    socket.on('vanoce', function(dur){
      const python = spawn("python", ['public/vanoce.py', dur]);
      python.stdout.on('data', function (data, bool) {
        console.log('Pipe data from python script ...');
        dataToSend = data.toString();
        python.on('close', (code) => {
          console.log(`child process close all stdio with code ${code}`);
        });
      })
    });
    socket.on('alarm', function(dur){
      const python = spawn("python", ['public/alarm.py', dur]);
      python.stdout.on('data', function (data, bool) {
        console.log('Pipe data from python script ...');
        dataToSend = data.toString();
        python.on('close', (code) => {
          console.log(`child process close all stdio with code ${code}`);
          });
        });     
      });
  });
});
