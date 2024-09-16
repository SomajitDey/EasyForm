onmessage = (e) => {
  console.log("Message received from main script: " + JSON.stringify(e.data));
  pollApi(e.data[0], e.data[1], e.data[2]);
};

async function pollApi(getFrom, postTo, TGchatID) {
    
    const pollingInterval = 5; // 5 seconds in milliseconds
    
    const makeRequest = async () => {
        try {
            const response = await fetch(getFrom); // Make request
            const data = await response.text();

			const res = await fetch(postTo, {
                method: "POST",
                headers: {'Content-Type': 'application/json'}, 
                body: '{"chat_id": "'+ TGchatID + '", "text": "'+ data +'"}'
            })

            console.log(Date() + ": Relay complete.");
            postMessage(data); // Send data to main for logging
            
            setTimeout(makeRequest, pollingInterval); // Schedule next request

        } catch (error) {
            console.error(Date() + ': Error making API request --', error);

            setTimeout(makeRequest, pollingInterval); // Schedule next request
        }
    };

    makeRequest(); // Start the first request
}
