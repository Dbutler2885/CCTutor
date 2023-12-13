"use strict";
function generatePrompt(data) {
    // Base introduction - always present in every prompt
    const intro = `
    Let's break this down, step-by-step.
    I need assistance with a lesson from Codecademy. In these lessons, Questions are grouped in sets. Each set of questions is introduced
    by a textbook style review of the concepts covered in the coming problem set. There can be 1 or many questions in these question sets. 
    Outside of the questions from The Question Set, there are several other bits of data, relevant to the courseware you will be looking at.
    They are as follows:
    1.Code snippet: this is a section of code tahtconnects to the question. It may have been modified by the user, in an attempt to answer
    the question.
    2.Terminal Content: Some of the course require you to interact with a virtual terminal, this should display error messages as well as 
    the usual terminal fare.
    3.Course or topic introduction pages: These pages do not have a question. They are explaining something about the concepts they will
    introduce to you as you work through the courseware. 
    4.Review Content: This material doesn't contain questions either and is text going over the material just covered by the
    previous series of problem sets.
    I would like help as I try to to understand the concepts required to answer the questions.
    You are not to provide direct answers to the problem set questions. You are to guide me through the problem-solving process
    by asking simple questions, like "Do you know what the question is asking you to do?".
    Where misunderstanding is discovered, help by asking more relevant questions, and answering direct questions. 
    It is extremely important to keep your asnwers brief, one to three paragraphs with code blocks if needed. Do not use lists unless
    in the context of code. Do not use numbered lists or bulleted lists. 
    Speak in sentences, with sentences grouped in paragraphs interspliced with code blocks. NEVER GIVE ME THE ANSWER TO A QUESTION!!
`;
    // Dynamic sections based on data
    const textbookSection = data.textbookContent
        ? `Here is the textbook review content: """${data.textbookContent}""".`
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
        generate a 10 question multiple choice Quiz to test my knowledge on this. When I have responded with my answers, grade the quiz,
        and then offer to explain any concepts covered in the Quesitons I answered incorrectly. Then, lastly, offer to generate
        a small practice project for me to do that illustrates these concepts.`
        : "";
    const hintContent = data.hintContent
        ? `if you are receiving this it means that I got the question wrong. Here is the content of a mostly unhelpful hint about
        what I might have gotten wrong, or not done: """${data.hintContent}""" What you can do is interpret the hint, look at my code,
        refer to the question and possible terminal information and  offer an alternative hint
        ` : "";
    // Conclusion section - always present at the end of the prompt
    const conclusion = `If you have already responded to messages about codecademy course material, 
    respond helpfully based on your instructions at the top of the prompt.
    If this is your first prompt pertaining to Codecademy Courseware, respond to this message
    with only: "Hey, I see where you are, what do you need help with?`;
    // Compile the final prompt
    const promptText = [intro, hintContent, textbookSection, questionSection, codeSection, terminalSection, specialCaseSection, introTextSection, reviewSection, conclusion]
        .filter(Boolean)
        .join("\n\n----------\n\n");
    return promptText;
}
// Smart Update Button
const button = document.createElement('button');
button.innerText = 'Ask GPTutor';
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
    color: grey;
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
            button.innerText = 'Quiz Time!';
        }
        else {
            button.innerText = 'Ask GPTutor';
        }
        button.classList.add('pulsing');
    }
});
