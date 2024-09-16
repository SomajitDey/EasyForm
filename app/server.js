let myWorker = null;
let getFrom, postTo, TGchatID;
const logs = document.getElementById("logs");
const toggleServer = document.getElementById("toggleServer");

function logThis(report) {
    logs.innerHTML += Date() + ":<br>=========<br>" + report + "<br>=========<br><br>";
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
    getFrom = document.getElementById("relay").value + '/' + document.getElementById("uuid").value;
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
        let errLvl = e.data[1];
        if (! errLvl) {
            logThis('Received: ' + e.data[0]);
        } else if (errLvl === 1) {
            stopWorker();
            logThis('Fatal Error: ' + e.data[0] + ' See console for details.');
            alert('Server stopped due to some critical error');
        } else {
            logThis('Error: ' + e.data[0] + ' See console for details.');
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
