// app.js

// Lijst voor het bijhouden van verbonden apparaten
let allheartRateData = []; // Array om de gegevens in op te slaan = [];  // Array om de gegevens in op te slaan
let shownDevices = []; // {characteristic: null, connected: false, device: {…}}

let missieBezig = false; // Variabele om bij te houden of de missie bezig is

let huidigePagina = 'null';

const teamAssignments = [
  { team: 1, player: 1, device: null, rustHartslag: 75 },
  { team: 2, player: 1, device: null, rustHartslag: 75 },
  { team: 1, player: 2, device: null, rustHartslag: 75 },
  { team: 2, player: 2, device: null, rustHartslag: 75 },
  { team: 1, player: 3, device: null, rustHartslag: 75 },
  { team: 2, player: 3, device: null, rustHartslag: 75 },
  { team: 1, player: 4, device: null, rustHartslag: 75 },
  { team: 2, player: 4, device: null, rustHartslag: 75 },
]; // Array voor teamindeling

let rondeWinnaars = []; // Array voor het bijhouden van de winnaars per ronde
// let rondeWinnaars = [
//   { ronde: 1, winnaar: 1 },
//   { ronde: 2, winnaar: 2 },
//   { ronde: 3, winnaar: 1 },
// ];
let huidigeRonde = 1;

let isHartslagVerlagen = false;
let startTijd = 45;
let isPauze = false;
let hartslagVerschil = 10;
let rondeTijden = [];
let straftijdVerhoging = 10;

const teams = [
  {
    id: 1,
    resterendeTijd: startTijd,
    totaleStraftijd: 0,
    totaleTijd: startTijd,
    spelers: [],
    timerInterval: null,
    timerGestopt: false,
  },
  {
    id: 2,
    resterendeTijd: startTijd,
    totaleStraftijd: 0,
    totaleTijd: startTijd,
    spelers: [],
    timerInterval: null,
    timerGestopt: false,
  },
];

//#region Timer

function startSpel() {
  // resetSpel();
  // console.log(`Spel gestart voor ronde ${huidigeRonde}`);
  missieBezig = true;
  teams.forEach((team) => {
    startTimer(team); // Start timers voor beide teams
  });
}

function resetSpel() {
  if (isHartslagVerlagen === true) {
    startTijd = 10;
  } else {
    startTijd = 45;
  }
  teams.forEach((team) => {
    team.resterendeTijd = startTijd;
    team.totaleStraftijd = 0;
    team.totaleTijd = startTijd;
    team.timerGestopt = false;
    if (team.timerInterval) {
      clearInterval(team.timerInterval);
      team.timerInterval = null;
    }
    werkWeergaveBij(team); // Werk de UI bij
  });
  isPauze = false;
  missieBezig = false;
  // console.log(`Ronde ${huidigeRonde} gestart.`);
}

// Functie om de hartslag te controleren
function controleerHartslag(team) {
  let isHartslagFout = team.spelers.some((speler) => {
    return (
      speler.hartslag === 0 ||
      (isHartslagVerlagen
        ? speler.hartslag > speler.rustHartslag
        : speler.hartslag < speler.rustHartslag + hartslagVerschil)
    );
  });

  if (isHartslagFout) {
    team.resterendeTijd += 1;
    team.totaleTijd += 1;
  }
}

// Functie om de timer voor een team te starten
function startTimer(team) {
  // Controleer of de timer al actief is voordat je een nieuwe start
  if (team.timerInterval) return;

  team.timerInterval = setInterval(() => {
    if (team.resterendeTijd > 0) {
      team.resterendeTijd--;
      controleerHartslag(team);
    } else {
      stopTimer(team);
    }
    werkWeergaveBij(team);
  }, 1000);
}

// Functie om de timer voor een team te stoppen
function stopTimer(team) {
  if (team.timerInterval) {
    clearInterval(team.timerInterval);
    team.timerInterval = null;
    team.timerGestopt = true;

    const otherTeam = teams.find((t) => t.id !== team.id);
    if (!otherTeam.timerGestopt) {
      clearInterval(otherTeam.timerInterval);
      otherTeam.timerInterval = null;
      otherTeam.timerGestopt = true;
      otherTeam.resterendeTijd = 0;
      werkWeergaveBij(otherTeam);
    }

    team.resterendeTijd = 0;
    werkWeergaveBij(team);
    checkTimersStopped();
  }
}

// Functie om de HTML-weergave bij te werken
function werkWeergaveBij(team) {
  let elementRest = document.getElementById(`resterendeTijdTeam${team.id}`);
  if (elementRest) {
    elementRest.textContent = team.resterendeTijd;
  }
  let elementTotaal = document.getElementById(`totaleStraftijdTeam${team.id}`);
  if (elementTotaal) {
    elementTotaal.textContent = team.totaleStraftijd;
  }
  const progressBar = document.getElementById(`myBar${team.id}`);
  const progressPercentage =
    (team.resterendeTijd / (startTijd + team.totaleStraftijd)) * 100;
  if (progressBar) {
    progressBar.style.width = `${progressPercentage}%`;
  }
}

// Functie om timers te pauzeren of hervatten
function togglePauze() {
  if (isPauze) {
    teams.forEach((team) => {
      if (!team.timerInterval && team.resterendeTijd > 0) {
        startTimer(team);
      }
    });
    isPauze = false;
    let pauzeknop1 = document.getElementById('pauzeKnop');
    if (pauzeknop1) {
      pauzeknop1.innerHTML =
        '<span class="material-symbols-outlined">pause</span>';
    }
  } else {
    teams.forEach((team) => {
      if (team.timerInterval) {
        clearInterval(team.timerInterval);
        team.timerInterval = null;
      }
    });
    isPauze = true;
    let pauzeknop2 = document.getElementById('pauzeKnop');
    if (pauzeknop2) {
      pauzeknop2.innerHTML =
        '<span class="material-symbols-outlined">play_arrow</span>';
    }
  }
}

// Functie om van pagina te veranderen met vertraging
function eindigSpel() {
  setTimeout(() => {
    pageEndMission(huidigeRonde);
  }, 1500);
}

// Functie om de winnaar van een ronde op te slaan
function slaRondeWinnaarOp(winner) {
  rondeWinnaars.push({ ronde: huidigeRonde, winnaar: winner.id });
  // console.log(`Ronde ${huidigeRonde} gewonnen door Team ${winner.id}`);
}

// Functie om de winnaar te bepalen
function checkTimersStopped() {
  if (teams.every((team) => team.timerGestopt)) {
    if (teams[0].totaleTijd === teams[1].totaleTijd) {
      console.log(
        'Beide timers hebben dezelfde totaleTijd. Extra tijd toegevoegd.'
      );

      teams.forEach((team) => {
        team.resterendeTijd += 10;
        team.timerGestopt = false;
        werkWeergaveBij(team);
        clearInterval(team.timerInterval);
        startTimer(team);
      });
      // console.log('Beide teams hebben dezelfde totaleTijd! Extra 10 seconden toegevoegd.');
    } else {
      const winner = teams.reduce((prev, curr) =>
        prev.totaleTijd < curr.totaleTijd ? prev : curr
      );
      const loser = teams.find((team) => team !== winner);
      // console.log(`Team ${winner.id} heeft als eerste gestopt! Team ${loser.id} had de meeste straftijd.`);
      slaRondeWinnaarOp(winner);
      rondeTijden.push({ ronde: huidigeRonde, tijd: winner.totaleTijd });
      eindigSpel();
    }
  } else {
    const winner = teams.find((team) => team.timerGestopt);
    const loser = teams.find((team) => team !== winner);
    // console.log(`Team ${winner.id} heeft gewonnen! Team ${loser.id} had het meeste totaleTijd.`);

    slaRondeWinnaarOp(winner);
    rondeTijden.push({ ronde: huidigeRonde, tijd: winner.totaleTijd });
    eindigSpel();
  }
}

// Functie voor het toevoegen van straftijd
function voegStraftijdToe(team) {
  team.resterendeTijd += straftijdVerhoging;
  team.totaleStraftijd += straftijdVerhoging;
  team.totaleTijd += straftijdVerhoging;
  werkWeergaveBij(team);
}

//#endregion Timer

//#region Update Map Colors
// Functie om de kleur van de map aan te passen
function updatePathColors() {
  // Ingevulde rondes verwerken
  rondeWinnaars.forEach((item) => {
    const pathId = `path${item.ronde}`; // path id's = path1, path2, ..., path5
    const path = document.getElementById(pathId);
    if (path) {
      if (item.winnaar === 1) {
        path.style.setProperty('fill', 'var(--pink-500)');
      } else if (item.winnaar === 2) {
        path.style.setProperty('fill', 'var(--cyan-500)');
      }
    }
  });

  // Niet ingevulde rondes verwerken
  for (let i = 1; i <= 5; i++) {
    const pathId = `path${i}`;
    const path = document.getElementById(pathId);

    if (path && !rondeWinnaars.some((item) => item.ronde === i)) {
      path.style.setProperty('fill', 'var(--gray-700)');
    }
  }
}

// Functie om de huidige ronde te laten flitsen op de map
function flitsHuidigeRonde(huidigeRonde) {
  const pathId = `path${huidigeRonde}`;
  const path = document.getElementById(pathId);

  if (path) {
    let highlighted = false;

    setInterval(() => {
      if (highlighted) {
        path.style.setProperty('fill', 'var(--gray-700)'); // Terug naar oorspronkelijke kleur
      } else {
        path.style.setProperty('fill', 'var(--violet-500)'); // Paars flitsen
      }
      highlighted = !highlighted;
    }, 750);
  }
}

// Functie om de laatste ronde geanimeerd in te kleuren
function animateLastRound(rondeWinnaars, huidigeRonde) {
  const laatsteRonde = rondeWinnaars.find(
    (item) => item.ronde === huidigeRonde
  );

  if (laatsteRonde) {
    const pathId = `path${laatsteRonde.ronde}`;
    const path = document.getElementById(pathId);

    if (path) {
      path.style.setProperty('fill', 'var(--gray-700)');
      setTimeout(() => {
        path.style.transition = 'fill 1s ease';

        // Kleur aanpassen
        if (laatsteRonde.winnaar === 1) {
          path.style.setProperty('fill', 'var(--pink-500)');
        } else if (laatsteRonde.winnaar === 2) {
          path.style.setProperty('fill', 'var(--cyan-500)');
        }

        // Verwijder de transitie na de animatie
        setTimeout(() => {
          path.style.transition = ''; // Reset naar oorspronkelijke staat
        }, 1000); // Duur van de transitie
      }, 1000); // Wacht voordat de animatie start
    }
  }
}

