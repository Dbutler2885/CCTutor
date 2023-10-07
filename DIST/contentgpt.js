"use strict";
function generatePrompt(data) {
    // Base introduction - always present in every prompt
    const intro = `
    Let's break this down, step-by-step.
    I need assistance with a lesson from Codecademy.
    You are not to provide direct answers, but to guide me through the problem-solving process
    by asking simple questions, like "Do you know what the question is asking you to do?".
    Where misunderstanding is discovered, help by asking more relevant questions, and answering direct questions. 
`;
    // Dynamic sections based on data
    const textbookSection = data.textbookContent
        ? `Here is the textbook review content: """${data.textbookContent}""". Ask "Do you have any questions
        about the review content you want to go over?" then proceed with the rest of the material in this prompt.
        Do not wait for a response, but also do not proceed to discuss the intro. Finish your response addressing all parts of the previous prompt.
        Never reprint the review content. If asked about it, answer by rephrasing. When discussing code examples, always
        reprint code examples.
        `
        : "";
    const questionSection = data.questionContent
        ? `Here is the question: """${data.questionContent}""". If not, we can look at the question.`
        : "";
    const codeSection = data.codeSnippet
        ? `The Question refers to a code snippet for us to edit or modify, here is the code snippet: """${data.codeSnippet}""".`
        : "";
    const terminalSection = data.terminalContent
        ? `Additionally, it might be necessary to take note of the terminal: """${data.terminalContent}""".`
        : "";
    const specialCaseSection = data.specialCaseContent
        ? `Here is some content from my course that I might want some help explaining: """${data.specialCaseContent}""".`
        : "";
    const introTextSection = data.introContent
        ? `Here is some intro text: """${data.introContent}""".`
        : "";
    const reviewSection = data.reviewContent
        ? `Here is some review text about the set of problems and concepts I've been working on: """${data.reviewContent}""".
        generate a 20 point multiple choice Quiz to test my knowledge on this. When I have responded with my answers, grade the quiz,
        and then offer to explain any concepts covered in the Quesitons I answered incorrectly. Then, lastly, offer to generate
        a small practice project for me to do that illustrates these concepts.`
        : "";
    // Conclusion section - always present at the end of the prompt
    const conclusion = `Thanks for your assistance! Looking forward to your guidance.`;
    // Compile the final prompt
    const promptText = [intro, textbookSection, questionSection, codeSection, terminalSection, specialCaseSection, introTextSection, reviewSection, conclusion]
        .filter(Boolean)
        .join("\n\n----------\n\n");
    return promptText;
}
// Smart Update Button
const button = document.createElement('button');
button.innerText = 'Smart Update';
button.id = 'smartUpdateButton';
button.style.position = 'fixed';
button.style.bottom = '50%';
button.style.right = '5%';
button.style.zIndex = '9999';
button.style.cursor = 'pointer';
document.body.appendChild(button);
const style = document.createElement('style');
style.innerHTML = `
  @keyframes pulse {
    0% { box-shadow: 0 0 5px darkgrey; }
    50% { box-shadow: 0 0 25px purple, 0 0 50px purple; }
    100% { box-shadow: 0 0 5px darkgrey; }
  }

  #smartUpdateButton {
    background: linear-gradient(darkgrey, #282538);  // dark grey with a hint of purple
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 15px;  // More rounded for a futuristic look
    font-size: 16px;
    outline: none;  // To remove the default outline
    transition: transform 0.3s; // Smooth transform transition
  }

  #smartUpdateButton:hover {
    transform: scale(1.05); // Button slightly enlarges on hover
  }

  #smartUpdateButton.pulsing {
    animation: pulse 1s infinite;
  }
`;
document.head.appendChild(style);
// Button Functions
let currentDataPackage = null;
const handleButtonClick = () => {
    console.log("Button clicked!");
    if (currentDataPackage) {
        const promptText = generatePrompt(currentDataPackage);
        const inputBox = document.getElementById('prompt-textarea');
        inputBox.value = promptText;
        const inputEvent = new Event('input', { 'bubbles': true, 'cancelable': true });
        inputBox.dispatchEvent(inputEvent);
        inputBox.focus();
        const enterEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            charCode: 13,
            bubbles: true,
            cancelable: true
        });
        inputBox.dispatchEvent(enterEvent);
        // Remove the pulsing effect once the button is clicked
        button.classList.remove('pulsing');
    }
};
button.addEventListener('click', handleButtonClick);
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "UPDATED_DATA_PACKAGE") {
        button.classList.remove('pulsing');
        currentDataPackage = {}; // Reinitialize to an empty object
        Object.assign(currentDataPackage, message.payload);
        if (currentDataPackage && currentDataPackage.reviewContent) {
            button.innerText = 'Quiz';
        }
        else {
            button.innerText = 'Smart Update';
        }
        button.classList.add('pulsing');
    }
});
