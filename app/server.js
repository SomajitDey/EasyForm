let myWorker = null;
let getFrom, postTo, TGchatID;
const logs = document.getElementById("logs");
const toggleServer = document.getElementById("toggleServer");

function logThis(report) {
    logs.innerHTML += Date() + ":<br>=========<br>" + report + "<br>=========<br><br>";
}

function inbox(json){
    const data = JSON.parse(json); // Read form data into entry object
    data.time = Date();
    const keysEnumArray = Object.keys(data);

    // Create table row:
    const row = document.createElement("tr");

    for (let key in keysEnumArray) {
        // Create cell:
        const cell = document.createElement("td");

        // Create a text entry:
        const entry = document.createTextNode(eval("data." + keysEnumArray[key]));

        // Append entry to cell:
        cell.appendChild(entry);

        // Append cell to row:
        row.appendChild(cell);        
    }

    // Append row to table body:
    document.getElementById("inboxTable").appendChild(row);
}

function genUUID() {
    document.getElementById("uuid").value = crypto.randomUUID().split('-')[0];
}

const fetchChatID = async () => {
    logThis("Fetching Telegram chat ID")
    const apiEndpoint = 'https://api.telegram.org/bot' + document.getElementById("apiKey").value + '/getUpdates';
    const response = await fetch(apiEndpoint); // Make request
    const data = await response.json();
    document.getElementById("chatID").value = data.result[0].message.chat.id;
}

function config() {
    const relayList = ["https://ppng.io", "https://piping.glitch.me", "https://demo.httprelay.io/link"];
    const uuid = document.getElementById("uuid").value;
    // Choose a random index in [0, relayList.length]. Use first two nibbles of uuid as random number in range [0,256].
    const randomIdx = Math.floor(parseInt(uuid.substr(0,2),16)*relayList.length/256);
    getFrom = relayList[randomIdx] + '/' + uuid;
    postTo = 'https://api.telegram.org/bot' + document.getElementById("apiKey").value + '/sendMessage';
    TGchatID = document.getElementById("chatID").value;
    document.getElementById("config").innerHTML = '<p class="alert alert-success">HTML Form Action URL: <u>' + getFrom + '</u></p>';
    document.getElementById("testFormBtn").setAttribute("formaction", getFrom);
    spaShowHide("testForm");
    document.getElementById("config").scrollIntoView();
}

function startWorker() {
    if (getFrom === undefined) {
        config();
    }

    myWorker = new Worker("app/bg-worker.js");

    // Register handler for messages from the background worker
    myWorker.onmessage = (e) => {
        const errLvl = e.data[1];
        const msg = e.data[0];
        if (! errLvl) {
            inbox(msg);
            logThis('Received: ' + msg);
        } else if (errLvl === 1) {
            stopWorker();
            logThis('Fatal Error: ' + msg + ' See console for details.');
            alert('Server stopped due to some critical error');
        } else {
            logThis('Error: ' + msg + ' See console for details.');
        }
    }

    // Communicate key data to the background worker
    myWorker.postMessage([getFrom, postTo, TGchatID]);

    toggleServer.value = "Kill Server";
    toggleServer.disabled = false;

    logThis("Server started");
    document.getElementById("serverStatus").innerHTML = 'Live  <span class="spinner-grow spinner-grow-sm"></span>';
}

function stopWorker() {
    myWorker.terminate();
    myWorker = null;
    console.log("Worker terminated");
    toggleServer.value = "Launch Server"
    logThis("Server stopped");
    document.getElementById("serverStatus").innerHTML = "Killed";
}

function toggleWorker() {
    if (myWorker != null) {
        stopWorker();
    } else {
        startWorker();
    }
}
