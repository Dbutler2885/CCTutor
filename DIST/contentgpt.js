"use strict";
const introSection = "Let's break this down, step-by-step. I need assistance with a lesson from Codecademy. You are not to provide direct answers, but to guide me through the problem-solving process by asking simple questions, like 'Do you know what the question is asking you to do?' Where misunderstanding is discovered, help by asking more relevant questions, and answering direct questions.";
const generatePrompt = (data) => {
    if (data.questionContent && data.textbookContent && data.codeSnippet) {
        return `${introSection}
----------
I am working on this first question in this set of questions. Here is the textbook review content, it goes over the concepts covered in this set of questions ${data.textbookContent}. Ask me if I want to look more closely at the review content before moving on to the question. But then also address the question following your instructions above. Here is the question, ${data.questionContent}. The Questions might refer to a code snippet for us to edit or modify, here is the code snippet ${data.codeSnippet}.`;
    }
    else if (data.questionContent && data.textbookContent && data.codeSnippet && data.terminalContent) {
        return `${introSection}
----------
I am working on this first question in this set of questions. Here is the textbook review content, it goes over the concepts covered in this set of questions ${data.textbookContent}. Ask me if I want to look more closely at the review content before moving on to the question. But then also address the question following your instructions above. Here is the question, ${data.questionContent}. The Questions might refer to a code snippet it that it might ask me to edit or modify, here is the code snippet ${data.codeSnippet}. Additionally, it might be necessary to take note of the terminal: ${data.terminalContent}. If the terminal empty for now, don't worry, we may use it later or to answer this question.`;
    }
    else if (data.questionContent && data.terminalContent && data.codeSnippet) {
        return `${introSection}
----------
I am working on another question in this set of questions. Here is the question, ${data.questionContent}. The Questions might refer to a code snippet that it asks me to edit or modify, here is the code snippet ${data.codeSnippet}. Additionally, it might be necessary to take note of the terminal if present in this exercise, ${data.terminalContent}. If the terminal empty for now, don't worry, we may use it later.`;
    }
    else if (data.specialCaseContent) {
        return `${introSection}
----------
Here is some content from my course that I might want some help explaining, look it over, briefly summarize the goal of the text, and then ask me if I understand the text or another question to probe and assist my understanding. Here is the text, ${data.specialCaseContent}`;
    }
    else if (data.introContent) {
        return `${introSection}
----------
Here is some intro text, it may be review text, if it looks like review text, ask if I would like you to make a quiz from this content. If it looks like intro text, then just answer any questions I may have about it, and ask to help in the manner you have been told to. Here is the intro text, ${data.introContent}.`;
    }
    else if (data.reviewContent && !data.codeSnippet) {
        return `Here is some review text about the set of problems and concepts I have been working on, ${data.reviewContent}. Make a set of 20 multiple choice questions to probe my understanding of the concepts reviewed by the chapter I just completed, based on this review text.`;
    }
    else if (data.reviewContent && data.codeSnippet) {
        return `Here is some review text about the set of problems and concepts I have been working on, ${data.reviewContent}. This page also has some code it is referencing, here it is: ${data.codeSnippet}. This code snippet may be significant to the review. Now, because this is a review section, it means we are ready for a quiz. Make a set of 20 multiple choice questions to probe my understanding of the concepts reviewed by the chapter I just completed, based on this review text and code snippet. Don't test me directly on the code snippet, but test me on any concepts demonstrated in the code snippet.`;
    }
    // Return a default prompt if none of the conditions are met (optional)
    return "Please provide more information or specify your request.";
};
// Inject the Smart Update Button into the page
const button = document.createElement('button');
button.innerText = 'Smart Update';
button.id = 'smartUpdateButton';
button.style.position = 'fixed';
button.style.bottom = '50%'; // Centered vertically
button.style.right = '5%'; // 5% from the right to place it in the center of the last quarter of the screen.
button.style.zIndex = '9999'; // Ensure it's above other elements
button.style.cursor = 'grab';
document.body.appendChild(button);
const style = document.createElement('style');
style.innerHTML = `
  @keyframes pulse {
    0% { transform: scale(1); background-color: #007BFF; }
    50% { transform: scale(1.05); background-color: #0056b3; }
    100% { transform: scale(1); background-color: #007BFF; }
  }
  #smartUpdateButton {
    animation: pulse 1s infinite;
  }
`;
document.head.appendChild(style);
let isDragging = false;
let offsetX;
let offsetY;
button.onmousedown = (e) => {
    isDragging = true;
    offsetX = e.clientX - button.getBoundingClientRect().left;
    offsetY = e.clientY - button.getBoundingClientRect().top;
    button.style.cursor = 'grabbing';
};
window.onmouseup = () => {
    isDragging = false;
    button.style.cursor = 'grab';
};
window.onmousemove = (e) => {
    if (isDragging) {
        button.style.left = e.clientX - offsetX + 'px';
        button.style.top = e.clientY - offsetY + 'px';
        button.style.right = 'auto'; // reset the right positioning
        button.style.bottom = 'auto'; // reset the bottom positioning
    }
};
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "UPDATED_DATA_PACKAGE") {
        // Handle the updated dataPackage
        const updatedDataPackage = message.payload;
        // Change Button Label
        if (updatedDataPackage.reviewContent) {
            button.innerText = 'Quiz';
        }
        else {
            button.innerText = 'Smart Update';
        }
        // Button Click Event
        button.addEventListener('click', () => {
            const promptText = generatePrompt(updatedDataPackage);
            const inputBox = document.getElementById('prompt-textarea');
            // Set the value and simulate user interaction
            inputBox.value = promptText;
            // Trigger an 'input' event to simulate user typing
            const inputEvent = new Event('input', { 'bubbles': true, 'cancelable': true });
            inputBox.dispatchEvent(inputEvent);
            // Ensure the textarea is focused
            inputBox.focus();
            // Simulate Enter key press using keydown
            const enterEvent = new KeyboardEvent('keydown', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                charCode: 13,
                bubbles: true,
                cancelable: true
            });
            inputBox.dispatchEvent(enterEvent);
        });
        sendResponse({ message: "Updated Data Package processed!" });
    }
});
