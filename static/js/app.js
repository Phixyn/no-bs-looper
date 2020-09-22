// Initialize all Foundation plugins
$(document).foundation();

const videoIdInput = $("#video-id");
const startTimeInput = $("#start-time");
const endTimeInput = $("#end-time");

const sliderDiv = $("#loop-portion-slider");
// TODO Could improve initialization to remove data-* params from
// HTML <div> element
const loopPortionSlider = new Foundation.Slider(sliderDiv);
const startTimeSliderHandle = $("#start-time-handle");
const endTimeSliderHandle = $("#end-time-handle");

var state;
var videoId = videoIdInput.val();
var startTime = 0; // startTimeInput.val()
var endTime; // endTimeInput.val()

// Fired when one of the slider's handles is moved
$(sliderDiv).on("moved.zf.slider", () => {
  updateLoopPortion();
});

/* This event fires when the slider has not been moved for a given time.
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
 *
 * @param {event} event An event object containing event data.
 */
function onPlayerReady(event) {
  startTime = parseInt(startTimeInput.val());
  // Probably don't need this, see note in onPlayerStateChange
  // setInterval() callback
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
 *
 * @param {event} event An event object containing event data.
 */
function onPlayerStateChange(event) {
  // TODO === ?
  if (event.data == YT.PlayerState.PLAYING) {
    console.debug("Interval started.");
    // Every 1 second, check if we need to go back to the start of the
    // loop portion.
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
  // TODO This also affects things like PlayerState == buffering,
  // and if so maybe do 'if (event.data == YT.PlayerState.PAUSED)' ?
  else {
    if (timer != null) {
      console.debug("Interval cleared from onPlayerStateChange.");
      clearInterval(timer);
    }
  }
}

/**
 * Updates slider and input attributes using the given new start time
 * and new end time. Whenever a new video is loaded and the start/end
 * times change, attributes such as max value and data-end need to be
 * updated so that users can correctly input and set start and end times.
 *
 * If these are not updated, there is a large chance that the slider will
 * no longer match the length of the video, and that users will not be
 * able to enter the expected end time values. The logical end value of
 * the slider also needs to be updated with the new end time of the video
 * (see Foundation slider docs for more information).
 *
 * Remember both numeric inputs and both slider handles have to be updated
 * everytime the video changes. If only the slider attributes are updated,
 * users might not be able to use input fields to set new times properly and
 * will be forced to use the slider. We want users to have a choice and for
 * both inputs and slider to work 100% all the time.
 *
 * @param {number} newStartTime The new start time for the loop portion.
 * @param {number} newEndTime The new end time of the video (i.e. video
 *     duration).
 */
function updateSliderAndInputAttributes(newStartTime, newEndTime) {
  console.log("Updating slider and input data.");

  endTimeString = newEndTime.toString();
  endTimeInput.attr("max", endTimeString);
  // Don't want start portion slider to be able to go all the way to the end
  startTimeInput.attr("max", (newEndTime - 1).toString());

  startTimeInput.val(newStartTime.toString());
  // By default, we'll put the end slider at the end of video time
  endTimeInput.val(endTimeString);

  // Update logical end value of slider
  loopPortionSlider.options.end = newEndTime;
  // Update visual end value of slider
  sliderDiv.attr("data-end", endTimeString);

  // Update ARIA 'valuemax' data for time slider handles. Entirely for
  // accessibility purposes, has no effect on handles' functionality.
  startTimeSliderHandle.attr("aria-valuemax", (newEndTime - 1).toString());
  endTimeSliderHandle.attr("aria-valuemax", endTimeString);

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
  startTimeInput.change();
  // Do this only after setting logical and visual end values for slider,
  // otherwise the second handle's position won't match the endTime value.
  endTimeInput.change();
}

// TODO move this either to another JS file or to top
const websocketClient = new WebSocket("ws://192.168.1.71:14670");

/**
 * Websocket client 'onmessage' event handler. Called whenever a message is
 * received from the websocket server.
 *
 * @param {event} event An event object containing event data.
 */
websocketClient.onmessage = (event) => {
  // We got a new video endTime, so update the slider and input elements
  console.debug("Received data from websocket server.");
  console.debug(event.data);
  var msg = JSON.parse(event.data);
  // TODO Check msg type before setting endTime
  endTime = parseInt(msg.lengthSeconds);
  // TODO check message contents for errors, unrecognized data, etc,
  // and handle those.
  updateSliderAndInputAttributes(0, endTime);
};

/**
 * Websocket client 'onopen' event handler. Called when a connection to the
 * websocket server is successfully opened.
 *
 * @param {event} event An event object containing event data.
 */
websocketClient.onopen = (event) => {
  console.log("Successfully opened websocket connection.");
};

/**
 * Websocket client 'onclose' event handler. Called when the connection to the
 * websocket server is closed.
 *
 * TODO needs improvement. Maybe pinging the server every x seconds?
 *
 * @param {event} event An event object containing event data.
 */
websocketClient.onclose = (event) => {
  console.log("Websocket server connection closed.");
  console.debug(event);
  // TODO this doesn't work. Find another way to reconnect
  // websocketClient = new WebSocket("ws://192.168.1.71:14670");
};

/**
 * Updates the YouTube player with a new video. Called when the user clicks
 * the "Update" button. The video ID is taken from the text input element
 * in the HTML form. This function also requests video info from our backend
 * server via websocket (see why this is necessary below), which hopefully
 * causes the websocket client's "onmessage" handler to get called.
 *
 * Normally, we'd update the slider and input attributes with new max values
 * based on the video duration here. However, we can't update them here
 * because we can't get the duration of the video yet. Check out this little
 * gem from the YouTube IFrame API:
 *
 * > "getDuration() will return 0 until the video's metadata is loaded, which
 * normally happens just after the video starts playing."
 * Thanks Google, really helpful and really nice UX for my users, eh.
 *
 * As a workaround we could perform this GET request to get video info:
 * https://www.youtube.com/get_video_info?html5=1&video_id=orxvTsPW10k
 * However, because of CORS, we can't do this from the web application, as
 * YouTube won't allow our cross-origin requests :(. So instead, we send a
 * message to our Python server, asking it to perform the HTTP GET request on
 * our behalf and send us the video info back via websocket.
 */
function updatePlayer() {
  // TODO rename function, maybe updatePlayerWithNewVideo or updatePlayerVideo?
  console.debug("Updating player.");
  videoId = videoIdInput.val();
  player.loadVideoById(videoId);

  // On new videos, reset startTime to 0 and set endTime to new video's length
  startTime = 0;
  // Request the Python server to make a GET request for video info and send
  // us the data back via the websocket.
  // TODO check if websocket connection is open first, if not, wait some seconds?
  websocketClient.send(JSON.stringify({ request_video_info: videoId }));
}

/**
 * Updates the start and end times for the video's loop portion based on the
 * values in the HTML input elements (i.e. set by the user!).
 */
function updateLoopPortion() {
  console.debug("Setting new loop start and end times.");

  startTime = parseInt(startTimeInput.val());
  endTime = parseInt(endTimeInput.val());

  // If needed, seek to the desired start time for the loop portion
  if (
    player.getCurrentTime() >= endTime ||
    player.getCurrentTime() < startTime
  ) {
    player.seekTo(startTime, true);
  }
}

/**
 * Updates the application's state object with the given video ID, start time
 * and end time. Replace the current state stored in the browser (using the
 * History API) with the updated state. This will also update the URL's
 * querystring with the object's data, which is useful for sharing and
 * bookmarking URLs to specific loops.
 *
 * @param {string} videoId The ID of the YouTube video.
 * @param {number} startTime The video loop portion's start time.
 * @param {number} endTime The video loop portion's end time.
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
 * Toggles the player iframe visibility with a fancy fade animation.
 */
function togglePlayer() {
  console.debug("Toggling player visibility.");
  $("#player").fadeToggle();
}

/**
 * Sets the loop portion's start time to the current time of the video.
 */
function setStartTimeToCurrent() {
  startTime = parseInt(player.getCurrentTime());
  startTimeInput.val(startTime.toString());
  startTimeInput.change();
}

/**
 * Sets the loop portion's end time to the current time of the video.
 */
function setEndTimeToCurrent() {
  endTime = parseInt(player.getCurrentTime());
  endTimeInput.val(endTime.toString());
  endTimeInput.change();
}