//#endregion Update Map Colors

//#region Team Position
function addTeamAssignment(givenDevice) {
  // console.warn('Adding team assignment for', givenDevice);
  // Zoek of het apparaat al een toewijzing heeft
  const existingAssignment = teamAssignments.find(
    (a) => a.device?.id === givenDevice.id
  );
  // console.warn('Existing assignment:', existingAssignment);
  // console.warn('Team assignments:', teamAssignments);

  if (existingAssignment) {
    console.log('Device already assigned:', givenDevice, existingAssignment);
    return;
  }

  // Zoek een beschikbare positie in de teamAssignments array en wijs het apparaat toe
  const firstNullDevice = teamAssignments.find((item) => item.device === null);
  if (firstNullDevice) {
    firstNullDevice.device = givenDevice;
    updateLijstGameSpelers();
    // console.log("Team assignments:", teamAssignments);
  } else {
    console.warn('No available team assignment for device:', givenDevice);
    alert('No available team assignment, max 8 devices allowed');
  }
}

async function removeTeamAssignment(device) {
  try {
    // console.log("Removing team assignment for", device);
    if (device) {
      const index = teamAssignments.findIndex(
        (a) => a && a.device && a.device.name === device.name
      );

      // console.log('Index:', index);
      if (index > -1) {
        teamAssignments[index].device = null;
        teamAssignments[index].rustHartslag = 75;
        // console.log("teamAssignments:", teamAssignments);
      }
    } else {
      console.warn('Device has no assignment:', device);
    }
  } catch (error) {
    console.error('Error removing team assignment:', error);
  }
}
//#endregion Team Position

//#region First Connect
async function connectPolarHeartRateMonitor() {
  try {
    console.log('Requesting Bluetooth Device...');

    const device = await navigator.bluetooth.requestDevice({
      filters: [{ services: ['heart_rate'] }],
      optionalServices: ['battery_service'],
    });

    console.log('Found device:', device.name);

    /// Controleer of het apparaat al verbonden is
    if (shownDevices.some((d) => d.device.id === device.id && d.connected)) {
      console.log('Device already connected:', device.name);
      alert(`${device.name} is already connected!`);
      return;
    }

    // Indien het apparaat nog niet in de lijst staat, voeg het toe
    if (!shownDevices.some((d) => d.device.id === device.id)) {
      shownDevices.push({
        device: {
          id: device.id,
          name: device.name,
          gatt: device.gatt, // GATT server object moet later gevuld worden
        },
        characteristic: device.characteristic, // Hartslagkenmerk moet later ingesteld worden
        connected: false, // Voeg de 'connected' status toe
      });
      // console.log('shownDevices:', shownDevices);
    }

    // Verbind met het apparaat en start notificaties (hartslag en batterijniveau)
    await connectToDevice(device);

    // Voeg disconnect event listener toe
    device.addEventListener('gattserverdisconnected', () => {
      handleDisconnectDevice(device);
    });
  } catch (error) {
    console.error('Error connecting to Polar Heart Rate Monitor:', error);
  }
}

//#endregion First Connect

//#region Disconnect Logic
async function handleDisconnectDevice(device, manualDisconnect = false) {
  // if (manualDisconnect) {
  //   console.log("Manual disconnect initiated.");
  // } else {
  //   console.log("Disconnect triggered by event.");
  // }
  // console.log("Disconnecting from", device);

  try {
    // Zoek het apparaat in de shownDevices lijst
    const selectedDevice = shownDevices.find(
      (d) => d.device.name === device.name
    );

    if (selectedDevice.isDisconnecting) {
      // console.warn(`Device ${selectedDevice.device.name} is already disconnecting.`);
      return;
    }

    // Markeer het apparaat als 'disconnecting'
    selectedDevice.isDisconnecting = true;

    // Markeer het apparaat als ontkoppeld
    // console.log("Disconnecting from", device);
    // console.log("Selected device:", selectedDevice);
    if (selectedDevice) {
      selectedDevice.connected = false;
    }

    try {
      if (device.gatt.connected) {
        if (selectedDevice.characteristic) {
          try {
            await selectedDevice.characteristic.stopNotifications();
            // console.log("Notifications stopped for", device.name);
          } catch (error) {
            console.warn('Failed to stop notifications:', error);
          }
        }

        try {
          await device.gatt.disconnect();
          console.log('Disconnected from', device.name);
        } catch (error) {
          console.warn('Failed to disconnect:', error);
        }
      } else {
        console.log('Device already disconnected:', device.name);
      }
    } catch (error) {
      console.error('Error disconnecting:', error);
    }

    // Werk de UI bij, afhankelijk van het type disconnect
    const listItem = document.querySelector(
      `#${generateSafeDeviceId(device.name)}`
    );
    if (listItem) {
      listItem.classList.add('disconnected');
      const status = listItem.querySelector('.device-status');
      const heartrateValue = listItem.querySelector('.heartrate-value');
      const batteryValue = listItem.querySelector('.battery-value');
      const disconnectBtn = listItem.querySelector(
        '.c-deviceButton__disconnect'
      );

      if (status) {
        status.className = 'device-status c-deviceButton__disconnected';
        status.innerHTML = `<span class="material-symbols-outlined">
            bluetooth_disabled
        </span>`;
        // status.textContent = 'Disconnected';
      }
      if (heartrateValue) {
        heartrateValue.textContent = 'N/A';
      }
      if (batteryValue) {
        batteryValue.textContent = 'N/A';
      }
      if (disconnectBtn) {
        disconnectBtn.className = 'c-deviceButton__reconnect';
        disconnectBtn.innerHTML = `<span class="material-symbols-outlined">
                bluetooth
            </span>`;
        disconnectBtn.onclick = async () => {
          // Hier kun je handmatig opnieuw verbinden, indien nodig
          console.log('(Re)connecting to', device.name);
          await connectToDevice(device);
        };
      }
    }

    updateConnectionStatus();

    if (!manualDisconnect) {
      try {
        console.log('Reconnecting to', device.name);
        await connectToDevice(device);
      } catch (error) {
        console.error('Error reconnecting:', error);
      }
    }
    selectedDevice.isDisconnecting = false;
  } catch (error) {
    console.error(`Error disconnecting device ${device.name}:`, error);
  }
}
//#endregion Disconnect Logic

//#region Connection Logic

// Functie om verbinding te maken met een apparaat
async function connectToDevice(device) {
  console.log(`Verbinden met apparaat ${device.name}...`);
  // console.log("Device:", device);

  try {
    // Verbind met het apparaat, Connect to the device's GATT server
    const server = await device.gatt.connect();
    console.log('Verbonden met', device.name);

    // Stel de hartslagservice en battery service in en start notificaties
    const characteristic = await setupHeartRateService(server, device);
    const batteryLevel = await setupBatteryService(server, device);

    // console.log("Team assignments:", teamAssignments);

    // Update de UI en de devices lijst
    const shownDevice = shownDevices.find((d) => d.device.name === device.name);
    if (shownDevice) {
      shownDevice.connected = true; // Zet 'connected' op true wanneer verbonden
      shownDevice.characteristic = characteristic;
      shownDevice.isDisconnecting = false;
    }
    // console.log("Shown devices:", shownDevices);

    // Zoek een beschikbare positie
    addTeamAssignment(device);

    updateDevicesList(device, batteryLevel);
    updateConnectionStatus();

    console.log('Notifications started. Listening for heart rate data...');
  } catch (error) {
    console.error(`Fout bij verbinden met apparaat ${device.name}:`, error);
    alert('Failed to connect to device');
  }
}

//#endregion Connection Logic

//#region Data Opslaan
// Functie om hartslaggegevens op te slaan in een array
async function sendHeartRateToArray(deviceName, heartRate) {
  const timestamp = new Date().toISOString(); // Verkrijg de huidige tijd in ISO-formaat

  // Nieuwe lijn die je wilt toevoegen
  const newLine = {
    device: deviceName,
    value: heartRate,
    timestamp: timestamp,
  };

  // Voeg de nieuwe lijn toe aan de data
  if (missieBezig) {
    allheartRateData.push(newLine);
  }
}
//#endregion Data Opslaan en Verzenden naar Server Logic

//#region UI Logic
// Functie om apparaten toe te voegen aan de lijstweergave

function updateDevicesList(device, batteryLevel = 'Unknown') {
  const devicesList = document.getElementById('devicesList');

  const existingItem = document.querySelector(
    `#${generateSafeDeviceId(device.name)}`
  );
  const timestamp = new Date().toLocaleTimeString();

  // Zoek de toewijzing voor het apparaat

  const assignment = teamAssignments.find(
    (a) => a && a.device && a.device.name === device.name
  );
  const assignmentText = assignment
    ? `Team ${assignment.team} - Player ${assignment.player}`
    : 'Unassigned'; // Toon 'Unassigned' als er geen toewijzing is

  // console.warn('Updating devices list:', device);
  let connectedButton = ``;
  let reconnectButton = ``;
  if (device.gatt.connected) {
    connectedButton = `
        <div class="device-status c-deviceButton__connect">
        <span class="material-symbols-outlined">
            bluetooth
        </span>
    </div>`;
    reconnectButton = `
        <button class="c-deviceButton__disconnect" type="button">
            <span class="material-symbols-outlined">
                bluetooth_disabled
            </span>
        </button>`;
  } else {
    connectedButton = `
    <button class="device-status c-deviceButton__disconnected" type="button">
        <span class="material-symbols-outlined">
            bluetooth_disabled
        </span>
    </button>`;
    reconnectButton = `
        <div class="c-deviceButton__reconnect">
            <span class="material-symbols-outlined">
                bluetooth
            </span>
        </div>`;
  }

  const deviceHTML = `
  <div class="col-6 c-deviceCard">
    
    <p class="">${device.name}</p>
    <h4 class="c-deviceCard__title"> ${assignmentText}</h4>
    ${connectedButton}
    <p>Hartslag: <span class="heartrate-value">0BPM</span></p>
    <p>
        <span class="material-symbols-outlined">battery_5_bar</span>
        <span class="battery-value">${batteryLevel}</span>
    </p>
    <p>Laatste Update: <span class="last-update"> ${timestamp}</span></p>
    <div class="c-deviceButton__container">
        ${reconnectButton}
        <button class="c-deviceButton__forget" type="button">
            <span class="material-symbols-outlined">
                delete
            </span>
        </button>
    </div>
  </div>
        `;

  // als het apparaat al bestaat, update de gegevens
  if (existingItem) {
    existingItem.classList.remove('disconnected');
    existingItem.innerHTML = deviceHTML;
    if (!device.gatt.connected) {
      existingItem.querySelector('.c-deviceButton__reconnect').onclick =
        async () => {
          console.log('Reconnecting to', device.name);

          await connectToDevice(device);
        };
    }
    setupDeviceButtons(existingItem, device.name);
    return;
  }

  // Maak een nieuw item aan voor het apparaat en voeg het toe aan de lijst als het nog niet bestaat
  const listItem = document.createElement('span');
  listItem.className = 'device-item';
  listItem.id = generateSafeDeviceId(device.name);
  listItem.innerHTML = deviceHTML;

  if (!device.gatt.connected) {
    listItem.querySelector('.c-deviceButton__reconnect').onclick = async () => {
      console.log('Reconnecting to', device.name);
      await connectToDevice(device);
    };
  }

  setupDeviceButtons(listItem, device.name);

  if (devicesList) {
    devicesList.appendChild(listItem);
  }
}

