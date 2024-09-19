// Main entry point for the server. Deploys background worker in "bg-worker.js" for handling networking.

let myWorker = null;
let getFrom, postTo, TGchatID;
let numReadMsgs = 0;
let numTotalMsgs = 0;
const logs = document.getElementById("logs");
const toggleServer = document.getElementById("toggleServer");

function logThis(report) {
    const row = document.createElement("p");
    row.append(`${Date()}: ${report}`);
    logs.prepend(row);
}

// Handler for updating the display of number of unread messages
function updateUnreadCount(){
    if (spaCurrentPageID === "inbox") {
        numReadMsgs = numTotalMsgs;
    }
    document.getElementById("unread").innerText = numTotalMsgs - numReadMsgs;
}

function inbox(json){
    const data = JSON.parse(json); // Read form data into entry object
    data.Timestamp = Date();
    const keysEnumArray = Object.keys(data); // Enumerated array of form fields.

    // Create table row:
    const row = document.createElement("tr");

    const header = document.getElementById("inboxHeader");
    if (! numTotalMsgs) { header.replaceChildren();}
    
    for (let key in keysEnumArray) {
        // Create cell:
        const cell = document.createElement("td");

        // Create a text entry:
        entry = eval(`data.${keysEnumArray[key]}`);

        // Append entry to cell:
        cell.append(entry);

        // Append cell to row:
        row.append(cell);        

        if (! numTotalMsgs) {
            // Setup header according to the form fields. This is necessary as users may have custom form fields.
            // Create header block:
            const header_block = document.createElement("th");
            header_block.append(keysEnumArray[key]);
            header.append(header_block);
        }
    }
    
    // Append row to table body:
    document.getElementById("inboxTable").prepend(row);
    
    // Update number of total messages
    ++numTotalMsgs;
    updateUnreadCount("new");
}

function genUUID() {
    // v4 UUID looks like xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx in hexadecimal. See Wikipedia.
    // M stores version & N, the variant. All the x digits above are cryptographically random.
    // For our uuid we simply choose the first block of hex chars from a v4 UUID.
    document.getElementById("uuid").value = crypto.randomUUID().split('-')[0];
}

const fetchChatID = async () => {
    logThis("Fetching Telegram chat ID")
    const apiEndpoint = 'https://api.telegram.org/bot' + document.getElementById("apiKey").value + '/getUpdates';
    const response = await fetch(apiEndpoint); // Make request
    if (! response.ok) {
        logThis(`Telegram API status code: ${response.status}. Is Bot API Token ok?`);
        alert("Failed to fetch chat ID. Check your Bot API Token!");
        return;
    }
    const data = await response.json();
    try {
        TGchatID = data.result[0].message.chat.id;
    } catch (e) {
        alert("Failed to fetch chat ID. Send any text to the Telegram Bot then try again.");
    }
}

function config() {
    const relayList = ["https://ppng.io", "https://piping.glitch.me", "https://demo.httprelay.io/link"];
    const uuid = document.getElementById("uuid").value;
    // Choose a random index in [0, relayList.length]. Use first two nibbles of uuid as random number in range [0,256].
    const randomIdx = Math.floor(parseInt(uuid.substr(0,2),16)*relayList.length/256);
    getFrom = relayList[randomIdx] + '/' + uuid;
    postTo = 'https://api.telegram.org/bot' + document.getElementById("apiKey").value + '/sendMessage';
    document.getElementById("config").innerHTML = `<p class="alert alert-success">HTML Form Action URL: <u>${getFrom}</u></p>`;
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
            logThis(`RECEIVED: ${msg}`);
        } else if (errLvl === 1) {
            stopWorker();
            logThis(`FATAL ERROR: ${msg}. See console for details.`);
            alert('Server stopped due to some critical error');
        } else {
            logThis(`ERROR: ${msg}. See console for details.`);
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
    document.getElementById("serverStatus").innerText = "Killed";
}

function toggleWorker() {
    if (myWorker != null) {
        stopWorker();
    } else {
        startWorker();
    }
}
