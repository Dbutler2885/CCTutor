//DEBUG Global Variable.
const DEBUG = true;

// Constants for DOM selectors
const SELECTORS = {
    STYLES_SPACING_TIGHT: '[class*="styles_spacing-tight"]',
    VIEW_LINES: '.view-lines',
    STYLES_CHECKPOINT: '[class*="styles_checkpoint__"]',
    XTERM_ROWS: '.xterm-rows',
    SPECIAL_CONTENT: 'main[tabindex="0"]'
};

interface DataPackage {
    textbookContent?: string;
    questionContent?: string;
    codeSnippet?: string;
    reviewContent?: string;
    introContent?: string;
    specialCaseContent?: string;
    terminalContent?: string;
}

let dataPackage: DataPackage = {};

// Log messages if DEBUG is enabled
const log = (message: string, data?: any) => {
    if (DEBUG) {
        console.log(message, data);
    }
};

// Utility function to update dataPackage and log the change
const updateAndLogData = (key: keyof DataPackage, value: any) => {
    dataPackage[key] = value;
    log(`${key} Content:`, value);
};

const getContentRecursively = (element: Node | HTMLElement): string => {
    let content = '';

    element.childNodes.forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) {
            content += child.textContent + '\n';
        } else if (child.nodeType === Node.ELEMENT_NODE) {
            content += handleSpecialTags(child as HTMLElement);
        }
    });

    return content.trim();
};

const handleSpecialTags = (element: HTMLElement): string => {
    const tagName = element.tagName.toLowerCase();
    if (tagName === 'p') {
        return element.textContent + '\n';
    } else if (tagName === 'pre' && element.querySelector('code')) {
        const codeContent = element.querySelector('code')?.textContent || '';
        return '```\n' + codeContent + '\n```\n';
    } else {
        return getContentRecursively(element);
    }
};

const getContent = (selector: string): string | undefined => {
    const elem = document.querySelector(selector);

    if (!elem) {
        return undefined;
    }

    if (elem.matches(SELECTORS.VIEW_LINES)) {
        return extractCodeContent(elem);
    }

    return elem.textContent?.trim();
};

const extractCodeContent = (element: Element): string => {
    let codeLines: string[] = [];
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
    } else {
        updateContentBasedOnHeaderText();
    }

    chrome.runtime.sendMessage({ type: "DATA_PACKAGE", payload: dataPackage });
};

const updateTerminalContent = () => {
    const terminalContent = getContent(SELECTORS.XTERM_ROWS);
    updateAndLogData('terminalContent', terminalContent);
};

const updateContentBasedOnHeaderText = () => {
    const headerText = getContent('h3');
    switch (headerText) {
        case 'Review':
            updateReviewData();
            break;
        case 'Intro':
            if (!updateIntroData()) {
                updateSpecialCaseContent();
            }
            break;
        default:
            updateSpecialCaseContent();
            break;
    }
};

const updateReviewData = () => {
    const reviewContent = getContent(SELECTORS.STYLES_SPACING_TIGHT);
    const codeSnippet = getContent(SELECTORS.VIEW_LINES);
    updateAndLogData('reviewContent', reviewContent);
    updateAndLogData('codeSnippet', codeSnippet);
};

const updateIntroData = (): boolean => {
    const introContent = getContent(SELECTORS.STYLES_SPACING_TIGHT);
    updateAndLogData('introContent', introContent);
    return !!introContent;
};

const updateSpecialCaseContent = () => {
    const specialCaseContent = getContent(SELECTORS.SPECIAL_CONTENT);
    updateAndLogData('specialCaseContent', specialCaseContent);
};

const updateQuestionContent = (activeQuestion: HTMLElement) => {
    const activeQuestionIndex = getActiveQuestionIndex(activeQuestion);
    log("Active Question Index:", activeQuestionIndex);

    if (activeQuestionIndex === 0) {
        updateFirstQuestionData(activeQuestion);
    } else {
        updateCommonQuestionData(activeQuestion);
    }
};

const updateFirstQuestionData = (activeQuestion: HTMLElement) => {
    updateCommonQuestionData(activeQuestion);
    const textbookContent = getContent(SELECTORS.STYLES_SPACING_TIGHT);
    updateAndLogData('textbookContent', textbookContent);
};

const updateCommonQuestionData = (activeQuestion: HTMLElement) => {
    const contentElement = getContentElementFromQuestion(activeQuestion);
    if (contentElement) {
        const questionContent = getContentRecursively(contentElement);
        updateAndLogData('questionContent', questionContent);
    }

    const codeSnippet = getContent(SELECTORS.VIEW_LINES);
    updateAndLogData('codeSnippet', codeSnippet);

    // Updating terminal content
    updateTerminalContent();
};

const getContentElementFromQuestion = (activeQuestion: HTMLElement): HTMLElement | null => {
    const parentElement = activeQuestion.parentElement;
    return parentElement?.querySelector(SELECTORS.STYLES_SPACING_TIGHT) || null; 
};

const getActiveQuestion = (): HTMLElement | null => {
    const firstDisabledCheckpoint = document.querySelector('[class*="styles_checkpointDisabled"]');
  
    if (firstDisabledCheckpoint) {
        const parentDiv = firstDisabledCheckpoint.parentElement;
        const secondPreviousSibling = parentDiv?.previousElementSibling?.previousElementSibling;
        return secondPreviousSibling?.firstElementChild as HTMLElement || null;
    }

    const allQuestions = document.querySelectorAll(SELECTORS.STYLES_CHECKPOINT);
    return allQuestions[allQuestions.length - 1] as HTMLElement;
};

const getActiveQuestionIndex = (activeQuestion: HTMLElement): number => {
    const allQuestions = document.querySelectorAll(SELECTORS.STYLES_CHECKPOINT);
    return Array.from(allQuestions).indexOf(activeQuestion);
};

window.onload = function () {
    log("Page loaded.");

    setTimeout(() => {
        updateContentBasedOnActiveState();

        const observer = new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    log('A child node has been added or removed.');
                    updateContentBasedOnActiveState();
                }
            }
        });

        const sampleQuestion = document.querySelector(SELECTORS.STYLES_CHECKPOINT);

        if (sampleQuestion?.parentElement?.parentElement) {
            log("Setting up MutationObserver.");
            const grandParentElement = sampleQuestion.parentElement.parentElement;
            observer.observe(grandParentElement, { childList: true, subtree: true });
        }
    }, 3000);
};
