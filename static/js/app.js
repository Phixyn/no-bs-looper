// Initialize all Foundation plugins
$(document).foundation(); // TODO not sure if it should go on document.ready

const websocket = new WebSocket("ws://192.168.1.71:14670");

var player;
var state;
var videoIdInput;
var startTimeInput;
var endTimeInput;
var sliderDiv;
var loopPortionSlider;
var startTimeSliderHandle;
var endTimeSliderHandle;

// Websocket client

/**
 * Websocket client 'onmessage' event handler. Called whenever a message is
 * received from the websocket server.
 *
 * @param {event} event An event object containing event data.
 */
websocket.onmessage = (event) => {
  console.log("[INFO] Received data from websocket server.");
  console.debug(event.data);

  let msg = JSON.parse(event.data);
  // TODO #46: Check message payload in client's onmessage handler
  // We got a new video endTime, so update the slider and input elements
  state.end_time = parseInt(msg.lengthSeconds);
  updateSliderAndInputAttributes(state.start_time, state.end_time);

  // TODO Temp workaround for slider fill bug e_e
  //    Make an issue to look into this separately.
  setTimeout(() => {
    // endTimeInput.change();
    loopPortionSlider._reflow();
  }, 2000);
};

/**
 * Websocket client 'onopen' event handler. Called when a connection to the
 * websocket server is successfully opened.
 *
 * @param {event} event An event object containing event data.
 */
websocket.onopen = (event) => {
  console.log("[INFO] Successfully opened websocket connection.");
  console.debug(event);
};

/**
 * Websocket client 'onclose' event handler. Called when the connection to the
 * websocket server is closed.
 *
 * TODO #47: Implement a proper websocket client onclose handler
 *
 * @param {event} event An event object containing event data.
 */
websocket.onclose = (event) => {
  console.log("[INFO] Websocket server connection closed.");
  console.debug(event);
};

/**
 * Handler for jQuery .ready() called.
 * For stuff that needs to happen only after the document is ready.
 */
