// DEBUG Global Variable.
const DEBUG = true;

let hasProcessedWrongAnswer: boolean = false;

// Constants for DOM selectors.
const SELECTORS = {
    TEXT: '[class*="styles_spacing-tight"]',
    CODE: '.view-lines',
    ALL_QUESTIONS: '[class*="styles_checkpoint__"]',
    TERMINAL: '.xterm-rows',
    SPECIAL_CONTENT: 'main[tabindex="0"]',
    WRONG_ANSWER: '[class*="styles_checkboxUnsatisfied"]',
    CORRECT_ANSWERS: '[class*="styles_checkboxSatisfied"]',
    HINT_CONTENT: '[class*="styles_errorString__"]',
    DISABLED_CHECKPOINT: '[class*="styles_checkpointDisabled"]'
};

interface DataPackage {
    textbookContent?: string;
    questionContent?: string;
    codeSnippet?: string;
    reviewContent?: string;
    introContent?: string;
    specialCaseContent?: string;
    terminalContent?: string;
    hintContent?: string;
}

let dataPackage: DataPackage = {};

const log = (message: string, data?: any): void => {
    if (DEBUG) {
        console.log("Message:", message, "Data:", data);
    }
};

const updateAndLogData = (key: keyof DataPackage, value: any): void => {
    dataPackage[key] = value;
    log(`${key} Content:`, value);
};

const getContentRecursively = (element: Node): string => {
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
        return '```\n' + (element.querySelector('code')?.textContent || '') + '\n```\n';
    } else {
        return getContentRecursively(element);
    }
};

const getContent = (selector: string): string | undefined => {
  const elem = document.querySelector(selector);
  log('getContent called for selector:', selector);
  if (!elem) {
      return undefined;
  }

  if (elem.matches(SELECTORS.CODE)) {
    log('headed to extractCodeContent')
      return extractCodeContent(elem);
  }
  const content = elem.textContent?.trim()
  log('every content', content);
  return content;
};

const extractCodeContent = (parentElement: Element): string => {
  let codeLines: string[] = [];

  Array.from(parentElement.children).forEach((lineDiv: Element) => {
      const lineText = Array.from(lineDiv.querySelectorAll('span'))
          .filter(span => !span.querySelector('span'))
          .map(span => span.textContent)
          .join('')
          .replace(/\u00a0/g, ' ');
      codeLines.push(lineText);
  });
  
  return codeLines.join('\n').trim();
};


const updateContentBasedOnActiveState = (): void => {
    log("Updating based on active state.");
    const activeQuestion = getActiveQuestion();
    activeQuestion ? updateQuestionContent(activeQuestion) : updateContentBasedOnNonQuestionState();
    chrome.runtime.sendMessage({ type: "DATA_PACKAGE", payload: dataPackage });
};
const updateTerminalContent = (): void => {
  const terminalContent = getContent(SELECTORS.TERMINAL);
  updateAndLogData('terminalContent', terminalContent);
};
const updateContentBasedOnNonQuestionState = (): void => {
  const headerText = getContent('h3');
  if(headerText === 'Review') {
      updateReviewData();
  } else if (getContent(SELECTORS.SPECIAL_CONTENT)) {
      log('updating special case')
      updateSpecialCaseContent();
  } else {
      log('updatingIntrodata')
      updateIntroData();
  }
};
const updateReviewData = (): void => {
  const reviewContent = getContent(SELECTORS.TEXT);
  const codeSnippet = getContent(SELECTORS.CODE);
  updateAndLogData('reviewContent', reviewContent);
  updateAndLogData('codeSnippet', codeSnippet);
};

const updateWrongAnswerData = (): void => {
  const wrongAnswerHintElement = document.querySelector(SELECTORS.HINT_CONTENT);
  if (wrongAnswerHintElement) {
      const hintContent = getContentRecursively(wrongAnswerHintElement);
      const activeQuestion = getActiveQuestion();
      if (activeQuestion) {
        updateCommonQuestionData(activeQuestion)
      }
      updateAndLogData('hintContent', hintContent);
  }
};

