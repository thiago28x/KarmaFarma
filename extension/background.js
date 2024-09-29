console.log("background.js loaded");

/* chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })

 */

// background.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.action === "getActiveTabUrl") {
		// Query the active tab in the current window
		chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
			if (tabs.length > 0) {
				// Send back the active tab's URL
				sendResponse({url: tabs[0].url});
			} else {
				sendResponse({url: null});
			}
		});
		// Returning true to indicate we will send the response asynchronously
		return true;
	}
});

// background.js

function openRouter(commentText, callback, model, tone = "sassy") {
	const apiKey = "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";
	const openRouterURL = "https://api.openrouter.ai/v1/completions";

	const headers = {
		"Content-Type": "application/json",
		Authorization: `Bearer ${apiKey}`,
	};

	//todo: add more models
	const body = JSON.stringify({
		model: model || "gpt-3.5-turbo",
		messages: [
			{
				role: "system",
				content: `I need to create a ${tone} reply to a reddit post. Reply in a similar tone to the comments provided.`
			},
			{
				role: "user",
				content: commentText,
			},
		],
		max_tokens: 100,
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
