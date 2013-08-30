// chrome.browserAction.onClicked.addListener(function(tab) {
 //    chrome.tabs.executeScript({
 //    	code: 'alert("hi");'
 //  		}, function (arr) {
 //  		console.log('injected, ', arr);
	// 	}
	// );
var flow_player = $("#movie_player");
console.log(player);

var play = function (player) {
	player.playVideo();
};
var pause = function (player) {
	$("#movie_player").pauseVideo();
};

window.setTimeout("pause(flow_player)", 3000);
window.setTimeout("play(flow_player)", 5000);	