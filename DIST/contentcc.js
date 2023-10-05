"use strict";
//DEBUG Global Variable.
const DEBUG = true;
// Constants for DOM selectors
const SELECTORS = {
    TEXT: '[class*="styles_spacing-tight"]',
    CODE: '.view-lines',
    ALL_QUESTIONS: '[class*="styles_checkpoint__"]',
    TERMINAL: '.xterm-rows',
    SPECIAL_CONTENT: 'main[tabindex="0"]',
    WRONG_ANSWER: '[class*="styles_checkboxUnsatisfied"]',
    CORRECT_ANSWER: '[class*="styles_checkboxSatisfied"]'
};
let dataPackage = {};
// Log messages if DEBUG is enabled
const log = (message, data) => {
    if (DEBUG) {
        console.log(message, data);
    }
};
// Utility function to update dataPackage and log the change
const updateAndLogData = (key, value) => {
    dataPackage[key] = value;
    log(`${key} Content:`, value);
};
const getContentRecursively = (element) => {
    let content = '';
    element.childNodes.forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) {
            content += child.textContent + '\n';
        }
        else if (child.nodeType === Node.ELEMENT_NODE) {
            content += handleSpecialTags(child);
        }
    });
    return content.trim();
};
const handleSpecialTags = (element) => {
    var _a;
    const tagName = element.tagName.toLowerCase();
    if (tagName === 'p') {
        return element.textContent + '\n';
    }
    else if (tagName === 'pre' && element.querySelector('code')) {
        const codeContent = ((_a = element.querySelector('code')) === null || _a === void 0 ? void 0 : _a.textContent) || '';
        return '```\n' + codeContent + '\n```\n';
    }
    else {
        return getContentRecursively(element);
    }
};
const getContent = (selector) => {
    var _a;
    const elem = document.querySelector(selector);
    if (!elem) {
        return undefined;
    }
    if (elem.matches(SELECTORS.CODE)) {
        return extractCodeContent(elem);
    }
    return (_a = elem.textContent) === null || _a === void 0 ? void 0 : _a.trim();
};
const extractCodeContent = (element) => {
    let codeLines = [];
    const lineDivs = element.querySelectorAll('.view-line');
    lineDivs.forEach((lineDiv) => {
        const lineText = Array.from(lineDiv.querySelectorAll('span'))
            .filter(span => !span.querySelector('span'))
            .map(span => span.textContent)
            .join('')
            .replace(/\u00a0/g, ' ');
        codeLines.push(lineText);
    });
    return codeLines.join('\n').trim();
};
const updateContentBasedOnActiveState = () => {
    log("Updating based on active state.");
    const activeQuestion = getActiveQuestion();
    if (activeQuestion) {
        updateQuestionContent(activeQuestion);
    }
    else {
        updateContentBasedOnHeaderText();
    }
    chrome.runtime.sendMessage({ type: "DATA_PACKAGE", payload: dataPackage });
};
const updateTerminalContent = () => {
    const terminalContent = getContent(SELECTORS.TERMINAL);
    updateAndLogData('terminalContent', terminalContent);
};
const updateContentBasedOnHeaderText = () => {
    const headerText = getContent('h3');
    if (headerText === 'Review') {
        updateReviewData();
    }
    else if (getContent(SELECTORS.SPECIAL_CONTENT)) {
        updateSpecialCaseContent();
    }
    else {
        updateIntroData();
    }
};
const updateReviewData = () => {
    const reviewContent = getContent(SELECTORS.TEXT);
    const codeSnippet = getContent(SELECTORS.CODE);
    updateAndLogData('reviewContent', reviewContent);
    updateAndLogData('codeSnippet', codeSnippet);
};
const updateIntroData = () => {
    const introContent = getContent(SELECTORS.TEXT);
    updateAndLogData('introContent', introContent);
    return !!introContent;
};
const updateSpecialCaseContent = () => {
    const specialCaseContent = getContent(SELECTORS.SPECIAL_CONTENT);
    updateAndLogData('specialCaseContent', specialCaseContent);
};
const updateQuestionContent = (activeQuestion) => {
    const activeQuestionIndex = getActiveQuestionIndex(activeQuestion);
    log("Active Question Index:", activeQuestionIndex);
    if (activeQuestionIndex === 0) {
        updateFirstQuestionData(activeQuestion);
    }
    else {
        updateCommonQuestionData(activeQuestion);
    }
};
const updateFirstQuestionData = (activeQuestion) => {
    updateCommonQuestionData(activeQuestion);
    const textbookContent = getContent(SELECTORS.TEXT);
    updateAndLogData('textbookContent', textbookContent);
};
const updateCommonQuestionData = (activeQuestion) => {
    const contentElement = getContentElementFromQuestion(activeQuestion);
    if (contentElement) {
        const questionContent = getContentRecursively(contentElement);
        updateAndLogData('questionContent', questionContent);
    }
    const codeSnippet = getContent(SELECTORS.CODE);
    updateAndLogData('codeSnippet', codeSnippet);
    // Updating terminal content
    updateTerminalContent();
};
const getContentElementFromQuestion = (activeQuestion) => {
    const parentElement = activeQuestion.parentElement;
    return (parentElement === null || parentElement === void 0 ? void 0 : parentElement.querySelector(SELECTORS.TEXT)) || null;
};
const getActiveQuestion = () => {
    var _a;
    const firstDisabledCheckpoint = document.querySelector('[class*="styles_checkpointDisabled"]');
    if (firstDisabledCheckpoint) {
        const parentDiv = firstDisabledCheckpoint.parentElement;
        const secondPreviousSibling = (_a = parentDiv === null || parentDiv === void 0 ? void 0 : parentDiv.previousElementSibling) === null || _a === void 0 ? void 0 : _a.previousElementSibling;
        return (secondPreviousSibling === null || secondPreviousSibling === void 0 ? void 0 : secondPreviousSibling.firstElementChild) || null;
    }
    const allQuestions = document.querySelectorAll(SELECTORS.ALL_QUESTIONS);
    return allQuestions[allQuestions.length - 1];
};
const getActiveQuestionIndex = (activeQuestion) => {
    const allQuestions = document.querySelectorAll(SELECTORS.ALL_QUESTIONS);
    return Array.from(allQuestions).indexOf(activeQuestion);
};
window.onload = function () {
    log("Page loaded.");
    setTimeout(() => {
        var _a;
        updateContentBasedOnActiveState();
        const observer = new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    log('A child node has been added or removed.');
                    updateContentBasedOnActiveState();
                }
            }
        });
        const sampleQuestion = document.querySelector(SELECTORS.ALL_QUESTIONS);
        if ((_a = sampleQuestion === null || sampleQuestion === void 0 ? void 0 : sampleQuestion.parentElement) === null || _a === void 0 ? void 0 : _a.parentElement) {
            log("Setting up MutationObserver.");
            const grandParentElement = sampleQuestion.parentElement.parentElement;
            observer.observe(grandParentElement, { childList: true, subtree: true });
        }
    }, 3000);
};
