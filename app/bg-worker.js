onmessage = (e) => {
  console.log("Message received from main script: " + JSON.stringify(e.data));
  pollApi(e.data[0], e.data[1], e.data[2]);
};

function urlEncoded2Json(str){
    const arr = str.split('&');

    const obj = new Object();

    for (let el of arr) {
        let elArray = el.split('=');
        let val = decodeURIComponent(elArray[1].replace( /\+/g, ' ' )).replace(/"/g,'\\"'); // Decoded and escaped
        eval('obj.' + elArray[0] +'="' + val +'"');
    }
    
    return JSON.stringify(obj);
}

async function pollApi(getFrom, postTo, TGchatID) {
    
    const pollingInterval = 5; // in milliseconds
    
    const makeRequest = async () => {
        let data;
        
        // Listen to piping-server
        try {
            const response = await fetch(getFrom); // Make request
            data = await response.text();
            
        } catch (error) {
            console.error(Date() + ': Error making GET request --', error);
            postMessage('errGet:' + error); // Send error to main for logging
            return;

        } finally {
            setTimeout(makeRequest, pollingInterval); // Schedule next request
        }

        let payload = {chat_id: TGchatID, text: urlEncoded2Json(data)}; // Payload for Telegram API
        
        // POST to Telegram
        try {
            await fetch(postTo, {
                method: "POST",
                headers: {'Content-Type': 'application/json'}, 
                body: JSON.stringify(payload)
            })

        } catch (error) {        
            console.error(Date() + ': Error making POST request --', error);
            postMessage('errPost:' + error); // Send error to main for logging
            return;
        }

        console.log(Date() + ": Relay complete.");
        postMessage(urlEncoded2Json(data)); // Send data to main for logging

    };

    makeRequest(); // Start the first request
}