$(() => {
  console.debug("[DEBUG] Document ready.");

  videoIdInput = $("#video-id");
  startTimeInput = $("#start-time");
  endTimeInput = $("#end-time");
  sliderDiv = $("#loop-portion-slider");
  // TODO #44: Improve initialization of Foundation Slider element
  loopPortionSlider = new Foundation.Slider(sliderDiv);
  startTimeSliderHandle = $("#start-time-handle");
  endTimeSliderHandle = $("#end-time-handle");

  // Load the Iframe Player API code asynchronously
  console.debug("[DEBUG] Adding script tag for YouTube Iframe API script to DOM.");
  let tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  let firstScriptTag = document.getElementsByTagName("script")[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

  console.debug("[DEBUG] Current history.state object is:");
  console.debug(history.state);

  // State setting and updating
  let queryString = location.search;
	if (queryString !== "") {
    console.debug("[DEBUG] Parsing URL querystring:");
    console.debug(queryString);

    // Use Qs to parse querystring and set state using parsed data
    let qsParse = Qs.parse(queryString, { ignoreQueryPrefix: true });
    console.debug("[DEBUG] Qs parsed querystring to object:");
    console.debug(qsParse);

    state = {
      video_id: qsParse.video_id,
      start_time: parseInt(qsParse.start_time),
      end_time: parseInt(qsParse.end_time),
    };
    console.debug("[DEBUG] State object set using querystring. Current state:");
    console.debug(state);
    // Just in case history.state doesn't get automatically set from querystring
    updateState();

    // Update text input for video ID (remember we can't update numeric inputs
    // here yet, because we need to set the "max" attributes. We can only set
    // those once the YT player is ready, so that we can get the video duration
    // and set the "max" attributes to that.
    console.debug("[DEBUG] Setting video ID input field.");
    videoIdInput.val(state.video_id);
  } else {
    console.debug("[DEBUG] No querystring in URL, setting default values.");

    // Get state data from HTML form (i.e. default values)
    state = {
      video_id: videoIdInput.val(),
      start_time: parseInt(startTimeInput.val()),
      end_time: parseInt(endTimeInput.val()),
    };
    updateState();
  }
});

/**
 * Event listener for window load event. This event is fired when all content
 * on the page has finished loading (including images and iframes). Stuff that
 * needs to happen after full load goes here.
 */
$(window).on("load", () => {
  console.debug("[DEBUG] Full content loaded.");

  // This is a fucking useless event now lol
});

// YouTube Player event handlers
// TODO consider doing this in .ready()

/**
 * Creates an <iframe> element (and YouTube player) after the API code
 * is downloaded.
 */
function onYouTubeIframeAPIReady() {
  console.debug("[DEBUG] YouTube Iframe API ready.");

  player = new YT.Player("player", {
    height: "390",
    width: "640",
    videoId: state.video_id,
    playerVars: {
      version: 3,
      rel: 0,
      start: state.start_time,
      modestBranding: 1,
      playlist: state.video_id,
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
  console.debug("[DEBUG] YouTube player ready.");
  // Probably don't need this, see note in onPlayerStateChange
  // setInterval() callback
  // event.target.setLoop(true);

  // Add slider event listeners
  // Fired when one of the slider's handles is moved
  $(sliderDiv).on("moved.zf.slider", () => {
    // TODO Function is not re-used, so consider moving all the code here
    // TODO check if YT.ready/loaded?
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
    console.debug("[DEBUG] Slider 'changed' triggered.");
    updateState();
  });

  // TODO #4: might need to change precision of slider and also data type?
  // event.target.getDuration() = 1634.781
  // For now use parseInt()
  updateSliderAndInputAttributes(
    state.start_time,
    parseInt(event.target.getDuration())
  );

  // TODO: Shouldn't be needed because of call to
  //    updateSliderAndInputAttributes? Weird that it only affects start time.
  //    Make an issue for this.
  console.debug("[DEBUG] Setting numeric input fields from YT onPlayerReady.");
  startTimeInput.val(state.start_time.toString()).change();

  // TODO Temp workaround for slider fill bug e_e
  //    Make an issue to look into this separately.
  setTimeout(() => {
    // endTimeInput.change();
    loopPortionSlider._reflow();
  }, 2000);
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
    console.debug("[DEBUG] Interval started from onPlayerStateChange.");
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
        player.getCurrentTime() >= state.end_time ||
        player.getCurrentTime() < state.start_time
      ) {
        player.seekTo(state.start_time, true);
      }
    }, 1000);
  }
  // TODO #45: This also affects things like PlayerState == buffering, so
  // maybe do 'if (event.data == YT.PlayerState.PAUSED)' ?
  else {
    if (timer != null) {
      console.debug("[DEBUG] Interval cleared from onPlayerStateChange.");
      clearInterval(timer);
    }
  }
}

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
 *
 * TODO #48: Rename updatePlayer to be more descriptive?
 */
function updatePlayer() {
  console.debug("[DEBUG] Updating player (state.video_id, state.start_time).");
  state.video_id = videoIdInput.val();
  console.debug("[DEBUG] Loading new video in player...");
  player.loadVideoById(state.video_id);

  // On new videos, reset startTime to 0 and set endTime to new video's length
  state.start_time = 0;
  // Request the Python server to make a GET request for video info and send
  // us the data back via the websocket.
  // TODO #49: Improve usage of websocket client in updatePlayer()
  console.debug("[DEBUG] Sending request for video info to Python server.");
  websocket.send(JSON.stringify({ request_video_info: state.video_id }));
}

/**
 * Toggles the player Iframe visibility with a fancy fade animation.
 */
function togglePlayer() {
  console.debug("[DEBUG] Toggling player visibility.");
  $("#player").fadeToggle();
}

/**
 * Updates the start and end times for the video's loop portion based on the
 * values in the HTML input elements (i.e. set by the user!).
 *
 * Note: The slider and input elements are data bound.
 */
