let postDetails = {}, comments = [], commentsQty = 20, language = "", customInstructions = "", model = "meta-llama/llama-3.2-11b-vision-instruct:free", mood = "sassy";

//log all global variable values
console.log(`global variables: \nLanguage: ${language || "(empty)"} | Custom Instructions: ${customInstructions || "(empty)"} | Model: ${model || "(empty)"} | Mood: ${mood || "(empty)"}`);

let elements = {};

// variable for buttons and dropdown
document.addEventListener("DOMContentLoaded", () => {
	console.log("DOM content loaded. storing 'elements'");

	elements = {
		testBtn: document.getElementById("test"),
		loadmore: document.getElementById("btn-load-more"),
		languageSelector: document.getElementById("dd-language"),
		customInstructionsSelector: document.getElementById("customInstructions"),
		llmModelSelector: document.getElementById("dd-model"),
		ddMood: document.getElementById("dd-mood"),
		getCommentsBtn: document.getElementById("getComments"),
		status1: document.getElementById("status1"),
		status2: document.getElementById("status2"),
	};

	const setStatus = (m1, m2 = "") => {
		elements.status1.textContent = m1;
		elements.status2.textContent = m2;
	};

	// Initialize event listeners
	elements.testBtn.addEventListener("click", () => setStatus("Test clicked"));
	elements.loadmore.addEventListener("click", () => loadMore("loading..."));
	// Add an event listener to the language selector. When it changes, store the
	// selected language in chrome storage. The callback function is called after
	// the storage has been set, and it logs the newly saved language to the
	// console. Finally, the selected value of the language selector is set to the
	// newly saved language, so that the UI stays in sync with the storage.
	// Add an event listener to the language selector. When it changes, store the
	// selected language in chrome storage. The callback function is called after
	// the storage has been set, and it logs the newly saved language to the
	// console. Finally, the selected value of the language selector is set to the
	// newly saved language, so that the UI stays in sync with the storage.
	elements.languageSelector.addEventListener("change", (e) => {
		// Set the selected language in chrome storage
		chrome.storage.local.set({language: e.target.value}, () => {
			// Log the newly saved language to the console
			console.log("Language saved: " + e.target.value);
		});
		// Set the selected value of the language selector to the newly saved language
		elements.languageSelector.value = e.target.value;
        //if not empty, update the global variable language
        if (e.target.value != "") {
            language = e.target.value;
        }
	});

	elements.customInstructionsSelector.addEventListener("change", (e) => {
		chrome.storage.local.set({customInstructions: e.target.value}, () => {
			console.log("Custom Instructions saved: " + e.target.value);
		});
		elements.customInstructionsSelector.value = e.target.value;
        //if not empty, update the global variable customInstructions
        if (e.target.value != "") {
            customInstructions = e.target.value;
        }
	});
	elements.llmModelSelector.addEventListener("change", (e) => {
		chrome.storage.local.set({model: e.target.value}, () => {
			console.log("Model saved: " + e.target.value);
		});
		elements.llmModelSelector.value = e.target.value;
        //if not empty, update the global variable Model
        if (e.target.value != "") {
            model = e.target.value;
        }
	});
	elements.ddMood.addEventListener("change", (e) => {
		chrome.storage.local.set({mood: e.target.value}, () => {
			console.log("Mood saved: " + e.target.value);
		});
		elements.ddMood.value = e.target.value;
	});
	elements.getCommentsBtn.addEventListener("click", () => {
		chrome.tabs.query({active: true, currentWindow: true}, ([tab]) => {
			if (tab) fetchComments(tab.url);
			else setStatus("error", "No active tab found.");
		});
	});

	// Default active tab processing
	chrome.runtime.sendMessage({action: "getActiveTabUrl"}, (response) => {
		console.log("Active Tab URL:", response.url);
	});
	console.log("Done storing buttons and dropdowns");

	storageLoader();
});

function storageLoader() {
	console.log("1 loading storage...");
	console.log(`2 Language selector: ${elements.languageSelector}`);
	//console.log(`Language selector: ${getElementById("dd-language").value}`);
	//getElementById("dd-language").value = "en";

	console.log(`3 Language current value: ${elements.languageSelector.value}`);

	chrome.storage.local.get(["language", "customInstructions", "model", "mood"], (data) => {
		elements.languageSelector.value = data.language ? data.language : "";
		elements.customInstructionsSelector.value = data.customInstructions ? data.customInstructions : "";
		elements.llmModelSelector.value = data.model ? data.model : "meta-llama/llama-3.2-11b-vision-instruct:free";
		elements.ddMood.value = data.mood ? data.mood : "sassy";

		console.log(`Language: ${data.language || "(empty)"} | Custom Instructions: ${data.customInstructions || "(empty)"} | Model: ${data.model || "(empty)"} | Mood: ${data.mood || "(empty)"}`);
	});
}

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
		flair: post.link_flair_css_class || "",
	};
	console.log("Post Details:", postDetails);

	if (data.length > 1 && data[1].data.children.length) {
		comments = data[1].data.children.slice(0, commentsQty).map((comment) => ({
			// author: comment.data.author,
			body: cleanText(comment.data.body),
		}));
		console.log("Comments: \n", comments, "\n\n");
		setStatus(postDetails.title, `Analyzing ${comments.length} comments...`);
		requestAIReply(postDetails, comments.map((c) => ` '${c.body}.' `).join(", "));
	}
};

