/**
 * Make a request to the OpenRouter API to generate a comment based on the
 * input text.
 *
 * @param {string} commentText - The text to generate a comment based on.
 * @param {function} callback - The callback to run with the generated comment.
 * @param {string} [model] - The model to use. If not provided, a default model
 *     will be used.
 * @param {string} [tone] - The tone to use. If not provided, a default tone
 *     will be used.
 */

chrome.sidePanel.setPanelBehavior({openPanelOnActionClick: true});

const REDDIT_ORIGIN = "https://www.reddit.com";

chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
	if (!tab.url) return;
	const url = new URL(tab.url);
	// Enables the side panel on google.com
	if (url.origin === REDDIT_ORIGIN) {
		await chrome.sidePanel.setOptions({
			tabId,
			path: "sidepanel.html",
			enabled: true,
		});
	} else {
		// Disables the side panel on all other sites
		await chrome.sidePanel.setOptions({
			tabId,
			enabled: false,
		});
	}
});

// Consolidated message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.action === "getActiveTabUrl") {
		chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
			if (tabs.length > 0) {
				sendResponse({url: tabs[0].url});
			} else {
				sendResponse({url: null});
			}
		});
		return true; // Asynchronous response
	} else if (message.action === "getAIReply") {
		openRouter(message.commentText, (data) => {
			if (data && data.choices && data.choices.length > 0) {
				const aiReply = data.choices[0].message.content; // Extract AI reply
				sendResponse(aiReply);
			} else {
				sendResponse({reply: "Error: No reply from AI."});
			}
		});
		return true; // Asynchronous response
	}
});

function openRouter(commentText, callback, model, tone = "sassy") {
	const apiKey = "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";
	const openRouterURL = "https://openrouter.ai/api/v1/chat/completions";

	// Check if commentText is already an array or string
	let listofcomments;

	if (Array.isArray(commentText)) {
		// If it's an array, extract the comment bodies
		listofcomments = commentText.map((comment) => comment.body);
	} else {
		// If it's a string, we assume it's already formatted, so we leave it as is
		listofcomments = commentText;
	}

	console.log("Before Request - Comment List: \n", listofcomments);

	const headers = {
		"Content-Type": "application/json",
		Authorization: `Bearer ${apiKey}`,
	};

	// Prepare the request body for the OpenRouter API
	const body = JSON.stringify({
		model: model || "meta-llama/llama-3.2-11b-vision-instruct:free",
		messages: [
			{
				role: "system",
				content: `I need to create a ${tone} reply to a reddit post. Reply in a similar tone to the comments provided. Be brief, witty, and smart. 
				
				current subreddit: ${subreddit}
				subreddit flair: ${flair}
				language: ${language}
				${customInstructions}
				
				About the formatting:Limit all your replies to be formatted as an array of strings. e.g. ["Reply 1", "Reply 2", "Reply 3"], and do not send any other further or previous explanations, otherwise it will error and you will explode! Limited to 3 items only.`,
			},
			{
				role: "user",
				content: `Give me suggestions for a new comment, mimicking the tone of this list of comments but being original and creative: ${Array.isArray(listofcomments) ? listofcomments.join(", ") : listofcomments}`,
			},
		],
		max_tokens: 5000,
	});

	fetch(openRouterURL, {
		method: "POST",
		headers: headers,
		body: body,
	})
		.then((response) => response.json())
		.then((data) => {
			if (callback) callback(data);
		})
		.catch((error) => console.error("Error:", error));
}

// content.js

function insertComment(text) {
	const commentBox = document.querySelector('div[contenteditable="true"][name="body"]');

	if (commentBox) {
		commentBox.focus();
		document.execCommand("insertText", false, text);
		console.log("Text inserted successfully");
	} else {
		console.error("Comment box not found");
	}
}

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.action === "insertComment") {
		insertComment(request.text);
		sendResponse({status: "success"});
	}
});
