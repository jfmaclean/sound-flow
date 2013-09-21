

function handleDrop(e) {
  // this / e.target is current target element.

  if (e.stopPropagation) {
    e.stopPropagation(); // stops the browser from redirecting.
  }
  alert("dropped ");
  console.log("dropped ", e);
  // See the section on the DataTransfer object.

  return false;
}

function handleDragStart(e) {
  this.style.opacity = '0.4';  // this / e.target is the source node.
  alert("dragStart");
}


function handleDragEnd(e) {
  // this/e.target is the source node.


}

var players = $(".player");
[].forEach.call(players, function(player) {
  player.addEventListener('dragstart', handleDragStart, false);
  player.addEventListener('drop', handleDrop, false);
  // col.addEventListener('dragend', handleDragEnd, false);
});










// var sendMessageToBackground = function (message, responseHandler) {
//     chrome.runtime.sendMessage(message, responseHandler);
// };

// receive messages
// chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
//     console.log("popup received message ", message, " from sender ", sender);
//     if (message.hasOwnProperty("updatePlayer")) {
//         // sendMessageToPage("UPDATE_PLAYER", message.updatePlayer);
//     }
// });

// chrome.runtime.onMessage.addListener(
//   function(request, sender, sendResponse) {
//     console.log(sender.tab ?
//                 "from a content script:" + sender.tab.url :
//                 "from the extension");
//     if (request.greeting == "hello")
//       sendResponse({farewell: "goodbye"});
//   });

// chrome.storage.onChanged.addListener(function (changes, area) {
//   document.getElementById("list").appendChild("<li>Detected change</li>");
//   // if (area === "local") {
//     for (var i in changes) {
//       // document.getElementById("notifications").appendChild(newChild)
//       // alert("SHIT");

//       console.log(i);
//     }
//   // }
// });