// Initialize all Foundation plugins
$(document).foundation();

var videoId = document.getElementById("video-id").value;
// var startTime = parseInt(document.getElementById("start-time").value);
// var endTime = parseInt(document.getElementById("end-time").value);
var startTime;
var endTime;

var startTimeInput = document.getElementById("start-time");
var endTimeInput = document.getElementById("end-time");

var sliderDiv = document.getElementById("loop-portion-slider");
// TODO Could improve initialization to remove data-* params from HTML <div> element
var loopPortionSlider = new Foundation.Slider($(sliderDiv));
var startTimeSliderHandle = document.getElementById("start-time-handle");
var endTimeSliderHandle = document.getElementById("end-time-handle");

// TODO Debug only
$(sliderDiv).on("moved.zf.slider", function() {
  console.log("a");
});

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
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange
    }
  });
}

/**
 * Called by the API when the video player is ready.
 *
 * Reference: https://developers.google.com/youtube/iframe_api_reference#Events
 */
function onPlayerReady(event) {
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

  console.log(event);
  console.log(event.target);

  startTime = parseInt(startTimeInput.value);
  // player.getDuration() = 1634.781  ... might need to change precision of slider and also data type
  // For now use parseInt()
  // ALso maybe use `event.target` instead of `player`
  endTime = parseInt(player.getDuration());

  // TODO: start of updateSliderAndInputAttributes(endTime);
  // Just JavaScript things
  endTimeString = endTime.toString();

  // Update max attribute for time number fields.
  // Remember both inputs and both handles have to be updated everytime the
  // video changes, otherwise user might not be able to use text fields to
  // new times properly and will be forced to use the slider. We want users
  // to have a choice and for both choices to work 100% all the time.
  endTimeInput.setAttribute("max", endTimeString);
  // Don't want start portion slider to be able to go all the way to the end
  startTimeInput.setAttribute("max", (endTime - 1).toString());

  // By default, we'll put the end slider at the end of video time
  endTimeInput.value = endTimeString;
  loopPortionSlider.options.end = endTime;

  // Update slider element with new value for 'data-end' (the max/end value of
  // the slider).
  loopPortionSlider.setAttribute("data-end", endTimeString);

  // Update ARIA 'valuemax' data for time slider handles. Entirely for
  // accessibility purposes, has no effect on handles' functionality.
  startTimeSliderHandle.setAttribute("aria-valuemax", (endTime - 1).toString());
  endTimeSliderHandle.setAttribute("aria-valuemax", endTimeString);
  // TODO: end of updateSliderAndInputAttributes(endTime);
}

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
  // This has to be changed so user can only submit video ID.
  // We then need to reset startTime to 0 and endTime to video duration.
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

  // TODO: updateSliderAndInputAttributes(endTime);
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