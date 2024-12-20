// Variabili principali
const videoElement = document.getElementById('video');
const barcodeResultElement = document.getElementById('barcode-result');
const latitudeElement = document.getElementById('latitude');
const longitudeElement = document.getElementById('longitude');
const accuracyElement = document.getElementById('accuracy');
const altitudeElement = document.getElementById('altitude');
const timestampElement = document.getElementById('timestamp');
const bearingElement = document.getElementById('bearing');
const speedElement = document.getElementById('speed');
const postDataElement = document.getElementById('post-data');
const responseElement = document.getElementById('server-response');
const startScanButton = document.getElementById('start-scan');
const scanLineElement = document.getElementById('scan-line');

// Funzione per ottenere il timestamp GPS in formato ISO 8601
function getGPSTimestamp(position) {
  const date = new Date(position.timestamp);
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const hours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
  const minutes = String(Math.abs(offset) % 60).padStart(2, '0');
  const milliseconds = String(Math.floor(date.getMilliseconds() / 10)).padStart(2, '0');
  const isoString = date.toISOString().replace(/\.\d{3}Z$/, '');
  return `${isoString}.${milliseconds}${sign}${hours}:${minutes}`;
}

// Funzione per ottenere le coordinate GPS
function getGPSLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((position) => {
      const coords = position.coords;
      latitudeElement.textContent = coords.latitude;
      longitudeElement.textContent = coords.longitude;
      accuracyElement.textContent = coords.accuracy + ' meters';
      altitudeElement.textContent = coords.altitude || 'Not available';
      timestampElement.textContent = getGPSTimestamp(position);
      bearingElement.textContent = coords.heading || 'Not available';
      speedElement.textContent = coords.speed || 'Not available';

      // Inviare i dati al server
      postDataToServer(coords, getGPSTimestamp(position));
    }, (error) => {
      console.error('Error getting location', error);
    });
  } else {
    console.error('Geolocation not supported');
  }
}

function postDataToServer(lat, lon, accuracy, altitude, bearing, speed, barcode, timestamp) {
  const data = new URLSearchParams();
  data.append('nome_disp', "ONL00");
  data.append('codice_disp', "0000");
  data.append('stato', "10");
  data.append('barcode', barcode);
  data.append('lat', lat);
  data.append('lon', lon);
  data.append('accuratezza', accuracy);
  data.append('data', timestamp);
  data.append('tag', "test_online");
  data.append('altitudine', altitude);
  data.append('bearing', bearing);
  data.append('velocita', speed);

  // Effettua la chiamata POST
  axios.post('https://gips.xyz/incoming/in_post.php', data)
    .then(response => {
      console.log('Dati inviati con successo:', response.data);
      // Mostra la risposta del server nel footer
      responseElement.textContent = JSON.stringify(response.data);
    })
    .catch(error => {
      console.error('Errore durante l\'invio dei dati:', error.response ? error.response.data : error.message);
      // Mostra l'errore del server nel footer
      responseElement.textContent = error.response ? JSON.stringify(error.response.data) : error.message;
    });
}


  postDataElement.textContent = data.toString();

  axios.post('https://gips.xyz/incoming/in_post.php', data)
    .then(response => {
      responseElement.textContent = JSON.stringify(response.data);
    })
    .catch(error => {
      responseElement.textContent = error.message;
    });
}

// Funzione per avviare la scansione
function startBarcodeScan() {
  videoElement.style.display = 'block';
  scanLineElement.style.display = 'block';

  const constraints = {
    video: {
      facingMode: { exact: "environment" },
      zoom: true,
      advanced: [{ focusMode: "continuous" }]
    }
  };

  navigator.mediaDevices.getUserMedia(constraints)
    .then((stream) => {
      videoElement.srcObject = stream;
      videoElement.play();
      const codeReader = new ZXing.BrowserMultiFormatReader();
      codeReader.decodeOnceFromStream(stream, videoElement)
        .then((result) => {
          barcodeResultElement.textContent = result.text;
          videoElement.style.display = 'none';
          scanLineElement.style.display = 'none';
          stream.getTracks().forEach(track => track.stop());
          getGPSLocation();
        })
        .catch(err => console.error('Error scanning barcode', err));
    })
    .catch(err => console.error('Error accessing camera', err));
}

// Event listener
startScanButton.addEventListener('click', startBarcodeScan);