const updateIntroData = (): void => {
  const introContent = getContent(SELECTORS.TEXT);
  updateAndLogData('introContent', introContent);
};

const updateSpecialCaseContent = (): void => {
  const specialCaseContent = getContent(SELECTORS.SPECIAL_CONTENT);
  updateAndLogData('specialCaseContent', specialCaseContent);
};

const updateQuestionContent = (activeQuestion: HTMLElement): void => {
  const activeQuestionIndex = getActiveQuestionIndex(activeQuestion);
  log("Active Question Index:", activeQuestionIndex);
  const allQuestions = document.querySelectorAll(SELECTORS.ALL_QUESTIONS)
  const allSatisfied = document.querySelectorAll(SELECTORS.CORRECT_ANSWERS)
  if (allQuestions.length === allSatisfied.length) {
    return;
  }
    else if (activeQuestionIndex === 0) {
      updateFirstQuestionData(activeQuestion);
    } else {
        updateCommonQuestionData(activeQuestion);
  }
};

const updateFirstQuestionData = (activeQuestion: HTMLElement): void => {
  updateCommonQuestionData(activeQuestion);
  const textbookContent = getContent(SELECTORS.TEXT);
  updateAndLogData('textbookContent', textbookContent);
};

const updateCommonQuestionData = (activeQuestion: HTMLElement): void => {
  const contentElement = getContentElementFromQuestion(activeQuestion);
  if (contentElement) {
      const questionContent = getContentRecursively(contentElement);
      updateAndLogData('questionContent', questionContent);
    
  }
  const codeSnippet = getContent(SELECTORS.CODE);
  updateAndLogData('codeSnippet', codeSnippet);
  updateTerminalContent();
};

const getContentElementFromQuestion = (activeQuestion: HTMLElement): HTMLElement | null => {
  const parentElement = activeQuestion.parentElement;
  log('getContentElementFromQuestion', parentElement?.querySelector(SELECTORS.TEXT))
  return parentElement?.querySelector(SELECTORS.TEXT) || null;
};

const getActiveQuestion = (): HTMLElement | null => {
  const firstDisabledCheckpoint = document.querySelector(SELECTORS.DISABLED_CHECKPOINT);
  if (firstDisabledCheckpoint) {
      const parentDiv = firstDisabledCheckpoint.parentElement;
      const secondPreviousSibling = parentDiv?.previousElementSibling?.previousElementSibling;
      log('activeQuestion', secondPreviousSibling?.firstElementChild)
      return secondPreviousSibling?.firstElementChild as HTMLElement || null;
  }

  const allQuestions = document.querySelectorAll(SELECTORS.ALL_QUESTIONS);
  return allQuestions[allQuestions.length - 1] as HTMLElement;
};

const getActiveQuestionIndex = (activeQuestion: HTMLElement): number => {
  const allQuestions = document.querySelectorAll(SELECTORS.ALL_QUESTIONS);
  return Array.from(allQuestions).indexOf(activeQuestion);
};

window.addEventListener('load', () => {
  log("Page loaded.");
  setTimeout(() => {
      updateContentBasedOnActiveState();

      const observer = new MutationObserver(checkForMutations);
      const sampleQuestion = document.querySelector(SELECTORS.ALL_QUESTIONS);
      if (sampleQuestion?.parentElement?.parentElement) {
          log("Setting up MutationObserver.",sampleQuestion?.parentElement?.parentElement );
          observer.observe(sampleQuestion.parentElement.parentElement, { childList: true, subtree: true });
      }
  }, 3000);
});

const checkForMutations = (mutationsList: MutationRecord[]): void => {
  for (const mutation of mutationsList) {
      if (mutation.type === 'childList') {
          log('A child node has been added or removed.');
          if (document.querySelector(SELECTORS.WRONG_ANSWER)) {
              updateWrongAnswerData();
              hasProcessedWrongAnswer = true;
        
            // Reset the flag after 1 second
            setTimeout(() => {
                hasProcessedWrongAnswer = false;
            }, 1000);
              return;
        }
        
          updateContentBasedOnActiveState();
      }
  }
};