const cleanText = (text) =>
	text
		.replace(/[\'\"\&\n]/g, "")
		.replace(/<[^>]*>/g, "")
		.replace(/gt;/g, "")
		.replace(/https?:\/\/\S+/g, "")
		.replace(/#[a-zA-Z0-9_]+/g, "")
		.replace(/[\u0000-\u00ff][\u0100-\uffff]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff]/g, "");

const requestAIReply = (postDetails, formattedComments) => {
	chrome.runtime.sendMessage(
		{
			action: "getAIReply",
			postTitle: postDetails.title,
			postBody: postDetails.body,
			formattedComments,
			subreddit: postDetails.subreddit,
			flair: postDetails.flair,
			language,
			customInstructions,
			model,
			mood,
		},
		(response) => {
			console.log("AI Response:", response);
			setStatus("Finished!");
			displayReplies(response);
			showTab(4);
		}
	);
};

function loadMore(text) {
	console.log("Load More Clicked");

	chrome.storage.local.get("history", (data) => {
		const newHistory = data.history || [];
		const repliesContainer = document.getElementById("repliesContainer");
		//   repliesContainer.innerHTML = ""; // Clear any previous replies

		/* if history is empty, set the button text to 'no data' */
		newHistory.forEach((reply) => {
			const replyElement = document.createElement("div");
			replyElement.classList.add("reply");

			const replyParagraph = document.createElement("p");
			replyParagraph.textContent = reply;

			// Create copy icon
			const copyIcon = document.createElement("span");
			copyIcon.classList.add("copy-icon");
			copyIcon.addEventListener("click", () => {
				navigator.clipboard.writeText(reply);
				copyIcon.classList.add("copied");
				setTimeout(() => copyIcon.classList.remove("copied"), 1500);
			});

			replyElement.appendChild(replyParagraph);
			replyElement.appendChild(copyIcon);
			repliesContainer.appendChild(replyElement);
		});

		const loadMoreButton = document.getElementById("btn-load-more");
		loadMoreButton.textContent = text;
		loadMoreButton.disabled = true;
		setTimeout(() => (loadMoreButton.disabled = false), 1000);
	});
}

// Utility function to display replies
function displayReplies(response) {
	const repliesContainer = document.getElementById("repliesContainer");
	// repliesContainer.innerHTML = ""; // Clear any previous replies

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
	repliesArray.forEach((reply) => {
		const replyElement = document.createElement("div");
		replyElement.classList.add("reply");

		const replyParagraph = document.createElement("p");
		replyParagraph.textContent = reply;

		// Create copy icon
		const copyIcon = document.createElement("span");
		copyIcon.classList.add("copy-icon");
		copyIcon.innerHTML = "📋"; // Clipboard emoji or replace with an actual icon if preferred

		// Add copy-to-clipboard functionality
		copyIcon.style.cursor = "pointer";
		copyIcon.title = "Copy to clipboard";
		copyIcon.addEventListener("click", () => {
			navigator.clipboard
				.writeText(reply)
				.then(() => {
					alert("Reply copied to clipboard!");
				})
				.catch((err) => {
					console.error("Failed to copy text: ", err);
				});
		});

		// Append the reply paragraph and copy icon to the reply element
		replyElement.appendChild(replyParagraph);
		replyElement.appendChild(copyIcon);
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
	chrome.storage.local.get({history: []}, (data) => {
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

function setStatus(m1, m2 = "", backgroundColor = "cyan") {
    const statusMessage = document.getElementById('status-message');

    // Check if either message contains the word 'error'
    if (m1.toLowerCase().includes('error') || m2.toLowerCase().includes('error')) {
        backgroundColor = 'red'; // Set background color to red
    }

    // Set the inner HTML with styles
    statusMessage.innerHTML = `
        <span style="font-weight: bold; font-size: 20px;">${m1}</span>
        <span style="font-weight: 400; font-size: 16px;">${m2}</span>
    `.trim();
    
    // Set the background color
    statusMessage.style.backgroundColor = backgroundColor;
    
    // Make the status message visible
    statusMessage.style.display = 'flex'; // Ensure display is flex for layout
    
    // Automatically hide the message after 2 seconds
    setTimeout(() => {
        statusMessage.style.display = 'none';
    }, 2000);
}