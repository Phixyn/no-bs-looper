// Initialize all Foundation plugins
$(document).foundation();

var state;

var videoId = document.getElementById("video-id").value;
var startTime = 0;
var endTime;

// TODO jQuery selectors?
const startTimeInput = document.getElementById("start-time");
const endTimeInput = document.getElementById("end-time");

const sliderDiv = document.getElementById("loop-portion-slider");
// TODO Could improve initialization to remove data-* params from HTML <div> element
const loopPortionSlider = new Foundation.Slider($(sliderDiv));
const startTimeSliderHandle = document.getElementById("start-time-handle");
const endTimeSliderHandle = document.getElementById("end-time-handle");

$(sliderDiv).on("moved.zf.slider", () => {
  updateLoopPortion();
});

/* This event fires when the value has not been changed for a given time.
 * The given time is 500 milliseconds by default, and can be overriden by
 * adding a data-changed-delay attribute to the slider element in the HTML.
 * Currently, it is set to 2000 milliseconds.
 */
$(sliderDiv).on("changed.zf.slider", () => {
  /* Only update state (used to set the search/querystring portion of the URL)
   * after the start/end times haven't been updated for 2000ms. The idea is to
   * reduce lag and overhead when updating the state. Updating the state
   * everytime the slider is moved causes massive lag. Updating it every 500ms
   * is slightly better, but can be laggy if a browser is already under heavy
   * load (e.g. many tabs loaded). 2000 to 5000ms seems like a good value, but
   * larger values could leave users confused as to why the sharable URL they
   * copied (which is set based on state) is wrong if they copy it too fast.
   */
  console.debug("Changed triggered.");
  updateState(videoId, startTime, endTime);
});

