// Interface to hold the data package
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

let dataPackage: DataPackage = {};

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
    } else {
      updateQuestionData(activeQuestion); 
    }
    updateThirdWindowContent();
  } else {
    const headerText = getContent('h3');
    if (headerText === 'Review') {
      updateReviewData();
    } else if (updateIntroData() === false) {
      updateSpecialCaseContent(); 
    }
  }
  chrome.runtime.sendMessage({ type: "DATA_PACKAGE", payload: dataPackage })
};

const updateThirdWindowContent = () => {
  const terminalElem = document.querySelector('.xterm-rows');
  
  if (terminalElem) {
    dataPackage.terminalContent = getContentRecursively(terminalElem as HTMLElement);
    console.log('Terminal Content:', dataPackage.terminalContent);
  }
};

const updateSpecialCaseContent = () => {
  console.log("Updating data for the special content section.");

  dataPackage.specialCaseContent = getContent('main[tabindex="0"]');
  
  console.log('Special Content Section:', dataPackage.specialCaseContent);
};
const updateFirstQuestionData = (activeQuestion: HTMLElement) => {
  console.log("Updating data for the first question.");
  
  updateCommonQuestionData(activeQuestion);
  
  dataPackage.textbookContent = getContent('[class*="styles_spacing-tight"]');
  
  console.log('Textbook Content:', dataPackage.textbookContent);
};

const updateQuestionData = (activeQuestion: HTMLElement) => {
  console.log("Updating data for a question other than the first one.");
  
  updateCommonQuestionData(activeQuestion);
};

const updateCommonQuestionData = (activeQuestion: HTMLElement) => {
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

const updateIntroData = (): boolean => {
  console.log("Updating data for the Intro section.");
  
  dataPackage.introContent = getContent('[class*="styles_spacing-tight"]');
  
  if (dataPackage.introContent) {
    console.log('Intro Content:', dataPackage.introContent);
    return true;
  } else {
    return false;
  }
};

// --- Helper Functions ---
const getContentRecursively = (element: Node | HTMLElement): string => {
  let content = '';

  element.childNodes.forEach(child => {
    if (child.nodeType === Node.TEXT_NODE) {
      content += child.textContent + '\n';
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const childElem = child as HTMLElement;

      

      // Special logging for <p> tags
      if (childElem.tagName.toLowerCase() === 'p') {
        content += childElem.textContent + '\n';
      }
      // Special handling for <pre> and <code> tags
      else if (childElem.tagName.toLowerCase() === 'pre' && childElem.querySelector('code')) {
        const codeContent = childElem.querySelector('code')?.textContent || '';
        content += '```\n' + codeContent + '\n```\n';
      } else {
        content += getContentRecursively(childElem);
      }
    }
  });

  return content.trim();
};



const getContent = (targetElement: string | HTMLElement): string | undefined => {
  const elem = typeof targetElement === "string" 
    ? document.querySelector(targetElement)
    : targetElement;

  // For code snippets
  if (elem && elem.matches('.view-lines')) {
    let codeLines: string[] = [];
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
      lineText = lineText.replace(/\u00a0/g, ' ');  // Replace non-breaking spaces
      codeLines.push(lineText);
    });
    return codeLines.join('\n').trim();
  }

  // For specified class matches, fetch content recursively
  if (elem && (elem.matches('[class*="styles_spacing-tight"]') || elem.matches('main[tabindex="0"]'))) {
    return getContentRecursively(elem as HTMLElement);
  }

  // For other elements, just get the text content
  return elem?.textContent?.trim();
};

const getContentElement = (activeQuestion: HTMLElement): HTMLElement | null => {
  const parentElement = activeQuestion.parentElement;
  return parentElement?.querySelector('[class*="styles_spacing-tight__BpBl3"]') || null; 
};


const getActiveQuestion = (): HTMLElement | null => {
  const firstDisabledCheckpoint = document.querySelector('[class*="styles_checkpointDisabled"]');
  
  if (firstDisabledCheckpoint) {
    const parentDiv = firstDisabledCheckpoint.parentElement;
    const secondPreviousSibling = parentDiv?.previousElementSibling?.previousElementSibling;
    
    return secondPreviousSibling?.firstElementChild as HTMLElement || null;
  }
  
  const allQuestions = document.querySelectorAll('[class*="styles_checkpoint__"]');
  return allQuestions[allQuestions.length - 1] as HTMLElement;
};

const getActiveQuestionIndex = (activeQuestion: HTMLElement): number => {
  const allQuestions = document.querySelectorAll('[class*="styles_checkpoint__"]');
  return Array.from(allQuestions).indexOf(activeQuestion);
};
// --- Initialization and Event Handling ---

window.onload = function() {
  console.log("Page loaded.");
  
  setTimeout(() => {
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
    
    if (sampleQuestion?.parentElement?.parentElement) {
      console.log("Setting up MutationObserver.");
      
      const grandParentElement = sampleQuestion.parentElement.parentElement;
      observer.observe(grandParentElement, { childList: true, subtree: true }); 
    }
    
  }, 3000);
};
