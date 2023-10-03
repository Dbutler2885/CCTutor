"use strict";
let dataPackage = {};
// --- Content Fetching and Updating Functions ---
// Modify handleActiveState accordingly
const handleActiveState = () => {
    console.log("handleActiveState called.");
    const activeQuestion = getActiveQuestion();
    if (activeQuestion) {
        const activeQuestionIndex = getActiveQuestionIndex(activeQuestion);
        console.log("Active Question Index:", activeQuestionIndex);
        if (activeQuestionIndex === 0) {
            updateFirstQuestionData(activeQuestion);
        }
        else {
            updateQuestionData(activeQuestion);
        }
        updateThirdWindowContent();
    }
    else {
        const headerText = getContent('h3');
        if (headerText === 'Review') {
            updateReviewData();
        }
        else if (updateIntroData() === false) { // If intro content is null
            updateSpecialCaseContent(); // Check for the special case content
        }
    }
    chrome.runtime.sendMessage({ type: "DATA_PACKAGE", payload: dataPackage });
};
// ... [Rest of your code]
const updateThirdWindowContent = () => {
    const terminalElem = document.querySelector('.xterm-rows');
    if (terminalElem) {
        dataPackage.terminalContent = getContentRecursively(terminalElem);
        console.log('Terminal Content:', dataPackage.terminalContent);
    }
};
const updateSpecialCaseContent = () => {
    console.log("Updating data for the special content section.");
    dataPackage.specialCaseContent = getContent('main[tabindex="0"]');
    console.log('Special Content Section:', dataPackage.specialCaseContent);
};
const updateFirstQuestionData = (activeQuestion) => {
    console.log("Updating data for the first question.");
    updateCommonQuestionData(activeQuestion);
    dataPackage.textbookContent = getContent('[class*="styles_spacing-tight"]');
    console.log('Textbook Content:', dataPackage.textbookContent);
};
const updateQuestionData = (activeQuestion) => {
    console.log("Updating data for a question other than the first one.");
    updateCommonQuestionData(activeQuestion);
};
const updateCommonQuestionData = (activeQuestion) => {
    const contentElement = getContentElement(activeQuestion);
    if (contentElement !== null) {
        dataPackage.questionContent = getContentRecursively(contentElement);
        console.log('Question Content:', dataPackage.questionContent);
    }
    dataPackage.codeSnippet = getContent('.view-lines');
    console.log('Code Snippet:', dataPackage.codeSnippet);
    dataPackage.thirdWindowContent = getContent('[class*="styles_thirdWindow"]');
    console.log('Third Window Content:', dataPackage.thirdWindowContent);
};
const updateReviewData = () => {
    console.log("Updating data for the Review section.");
    dataPackage.reviewContent = getContent('[class*="styles_spacing-tight"]');
    console.log('Review Content:', dataPackage.reviewContent);
    dataPackage.codeSnippet = getContent('.view_lines');
};
const updateIntroData = () => {
    console.log("Updating data for the Intro section.");
    dataPackage.introContent = getContent('[class*="styles_spacing-tight"]');
    if (dataPackage.introContent) {
        console.log('Intro Content:', dataPackage.introContent);
        return true; // Successfully fetched the intro content
    }
    else {
        return false; // Failed to fetch the intro content
    }
};
// --- Helper Functions ---
const getContentRecursively = (element) => {
    let content = '';
    element.childNodes.forEach(child => {
        var _a;
        if (child.nodeType === Node.TEXT_NODE) {
            content += child.textContent + '\n';
        }
        else if (child.nodeType === Node.ELEMENT_NODE) {
            const childElem = child;
            // Special logging for <p> tags
            if (childElem.tagName.toLowerCase() === 'p') {
                content += childElem.textContent + '\n';
            }
            // Special handling for <pre> and <code> tags
            else if (childElem.tagName.toLowerCase() === 'pre' && childElem.querySelector('code')) {
                const codeContent = ((_a = childElem.querySelector('code')) === null || _a === void 0 ? void 0 : _a.textContent) || '';
                content += '```\n' + codeContent + '\n```\n';
            }
            else {
                content += getContentRecursively(childElem);
            }
        }
    });
    return content.trim();
};
const getContent = (targetElement) => {
    var _a;
    const elem = typeof targetElement === "string"
        ? document.querySelector(targetElement)
        : targetElement;
    // For code snippets
    if (elem && elem.matches('.view-lines')) {
        let codeLines = [];
        const lineDivs = elem.querySelectorAll('.view-line');
        lineDivs.forEach((lineDiv) => {
            let lineText = '';
            const spans = lineDiv.querySelectorAll('span');
            // Only consider the innermost span
            spans.forEach((span) => {
                if (!span.querySelector('span')) { // Check if the span contains another span
                    lineText += span.textContent;
                }
            });
            lineText = lineText.replace(/\u00a0/g, ' '); // Replace non-breaking spaces
            codeLines.push(lineText);
        });
        return codeLines.join('\n').trim();
    }
    // For specified class matches, fetch content recursively
    if (elem && (elem.matches('[class*="styles_spacing-tight"]') || elem.matches('main[tabindex="0"]'))) {
        return getContentRecursively(elem);
    }
    // For other elements, just get the text content
    return (_a = elem === null || elem === void 0 ? void 0 : elem.textContent) === null || _a === void 0 ? void 0 : _a.trim();
};
const getContentElement = (activeQuestion) => {
    const parentElement = activeQuestion.parentElement;
    return (parentElement === null || parentElement === void 0 ? void 0 : parentElement.querySelector('[class*="styles_spacing-tight__BpBl3"]')) || null;
};
const getActiveQuestion = () => {
    var _a;
    const firstDisabledCheckpoint = document.querySelector('[class*="styles_checkpointDisabled"]');
    if (firstDisabledCheckpoint) {
        const parentDiv = firstDisabledCheckpoint.parentElement;
        const secondPreviousSibling = (_a = parentDiv === null || parentDiv === void 0 ? void 0 : parentDiv.previousElementSibling) === null || _a === void 0 ? void 0 : _a.previousElementSibling;
        return (secondPreviousSibling === null || secondPreviousSibling === void 0 ? void 0 : secondPreviousSibling.firstElementChild) || null;
    }
    const allQuestions = document.querySelectorAll('[class*="styles_checkpoint__"]');
    return allQuestions[allQuestions.length - 1];
};
const getActiveQuestionIndex = (activeQuestion) => {
    const allQuestions = document.querySelectorAll('[class*="styles_checkpoint__"]');
    return Array.from(allQuestions).indexOf(activeQuestion);
};
// --- Initialization and Event Handling ---
window.onload = function () {
    console.log("Page loaded.");
    setTimeout(() => {
        var _a;
        handleActiveState();
        const observer = new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    console.log('A child node has been added or removed.');
                    handleActiveState();
                }
            }
        });
        const sampleQuestion = document.querySelector('[class*="styles_checkpoint__"]');
        if ((_a = sampleQuestion === null || sampleQuestion === void 0 ? void 0 : sampleQuestion.parentElement) === null || _a === void 0 ? void 0 : _a.parentElement) {
            console.log("Setting up MutationObserver.");
            const grandParentElement = sampleQuestion.parentElement.parentElement;
            observer.observe(grandParentElement, { childList: true, subtree: true });
        }
    }, 3000);
};
