console.log("popup.js loaded");
// Global variables to store the post and comments data
let postDetails = {};
let comments = [];
let commentsQty = 50;  //TODO filter out comments with less than 10 upvotes


/* log the tab url */
console.log("tab url: " + window.location.toString());

let testBtn = document.getElementById("test");
testBtn.addEventListener("click", test);

function test() {
	console.log("test");

	/* do get request to this url https://api.waifudungeon.xyz/status */
	fetch("https://api.waifudungeon.xyz/status")
		.then((response) => {
			if (response.ok) {
				return response.json();
			} else {
				throw new Error("HTTP error, status = " + response.status);
			}
		})
		.then((data) => console.log(data))
		.catch((error) => {
			console.error("Error: " + error.message);
			if (error.stack) {
				console.error("stack: " + error.stack);
			}
		});
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
	chrome.runtime.sendMessage({action: "getActiveTabUrl"}, function (response) {
		if (response.url) {
			console.log("Active Tab URL:", response.url);
		} else {
			console.error("Failed to retrieve the active tab's URL.");
		}
	});
});



function organizeData(data) {
	// Clear previous data
	postDetails = {};
	comments = [];

	// First, extract the post title and body from the first "Listing"
	if (data.length > 0 && data[0].data.children.length > 0) {
		const post = data[0].data.children[0].data;
		postDetails = {
			title: post.title,
			body: post.selftext,
		};
	}

	// Then, extract comments from the second "Listing"
	if (data.length > 1 && data[1].data.children.length > 0) {
		data[1].data.children.forEach((comment) => {
			const commentData = comment.data;
			comments.push({
				author: commentData.author,
				body: commentData.body,
			});
		});
	}

	// For debugging purposes, log the extracted data
	console.log("Post Details:", postDetails);
	console.log("Comments:", comments);

	setStatus(`${postDetails.title}`, `Analyzing ${comments.length} comments...`);
}
