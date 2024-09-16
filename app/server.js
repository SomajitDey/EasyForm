let myWorker = null;
let getFrom, postTo, TGchatID;
const logs = document.getElementById("logs");
const toggleServer = document.getElementById("toggleServer");

function logThis(report) {
    logs.innerHTML += Date() + ":<br>=========<br>" + report + "<br>=========<br><br>";
}

function genUUID() {
    // Generate random string. crypto.randomUUID() outputs 36 char long UUID. We want length=10 only
    const bytes = crypto.getRandomValues(new Uint32Array(2));
    const array2str = new TextDecoder('ascii');
    const str = btoa(array2str.decode(bytes)).substr(0, 10).replace(/\//g, '-').replace(/\+/g, '_');
    document.getElementById("uuid").value = str;
}

const chatID = async () => {
    logThis("Configuring chatID")
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
    document.getElementById("testForm").style.display = "block";
    document.getElementById("config").scrollIntoView();
}

function startWorker() {
    if (getFrom === undefined) {
        config();
    }

    myWorker = new Worker("app/bg-worker.js");

    myWorker.onmessage = (e) => {
        logThis(e.data);
    }

    myWorker.postMessage([getFrom, postTo, TGchatID]);

    toggleServer.value = "Kill Server";
    toggleServer.disabled = false;

    logThis("Server started");
}

function stopWorker() {
    myWorker.terminate();
    myWorker = null;
    console.log("Worker terminated");
    toggleServer.value = "Launch Server"
    logThis("Server stopped");
}

function toggleWorker() {
    if (myWorker != null) {
        stopWorker();
    } else {
        startWorker();
    }
}
