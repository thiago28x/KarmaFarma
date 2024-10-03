// Global variables
let postDetails = {}, comments = [], commentsQty = 20, language = "", customInstructions = "", model = "meta-llama/llama-3.2-11b-vision-instruct:free", mood = "sassy";

// Add event listeners in one block
document.addEventListener("DOMContentLoaded", () => {
    const elements = {
        testBtn: document.getElementById("test"),
        languageSelector: document.getElementById("dd-language"),
        customInstructionsSelector: document.getElementById("customInstructions"),
        llmModelSelector: document.getElementById("dd-model"),
        ddMood: document.getElementById("dd-mood"),
        getCommentsBtn: document.getElementById("getComments"),
        status1: document.getElementById("status1"),
        status2: document.getElementById("status2")
    };

    const setStatus = (m1, m2 = '') => {
        elements.status1.textContent = m1;
        elements.status2.textContent = m2;
    };

    const fetchComments = async (url) => {
        if (!url.includes("reddit.com/r/")) return setStatus("error", "Not a Reddit post 🤔");
        try {
            const response = await fetch(url.replace("#lightbox", "") + ".json");
            if (!response.ok) throw new Error("HTTP error: " + response.status);
            const data = await response.json();
            processRedditData(data);
        } catch (error) {
            console.error(error.message, error.stack);
            setStatus("error", error.message);
        }
    };

    const processRedditData = (data) => {
        if (!data.length || !data[0].data.children.length) return;

        const post = data[0].data.children[0].data;
        postDetails = {
            title: cleanText(post.title),
            body: cleanText(post.selftext),
            subreddit: post.subreddit,
            flair: post.link_flair_css_class || ""
        };
        console.log("Post Details:", postDetails);

        if (data.length > 1 && data[1].data.children.length) {
            comments = data[1].data.children.slice(0, commentsQty).map(comment => ({
               // author: comment.data.author,
                body: cleanText(comment.data.body)
            }));
            console.log("Comments: \n", comments , '\n\n');
            setStatus(postDetails.title, `Analyzing ${comments.length} comments...`);
            requestAIReply(postDetails, comments.map(c => ` '${c.body}.' `).join(", "));
        }
    };

    const cleanText = (text) => text
        .replace(/[\'\"\&\n]/g, "")
        .replace(/<[^>]*>/g, "")
        .replace(/gt;/g, "")
        .replace(/https?:\/\/\S+/g, "")
        .replace(/#[a-zA-Z0-9_]+/g, "")
        .replace(/[\u0000-\u00ff][\u0100-\uffff]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff]/g, "");

    const requestAIReply = (postDetails, formattedComments) => {
        chrome.runtime.sendMessage({
            action: "getAIReply",
            postTitle: postDetails.title,
            postBody: postDetails.body,
            formattedComments,
            subreddit: postDetails.subreddit,
            flair: postDetails.flair,
            language,
            customInstructions,
			model,
			mood
        }, (response) => {
            console.log("AI Response:", response);
            setStatus("Finished!");
            displayReplies(response);
			showTab(4);
        });
    };

    // Initialize event listeners
    elements.testBtn.addEventListener("click", () => setStatus("Test clicked"));
    elements.languageSelector.addEventListener("change", (e) => language = e.target.value);
    elements.customInstructionsSelector.addEventListener("change", (e) => customInstructions = e.target.value);
    elements.llmModelSelector.addEventListener("change", (e) => model = e.target.value);
    elements.ddMood.addEventListener("change", (e) => mood = e.target.value);
    elements.getCommentsBtn.addEventListener("click", () => {
        chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
            if (tab) fetchComments(tab.url);
            else setStatus("error", "No active tab found.");
        });
    });

    // Default active tab processing
    chrome.runtime.sendMessage({ action: "getActiveTabUrl" }, (response) => {
        console.log("Active Tab URL:", response.url);
    });
});




// Utility function to display replies
function displayReplies(response) {
    const repliesContainer = document.getElementById("repliesContainer");
    repliesContainer.innerHTML = ""; // Clear any previous replies

    let repliesArray;

    // If the response is a stringified array, parse it first
    if (typeof response === "string") {
        try {
            repliesArray = JSON.parse(response);
        } catch (error) {
            console.error("Error parsing response:", error);
            return;
        }
    } else {
        repliesArray = Array.isArray(response) ? response : [response];
    }

    // Iterate through the array and create elements for each reply
    repliesArray.forEach(reply => {
        const replyElement = document.createElement("div");
        replyElement.classList.add("reply");

        const replyParagraph = document.createElement("p");
        replyParagraph.textContent = reply;

        replyElement.appendChild(replyParagraph);
        repliesContainer.appendChild(replyElement);
    });
}





// popup.js

// Function to send the text to the content script
function insertCommentInRedditTab(commentText) {
	chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
		chrome.tabs.sendMessage(tabs[0].id, {action: "insertComment", text: commentText}, (response) => {
			if (response && response.status === "success") {
				console.log("Comment inserted successfully.");
			} else {
				console.error("Failed to insert comment.");
			}
		});
	});
}

document.getElementById("test").addEventListener("click", () => {
	const commentText = "This is an automated comment.";
	insertCommentInRedditTab(commentText);
});



document.addEventListener("DOMContentLoaded", function () {
	const buttons = document.querySelectorAll(".icon-button");

	buttons.forEach((button) => {
		button.addEventListener("click", function () {
			const tabNumber = this.getAttribute("data-tab");
			showTab(tabNumber);
		});
	});
});

function showTab(tabNumber) {
	// Hide all tabs
	document.querySelectorAll(".tab").forEach((tab) => {
		tab.style.display = "none";
	});

	// Show the selected tab
	const selectedTab = document.getElementById(tabNumber);
	if (selectedTab) {
		selectedTab.style.display = "block";
	}
}





function loadHistory() {
	chrome.storage.local.get({ history: [] }, (data) => {
		const historyList = document.getElementById("historyList"); // Assume this element exists in your HTML

		data.history.forEach((request, index) => {
			const listItem = document.createElement("li");
			listItem.textContent = `Request ${index + 1}: ${request.model}, ${request.subreddit}, ${new Date()}`;
			
			const retryBtn = document.createElement("button");
			retryBtn.textContent = "Retry";
			retryBtn.addEventListener("click", () => retryRequest(request));
			
			listItem.appendChild(retryBtn);
			historyList.appendChild(listItem);
		});
	});
}


function test() {
	console.log("test");

	// First, select the comment box with the contenteditable attribute
	const commentBox = document.querySelector('div[contenteditable="true"][name="body"]');

	if (commentBox) {
		// Focus on the comment box to make it active
		commentBox.focus();
		const eventOptions = {bubbles: true, cancelable: true, view: window};

		// Simulate mouse click to activate the box
		commentBox.dispatchEvent(new MouseEvent("mousedown", eventOptions));
		commentBox.dispatchEvent(new MouseEvent("mouseup", eventOptions));

		// Use execCommand to insert text
		document.execCommand("insertText", false, "test");

		console.log("Text inserted successfully");
	}
}

showTab(1);
