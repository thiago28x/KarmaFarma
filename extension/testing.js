function getElementByXPath(xpath) {
    return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

function insertComment(text) {
    const commentBox = getElementByXPath("//div[@contenteditable='true' and @name='body']");
    
    if (commentBox) {
        const eventOptions = { bubbles: true, cancelable: true, view: window };

        // Simulate mouse click to activate the box
        commentBox.dispatchEvent(new MouseEvent('mousedown', eventOptions));
        commentBox.dispatchEvent(new MouseEvent('mouseup', eventOptions));
        commentBox.focus();
        document.execCommand('insertText', false, text);
        console.log("Text inserted successfully using XPath.");
    } else {
        console.error("Comment box not found using XPath.");
    }
}
insertComment('asdasd')





function insertComment(text) {
    const commentBox = document.querySelector("div[contenteditable='true'][name='body'].outline-none");
    
    if (commentBox) {
        commentBox.focus();
        document.execCommand('insertText', false, text);
        console.log("Text inserted successfully with a refined selector.");
    } else {
        console.error("Comment box not found with refined selector.");
    }
}
insertComment('hello world') 

