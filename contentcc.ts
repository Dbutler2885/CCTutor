let dataPackage: {
    textbookContent?: string,
    questionContent?: string,
    codeSnippet?: string,
    thirdWindowContent?: string,
    reviewContent?: string,
    introContent?: string
} = {}; 

// Helper function to get content
const getContent = (targetElement: string | HTMLElement): string | undefined => {
    const elem: HTMLElement | null = 
        typeof targetElement === "string" ? document.querySelector(targetElement) : targetElement;
    return elem?.textContent?.trim();
};

// Function to handle the active state and update the dataPackage
const handleActiveState = () => {
    const firstDisabledCheckpoint: HTMLElement | null = document.querySelector('.styles_checkpointDisabled__7AnpZ');
    const allQuestions: NodeListOf<HTMLElement> = document.querySelectorAll('.styles_checkpoint__DxsLV');
    const activeQuestion: HTMLElement | null = firstDisabledCheckpoint 
        ? firstDisabledCheckpoint.previousElementSibling as HTMLElement | null 
        : allQuestions[allQuestions.length - 1];

    if (activeQuestion) {
        const activeQuestionIndex: number = Array.from(allQuestions).indexOf(activeQuestion);
        dataPackage.questionContent = getContent(activeQuestion);
        dataPackage.codeSnippet = getContent('.styles_codeEditor__xyz');
        dataPackage.thirdWindowContent = getContent('.styles_thirdWindow__xyz');
        
        if (activeQuestionIndex === 0) {
            dataPackage.textbookContent = getContent('.styles_textbookContent__xyz');
        }
    } else {
        const headerText: string | undefined = getContent('h3');
        if (headerText === 'Review') {
            dataPackage.reviewContent = getContent('.styles_reviewContent__xyz');
            dataPackage.codeSnippet = getContent('.styles_codeEditor__xyz');
        } else {
            dataPackage.introContent = getContent('.styles_introContent__xyz');
        }
    }
};

window.onload = function() {
    // Explicitly query the DOM elements once the page has loaded
    handleActiveState();

    /* Set up the MutationObserver to monitor changes to the
    parent div of the active question. this is necessary because of
    the SPA changes in-between sets of questions. new sets load 
    at page-load
    */
    const sampleQuestion: HTMLElement | null = document.querySelector('.styles_checkpoint__DxsLV');
    if (sampleQuestion && sampleQuestion.parentElement) {
        const parentElement = sampleQuestion.parentElement;
        const observer = new MutationObserver(handleActiveState);
        observer.observe(parentElement, { childList: true, subtree: true });
    }
};
