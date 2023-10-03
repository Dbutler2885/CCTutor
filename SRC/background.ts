interface DataPackage {
    textbookContent?: string;
    questionContent?: string;
    codeSnippet?: string;
    thirdWindowContent?: string;
    reviewContent?: string;
    introContent?: string;
    specialCaseContent?: string;
    terminalContent?: string;
  }
  
  interface Message {
    type: string;
    payload: DataPackage;
  }
  
  let storedDataPackage: DataPackage | null = null;
  
  chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
    if (message.type === "DATA_PACKAGE") {
        // Check if the received dataPackage is different from the stored one
        if (JSON.stringify(storedDataPackage) !== JSON.stringify(message.payload)) {
            storedDataPackage = message.payload;
            console.log("New dataPackage received and stored.");

            // Notify the ChatGPT content script about the updated dataPackage
            notifyChatGPTContentScript(storedDataPackage);

            sendResponse({ message: "Data Package received and updated!" });
        } else {
            sendResponse({ message: "Data Package received but no change detected." });
        }
    }
    // ... (handle other types of messages, if any)
});

function notifyChatGPTContentScript(data: DataPackage) {
    chrome.tabs.query({}, (tabs) => {
        for (let tab of tabs) {
            // Check if the tab's URL matches the ChatGPT URL (or whatever identifier you use)
            if (tab.url && tab.url.includes("chat.openai.com")) {  // Adjust this URL to your needs
                if (tab.id) {
                    chrome.tabs.sendMessage(tab.id, { type: "UPDATED_DATA_PACKAGE", payload: data });
                }
            }
        }
    });
}

  