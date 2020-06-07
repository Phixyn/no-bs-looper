// Initialize all Foundation plugins
$(document).foundation();

var videoId = document.getElementById("video-id").value;
// var startTime = parseInt(document.getElementById("start-time").value);
// var endTime = parseInt(document.getElementById("end-time").value);
var startTime = 0;
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
  // console.log("Slider moved!");
  updateLoopPortion();
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
      modestBranding: 1,
      version: 3
    },
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange
    }
  });
}

/**
 * Called by the API when the video player is ready.
 * Updates the slider and form input elements with the video's duration.
 *
 * Could use player.loadVideoById with endSeconds here.
 * But if user seeks, endSeconds becomes invalidated.
 *
 * Reference: https://developers.google.com/youtube/iframe_api_reference#Events
 */
function onPlayerReady(event) {
  startTime = parseInt(startTimeInput.value);
  // event.target.getDuration() = 1634.781  ... might need to change precision of slider and also data type?
  // For now use parseInt()
  updateSliderAndInputAttributes(parseInt(event.target.getDuration()));
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
    // Bad UX: end slider changes everytime user unpauses video
    // updateSliderAndInputAttributes(parseInt(event.target.getDuration()));
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

/**
 * TODO
 */
function eventCallback() {
  if (player.getCurrentTime() >= endTime) {
    player.seekTo(startTime, true);
  }
}

/**
 * TODO
 *
 * Remember both inputs and both handles have to be updated everytime the
 * video changes, otherwise user might not be able to use text fields to
 * new times properly and will be forced to use the slider. We want users
 * to have a choice and for both choices to work 100% all the time.
 */
function updateSliderAndInputAttributes(newEndTime) {
  console.log("Updating slider and input data.");

  // JavaScript amirite?
  endTimeString = newEndTime.toString();

  endTimeInput.setAttribute("max", endTimeString);
  // Don't want start portion slider to be able to go all the way to the end
  startTimeInput.setAttribute("max", (newEndTime - 1).toString());

  startTimeInput.value = startTime;
  // By default, we'll put the end slider at the end of video time
  endTimeInput.value = endTimeString;

  // Logical end value of slider
  loopPortionSlider.options.end = newEndTime;
  // Visual end value of slider
  sliderDiv.setAttribute("data-end", endTimeString);

  // Update ARIA 'valuemax' data for time slider handles. Entirely for
  // accessibility purposes, has no effect on handles' functionality.
  startTimeSliderHandle.setAttribute("aria-valuemax", (newEndTime - 1).toString());
  endTimeSliderHandle.setAttribute("aria-valuemax", endTimeString);
}

/**
 * TODO
 *
 * We can't update the slider/input elements here because we can't get the
 * duration of the video yet. This happens because of this little gem from
 * the YouTube IFrame API:
 * "getDuration() will return 0 until the video's metadata is loaded, which
 * normally happens just after the video starts playing."
 * Thanks Google, really helpful and really nice UX for my users, eh.
 *
 * As a workaround we could perform this GET request to get video info:
 * https://www.youtube.com/get_video_info?html5=1&video_id=orxvTsPW10k
 * However, because of CORS, we can't do this from the web application,
 * as YouTube won't allow our cross-origin requests :(. So instead,
 * we wrote an entirely new Python application just to perform the
 * request on the behalf of this web app, and send us the video info
 * via HTTP. This will eventually be replaced with websocket for IPC.
 */
var someReq;
function updatePlayer() {
  // TODO rename function, maybe updatePlayerWithNewVideo? e_e
  console.debug("Updating player.");
  // startTime = parseInt(document.getElementById("start-time").value);
  startTime = 0;
  videoId = document.getElementById("video-id").value;
  player.loadVideoById(videoId);
  console.log(player.getDuration());
  console.log(player.playerInfo.duration);
  // Get fucked CORS. We'll use a separate application to proxy our GET request muahahaha
  someReq = $.get("http://192.168.1.71:14670/get_yt_video_length?video_id=" + videoId, function() {
      console.log("Response to request: success");
    }
  ).done(function(result) {
    console.log("GET request done, setting endTime.");
    // Get me that illegal video info data >:)
    endTime = result.lengthSeconds;
    // console.debug(endTime);
    // And FINALLY, we can update the slider and input elements here, giving our
    // users a much nicer UX. And it only took 10 hours to figure this out. I
    // sure hope our 1 user appreciates this (talkin about myself).
    updateSliderAndInputAttributes(endTime);
  });
}

/**
 * TODO
 */
function updateLoopPortion() {
  console.debug("Setting new loop start and end times.");
  startTime = parseInt(document.getElementById("start-time").value);
  endTime = parseInt(document.getElementById("end-time").value);
  if (startTime > player.getCurrentTime()) {
    player.seekTo(startTime, true);
  }
}

/**
 * TODO
 */
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