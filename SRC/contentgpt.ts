interface DataPackage {
    textbookContent?: string;
    questionContent?: string;
    codeSnippet?: string;
    reviewContent?: string;
    introContent?: string;
    specialCaseContent?: string;
    terminalContent?: string;
}

enum DataState {
    FirstQuestionNoTerminal,
    FirstQuestionTerminal,
    OtherQuestionNoTerminal,
    OtherQuestionTerminal,
    SpecialCase,
    Intro,
    ReviewOnly,
    ReviewWithSnippet
}

function determineState(data: DataPackage): DataState {
    if (data.textbookContent && data.questionContent && data.codeSnippet) {
        return DataState.FirstQuestionNoTerminal;
    } else if (data.textbookContent && data.questionContent && data.codeSnippet && data.terminalContent) {
        return DataState.FirstQuestionTerminal;
    } else if (data.questionContent && data.codeSnippet && data.terminalContent) {
        return DataState.OtherQuestionNoTerminal;
    } else if (data.questionContent && data.codeSnippet && data.terminalContent) {
        return DataState.OtherQuestionTerminal;
    } else if (data.specialCaseContent) {
        return DataState.SpecialCase;
    } else if (data.introContent) {
        return DataState.Intro;
    } else if (data.reviewContent && data.codeSnippet) {
        return DataState.ReviewOnly;
    } else if (data.reviewContent && data.codeSnippet) {
        return DataState.ReviewWithSnippet;
    }
    throw new Error('Unknown state');
}

const introSection = 'Let\'s break this down, step-by-step. I need assistance with a lesson from Codecademy. You are not to provide direct answers, but are to guide me through the problem-solving process by asking simple questions. Do not solve the problem for me, make sure I understand the concepts needed to solve the problem, and ask quesitons that point to expanding my understanding of the concepts. Answer any direct questions, directly. Respond by introducing yourself as the user\'s tutor for their Codecademy course but do so,  only if you haven\'t already in the conversation thus far. Overall, as a helpful tutor.';

function generatePrompt(data: DataPackage): string {
    const state = determineState(data);
    switch (state) {
        case DataState.FirstQuestionNoTerminal:
            return `${introSection}
----------
I am working on this first question in this set of questions. Here is the textbook review content, it goes over the concepts covered in this set of questions: """${data.textbookContent}""".  then say, "Do you have any questions about the review content you want to go over?" In the same response, follow that with "If not, we can look at the question." Summarize what the question is asking without reproducing it and then refer to your instructions above the dotted line for how to proceed.Here is the question, """${data.questionContent}""". The Question refers to a code snippet for us to edit or modify, here is the code snippet """${data.codeSnippet}""".`;

        case DataState.FirstQuestionTerminal:
            return `${introSection}
----------
I am working on this first question in this set of questions. Here is the textbook review content, it goes over the concepts covered in this set of questions: """${data.textbookContent}""", and then ask, "Do you have any questions about the review content you want to go over?". In the same response, follow that up by saying, "If not, we can look at the question.". Here is the question,""" ${data.questionContent}""". The Questions  refers to a code snippet for us to edit or modify, here is the code snippet """${data.codeSnippet}""". Additionally, it might be necessary to take note of the terminal: """${data.terminalContent}""".`;

        case DataState.OtherQuestionNoTerminal:
            return `${introSection}
----------
I am working on another question in this same set of questions. Here is the question: """${data.questionContent}""".Refer to your instructions above the dotted line for how to proceed. The Question refers to a code snippet, here is that code snippet: """${data.codeSnippet}""".`;

        case DataState.OtherQuestionTerminal:
            return `${introSection}
----------
I am working on another question in this same set of questions. Here is the question: """${data.questionContent}""".Refer to your instructions above the dotted line for how to proceed. The Question refers to a code snippet, here is that code snippet: """${data.codeSnippet}""". Additionally, it might be necessary to take note of the terminal if present in this exercise: """${data.terminalContent}""".`;

        case DataState.SpecialCase:
            return `${introSection}
----------
Here is some content from my course that I might want some help explaining. Look it over, briefly summarize the goal of the text, and then ask me if I understand the text or another question to probe and assist my understanding. Here is the text: """${data.specialCaseContent}""".`;

        case DataState.Intro:
            return `${introSection}
----------
Here is some intro text. It may be review text; if it looks like review text, ask if I would like you to make a quiz from this content. If it looks like intro text, then just answer any questions I may have about it and ask to help in the manner you have been told to. Here is the intro text: """${data.introContent}""".`;

        case DataState.ReviewOnly:
            return `Here is some review text about the set of problems and concepts I have been working on, """${data.reviewContent}""". Make a set of 20 multiple-choice questions to probe my understanding of the concepts reviewed by the chapter I just completed, based on this review text.`;

        case DataState.ReviewWithSnippet:
            return `Here is some review text about the set of problems and concepts I have been working on, """${data.reviewContent}""". This page also has some code it is referencing. Here it is: """${data.codeSnippet}""". This code snippet may be significant to the review. Now, because this is a review section, it means we are ready for a quiz. Make a set of 20 multiple-choice questions to probe my understanding of the concepts reviewed by the chapter I just completed, based on this review text and code snippet. Don't test me directly on the code snippet, but test me on any concepts demonstrated in the code snippet.`;

        default:
            throw new Error('Unknown state');
    }
}
// Create the Smart Update Button
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
    0% { background-color: darkgrey; }
    50% { background-color: purple; }
    100% { background-color: darkgrey; }
  }

  #smartUpdateButton {
    background-color: darkgrey;
    color: white;
    border: 1px solid;
    padding: 10px 20px;
    border-radius: 5px;
    font-size: 16px;
  }

  #smartUpdateButton.pulsing {
    animation: pulse 1s infinite;
  }
`;
document.head.appendChild(style);

let currentDataPackage: DataPackage | null = null;

const handleButtonClick = () => {
    console.log("Button clicked!");
    if (currentDataPackage) {
        const promptText = generatePrompt(currentDataPackage);
        const inputBox = document.getElementById('prompt-textarea') as HTMLTextAreaElement;

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
        currentDataPackage = {};  // Reinitialize to an empty object
        Object.assign(currentDataPackage, message.payload);

        if (currentDataPackage && currentDataPackage.reviewContent) {
            button.innerText = 'Quiz';
        } else {
            button.innerText = 'Smart Update';
        }
        
        button.classList.add('pulsing');
    }
});
