$(document).foundation()

var videoId = document.getElementById("video-id").value;
var startTime = parseInt(document.getElementById("start-time").value);
var endTime = parseInt(document.getElementById("end-time").value);

// Load the IFrame Player API code asynchronously
var tag = document.createElement('script');

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var player;
/**
 * Creates an <iframe> element (and YouTube player) after the API code
 * is downloaded.
 */
function onYouTubeIframeAPIReady() {
  player = new YT.Player('player', {
    height: '390',
    width: '640',
    videoId: videoId,
    playerVars: {
      rel: 0,
      start: startTime,
      modestBranding: 1
    },
    events: {
      // 'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange
    }
  });
}

/**
 * Called by the API when the video player is ready.
 *
 * Reference: https://developers.google.com/youtube/iframe_api_reference#Events
 */
// function onPlayerReady(event) {
  // event.target.playVideo();
  // Could use this, but if user seeks, endSeconds becomes invalidated
  // This is the same reason we don't have loop: 1 in our playerVars. Because
  // we have our own loop through the setInterval callback.
  // player.loadVideoById(
  //   {
  //     videoId: videoId,
  //     startSeconds: startTime,
  //     endSeconds: endTime
  //   }
  // );
// }

/**
 * Called by the API when the video player's state changes.
 *
 * Reference: https://developers.google.com/youtube/iframe_api_reference#Events
 */
var timer = null;
function onPlayerStateChange(event) {
  if (event.data == YT.PlayerState.PLAYING) {
    console.debug("Interval started.");
    timer = setInterval(eventCallback, 1000);
  }
  // TODO Check if this also affects things like player state == buffering,
  // and if so, maybe improve it.
  // Update: It does. Maybe do if (event.data == YT.PlayerState.PAUSED) ?
  else {
    if (timer != null) {
      console.debug("Interval cleared from onPlayerStateChange.");
      clearInterval(timer);
    }
  }
}

function eventCallback() {
  if (player.getCurrentTime() >= endTime) {
    player.seekTo(startTime, true);
  }
}

function updatePlayer() {
  console.debug("Updating player.");
  videoId = document.getElementById("video-id").value;
  startTime = parseInt(document.getElementById("start-time").value);
  endTime = parseInt(document.getElementById("end-time").value);

  // player.loadVideoById({videoId:String,
  //               startSeconds:Number,
  //               endSeconds:Number}):Void
  // endSeconds becomes invalid if user seeks, so it's pointless
  player.loadVideoById(
    {
      videoId: videoId,
      startSeconds: startTime
    }
  );
}

function togglePlayer() {
  console.debug("Toggling player visibility.");
  var playerDiv = document.getElementById("player");
  // TODO Get rid of first condition by assigning display: block to #player in CSS
  if (playerDiv.style.display === "" || playerDiv.style.display !== "none") {
    playerDiv.style.display = "none";
  } else {
    playerDiv.style.display = "block";
  }
}