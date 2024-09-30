console.log("popup.js loaded");
// Global variables to store the post and comments data
let postDetails = {};
let comments = [];
let commentsQty = 50; //TODO filter out comments with less than 10 upvotes

/* log the tab url */
console.log("tab url: " + window.location.toString());

let testBtn = document.getElementById("test");
testBtn.addEventListener("click", test);

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

let getCommentsBtn = document.getElementById("getComments");
getCommentsBtn.addEventListener("click", getComments);

let status1 = document.getElementById("status1");
let status2 = document.getElementById("status2");

function setStatus(m1, m2) {
	status1.textContent = m1;
	status2.textContent = m2;
}

function getComments() {
	try {
		chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
			if (tabs.length === 0) {
				setStatus("error", "No active tab found.");
				return;
			}

			// Get the current tab's URL
			const [getCurrentTab] = tabs;

			if (!getCurrentTab) {
				setStatus("error", "getCurrentTab is null.");
				return;
			}

			console.log("Current URL:", getCurrentTab.url);

			setStatus("tab0", getCurrentTab.url);
			getJsonComments(getCurrentTab.url);
		});
	} catch (e) {
		setStatus("error", "Exception occurred: " + e);
	}
}

function getJsonComments(url) {
	console.log(url);
	if (url.includes("reddit.com/r/")) {
		/* remove this from the url '#lightbox' */
		url = url.replace("#lightbox", "");
		console.log(url);

		fetch(url + ".json")
			.then((response) => {
				if (response.ok) {
					return response.json();
				} else {
					throw new Error("HTTP error, status = " + response.status);
				}
			})
			.then((data) => {
				console.log(data);
				organizeData(data);
			})
			.catch((error) => {
				console.error("Error: " + error.message);
				if (error.stack) {
					console.error("stack: " + error.stack);
				}
			});
	} else {
		setStatus("error", "Current tab is not a Reddit post 🤔");
	}
}

document.addEventListener("DOMContentLoaded", function () {

	showTab(1);

	chrome.runtime.sendMessage({action: "getActiveTabUrl"}, function (response) {
		if (response.url) {
			console.log("DOM content loaded. Active Tab URL:", response.url);
		} else {
			console.error("Failed to retrieve the active tab's URL.");
		}
	});
});
function organizeData(data) {
	// Clear previous data
	postDetails = {};
	comments = [];

	// First, extract post title and body, from the first "Listing".
	if (data.length > 0 && data[0].data.children.length > 0) {
		const post = data[0].data.children[0].data;
		postDetails = {
			title: post.title.replace(/[\'\"\&\n]/g, "").replace(/<[^>]*>/g, ""),
			body: post.selftext.replace(/[\'\"\&\n]/g, "").replace(/<[^>]*>/g, ""),
		};
	}

	//only until commentsQty variable.
	// Then, extract comments from the second "Listing"
	if (data.length > 1 && data[1].data.children.length > 0) {
		data[1].data.children.slice(0, commentsQty).forEach((comment) => {
			const commentData = comment.data;
			comments.push({
				author: commentData.author,
				body: commentData.body.replace(/[\'\"\&\n]/g, "").replace(/<[^>]*>/g, ""), // clean the comment body
			});
		});
	}

	// Log the comments for debugging
	console.log("Comments:", comments);

	// Format the comments as a clean string for AI processing
	const formattedComments = comments.map((comment) => `Author: ${comment.author}, Comment: ${comment.body}`).join("\n\n");

	setStatus(`${postDetails.title}`, `Analyzing ${comments.length} comments...`);

	// Request the AI reply with the formatted comments
	requestAIReply(`${postDetails.title}\n\n${postDetails.body}\n\n${formattedComments}`);
}

function requestAIReply(commentText) {
	// Send message to background script
	chrome.runtime.sendMessage({action: "getAIReply", commentText: commentText}, function (response) {
		console.log("✨ Finished processing, AI Response: \n", response);
		setStatus(`Finished!`, `✅`);
		document.getElementById("aiReply").textContent = response.reply;
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

// Example usage
document.getElementById("test").addEventListener("click", () => {
	const commentText = "This is an automated comment.";
	insertCommentInRedditTab(commentText);
});









function showTab(tabNumber) {
	// Hide all tabs
	const tabs = document.querySelectorAll('.tab');
	tabs.forEach(tab => tab.style.display = 'none');

	// Show the correct tab
	const selectedTab = document.getElementById(tabNumber.toString());
	if (selectedTab) {
		selectedTab.style.display = 'block';
	}
}







/* 

fetch("https://api.openrouter.ai/v1/completions", {
	"headers": {
	  "authorization": "Bearer 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",
	  "content-type": "application/json"
	},
	"referrer": "",
	"referrerPolicy": "strict-origin-when-cross-origin",
	"body": "{\"model\":\"meta-llama/llama-3.2-11b-vision-instruct:free\",\"messages\":[{\"role\":\"system\",\"content\":\"I need to create a sassy reply to a reddit post. Reply in a similar tone to the comments provided. Be brief, witty, and smart.\"},{\"role\":\"user\",\"content\":\"Give me suggestions for a new comment, mimicking the tone of this list of comments but being original and creative: Romantic seneces\\n\\n\\n\\nAuthor: dr_lm, Comment: See I like this because it isnt trying to capture the exact likeness of the people in the source photo, but to stylize it whilst capturing the overall vibe.\\n\\nAuthor: Old-March-5273, Comment: how ?gt;gt;gt;gt;gt; any short tutorial or video ?gt;\\n\\nAuthor: casey_otaku, Comment: Cool) XL?\\n\\nAuthor: scorpiov2, Comment: Lineart Controlnet? Looks cool\\n\\nAuthor: thewayur, Comment: Which art style it is?Any workflow or short guide to achieve this please 🙏\\n\\nAuthor: FeelingFickle7400, Comment: wow, how do you create it, do you trained the lora by some specital dataset ?\\n\\nAuthor: bozkurt81, Comment: Amazing work, tutorial please\\n\\nAuthor: DoragonSubbing, Comment: is the LoRA private? If yes, are you willing to release it?\\n\\nAuthor: CallingGoend, Comment: Is that Grimes on ninth picture??\\n\\nAuthor: innovanimations, Comment: interesting\\n\\nAuthor: Cubey42, Comment: TIL Senece is a word\\n\\nAuthor: BeeSynthetic, Comment: Nicely captured lt;3  The essence of the connections are fully preserved. Well played.My only critism, is it appears to be hetro only. Take a leap and capture this with \\\\*any\\\\* scene. Next Goal :P\"}],\"max_tokens\":100}",
	"method": "POST",
	"mode": "cors",
	"credentials": "include"
  }); 
  
 
 
 
  */