// Setup voor de knoppen in de UI
function setupDeviceButtons(listItem, deviceName) {
  const disconnectBtn = listItem.querySelector('.c-deviceButton__disconnect');
  const removeBtn = listItem.querySelector('.c-deviceButton__forget');

  if (disconnectBtn) {
    // Knop voor het handmatig ontkoppelen van een apparaat
    disconnectBtn.onclick = async () => {
      const device = shownDevices.find(
        (d) => d && d.device && d.device.name === deviceName
      );
      if (device) {
        try {
          await handleDisconnectDevice(device.device, true);
        } catch (error) {
          console.error('Error disconnecting:', error);
        }
      }
    };
  }

  if (removeBtn) {
    // Knop voor het verwijderen van een apparaat uit de lijst
    removeBtn.onclick = async () => {
      const teamDevice = teamAssignments.find(
        (a) => a && a.device && a.device.name === deviceName
      );
      if (teamDevice) {
        try {
          // Verwijder de toewijzing van het apparaat
          // console.log("Removing team assignment for", teamDevice.device.name);
          await removeTeamAssignment(teamDevice.device);
          // console.log("Team assignments:", teamAssignments);
        } catch (error) {
          console.error('Error removing team assignment:', error);
          // console.log("Team assignments:", teamAssignments);
        }
      }

      const device = shownDevices.find((d) => d.device.name === deviceName);
      if (device) {
        try {
          await handleDisconnectDevice(device.device, true);
        } catch (error) {
          console.error('Error disconnecting during remove:', error);
        }
      }
      try {
        // Verwijder het apparaat uit de lijst
        const index = shownDevices.findIndex(
          (d) => d.device.name === deviceName
        );
        if (index !== -1) {
          shownDevices.splice(index, 1);
        }
      } catch (error) {
        console.error('Error removing device from shown list:', error);
      }

      if (listItem) {
        listItem.remove();
      }
    };
  }
}

//#endregion UI Logic

//#region HulpFuncties

// Functie om scores van beide teams te berekenen
function berekenScores(rondeWinnaars) {
  let scoreTeam1 = 0;
  let scoreTeam2 = 0;

  rondeWinnaars.forEach((item) => {
    switch (item.winnaar) {
      case 1:
        scoreTeam1++;
        break;
      case 2:
        scoreTeam2++;
        break;
      default:
        console.warn(
          `Ongeldige winnaar in ronde ${item.ronde}: ${item.winnaar}`
        );
        break;
    }
  });

  return { team1: scoreTeam1, team2: scoreTeam2 };
}

// Functie om de connection status te updaten
function updateConnectionStatus() {
  const statusElement = document.getElementById('connectionStatus');
  const count = shownDevices.filter((device) => device.connected).length; // Alleen apparaten die verbonden zijn
  if (statusElement) {
    if (count === 0) {
      statusElement.textContent = 'Geen sensors geconnecteerd';
    } else if (count === 1) {
      statusElement.textContent = '1 sensor geconnecteerd';
    } else {
      statusElement.textContent = `${count} sensors geconnecteerd`;
    }
  }
}

// Helperfunctie om hartslag te parsen
function parseHeartRate(value) {
  const data = new DataView(value.buffer);
  let flags = data.getUint8(0);
  let heartRate;
  if (flags & 0x01) {
    heartRate = data.getUint16(1, true);
  } else {
    heartRate = data.getUint8(1);
  }
  return heartRate;
}

