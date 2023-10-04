interface DataPackage {
    textbookContent?: string;
    questionContent?: string;
    codeSnippet?: string;
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
        if (JSON.stringify(storedDataPackage) !== JSON.stringify(message.payload)) {
            storedDataPackage = message.payload;
            console.log("New dataPackage received and stored.");

            notifyChatGPTContentScript(storedDataPackage);

            sendResponse({ message: "Data Package received and updated!" });
        } else {
            sendResponse({ message: "Data Package received but no change detected." });
        }
    }

});

function notifyChatGPTContentScript(data: DataPackage) {
    chrome.tabs.query({}, (tabs) => {
        for (let tab of tabs) {
            if (tab.url && tab.url.includes("chat.openai.com")) {  // Adjust this URL to your needs
                if (tab.id) {
                    chrome.tabs.sendMessage(tab.id, { type: "UPDATED_DATA_PACKAGE", payload: data });
                }
            }
        }
    });
}

  