function updateLoopPortion() {
  console.debug("[DEBUG] Setting new loop start and end times (state change)");

  state.start_time = parseInt(startTimeInput.val());
  state.end_time = parseInt(endTimeInput.val());

  // If needed, seek to the desired start time for the loop portion
  if (
    player.getCurrentTime() >= state.end_time ||
    player.getCurrentTime() < state.start_time
  ) {
    player.seekTo(state.start_time, true);
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
function updateState() {
  console.debug("[DEBUG] Updating and replacing history.state.");
  console.debug("[DEBUG] Old history.state:");
  console.debug(history.state);

  // jQuery's param() serializes an object into a string that can be used in
  // an URL query string or an API query. Also see MDN's page on the History
  // API for info on replaceState().
  history.replaceState(state, "", "?" + $.param(state));
  console.debug("[DEBUG] New history.state:");
  console.debug(history.state);
}

/**
 * Sets the loop portion's start time to the current time of the video.
 */
function setStartTimeToCurrent() {
  state.start_time = parseInt(player.getCurrentTime());
  startTimeInput.val(state.start_time.toString()).change();
}

/**
 * Sets the loop portion's end time to the current time of the video.
 */
function setEndTimeToCurrent() {
  state.end_time = parseInt(player.getCurrentTime());
  endTimeInput.val(state.end_time.toString()).change();
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
  console.log("[INFO] Updating slider and input data.");
  console.debug(`[DEBUG] newStartTime: ${newStartTime} ; newEndTime: ${newEndTime}`);

  endTimeString = newEndTime.toString();
  console.debug(`[DEBUG] endTimeString: ${endTimeString}`);
  endTimeInput.attr("max", endTimeString);
  // Don't want start portion slider to be able to go all the way to the end
  startTimeInput.attr("max", (newEndTime - 1).toString());
  console.debug("[DEBUG] Finished setting numeric input max attributes.");

  // Update logical end values of slider
  loopPortionSlider.options.end = newEndTime;
  loopPortionSlider.options.initialEnd = newEndTime;
  console.debug("[DEBUG] Updated logical end value of slider.");

  // Update visual end values of slider
  sliderDiv.attr("data-end", endTimeString);
  sliderDiv.attr("data-initial-end", endTimeString);
  console.debug("[DEBUG] Updated visual end value of slider.");

  // Update ARIA 'valuemax' data for time slider handles. Entirely for
  // accessibility purposes, has no effect on handles' functionality.
  startTimeSliderHandle.attr("aria-valuemax", (newEndTime - 1).toString());
  endTimeSliderHandle.attr("aria-valuemax", endTimeString);
  console.debug(
    "[DEBUG] Finished setting slider handle aria-valuemax attributes."
  );

  console.debug(
    "[DEBUG] Setting numeric input values from updateSliderAndInputAttributes."
  );

  // Update number input elements
  /* Note on the .change() chaining:
   *
   * Changing an input element's value with val() does not trigger a change
   * event. Thus the sliders bound to the input elements will not update their
   * position to reflect the new values. To fix this, we can trigger the change
   * event after we set the input's value.
   *
   * Note that this is a jQuery function and does NOT trigger a native onchange
   * event. Instead, it will only fire on all the onchange listeners that are
   * bound through jQuery. This works fine here because we are using Foundation
   * and jQuery, but it's something to keep in mind. It also means that we need
   * to use a jQuery selector (as opposed to something DOM native like
   * document.getElementById).
   */
  startTimeInput.val(newStartTime.toString()).change();
  /* By default, we could put the end slider at the end of video time, but if
   * the URL's querystring has a different end_time, we should honor that, so
   * that's why we use the state here.
   *
   * Note: Do this only after setting logical and visual end values for slider,
   * otherwise the second handle's position won't match the endTime value.
   */
  endTimeInput.val(state.end_time.toString()).change();
}
