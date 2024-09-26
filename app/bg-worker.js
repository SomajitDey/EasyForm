// Code for background worker.
// Its purpose is to listen to piping-server for form data and post to Telegram when received, i.e. relaying.
// Polling piping-server API is achieved using setTimeout for efficiency. One relay seeds the next before returning.
// 'main' in the following refers to "server.js".

function urlEncoded2Json(str){
    const arr = str.split('&');

    const obj = new Object();

    for (const el of arr) {
        let elArray = el.split('=');
        let val = decodeURIComponent(elArray[1].replace( /\+/g, ' ' )).replace(/"/g,'\\"'); // Decoded and escaped
        obj[elArray[0]]=val;
    }
    
    return JSON.stringify(obj);
}

async function pollApi(getFrom, postTo, TGchatID) {
    const pollInterval = 5000; // in milliseconds

    const relay = async () => {
        let data; // This will hold the received URL encoded form data
        let errLvl = 2; // Default error level when errors are caught. May be overriden before using `throw`.
        
        // Listen to piping-server
        try {
            const response = await fetch(getFrom); // Make request

            if (response.status !== 200) {
                if (response.status === 404) return;
                errLvl = 1; // Set error to critical/fatal
                throw `GET @ ${getFrom} status: ${response.status}`;
            }

            data = await response.text();
            // Send URL decoded form data as JSON string to main for logging. Also pass an error level.
            postMessage([data, 0]);
            
        } catch (error) {
            console.error(`${Date()}: Error making GET request -- ${error}`);
            // Send error to main for logging. Error level: 1 for high priority / fatal.
            postMessage(['Failed to fetch form data.', errLvl]);
            return;

        } finally {
            setTimeout(relay, pollInterval); // Schedule next relay
        }

        // POST to Telegram
        let payload = {chat_id: TGchatID, text: data}; // conforming to Telegram API schema

        try {
            const response = await fetch(postTo, {
                method: "POST",
                headers: {'Content-Type': 'application/json'}, 
                body: JSON.stringify(payload)
            })
            
            if (! response.ok) {
                throw `POST @ ${postTo} status: ${response.status}. Is chat ID = ${TGchatID} ok?`;
            }

        } catch (error) {        
            console.error(`${Date()}: Error making POST request -- ${error}`);
            // Send error to main for logging. Error level: 2 for low priority / non-fatal.
            postMessage(['Failed to post form data to Telegram.', errLvl]);
            return;
        }

        console.log(`${Date()}: Relay complete.`);
    };

    relay(); // Start the first relay
}

// Register pollApi has handler for the event of receiving any message from main
onmessage = (e) => {
  console.log("Message received from main script: " + JSON.stringify(e.data));
  pollApi(e.data[0], e.data[1], e.data[2]);
};