// Load the IFrame Player API code asynchronously
const tag = document.createElement("script");
tag.src = "https://www.youtube.com/iframe_api";
const firstScriptTag = document.getElementsByTagName("script")[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var player;
/**
 * Creates an <iframe> element (and YouTube player) after the API code
 * is downloaded.
 */
function onYouTubeIframeAPIReady() {
  player = new YT.Player("player", {
    height: "390",
    width: "640",
    videoId: videoId,
    playerVars: {
      version: 3,
      rel: 0,
      start: startTime,
      modestBranding: 1,
      playlist: videoId,
      loop: 1,
    },
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange,
    },
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
  // Probably don't need this, see note in onPlayerStateChange setInterval callback
  // event.target.setLoop(true);

  // TODO #4: might need to change precision of slider and also data type?
  // event.target.getDuration() = 1634.781
  // For now use parseInt()
  updateSliderAndInputAttributes(
    startTime,
    parseInt(event.target.getDuration())
  );
}

var timer = null;
/**
 * Called by the API when the video player's state changes.
 *
 * Reference: https://developers.google.com/youtube/iframe_api_reference#Events
 */
function onPlayerStateChange(event) {
  if (event.data == YT.PlayerState.PLAYING) {
    console.debug("Interval started.");
    timer = setInterval(() => {
      /* TODO #4 bug:
       * Need to make sure endTime is using the 3 decimal points float
       * for precision, otherwise comparisons are not 100% accurate
       * (could be a few milliseconds off). Doesn't matter as much now
       * that we've added loop: 1 and playlist: id to the player params,
       * but still worth fixing.
       * Update: still an issue on mobile, so worth fixing
       */
      if (
        player.getCurrentTime() >= endTime ||
        player.getCurrentTime() < startTime
      ) {
        player.seekTo(startTime, true);
      }
    }, 1000);
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
 *
 * Remember both inputs and both handles have to be updated everytime the
 * video changes, otherwise user might not be able to use text fields to
 * new times properly and will be forced to use the slider. We want users
 * to have a choice and for both choices to work 100% all the time.
 */
function updateSliderAndInputAttributes(newStartTime, newEndTime) {
  console.log("Updating slider and input data.");

  // JavaScript amirite?
  endTimeString = newEndTime.toString();

  endTimeInput.setAttribute("max", endTimeString);
  // Don't want start portion slider to be able to go all the way to the end
  startTimeInput.setAttribute("max", (newEndTime - 1).toString());

  startTimeInput.value = newStartTime.toString();
  // By default, we'll put the end slider at the end of video time
  endTimeInput.value = endTimeString;

  // Update logical end value of slider
  loopPortionSlider.options.end = newEndTime;
  // Update visual end value of slider
  sliderDiv.setAttribute("data-end", endTimeString);

  // Update ARIA 'valuemax' data for time slider handles. Entirely for
  // accessibility purposes, has no effect on handles' functionality.
  startTimeSliderHandle.setAttribute(
    "aria-valuemax",
    (newEndTime - 1).toString()
  );
  endTimeSliderHandle.setAttribute("aria-valuemax", endTimeString);

  /* Changing an input element's value as done above does not trigger an
   * onchange event. Thus the sliders bound to the input elements will not
   * update their position to reflect the new values. To fix this, we can
   * trigger the onchange event.
   *
   * Note that this is a jQuery function and does NOT trigger a native onchange
   * event. Instead, it will only fire on all the onchange listeners that are
   * bound through jQuery. This works fine here because we are using Foundation
   * and jQuery, but it's something to keep in mind. It also means that we need
   * to use a jQuery selector (as opposed to something DOM native like
   * document.getElementById).
   */
  // TODO should probably make variables for these
  $("#start-time").change();
  // Do this only after setting logical and visual end values for slider,
  // otherwise the second handle's position won't match the endTime value.
  $("#end-time").change();
}

// TODO move this either to another JS file or to top
const websocketClient = new WebSocket("ws://192.168.1.71:14670");

// TODO: these can all be arrow functions now

/**
 * onmessage handler for websocket.
 */
websocketClient.onmessage = (event) => {
  // We got a new video endTime, so update the slider and input elements
  console.debug("Received data from websocket server.");
  console.debug(event.data);
  var msg = JSON.parse(event.data);
  endTime = parseInt(msg.lengthSeconds);
  // TODO check message contents for errors, unrecognized data, etc,
  // and handle those.
  updateSliderAndInputAttributes(0, endTime);
};

/**
 * onopen handler for websocket.
 */
websocketClient.onopen = (event) => {
  console.log("Successfully opened websocket connection.");
  // console.debug("onopen event:");
  // console.debug(event);
};

/**
 * onclose handler for websocket.
 * TODO needs improvement. Maybe pinging the server every x seconds?
 */
websocketClient.onclose = (event) => {
  console.log("Websocket server connection closed.");
  console.debug(event);
  // TODO this doesn't work. Find another way to reconnect
  // websocketClient = new WebSocket("ws://192.168.1.71:14670");
};

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
 * request on the behalf of this web app, and send it the video info
 * via websocket.
 */
function updatePlayer() {
  // TODO rename function, maybe updatePlayerWithNewVideo? e_e
  console.debug("Updating player.");
  videoId = document.getElementById("video-id").value;
  player.loadVideoById(videoId);

  // On new videos, reset startTime to 0 and set endTime to new video's length
  startTime = 0;
  // Get fucked CORS. We'll use a separate application to make our GET request muahahaha
  // Get me that illegal video info data >:)
  // TODO check if websocket connection is open first, if not, wait some seconds?
  websocketClient.send(JSON.stringify({ request_video_info: videoId }));
}

/**
 * TODO
 */
function updateLoopPortion() {
  console.debug("Setting new loop start and end times.");
  startTime = parseInt(startTimeInput.value);
  endTime = parseInt(endTimeInput.value);
  if (
    player.getCurrentTime() >= endTime ||
    player.getCurrentTime() < startTime
  ) {
    player.seekTo(startTime, true);
  }
}

/**
 * Update the application's state object with the given video ID, start time
 * and end time. Replace the current state stored in the browser (using the
 * History API) with the updated state. This will also update the URL's
 * querystring with the object's data, which is useful for sharing and
 * bookmarking URLs to specific loops.
 */
function updateState(videoId, startTime, endTime) {
  console.debug("Updating and replacing state.");

  state = {
    video_id: videoId,
    start_time: startTime,
    end_time: endTime,
  };
  // jQuery's param() serializes an object into a string that can be used in
  // an URL query string or an API query. Also see MDN's page on the History
  // API for info on replaceState().
  history.replaceState(state, "", "?" + $.param(state));
}

/**
 * TODO
 */
function togglePlayer() {
  console.debug("Toggling player visibility.");
  const playerDiv = document.getElementById("player");
  // TODO Get rid of first condition by assigning display: block to #player in CSS?
  if (playerDiv.style.display === "" || playerDiv.style.display !== "none") {
    playerDiv.style.display = "none";
  } else {
    playerDiv.style.display = "block";
  }
}

/**
 * TODO
 */
function setStartTimeToCurrent() {
  startTime = parseInt(player.getCurrentTime());
  startTimeInput.value = startTime.toString();
  $("#start-time").change();
}

/**
 * TODO
 */
function setEndTimeToCurrent() {
  endTime = parseInt(player.getCurrentTime());
  endTimeInput.value = endTime.toString();
  $("#end-time").change();
}