// Helper functie voor het genereren van veilige device IDs
function generateSafeDeviceId(deviceName) {
  return (
    'device-' +
    deviceName
      .toLowerCase()
      .replace(/[^\w]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
  );
}

// SERVICES

/**
 * Stelt de batterijservice in en retourneert het batterijniveau.
 * @param {BluetoothRemoteGATTServer} server - De GATT-server van het apparaat.
 * @param {BluetoothDevice} device - Het apparaat waarvoor de batterijservice wordt ingesteld.
 * @returns {Promise<string>} Het batterijniveau als string of 'Unknown' bij een fout.
 */
async function setupBatteryService(server, device) {
  try {
    // Haal de batterijservice op

    const batteryService = await server.getPrimaryService('battery_service');
    const batteryCharacteristic = await batteryService.getCharacteristic(
      'battery_level'
    );

    // Lees het batterijniveau
    const batteryValue = await batteryCharacteristic.readValue();
    const batteryLevel = `${batteryValue.getUint8(0)}%`;

    // Start notificaties en voeg een eventlistener toe voor batterij-updates
    await batteryCharacteristic.startNotifications();

    batteryCharacteristic.addEventListener(
      'characteristicvaluechanged',
      (event) => handleBatteryUpdate(event, device)
    );

    return batteryLevel; // Retourneer het batterijniveau
  } catch (error) {
    console.log('Battery service not available:', error);
    return 'Unknown'; // Retourneer 'Unknown' bij een fout
  }
}

// /**
//  * Stelt de hartslagservice in en start notificaties.
//  * @param {BluetoothRemoteGATTServer} server - De GATT-server van het apparaat.
//  * @param {string} deviceName - De naam van het apparaat.
//  * @returns {Promise<BluetoothRemoteGATTCharacteristic>} De hartslagkarakteristiek.
//  */
async function setupHeartRateService(server, device) {
  try {
    // Haal de hartslagservice op

    const service = await server.getPrimaryService('heart_rate');
    const characteristic = await service.getCharacteristic(
      'heart_rate_measurement'
    );
    // console.log('Heart Rate Measurement Characteristic:', characteristic);

    // Start notificaties en voeg een eventlistener toe
    await characteristic.startNotifications();
    characteristic.addEventListener('characteristicvaluechanged', (event) => {
      handleHeartRateNotification(event, device);
    });

    return characteristic; // Retourneer de karakteristiek
  } catch (error) {
    console.error(
      `Failed to set up heart rate service for ${device.name}:`,
      error
    );
    throw error; // Geef de fout door voor verdere verwerking
  }
}

// Functie om hartslagdata te verwerken
function handleHeartRateNotification(event, device) {
  const value = event.target.value;
  const heartRate = parseHeartRate(value);
  const timestamp = new Date().toLocaleTimeString();

  // console.log(`Heart Rate from ${device.name}:`, heartRate);
  const listItem = document.querySelector(
    `#${generateSafeDeviceId(device.name)}`
  );

  if (listItem) {
    const heartrateValue = listItem.querySelector('.heartrate-value');
    const lastUpdate = listItem.querySelector('.last-update');
    if (heartrateValue) {
      heartrateValue.textContent = `${heartRate} BPM`;
    }
    if (lastUpdate) {
      lastUpdate.textContent = timestamp;
    }
  }
  try {
    // Stuur de hartslag naar array
    sendHeartRateToArray(device.name, heartRate);
  } catch (error) {
    console.error('Fout bij het verzenden van hartslag naar de server:', error);
  }
  if (isMeasuring) {
    handleAverageHeartRateNotification(heartRate, device);
  }
  if (missieBezig) {
    teams.forEach((team) => {
      team.spelers.forEach((speler) => {
        if (speler.device.name === device.name) {
          speler.hartslag = heartRate;
          // console.warn('Hartslag van speler', speler.player, 'van team', team.id, 'is', speler.hartslag);
          let elementHartslag = document.getElementById(
            `hartslagSpeler${speler.player}Team${team.id}`
          );
          if (elementHartslag) {
            elementHartslag.innerHTML = `${speler.hartslag} bpm`;
            if (isHartslagVerlagen) {
              if (
                speler.hartslag > speler.rustHartslag ||
                speler.hartslag === 0
              ) {
                elementHartslag.innerHTML = `<span class="material-symbols-outlined c-leaderboard__counterIcon">warning</span> ${speler.hartslag} bpm`;
              }
            } else {
              if (
                speler.hartslag < speler.rustHartslag + hartslagVerschil ||
                speler.hartslag === 0
              ) {
                elementHartslag.innerHTML = `<span class="material-symbols-outlined c-leaderboard__counterIcon">warning</span> ${speler.hartslag} bpm`;
              }
            }
          }
        }
      });
    });
  }
}

// Functie om batterij updates te verwerken
function handleBatteryUpdate(event, device) {
  const value = event.target.value;
  const batteryLevel = value.getUint8(0) + '%';

  const listItem = document.querySelector(
    `#${generateSafeDeviceId(device.name)}`
  );
  if (listItem) {
    const batteryValue = listItem.querySelector('.battery-value');
    if (batteryValue) {
      batteryValue.textContent = batteryLevel;
    }
  }
}

//#endregion HulpFuncties

//#region Average heart rate
const heartRateData = {}; // Object om hartslagmetingen op te slaan
let isMeasuring = false; // Variabele om bij te houden of we aan het meten zijn

// Start of stop de simulatie voor alle apparaten
function toggleMeasurement(start) {
  isMeasuring = start;

  // console.log(start ? 'Meting gestart. Verzamel hartslagen...' : 'Meting gestopt. Bereken gemiddelden...');

  if (!start) calculateAndDisplayAverages();
}

// Verwerk hartslagnotificaties
function handleAverageHeartRateNotification(heartRate, device) {
  if (!isMeasuring || !device?.id) return;

  heartRateData[device.id] ??= []; // Initialiseer array als deze niet bestaat
  heartRateData[device.id].push(heartRate);

  // console.log(`Hartslag van ${device.name || device.id}: ${heartRate} BPM`);
}

// Bereken en toon de gemiddelde hartslag
function calculateAndDisplayAverages() {
  // const resultsContainer = document.querySelector('#results');
  // resultsContainer.innerHTML = ''; // Wis oude resultaten

  Object.entries(heartRateData).forEach(([deviceId, heartRates]) => {
    if (heartRates.length > 0) {
      const average =
        heartRates.reduce((sum, rate) => sum + rate, 0) / heartRates.length;

      const deviceName =
        shownDevices.find((d) => d.id === deviceId)?.name || deviceId;

      // resultsContainer.innerHTML += `
      //   <p>${deviceName}:
      //   Gemiddelde hartslag: ${average.toFixed(2)} BPM</p>`;

      teamAssignments.forEach((assignment) => {
        if (assignment.device && assignment.device.id === deviceId) {
          assignment.rustHartslag = parseInt(average.toFixed(0), 10);
        }
      });

      // console.log(`Gemiddelde rusthartslag voor apparaat ${deviceId}: ${average.toFixed(2)} BPM`);
    } else {
      console.log(`Geen data verzameld voor apparaat ${deviceId}.`);
    }
  });
}

//#endregion Average heart rate

//#region top 3 stats

// Creëer een object voor de hoogste hartslag per device
function getTop3HeartRateDevices() {
  try {
    // HOOGSTE HARTSLAG
    let highestHeartRatePerDevice = {};

    // Doorloop de gegevens en vind de hoogste hartslag per apparaat
    allheartRateData.forEach((data) => {
      if (
        !highestHeartRatePerDevice[data.device] ||
        data.value > highestHeartRatePerDevice[data.device]
      ) {
        highestHeartRatePerDevice[data.device] = data.value;
      }
    });

    // Zet het object om naar een array en sorteer deze op hoogste hartslag
    let sortedDevicesForHighest = Object.entries(highestHeartRatePerDevice)
      .sort((a, b) => b[1] - a[1]) // Sorteer op de hartslag (waarde)
      .slice(0, 3) // Haal de top 3 eruit
      .map(([device, value]) => ({ device, highestHeartRate: value })); // Zet om naar objecten

    // LAAGSTE HARTSLAG
    // Creëer een object voor de laagste hartslag per device
    let lowestHeartRatePerDevice = {};

    // Doorloop de gegevens en vind de laagste hartslag per apparaat
    allheartRateData.forEach((data) => {
      if (
        !lowestHeartRatePerDevice[data.device] ||
        data.value < lowestHeartRatePerDevice[data.device]
      ) {
        lowestHeartRatePerDevice[data.device] = data.value;
      }
    });

    // Zet het object om naar een array en sorteer deze op laagste hartslag
    let sortedDevicesForLowest = Object.entries(lowestHeartRatePerDevice)
      .sort((a, b) => a[1] - b[1]) // Sorteer op de hartslag (waarde), oplopend
      .slice(0, 3) // Haal de top 3 eruit
      .map(([device, value]) => ({ device, lowestHeartRate: value })); // Zet om naar objecten

    // GROOTSTE INSPANNING
    // Creëer een object voor de hoogste en laagste hartslag per device
    let heartRateRangePerDevice = {};

    // Doorloop de gegevens en vind de hoogste en laagste hartslag per apparaat
    allheartRateData.forEach((data) => {
      if (!heartRateRangePerDevice[data.device]) {
        heartRateRangePerDevice[data.device] = {
          highest: data.value,
          lowest: data.value,
        };
      } else {
        heartRateRangePerDevice[data.device].highest = Math.max(
          heartRateRangePerDevice[data.device].highest,
          data.value
        );

        heartRateRangePerDevice[data.device].lowest = Math.min(
          heartRateRangePerDevice[data.device].lowest,
          data.value
        );
      }
    });

    // Bereken het verschil tussen de hoogste en laagste hartslag per apparaat
    let effortPerDevice = Object.entries(heartRateRangePerDevice).map(
      ([device, range]) => {
        return {
          device,
          effort: range.highest - range.lowest,
        };
      }
    );

    // Sorteer de apparaten op het grootste verschil (inspanning)
    let sortedDevicesByEffort = effortPerDevice
      .sort((a, b) => b.effort - a.effort)
      .slice(0, 3)
      .map(({ device, effort }) => ({ device, effort })); // Zet om naar objecten

    // console.log('Top 3 apparaten voor de hoogste hartslag:', sortedDevicesForHighest);
    // console.log('Top 3 apparaten voor de laagste hartslag:', sortedDevicesForLowest);
    // console.log('Top 3 apparaten voor de grootste inspanning:', sortedDevicesByEffort);

    return {
      sortedDevicesForHighest,
      sortedDevicesForLowest,
      sortedDevicesByEffort,
    };
  } catch (error) {
    console.error('Fout bij het vinden van de top 3 apparaten:', error);
    return {
      sortedDevicesForHighest: [],
      sortedDevicesForLowest: [],
      sortedDevicesByEffort: [],
    };
  }
}

//#endregion top 3 stats

//#region Componenten

function clearPage() {
  const bodyElement = document.querySelector('body');
  bodyElement.className = ''; // Reset alle klassen
  bodyElement.innerHTML = '';
}

//#region Start Screen
function pageStartScreen() {
  clearPage();
  huidigePagina = 'startScreen';
  const bodyElement = document.querySelector('body');

  // Class toevoegen aan body voor styling
  bodyElement.classList.add('c-start__container');

  // DIT hieronder NOG AANPASSEN
  const innerHTML = `
    <div class="container">
        <div class="row">
        <a id="deviceManagementButton" class="c-button__settings">
                    <span class="material-symbols-outlined c-button__settingsIcon">
                    settings
                    </span>
                </a>
            <div class="col-12 c-start__frame">
                <h1 class="text-center c-start__title"> Echo Voyager: Rebuild The Ship</h1>
                    <button class="c-button__start"><p>Start Spel</p></button>
            </div>
        </div>
    </div>

    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>`;

  // Voeg de HTML toe aan de body
  bodyElement.innerHTML = innerHTML;

  document
    .getElementById('deviceManagementButton')
    .addEventListener('click', pageDeviceManagement);

  document.querySelector('.c-button__start').addEventListener('click', () => {
    pageGameIntro();
  });
}
//#endregion Start Screen
//#region Game Intro
function pageGameIntro() {
  clearPage();

  huidigePagina = 'gameIntro';
  // console.log(huidigePagina);
  const bodyElement = document.querySelector('body');

  // Class toevoegen aan body voor styling
  bodyElement.classList.add('c-start__container');

  // DIT hieronder NOG AANPASSEN
  const innerHTML = `
  <header class="c-intro__header">
        <h2 class="c-intro__title">Echo Voyager</h2>
        <h3 class="c-intro__subtitle">Rebuild The Ship</h3>
    </header>
  <div class="container">
        <div class="row">
            <div class="col-12">
                <a id="deviceManagementButton"  class="c-button__settings">
                    <span class="material-symbols-outlined c-button__settingsIcon">
                    settings
                    </span>
                </a>
        
            </div>
        </div>
    </div>

    <div class="container">
        <div class="row">
            <div class="col-3">
                <img class="c-intro__character" src="img/Designer_person2.png" alt="character">
            </div>
            <div class="col-8 c-intro__frame">
              
                <div class="c-intro-frameShader">
            
                </div>
                <div class="c-intro__text">
                    <h3 class="c-intro__characterName">Commandant Nova</h3>
                    <h4 class="c-intro__characterText">Bemanning, dit is commandant Nova van de Intergalactic 
                        Fleet. De Starship Zenith is zwaar beschadigd na een opstand. We hebben jullie hulp 
                        dringend nodig!
                    </h4>
                    <button id="intro1" class="c-button__intro" ><p>Volgende</p> <span class="material-symbols-outlined">
arrow_right_alt
</span></button>
                </div>
                
            </div>
        </div>
    </div>
 
    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>`;

  // Voeg de HTML toe aan de body
  bodyElement.innerHTML = innerHTML;

  document
    .getElementById('deviceManagementButton')
    .addEventListener('click', pageDeviceManagement);

  document.getElementById('intro1').addEventListener('click', () => {
    pageGameIntro2();
  });

  toggleMeasurement(true);
}

function pageGameIntro2() {
  document.querySelector('.c-intro__text').innerHTML = `
    <h3 class="c-intro__characterName">Commandant Nova</h3>
    <h4 class="c-intro__characterText">De bemanning is verdeeld in twee rivaliserende <br> teams. 
        Binnen elk team moeten spelers <br> samenwerken om zoveel mogelijk kamers te <br> herstellen.
    </h4>
    <button id="intro2" class="c-button__intro"><p>Volgende</p><span class="material-symbols-outlined">
arrow_right_alt
</span></button>`;

  document.getElementById('intro2').addEventListener('click', () => {
    pageGameIntro3();
  });
}

function pageGameIntro3() {
  document.querySelector('.c-intro__text').innerHTML = `
    <h3 class="c-intro__characterName">Commandant Nova</h3>
        <h4 class="c-intro__characterText">Let op: het team dat de meeste kamers repareert, neemt 
            de controle over het schip. Werk snel en <br> bewijs je kracht. Het lot van de Zenith ligt 
            in jullie handen!
        </h4>
    <button id="intro3" class="c-button__intro"><p>Volgende</p><span class="material-symbols-outlined">
arrow_right_alt
</span></button>`;

  document.getElementById('intro3').addEventListener('click', () => {
    toggleMeasurement(false);
    pageMissonBriefing(1);
  });
}
//#endregion Game Intro
//#region Missie Briefing
function pageMissonBriefing(number = 1) {
  huidigeRonde = number;
  clearPage();
  huidigePagina = 'briefingMission';
  const bodyElement = document.querySelector('body');

  // Class toevoegen aan body voor styling
  bodyElement.classList.add('c-start__container');

  // DIT hieronder NOG AANPASSEN
  const innerHTML = `
  <div class="container">
        <div class="row">
            <div class="col-12">
                <a id="deviceManagementButton" class="c-button__settings">
                    <span class="material-symbols-outlined c-button__settingsIcon">
                    settings
                    </span>
                </a>
        
            </div>
        </div>
    </div>
    <div class="c-briefing__mapContainer">
        <svg class="c-briefing__map" width="412" height="275" viewBox="0 0 412 275" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M2.637 53.6675H16.7002V72.2806H43.6546L47.4634 67.9375H65.0423V72.2806H54.7879L32.8142 97.0979H27.2475V118.193H32.8142V137.116H403.73V129.05L406.953 125.638V113.85L411.348 109.507V97.0979L403.73 91.2038L406.953 83.7586L381.757 60.4923H369.158L365.35 53.6675H353.337L337.223 41.8793V35.675H330.778V27.2991H310.855L307.046 31.0217H262.806V27.2991L227.648 4.03282H128.62L124.811 0H117.779V4.03282H111.627L106.353 8.37586H79.3985L70.609 4.03282H47.4634L43.6546 0H16.7002V12.4087H2.637C-0.926114 28.364 -0.697858 37.4077 2.637 53.6675ZM2.58745 220.564H16.6506V201.951H43.605L47.4138 206.294H64.9928V201.951H54.7384L32.7647 177.134H27.198V156.039H32.7647V137.116H403.681V145.182L406.904 148.594V160.382L411.298 164.725V177.134L403.681 183.028L406.904 190.473L381.707 213.74H369.109L365.3 220.564H353.288L337.174 232.353V238.557H330.728V246.933H310.805L306.997 243.21H262.756V246.933L227.598 270.199H128.57L124.761 274.232H117.73V270.199H111.577L106.303 265.856H79.349L70.5594 270.199H47.4138L43.605 274.232H16.6506V261.823H2.58745C-0.975667 245.868 -0.747411 236.824 2.58745 220.564Z" fill="#413D4C"/>
        <path id="path2" fill-rule="evenodd" clip-rule="evenodd" d="M231.457 75.0725H137.702V137.116H247.864V92.4447L231.457 75.0725ZM247.863 181.787L231.456 199.159H137.702V137.116H247.863V181.787Z" fill="#666173"/>
        <path id="path3" fill-rule="evenodd" clip-rule="evenodd" d="M231.456 14.8904H17.579V48.3939H73.5387V67.9375H231.456V14.8904ZM231.456 259.341H17.579V225.838H73.5387V206.294H231.456V259.341Z" fill="#666173"/>
        <path id="path1" fill-rule="evenodd" clip-rule="evenodd" d="M133.014 75.0725H64.7492L41.0176 102.061V137.116H133.014V75.0725ZM133.014 137.116V199.159H64.7492L41.0176 172.17V137.116H133.014Z" fill="#666173"/>
        <path id="path4" fill-rule="evenodd" clip-rule="evenodd" d="M326.427 35.9852H237.902V74.8342L253.386 90.2504V137.116H342.204V64.3511L326.427 35.9852ZM326.427 238.247H237.902V199.398L253.386 183.981V137.116H342.204V209.881L326.427 238.247Z" fill="#666173"/>
        <path id="path5" fill-rule="evenodd" clip-rule="evenodd" d="M376.483 66.3864H346.306V137.116H399.043V87.4141L376.483 66.3864ZM399.042 137.116V186.818L376.483 207.845H346.306V137.116H399.042Z" fill="#666173"/>
        </svg>
    </div>

    <div class="c-briefing__container">
        <div class="c-briefing__header"> 
            <div class="c-briefing__headerGroup">
                <h4 class="c-briefing__headerTitles">Doel</h4>
                <h3 id="missieDoel" class="c-briefing__headerTitles c-briefing__headerTitles--h3">Energiecentrale</h3>
            </div>
            <div class="c-briefing__headerGroup">
                <h4 class="c-briefing__headerTitles">Status</h4>
                <h3  id="missieStatus" class="c-briefing__headerTitles c-briefing__headerTitles--h3">Stroompanne</h3>
            </div>
        </div>

        <header id="missieUitleg" class="c-intro__header c-intro__header--briefing">
            <h2 class="c-intro__title c-intro__title--briefing">Missie Briefing</h2>
            <p class="c-intro__subtitle c-intro__subtitle--briefing">Laad de energiebron van het schip op door 30 seconden armpompen. Als niet <br>
                iedereen actief meedoet, wordt de oefening  met 5 seconden verlengd zodat <br>het hele team betrokken blijft.</p>
            <button id="startmissie" class="c-button__intro c-button__intro--briefing"><p>Start Missie</p></button>
        </header>

        <div>
          <img class="c-intro__character c-intro__character--briefing" src="img/Designer_person2.png" alt="character">
        </div>
    </div>

    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>`;

  // Voeg de HTML toe aan de body
  bodyElement.innerHTML = innerHTML;
  flitsHuidigeRonde(huidigeRonde);

  // Update de briefing op basis van missie nummer
  switch (number) {
    case 1:
      isHartslagVerlagen = false;
      bodyElement.classList.add('c-start__container--energie');
      document.getElementById('missieDoel').innerHTML = `Energiecentrale`;
      document.getElementById('missieStatus').innerHTML = `Stroompanne`;
      document.getElementById('missieUitleg').innerHTML = `
        <h2 class="c-intro__title c-intro__title--briefing">Missie Briefing</h2>
            <p class="c-intro__subtitle c-intro__subtitle--briefing">Laad de energiebron op door <span class="strong-text">armpompen</span> te doen. Dit zorgt ervoor dat de energiecentrale weer volledig opgeladen wordt.</p>
            <button id="startmissie" class="c-button__intro c-button__intro--briefing"><p>Start Missie</p></button>`;
      break;
    case 2:
      isHartslagVerlagen = true;
      bodyElement.classList.add('c-start__container--medical');
      document.getElementById('missieDoel').innerHTML = `Medische Ruimte`;
      document.getElementById(
        'missieStatus'
      ).innerHTML = `Genezingssysteem Inactief`;
      document.getElementById('missieUitleg').innerHTML = `

        <h2 class="c-intro__title c-intro__title--briefing">Missie Briefing</h2>
            <p class="c-intro__subtitle c-intro__subtitle--briefing">Activeer het genezingssysteem door zachte <span class="strong-text">stretchoefeningen</span> te doen, zoals nekrollen en schouderstretches. Dit reset het systeem en maakt het weer operationeel.</p>
            <button id="startmissie" class="c-button__intro c-button__intro--briefing"><p>Start Missie</p></button>`;
      break;
    case 3:
      isHartslagVerlagen = false;
      bodyElement.classList.add('c-start__container--motor');
      document.getElementById('missieDoel').innerHTML = `Motorreparatieruimte`;
      document.getElementById(
        'missieStatus'
      ).innerHTML = `Motoren Uitgeschakeld`;
      document.getElementById('missieUitleg').innerHTML = `

        <h2 class="c-intro__title c-intro__title--briefing">Missie Briefing</h2>
            <p class="c-intro__subtitle c-intro__subtitle--briefing">Herstel de motoren door <span class="strong-text">ter plaatse</span> te <span class="strong-text">rennen</span>. Dit activeert de energie die nodig is om de motoren weer te laten draaien.</p>
            <button id="startmissie" class="c-button__intro c-button__intro--briefing"><p>Start Missie</p></button>`;
      break;
    case 4:
      isHartslagVerlagen = true;
      bodyElement.classList.add('c-start__container--oxygen');
      document.getElementById(
        'missieDoel'
      ).innerHTML = `Zuurstofproductiekamer`;
      document.getElementById(
        'missieStatus'
      ).innerHTML = `Zuurstoftoevoer Onderbroken`;
      document.getElementById('missieUitleg').innerHTML = `

        <h2 class="c-intro__title c-intro__title--briefing">Missie Briefing</h2>
            <p class="c-intro__subtitle c-intro__subtitle--briefing">Herstel de ademlucht door <span class="strong-text">diep adem</span> te <span class="strong-text">halen</span> en rustig te worden. Dit vermindert de zuurstofverbruik en herstelt de zuurstoftoevoer in het schip.</p>
            <button id="startmissie" class="c-button__intro c-button__intro--briefing"><p>Start Missie</p></button>`;
      break;
    case 5:
      isHartslagVerlagen = false;
      document.getElementById('missieDoel').innerHTML = `Controlekamer`;
      document.getElementById(
        'missieStatus'
      ).innerHTML = `Signaallampen Overbelast`;
      document.getElementById('missieUitleg').innerHTML = `

        <h2 class="c-intro__title c-intro__title--briefing">Missie Briefing</h2>
            <p class="c-intro__subtitle c-intro__subtitle--briefing">Fix de knipperende lichten door <span class="strong-text">Jumping Jacks</span> te doen. Spring omhoog en spreid je armen en benen tegelijkertijd om de signaallampen te resetten.</p>
            <button id="startmissie" class="c-button__intro c-button__intro--briefing"><p>Start Missie</p></button>`;
      break;
    default:
      document.querySelector(
        '.c-briefing__container'
      ).innerHTML = `<div class="c-briefing__header"> 

            <div class="c-briefing__headerGroup">
                <h4 class="c-briefing__headerTitles">Doel</h4>
                <h3 class="c-briefing__headerTitles c-briefing__headerTitles--h3">...</h3>
            </div>
            <div class="c-briefing__headerGroup">
                <h4 class="c-briefing__headerTitles">Status</h4>
                <h3 class="c-briefing__headerTitles c-briefing__headerTitles--h3">...</h3>
            </div>
        </div>

        <header class="c-intro__header">
            <h2 class="c-intro__title c-intro__title--briefing">Missie Briefing</h2>
            <p class="c-intro__subtitle c-intro__subtitle--briefing">...</p>
                <button id='startmissie" class="c-button__intro c-button__intro--briefing" ><p>Start Missie</p></button>
        </header>`;
      break;
  }

  document
    .getElementById('deviceManagementButton')
    .addEventListener('click', pageDeviceManagement);

  document.getElementById('startmissie').addEventListener('click', () => {
    resetSpel();
    pageGame(huidigeRonde);
  });

  updatePathColors();
}
//#endregion Missie Briefing
//#region Game
function pageGame(number = 1) {
  missieBezig = true;
  clearPage();
  huidigePagina = 'game';
  const bodyElement = document.querySelector('body');

  // Class toevoegen aan body voor styling
  bodyElement.classList.add('c-start__container');

  const innerHTML = `<header id="missieTitel" class="c-intro__header">
        <h2 class="c-intro__title">Missie: ....</h2>
        <h3 class="c-intro__subtitle">......</h3>
    </header>
  <div class="container">
        <div class="row">
            <div class="col-12">
                <button id="pauzeKnop" class="c-button__settings c-button__settings--pause">
                    <span class="material-symbols-outlined">
                        pause
                        </span>
                </button>
               
                <button id="deviceManagementButton" class="c-button__settings">
                    <span class="material-symbols-outlined c-button__settingsIcon">
                    settings
                    </span>
                </button>
        
            </div>
        </div>
    </div>

    

    <div class="container c-progress__scaleContainer">
        <div class="row">
           <div class="col-12 c-progress__container">
                <div class="col-6 col-lg-6 c-progress__team">
                    <div  class="team" id="team1">
                        <div class="c-progressCard">
                            <div class="card-img-top">
                                <h2 class="c-progress__team1">Team 1</h2>   
                                <h3 id="resterendeTijdTeam1" class="c-progress__time">...</h3>
                                <div id="myProgress1" class="progress">
                                    <div id="myBar1" class="bar"></div>
                                </div>
                            </div>
                            <div class="card-body c-progressCard__body">
                            <span id="gameSpelers1">
                              
                            </span>
                           
                            <div class="c-progressCard__statContainer">
                                <p class="card-text ">Straftijd</p>
                                <p id="totaleStraftijdTeam1" class="card-text c-progressCard__stat">...</p>
                            </div>

                            <div class="c-button__introContainer">
                                <button class="c-button__intro c-button__intro--straf" id="voegTijdToeTeam1">Straf (${straftijdVerhoging}s)</button>
                            </div>
                        </div>
                        </div>
                    </div>
                </div>
        
                <div class="col-6 col-lg-6 c-progress__team">
                    <div  class="team" id="team2">
                        <div class="c-progressCard">
                            <div class="card-img-top">
                                <h2 class="c-progress__team2">Team 2</h2>   
                                <h3 id="resterendeTijdTeam2" class="c-progress__time">...</h3>
                                <div id="myProgress2" class="progress">
                                    <div id="myBar2" class="bar"></div>
                                </div>
                            </div>
                            <div class="card-body c-progressCard__body">
                            <span id="gameSpelers2">
                              
                            </span>
                           
                            <div class="c-progressCard__statContainer">
                                <p class="card-text ">Straftijd</p>
                                <p id="totaleStraftijdTeam2" class="card-text c-progressCard__stat">...</p>
                            </div>

                            <div class="c-button__introContainer">
                                <button class="c-button__intro c-button__intro--straf" id="voegTijdToeTeam2">Straf (${straftijdVerhoging}s)</button>
                            </div>
                        </div>
                        </div>
                    </div>
                </div>
            
           </div>
        </div>
    </div>
 


    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>`;

  // Voeg de HTML toe aan de body
  bodyElement.innerHTML = innerHTML;

  // Update de briefing op basis van missie nummer
  switch (number) {
    case 1:
      bodyElement.classList.add('c-start__container--energie');
      document.getElementById('missieTitel').innerHTML = `
        <h2 id="endGame" class="c-intro__title">Missie: Energiecentrale</h2>
        <h3 class="c-intro__subtitle">Laad de energiebron op door <span class="strong-text">armpompen</span> te doen.</h3>`;
      isHartslagVerlagen = false;
      break;
    case 2:
      bodyElement.classList.add('c-start__container--medical');
      document.getElementById('missieTitel').innerHTML = `
        <h2 id="endGame" class="c-intro__title">Missie: Medische Ruimte</h2>
        <h3 class="c-intro__subtitle">Activeer het genezingssysteem door zachte <span class="strong-text">stretchoefeningen</span> te doen.</h3> `;
      isHartslagVerlagen = true;
      break;
    case 3:
      bodyElement.classList.add('c-start__container--motor');
      document.getElementById('missieTitel').innerHTML = `
        <h2 id="endGame" class="c-intro__title">Missie: Motorreparatieruimte</h2>
        <h3 class="c-intro__subtitle">Herstel de motoren door <span class="strong-text">ter plaatse</span> te <span class="strong-text">rennen</span>.</h3> `;
      isHartslagVerlagen = false;
      break;
    case 4:
      bodyElement.classList.add('c-start__container--oxygen');
      document.getElementById('missieTitel').innerHTML = `
        <h2 id="endGame" class="c-intro__title">Missie: Zuurstofproductiekamer</h2>
        <h3 class="c-intro__subtitle">Herstel de ademlucht door <span class="strong-text">diep adem</span> te <span class="strong-text">halen</span>.</h3> `;
      isHartslagVerlagen = true;
      break;
    case 5:
      document.getElementById('missieTitel').innerHTML = `
        <h2 id="endGame" class="c-intro__title">Missie: Controlekamer </h2>
        <h3 class="c-intro__subtitle">Fix de knipperende lichten door <span class="strong-text">Jumping Jacks</span> te doen.</h3> `;
      isHartslagVerlagen = false;
      break;
    default:
      document.getElementById('missieTitel').innerHTML = `
        <h2 id="endGame" class="c-intro__title">Missie: ... </h2>
        <h3 class="c-intro__subtitle">...</h3> `;
      break;
  }

  updateLijstGameSpelers();
  gameAddPlayers();

  document
    .getElementById('deviceManagementButton')
    .addEventListener('click', () => {
      if (isPauze === false) {
        togglePauze();
      }
      pageDeviceManagement();
    });

  // Event listeners voor knoppen

  document
    .getElementById('voegTijdToeTeam1')
    .addEventListener('click', () => voegStraftijdToe(teams[0]));
  document
    .getElementById('voegTijdToeTeam2')
    .addEventListener('click', () => voegStraftijdToe(teams[1]));
  document.getElementById('pauzeKnop').addEventListener('click', togglePauze);

  // Start de timers
  startSpel();
}

function gameAddPlayers() {
  let tekst = '';
  let verschil = 0;
  if (isHartslagVerlagen) {
    tekst = 'Maximale Hartslag';
    verschil = 0;
  } else {
    tekst = 'Minimale Hartslag';
    verschil = 0 + hartslagVerschil;
  }
  const playerLijst1 = document.getElementById('gameSpelers1');
  const playerLijst2 = document.getElementById('gameSpelers2');

  teams[0].spelers.forEach((speler) => {
    if (speler.rustHartslag + verschil < 0) {
      verschil = 0;
    }
    playerLijst1.innerHTML += `
      <h4 class="c-progressCard__player">Speler ${speler.player}</h4>
      <div class="c-progressCard__statContainer">
          <p class="card-text c-progressCard__stat">Huidige Hartslag</p>
          <p id="hartslagSpeler${
            speler.player
          }Team1" class="card-text c-progressCard__stat">${
      speler.hartslag
    } bpm</p>
      </div>
      <div class="c-progressCard__statContainer">
          <p class="card-text ">${tekst}</p>
          <p class="card-text c-progressCard__stat">${
            speler.rustHartslag + verschil
          } bpm</p>
      </div>`;
  });

  teams[1].spelers.forEach((speler) => {
    if (speler.rustHartslag + verschil < 0) {
      verschil = 0;
    }
    playerLijst2.innerHTML += `
      <h4 class="c-progressCard__player">Speler ${speler.player}</h4>
      <div class="c-progressCard__statContainer">
          <p class="card-text c-progressCard__stat">Huidige Hartslag</p>
          <p id="hartslagSpeler${
            speler.player
          }Team2" class="card-text c-progressCard__stat">${
      speler.hartslag
    } bpm</p>
      </div>
      <div class="c-progressCard__statContainer">
          <p class="card-text ">${tekst}</p>
          <p class="card-text c-progressCard__stat">${
            speler.rustHartslag + verschil
          } bpm</p>
      </div>`;
  });
}

function updateLijstGameSpelers() {
  const team1 = teamAssignments.filter((player) => player.team === 1);
  const team2 = teamAssignments.filter((player) => player.team === 2);

  const team1WithDevice = team1.filter((player) => player.device !== null);
  const team2WithDevice = team2.filter((player) => player.device !== null);

  // Voeg de parameter 'hartslag' toe aan team1WithDevice en team2WithDevice
  const team1WithDeviceAndHartslag = team1WithDevice.map((player) => ({
    ...player,
    hartslag: 80, // Voeg hier de gewenste hartslagwaarde toe
  }));

  const team2WithDeviceAndHartslag = team2WithDevice.map((player) => ({
    ...player,
    hartslag: 80, // Voeg hier de gewenste hartslagwaarde toe
  }));

  teams[0].spelers = team1WithDeviceAndHartslag;
  teams[1].spelers = team2WithDeviceAndHartslag;
}

//#endregion Game
//#region End Mission
function pageEndMission(number = 1) {
  missieBezig = false;

  const scores = berekenScores(rondeWinnaars);
  let scoreTeam1 = scores.team1;
  let scoreTeam2 = scores.team2;

  clearPage();
  huidigePagina = 'endMission';
  const bodyElement = document.querySelector('body');

  // Class toevoegen aan body voor styling
  bodyElement.classList.add('c-start__container');

  // DIT hieronder NOG AANPASSEN
  const innerHTML = `
    <div class="container-fluid">
    <button id="deviceManagementButton" class="c-button__settings" type="button">
                    <span class="material-symbols-outlined c-button__settingsIcon" > 
                    settings
                    </span>
                </button>
        <div class="row row-endmission">
            <div class="col-12 c-leaderbord__frame">
                
                
              
                <button id="volgendeMissie" class="c-button__intro c-button__intro--endMission" type="button">Volgende Missie</button>

                
                    <div id="uitlegMissie" class="col-12 c-endMission__header">
                        <h2 class="col-12 c-endMission__title">Missie: ...</h2>
                        <h3 class="col-12 c-endMission__subtitle">Status: ...</h3>
                    </div>
             
                    <div class="col-12 c-endMission__container">
                        <div class="c-endMission__containers">
                            <h3 id="uitslagTeam1" class="c-leaderbord__title">Winnende Team</h3>
                            <h2 class="text-red text-bold mb-2">Team 1</h2>
                            <h3 class="c-leaderbord__title">Kamers gered</h3>
                            <h2 id="kamers1" class="text-red text-bold">3</h2>
                        </div>

                        <div class="c-endMission__containers">
                                <svg class="c-briefing__map" width="412" height="275" viewBox="0 0 412 275" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M2.637 53.6675H16.7002V72.2806H43.6546L47.4634 67.9375H65.0423V72.2806H54.7879L32.8142 97.0979H27.2475V118.193H32.8142V137.116H403.73V129.05L406.953 125.638V113.85L411.348 109.507V97.0979L403.73 91.2038L406.953 83.7586L381.757 60.4923H369.158L365.35 53.6675H353.337L337.223 41.8793V35.675H330.778V27.2991H310.855L307.046 31.0217H262.806V27.2991L227.648 4.03282H128.62L124.811 0H117.779V4.03282H111.627L106.353 8.37586H79.3985L70.609 4.03282H47.4634L43.6546 0H16.7002V12.4087H2.637C-0.926114 28.364 -0.697858 37.4077 2.637 53.6675ZM2.58745 220.564H16.6506V201.951H43.605L47.4138 206.294H64.9928V201.951H54.7384L32.7647 177.134H27.198V156.039H32.7647V137.116H403.681V145.182L406.904 148.594V160.382L411.298 164.725V177.134L403.681 183.028L406.904 190.473L381.707 213.74H369.109L365.3 220.564H353.288L337.174 232.353V238.557H330.728V246.933H310.805L306.997 243.21H262.756V246.933L227.598 270.199H128.57L124.761 274.232H117.73V270.199H111.577L106.303 265.856H79.349L70.5594 270.199H47.4138L43.605 274.232H16.6506V261.823H2.58745C-0.975667 245.868 -0.747411 236.824 2.58745 220.564Z" fill="#413D4C"/>
                                <path id="path2" fill-rule="evenodd" clip-rule="evenodd" d="M231.457 75.0725H137.702V137.116H247.864V92.4447L231.457 75.0725ZM247.863 181.787L231.456 199.159H137.702V137.116H247.863V181.787Z" fill="#666173"/>
                                <path id="path3" fill-rule="evenodd" clip-rule="evenodd" d="M231.456 14.8904H17.579V48.3939H73.5387V67.9375H231.456V14.8904ZM231.456 259.341H17.579V225.838H73.5387V206.294H231.456V259.341Z" fill="#666173"/>
                                <path id="path1" fill-rule="evenodd" clip-rule="evenodd" d="M133.014 75.0725H64.7492L41.0176 102.061V137.116H133.014V75.0725ZM133.014 137.116V199.159H64.7492L41.0176 172.17V137.116H133.014Z" fill="#666173"/>
                                <path id="path4" fill-rule="evenodd" clip-rule="evenodd" d="M326.427 35.9852H237.902V74.8342L253.386 90.2504V137.116H342.204V64.3511L326.427 35.9852ZM326.427 238.247H237.902V199.398L253.386 183.981V137.116H342.204V209.881L326.427 238.247Z" fill="#666173"/>
                                <path id="path5" fill-rule="evenodd" clip-rule="evenodd" d="M376.483 66.3864H346.306V137.116H399.043V87.4141L376.483 66.3864ZM399.042 137.116V186.818L376.483 207.845H346.306V137.116H399.042Z" fill="#666173"/>
                                </svg>
                        </div>

                        <div class="c-endMission__containers">
                            <h3 id="uitslagTeam2" class="c-leaderbord__title">Winnende Team</h3>
                            <h2 class="text-green text-bold mb-2">Team 2</h2>
                            <h3 class="c-leaderbord__title">Kamers gered</h3>
                            <h2 id="kamers2" class="text-green text-bold">3</h2>
                        </div>

                    </div>
                    

            </div>
        </div>
    </div>
    <script src="path/to/bootstrap.js"></script>`;

  // Voeg de HTML toe aan de body
  bodyElement.innerHTML = innerHTML;
  updatePathColors();
  animateLastRound(rondeWinnaars, huidigeRonde);

  // Update de briefing op basis van missie nummer
  switch (number) {
    case 1:
      bodyElement.classList.add('c-start__container--energie');
      document.getElementById('uitlegMissie').innerHTML = `
      <h2 class="col-12 c-endMission__title">Missie: Energiecentrale</h2>
      <h3 class="col-12 c-endMission__subtitle">Status: Stroom Hersteld</h3>
      `;
      break;
    case 2:
      bodyElement.classList.add('c-start__container--medical');
      document.getElementById('uitlegMissie').innerHTML = `
      <h2 class="col-12 c-endMission__title">Missie: Medische Ruimte</h2>
      <h3 class="col-12 c-endMission__subtitle">Status: Genezingssysteem Actief</h3>
      `;
      break;
    case 3:
      bodyElement.classList.add('c-start__container--motor');
      document.getElementById('uitlegMissie').innerHTML = `
      <h2 class="col-12 c-endMission__title">Missie: Motorreparatieruimte</h2>
      <h3 class="col-12 c-endMission__subtitle">Status: Motoren Ingeschakeld</h3>
      `;
      break;
    case 4:
      bodyElement.classList.add('c-start__container--oxygen');
      document.getElementById('uitlegMissie').innerHTML = `
      <h2 class="col-12 c-endMission__title">Missie: Zuurstofproductiekamer</h2>
      <h3 class="col-12 c-endMission__subtitle">Status: Zuurstoftoevoer Operationeel</h3>
      `;
      break;
    case 5:
      document.getElementById('uitlegMissie').innerHTML = `
      <h2 class="col-12 c-endMission__title">Missie: Controlekamer</h2>
      <h3 class="col-12 c-endMission__subtitle">Status: Signaallampen Hersteld</h3>
      `;
      document.getElementById('volgendeMissie').innerHTML = `Einde Spel`;
      break;
    default:
      document.getElementById(
        'uitlegMissie'
      ).innerHTML = `<p>Score Team 1: ... </p><p>Score Team 2: ...</p>`;

      break;
  }
  document.getElementById('kamers1').innerHTML = `${scoreTeam1}`;
  document.getElementById('kamers2').innerHTML = `${scoreTeam2}`;

  // Controleren wie de winnaar is van de huidige ronde
  let huidigeWinnaar = rondeWinnaars.find(
    (item) => item.ronde === huidigeRonde
  );
  if (huidigeWinnaar) {
    if (huidigeWinnaar.winnaar === 1) {
      document.getElementById('uitslagTeam1').innerHTML = `Winnende Team`;
      document.getElementById('uitslagTeam2').innerHTML = `Verloren Team`;
    } else if (huidigeWinnaar.winnaar === 2) {
      document.getElementById('uitslagTeam1').innerHTML = `Verloren Team`;
      document.getElementById('uitslagTeam2').innerHTML = `Winnende Team`;
    } else {
      // dit zou eigenlijk nooit mogen voorkomen
      document.getElementById('uitslagTeam1').innerHTML = `Gelijkspel`;
      document.getElementById('uitslagTeam2').innerHTML = `Gelijkspel`;
    }
  } else {
    document.getElementById('uitslagTeam1').innerHTML = `Gelijkspel`;
    document.getElementById('uitslagTeam2').innerHTML = `Gelijkspel`;
  }

  document
    .getElementById('deviceManagementButton')
    .addEventListener('click', pageDeviceManagement);

  document.getElementById('volgendeMissie').addEventListener('click', () => {
    huidigeRonde++;
    if (huidigeRonde > 5) {
      pageEndStartScreen();
    } else {
      pageMissonBriefing(huidigeRonde);
    }
  });
}
//#endregion End Mission

//#region End Screen
function pageEndStartScreen() {
  clearPage();
  huidigePagina = 'endScreen';
  const bodyElement = document.querySelector('body');

  // Class toevoegen aan body voor styling
  bodyElement.classList.add('c-start__container');

  // DIT hieronder NOG AANPASSEN
  const innerHTML = `<div class="container-fluid">
        <div class="row row-endmission">
            <button id="deviceManagementButton" class="c-button__settings" type="button">
                <span class="material-symbols-outlined c-button__settingsIcon">
                    settings
                </span>
            </button>
            <div class="col-12 c-leaderbord__frame c-leaderbord__frame--endGame">

                <div class="row c-leaderbord__row">
                    <div class="col-3 c-leaderbord__container c-leaderboard__columnContainer">
                        <div id="hoogsteHartslag">
                            <h3 class="c-leaderbord__title">Hoogste Hartslag</h3>
                            <div class="c-leaderbord__flex">
                                <p class="c-leaderboard__player"><span
                                        class="material-symbols-outlined text-green  c-leaderboard__counterIcon">
                                        counter_1
                                    </span> Speler 1</p>
                                <p>250 bpm</p>
                            </div>
                            <div class="c-leaderbord__flex">
                                <p class="c-leaderboard__player"><span
                                        class="material-symbols-outlined text-green  c-leaderboard__counterIcon">
                                        counter_2
                                    </span> Speler 2</p>
                                <p>240 bpm</p>
                            </div>
                            <div class="c-leaderbord__flex">
                                <p class="c-leaderboard__player"><span
                                        class="material-symbols-outlined text-red  c-leaderboard__counterIcon">
                                        counter_3
                                    </span> Speler 2</p>
                                <p>240 bpm</p>
                            </div>
                        </div>
                        <div id="laagsteHartslag">
                            <h3 class="c-leaderbord__title">Laagste Hartslag</h3>
                            <div class="c-leaderbord__flex">
                                <p class="c-leaderboard__player"><span
                                        class="material-symbols-outlined text-green  c-leaderboard__counterIcon">
                                        counter_1
                                    </span> Speler 1</p>
                                <p>250 bpm</p>
                            </div>
                            <div class="c-leaderbord__flex">
                                <p class="c-leaderboard__player"><span
                                        class="material-symbols-outlined text-red  c-leaderboard__counterIcon">
                                        counter_2
                                    </span> Speler 2</p>
                                <p>240 bpm</p>
                            </div>
                            <div class="c-leaderbord__flex">
                                <p class="c-leaderboard__player"><span
                                        class="material-symbols-outlined text-red  c-leaderboard__counterIcon">
                                        counter_3
                                    </span>Speler 2</p>
                                <p>240 bpm</p>
                            </div>
                        </div>
                        <div id="grootsteInspanning">
                            <h3 class="c-leaderbord__title">Grootste Inspanning</h3>
                            <div class="c-leaderbord__flex">
                                <p class="c-leaderboard__player"><span
                                        class="material-symbols-outlined text-green  c-leaderboard__counterIcon">
                                        counter_1
                                    </span> Speler 1</p>
                                <p>250 bpm</p>
                            </div>
                            <div class="c-leaderbord__flex">
                                <p class="c-leaderboard__player"><span
                                        class="material-symbols-outlined text-green  c-leaderboard__counterIcon">
                                        counter_2
                                    </span> Speler 2</p>
                                <p>240 bpm</p>
                            </div>
                            <div class="c-leaderbord__flex">
                                <p class="c-leaderboard__player"><span
                                        class="material-symbols-outlined text-red  c-leaderboard__counterIcon">
                                        counter_3
                                    </span> Speler 2</p>
                                <p>240 bpm</p>
                            </div>
                        </div>
                    </div>

                    <div class="col-3 c-leaderboard__gridColumn">
                        <div class="row h-50 c-leaderboard__gridRow">
                            <div
                                class="col-12 c-leaderbord__container c-leaderboard__gridContainer  c-leaderboard__gridContainer--top">
                                <h3 id="winnendTitel" class="c-leaderbord__title">Winnende Team</h3>
                                <h2 id="winnendeTeam" class="text-light text-bold mb-2">Team 1</h2>
                                <h3 class="c-leaderbord__title">Kamers gered</h3>
                                <h2 id="aantalKamersWinner" class="text-bold">3</h2>
                            </div>
                        </div>
                        <div class="row h-50 c-leaderboard__gridRow">
                            <div
                                class="col-12 c-leaderbord__container  c-leaderboard__gridContainer  c-leaderboard__gridContainer--bot">
                                <h3 class="c-leaderbord__title">Statistieken</h3>
                                <div class="c-leaderbord__flex">
                                    <p>Ronde 1</p>
                                    <p class="rondetijd text-light">${rondeTijden[0].tijd} s</p>
                                </div>
                                <div class="c-leaderbord__flex">
                                    <p>Ronde 2</p>
                                    <p class="rondetijd text-light">${rondeTijden[1].tijd} s</p>
                                </div>
                                <div class="c-leaderbord__flex">
                                    <p>Ronde 3</p>
                                    <p class="rondetijd text-light">${rondeTijden[2].tijd} s</p>
                                </div>
                                <div class="c-leaderbord__flex">
                                    <p>Ronde 4</p>
                                    <p class="rondetijd text-light">${rondeTijden[3].tijd} s</p>
                                </div>
                                <div class="c-leaderbord__flex">
                                    <p>Ronde 5</p>
                                    <p class="rondetijd text-light">${rondeTijden[4].tijd} s</p>
                                </div>
                            </div>
                        </div>

                    </div>

                    <div class="col-3">
                        <div class="row h-50 c-leaderboard__gridRow">
                            <svg class="c-leaderboard__map" width="412" height="275" viewBox="0 0 412 275" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M2.637 53.6675H16.7002V72.2806H43.6546L47.4634 67.9375H65.0423V72.2806H54.7879L32.8142 97.0979H27.2475V118.193H32.8142V137.116H403.73V129.05L406.953 125.638V113.85L411.348 109.507V97.0979L403.73 91.2038L406.953 83.7586L381.757 60.4923H369.158L365.35 53.6675H353.337L337.223 41.8793V35.675H330.778V27.2991H310.855L307.046 31.0217H262.806V27.2991L227.648 4.03282H128.62L124.811 0H117.779V4.03282H111.627L106.353 8.37586H79.3985L70.609 4.03282H47.4634L43.6546 0H16.7002V12.4087H2.637C-0.926114 28.364 -0.697858 37.4077 2.637 53.6675ZM2.58745 220.564H16.6506V201.951H43.605L47.4138 206.294H64.9928V201.951H54.7384L32.7647 177.134H27.198V156.039H32.7647V137.116H403.681V145.182L406.904 148.594V160.382L411.298 164.725V177.134L403.681 183.028L406.904 190.473L381.707 213.74H369.109L365.3 220.564H353.288L337.174 232.353V238.557H330.728V246.933H310.805L306.997 243.21H262.756V246.933L227.598 270.199H128.57L124.761 274.232H117.73V270.199H111.577L106.303 265.856H79.349L70.5594 270.199H47.4138L43.605 274.232H16.6506V261.823H2.58745C-0.975667 245.868 -0.747411 236.824 2.58745 220.564Z" fill="#413D4C"/>
                            <path id="path2" fill-rule="evenodd" clip-rule="evenodd" d="M231.457 75.0725H137.702V137.116H247.864V92.4447L231.457 75.0725ZM247.863 181.787L231.456 199.159H137.702V137.116H247.863V181.787Z" fill="#666173"/>
                            <path id="path3" fill-rule="evenodd" clip-rule="evenodd" d="M231.456 14.8904H17.579V48.3939H73.5387V67.9375H231.456V14.8904ZM231.456 259.341H17.579V225.838H73.5387V206.294H231.456V259.341Z" fill="#666173"/>
                            <path id="path1" fill-rule="evenodd" clip-rule="evenodd" d="M133.014 75.0725H64.7492L41.0176 102.061V137.116H133.014V75.0725ZM133.014 137.116V199.159H64.7492L41.0176 172.17V137.116H133.014Z" fill="#666173"/>
                            <path id="path4" fill-rule="evenodd" clip-rule="evenodd" d="M326.427 35.9852H237.902V74.8342L253.386 90.2504V137.116H342.204V64.3511L326.427 35.9852ZM326.427 238.247H237.902V199.398L253.386 183.981V137.116H342.204V209.881L326.427 238.247Z" fill="#666173"/>
                            <path id="path5" fill-rule="evenodd" clip-rule="evenodd" d="M376.483 66.3864H346.306V137.116H399.043V87.4141L376.483 66.3864ZM399.042 137.116V186.818L376.483 207.845H346.306V137.116H399.042Z" fill="#666173"/>
                            </svg>
                        </div>
                        <div class="row h-50 c-leaderboard__gridRow">
                            <button id="opnieuwSpelen" class="c-button__intro c-button__intro--leaderboard">Opnieuw Spelen</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <script src="path/to/bootstrap.js"></script>`;
  bodyElement.innerHTML = innerHTML;

  updatePathColors();

  document
    .getElementById('deviceManagementButton')
    .addEventListener('click', pageDeviceManagement);
  document.getElementById('opnieuwSpelen').addEventListener('click', () => {
    // Pagina herladen om spel te resetten en opnieuw te spelen
    location.reload();
  });

  let statistieken = getTop3HeartRateDevices();

  // Data invullen
  updateLeaderboard(
    'hoogsteHartslag',
    'Hoogste Hartslag',
    statistieken.sortedDevicesForHighest,
    'highestHeartRate',
    'bpm'
  );

  updateLeaderboard(
    'laagsteHartslag',
    'Laagste Hartslag',
    statistieken.sortedDevicesForLowest,
    'lowestHeartRate',
    'bpm'
  );

  updateLeaderboard(
    'grootsteInspanning',
    'Grootste Inspanning',
    statistieken.sortedDevicesByEffort,
    'effort',
    'bpm'
  );

  const scores = berekenScores(rondeWinnaars);
  let elementWinnendeTeam = document.getElementById('winnendeTeam');
  let elementAantalKamersWinner = document.getElementById('aantalKamersWinner');
  let rondetijdElementen = document.querySelectorAll('.rondetijd');

  if (elementWinnendeTeam && elementAantalKamersWinner) {
    if (scores.team1 > scores.team2) {
      elementWinnendeTeam.innerHTML = 'Team 1';
      elementWinnendeTeam.classList.replace('text-light', 'text-red');
      rondetijdElementen.forEach((element) => {
        element.classList.replace('text-light', 'text-red');
      });
      elementAantalKamersWinner.innerHTML = `${scores.team1}`;
      elementAantalKamersWinner.classList.add('text-red');
    } else if (scores.team2 > scores.team1) {
      elementWinnendeTeam.innerHTML = 'Team 2';
      elementWinnendeTeam.classList.replace('text-light', 'text-green');
      rondetijdElementen.forEach((element) => {
        element.classList.replace('text-light', 'text-green');
      });
      elementAantalKamersWinner.innerHTML = `${scores.team2}`;
      elementAantalKamersWinner.classList.add('text-green');
    } else {
      document.getElementById('winnendTitel').innerHTML = '';
      elementWinnendeTeam.innerHTML = 'Teams gelijkspel';
      elementAantalKamersWinner.innerHTML = `${scores.team1 * 2}`;
    }
  }

  document.getElementById('opnieuwSpelen').addEventListener('click', () => {
    clearPage();
  });
}

// Functie om HTML dynamisch in te vullen
function updateLeaderboard(containerId, title, data, valueKey, unit) {
  const container = document.getElementById(containerId);
  container.innerHTML = `<h3 class="c-leaderbord__title">${title}</h3>`;

  data.forEach((item, index) => {
    const teamDevice = teamAssignments.find(
      (a) => a && a.device && a.device.name === item.device
    );

    const div = document.createElement('div');
    div.className = 'c-leaderbord__flex';

    // Dynamische kleur en icoon afhankelijk van de positie

    const colorClass = teamDevice
      ? teamDevice.team === 1
        ? 'text-red'
        : teamDevice.team === 2
        ? 'text-green'
        : 'text-light'
      : 'text-light'; // Als teamDevice undefined is

    const icon = `counter_${index + 1}`;

    let dezeSpeler = null;
    if (
      teamDevice &&
      teamDevice.player !== null &&
      teamDevice.player !== undefined
    ) {
      dezeSpeler = teamDevice.player;
    } else {
      dezeSpeler = '...';
    }

    div.innerHTML = `
      <p class="c-leaderboard__player">
        <span class="material-symbols-outlined ${colorClass} c-leaderboard__counterIcon">${icon}</span>
        Speler ${dezeSpeler}
      </p>
      <p>${item[valueKey]} ${unit}</p>
    `;
    container.appendChild(div);
  });
}
//#endregion End Screen

//#region Device Management

function pageDeviceManagement() {
  clearPage();
  const bodyElement = document.querySelector('body');

  // Class toevoegen aan body voor styling
  bodyElement.classList.add('c-start__container');
  bodyElement.classList.add('c-start__container--energie');

  // DIT hieronder NOG AANPASSEN
  const innerHTML = `<header class="c-intro__header">
        <h2 class="c-intro__title">Apparaatbeheer</h2>
        <h3 class="c-intro__subtitle" id="connectionStatus">4 sensors verbonden</h3>
    </header>
  <div class="container">
        <div class="row">
            <div class="col-12">
                <button class="c-button__settings c-button__settings--pause" id="connectButton" type="button">
                    <span class="material-symbols-outlined">
                        add
                        </span>
                </button>
               
                <button class="c-button__settings" type="button" id="backButton">
                    <span class="material-symbols-outlined">
                        arrow_back
                        </span>
                </button>
        
            </div>
        </div>
    </div>
    <div class="container">
        <div id="devicesList" class="row c-deviceCard__grid">
        </div>
    </div>

    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>`;

  // Voeg de HTML toe aan de body
  bodyElement.innerHTML = innerHTML;

  // Event listeners voor knoppen
  document.getElementById('backButton').addEventListener('click', () => {
    switch (huidigePagina) {
      case 'startScreen':
        pageStartScreen();
        break;
      case 'gameIntro':
        pageGameIntro();
        break;
      case 'briefingMission':
        pageMissonBriefing(huidigeRonde);
        break;
      case 'game':
        if (isPauze === true) {
          togglePauze();
        }
        pageGame(huidigeRonde);
        break;
      case 'endMission':
        pageEndMission(huidigeRonde);
        break;
      case 'endScreen':
        pageEndStartScreen();
        break;
      default:
        clearPage();
        break;
    }
  });

  // Devices ophalen uit shownDevices
  shownDevices.forEach((showndevice) => {
    updateDevicesList(showndevice.device);
  });

  // Sensoren connecten
  const connectButton = document.querySelector('#connectButton');
  if (connectButton) {
    connectButton.addEventListener('click', connectPolarHeartRateMonitor);
  } else {
    console.warn('Connect-knop niet gevonden.');
  }

  updateConnectionStatus();
}
//#endregion Device Management

//#endregion Componenten

//#region Event Listeners

// Initialiseer eventlisteners bij het laden van de pagina
document.addEventListener('DOMContentLoaded', pageStartScreen);

//#endregion docEventListeners
