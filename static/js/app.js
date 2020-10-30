// Initialize all Foundation plugins
$(document).foundation();

// Add your websocket server IP address here
const websocket = new WebSocket("ws://<server IP address here>:14670");
const TYPE_PROP = "type";
const TYPE_SERVER_ERROR_MESSAGE = "error";
const TYPE_VIDEO_INFO_MESSAGE = "video_info";
const VIDEO_ID_LENGTH = 11;
const TOOLTIP_TEXT_CLASS = ".phix-tooltip-text";

var player;
var state;
var videoForm;
var videoIdInput;
var startTimeInput;
var endTimeInput;
var sliderDiv;
var loopPortionSlider;
var startTimeSliderHandle;
var endTimeSliderHandle;
var shareLinkInput;

// Websocket client

/**
 * Websocket client 'onmessage' event handler. Called whenever a message is
 * received from the websocket server.
 *
 * @param {event} event An event object containing event data.
 */
websocket.onmessage = (event) => {
  let msg;
  console.log("[INFO] Received data from websocket server.");
  console.debug(event.data);

  try {
    msg = JSON.parse(event.data);
  } catch (err) {
    // TODO #75: Show error toast to the user
    console.error("[ERROR] Error parsing received data from the server.");
    console.error(`[ERROR] ${err.name}: ${err.message}`);
    return;
  }

  if (!msg.hasOwnProperty(TYPE_PROP)) {
    // TODO #75: Show error toast to the user
    console.error("[ERROR] Malformed message received from socket server.");
    return;
  }

  switch (msg.type) {
    case undefined:
    case null:
    case "":
      // TODO #75: Show error toast to the user
      console.error("[ERROR] Malformed message received from socket server.");
      break;
    case TYPE_VIDEO_INFO_MESSAGE:
      // We got a new video duration, so update the slider and input elements
      state.end = parseInt(msg.content.length_seconds, 10);
      updateSliderAndInputAttributes(state.start, state.end);

      // TODO #52: Workaround for slider fill bug
      setTimeout(() => {
        loopPortionSlider._reflow();
      }, 1000);
      break;
    case TYPE_SERVER_ERROR_MESSAGE:
      // TODO #75: Show error toast to the user
      console.error("[ERROR] A server error has ocurred.");
      console.error(
        `[ERROR] Server: ${msg.content.error}\n${msg.content.description}`
      );
      break;
    default:
      // TODO #75: Show error toast to the user
      console.error("[ERROR] Unsupported message received from socket server.");
      break;
  }
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
 * Event handler for input focus events.
 *
 * This handler looks for the custom data attributes 'data-autoselect' and
 * 'data-autocopy' in form input elements. If these are found and set to true,
 * the handler will execute the appropriate action, such as selecting the
 * input's text or copying it to the user's clipboard.
 */
$("input").on("focus", function () {
  if ($(this).data("autoselect")) {
    $(this).select();
  }

  if ($(this).data("autocopy")) {
    // Attempt to write the input's value to the user's clipboard
    navigator.clipboard.writeText($(this).val()).then(
      () => {
        console.log("[INFO] Share link copied.");

        // If the input element has a tooltip as a sibling, toggle it. This can
        // be used to show a message when the text is automatically copied.
        if ($(this).siblings(TOOLTIP_TEXT_CLASS).length > 0) {
          $(this).siblings(TOOLTIP_TEXT_CLASS).first().fadeIn(300);
          setTimeout(() => {
            $(this).siblings(TOOLTIP_TEXT_CLASS).first().fadeOut(400);
          }, 3000);
        }
      },
      (err) => {
        console.error("[ERROR] Copying share link to clipboard failed.");
        console.error(err);
      }
    );
  }
});

/**
 * Event handler for jQuery's ready event. Everything that we want to execute
 * only after the DOM is ready should go here.
 */
$(function () {
  console.log("[INFO] Document ready.");

  videoForm = $("#video-form");
  videoIdInput = $("#video-id");
  startTimeInput = $("#start-time");
  endTimeInput = $("#end-time");
  sliderDiv = $("#loop-portion-slider");
  // TODO #44: Improve initialization of Foundation Slider element
  loopPortionSlider = new Foundation.Slider(sliderDiv);
  startTimeSliderHandle = $("#start-time-handle");
  endTimeSliderHandle = $("#end-time-handle");
  shareLinkInput = $("#share-link");

  // Load the Iframe Player API code asynchronously
  console.debug(
    "[DEBUG] Adding script tag for YouTube Iframe API script to DOM."
  );
  let tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  let firstScriptTag = document.getElementsByTagName("script")[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

  // State setting and updating
  console.debug("[DEBUG] Current history.state object is:");
  console.debug(history.state);

  let queryString = location.search;
  if (queryString !== "") {
    console.debug("[DEBUG] Parsing URL querystring:");
    console.debug(queryString);

    // Use Qs to parse querystring and set state using parsed data
    let qsParse = Qs.parse(queryString, { ignoreQueryPrefix: true });
    console.debug("[DEBUG] Qs parsed querystring to object:");
    console.debug(qsParse);

    // TODO #59: Handle broken querystrings in URL
    state = {
      v: qsParse.v,
      start: parseInt(qsParse.start, 10),
      end: parseInt(qsParse.end, 10),
    };
    console.debug("[DEBUG] State object set using querystring. Current state:");
    console.debug(state);
    // Do this just in case history.state doesn't get automatically set
    // from the URL's querystring. Same applies to the call below.
    updateHistoryState();

    /* Update text input for video ID (remember we can't update numeric inputs
     * here yet, because we need to set the "max" attributes. We can only set
     * those once the YT player is ready, so that we can get the video duration
     * and set the "max" attributes to that.
     */
    console.debug("[DEBUG] Setting video ID input field.");
    videoIdInput.val(state.v);
  } else {
    console.debug("[DEBUG] No querystring in URL, setting default values.");

    // Get state data from HTML form (i.e. default values)
    state = {
      v: videoIdInput.val(),
      start: parseInt(startTimeInput.val(), 10),
      end: parseInt(endTimeInput.val(), 10),
    };
    updateHistoryState();
  }
});

// YouTube Player event handlers

/**
 * Creates an <iframe> element (and YouTube player) after the API code
 * is downloaded.
 */
function onYouTubeIframeAPIReady() {
  console.log("[INFO] YouTube Iframe API ready.");

  player = new YT.Player("player", {
    height: "390",
    width: "640",
    videoId: state.v,
    playerVars: {
      version: 3,
      rel: 0,
      start: state.start,
      modestBranding: 1,
      playlist: state.v,
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
 * Updates the slider and form input elements based on state.
 *
 * We could use `player.loadVideoById()` with the `endSeconds` parameter here.
 * But if user seeks, `endSeconds` becomes invalidated, so it's kinda pointless
 * and better to control the loop portion ourselves.
 *
 * Reference: https://developers.google.com/youtube/iframe_api_reference#Events
 *
 * @param {event} event An event object containing event data.
 */
function onPlayerReady(event) {
  console.log("[INFO] YouTube player ready.");

  /* Add slider event handlers. Why are these here? See commit 0628275:
   * https://github.com/Phixyn/no-bs-looper/commit/06282756b8712a2c2012f48238b97497a0a2b62a
   * Could also addEventListener("load", ...) to the Iframe, but it's
   * effectively the same as this.
   */

  // Fired when one of the slider's handles is moved
  $(sliderDiv).on("moved.zf.slider", () => {
    // Foundation Abide plugin validation. Needs to be manually called on slider
    // change, for all of its bound input elements.
    videoForm.foundation("validateInput", startTimeInput);
    videoForm.foundation("validateInput", endTimeInput);

    updateLoopPortion();
  });

  /* This event fires when the slider has not been moved for a given time.
   * The given time is 500 milliseconds by default, and can be overriden by
   * adding a data-changed-delay attribute to the slider element in the HTML.
   * Currently, it is set to 2000 milliseconds.
   */
  $(sliderDiv).on("changed.zf.slider", () => {
    /* Only update state (used to set the querystring portion of the URL) after
     * the start/end times haven't been updated for 2000ms. The idea is to
     * reduce lag and overhead when updating the state. Updating the state
     * everytime the slider is moved causes massive lag. Updating it every
     * 500ms is slightly better, but can be laggy if a browser is already under
     * heavy load (e.g. many tabs loaded). 2000 to 5000ms seems like a good
     * value, but larger values could leave users confused as to why the
     * sharable URL they copied (which is set based on state) is wrong if they
     * copy it too fast after moving the slider.
     */
    updateHistoryState();
  });

  updateSliderAndInputAttributes(
    state.start,
    parseInt(event.target.getDuration(), 10)
  );

  // TODO #54: This shouldn't be needed because it's already set in
  //    updateSliderAndInputAttributes(). But the app breaks without it.
  console.debug("[DEBUG] Setting numeric input fields from YT onPlayerReady.");
  startTimeInput.val(state.start.toString()).change();

  // TODO #52: Workaround for slider fill bug
  setTimeout(() => {
    loopPortionSlider._reflow();
  }, 1000);
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
  if (event.data === YT.PlayerState.PLAYING) {
    console.debug("[DEBUG] Interval started from onPlayerStateChange.");
    // Every 1 second, check if we need to go back to the start of the
    // loop portion.
    timer = setInterval(() => {
      if (
        player.getCurrentTime() >= state.end ||
        player.getCurrentTime() < state.start
      ) {
        player.seekTo(state.start, true);
      }
    }, 1000);
  }
  // TODO #45: This also affects things like PlayerState === buffering, so
  // maybe do 'if (event.data === YT.PlayerState.PAUSED)' ?
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
 * in the HTML form. If the user enters a URL, the ID is extracted from it.
 * This function also requests video info from our backend server via websocket
 * (see why this is necessary below), which hopefully causes the websocket
 * client's "onmessage" handler to get called.
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
  console.debug("[DEBUG] Updating player (state.v, state.start).");
  let videoIdInputVal = videoIdInput.val();

  if (isValidHttpUrl(videoIdInputVal)) {
    let videoId = extractVideoId(videoIdInputVal);

    if (videoId === null) {
      // TODO #75: Show error toast to the user
      videoForm.foundation("addErrorClasses", videoIdInput, ["pattern"]);
      console.error(
        `[ERROR] Invalid video URL or ID in input: '${videoIdInputVal}'.`
      );
      return;
    }

    state.v = videoId;
  } else if (videoIdInputVal.length === VIDEO_ID_LENGTH) {
    state.v = videoIdInputVal;
  } else {
    // TODO #75: Show error toast to the user
    videoForm.foundation("addErrorClasses", videoIdInput, ["pattern"]);
    console.error(
      `[ERROR] Invalid video URL or ID in input: '${videoIdInputVal}'.`
    );
    return;
  }

  console.log(`[INFO] Loading new video in player with ID '${state.v}'.`);
  /* loadPlaylist() and setLoop() are required to make infinite loops of full
   * videos (i.e. not portions of a video). It's for this same reason that we
   * set 'playlist' and 'loop' in the 'playerVars' (see
   * onYouTubeIframeAPIReady()).
   *
   * Normally, we'd use player.loadVideoById(state.v), but then the video
   * wouldn't loop unless users explicitly set a loop portion using the slider.
   *
   * With loadPlaylist(), if the listType argument value is 'playlist'
   * (which is the default), then the first argument of loadPlaylist() can
   * either be a playlist ID, or an array of video IDs. A single video ID
   * string also works, and the player will create a playlist with that single
   * video. However, I was seeing some issues with full videos sometimes not
   * looping when just using a single video ID string. For now, it seems more
   * consistent with an array and two elements of the same video ID. This makes
   * a playlist with 2 copies of the same video, which is also the same
   * behaviour caused by having 'playlist' in the 'playerVars' mentioned above.
   *
   * If we start to see the same issues again, use an array of 1 video ID, or
   * just a video ID string again.
   *
   * For more info on loading and queueing videos, see:
   * https://developers.google.com/youtube/iframe_api_reference#Queueing_Functions
   */
  // player.loadPlaylist(state.v);
  player.loadPlaylist([state.v, state.v]);
  player.setLoop(true);

  // On new videos, reset start time to 0 and set end to new video's length
  state.start = 0;
  // Request the Python server to make a GET request for video info and send
  // us the data back via the websocket.
  // TODO #49: Improve usage of websocket client in updatePlayer()
  console.debug("[DEBUG] Sending request for video info to Python server.");
  websocket.send(JSON.stringify({ get_video_info: state.v }));
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
  let startTime = parseInt(startTimeInput.val(), 10);
  let endTime = parseInt(endTimeInput.val(), 10);

  if (!isNaN(startTime) && startTime != state.start) {
    state.start = startTime;
  }

  if (!isNaN(endTime) && endTime != state.end) {
    state.end = endTime;
  }

  // If needed, seek to the desired start time for the loop portion
  if (
    player.getCurrentTime() >= state.end ||
    player.getCurrentTime() < state.start
  ) {
    player.seekTo(state.start, true);
  }
}

/**
 * Replaces the browser's history state object with the current application
 * state object. This will also update the URL's querystring with the state's
 * data, which is useful for sharing and bookmarking URLs to specific loops.
 */
function updateHistoryState() {
  console.debug("[DEBUG] Updating and replacing history.state.");
  console.debug("[DEBUG] Old history.state:");
  console.debug(history.state);

  /* jQuery's param() serializes an object into a string that can be used in
   * an URL query string or an API query. Also see MDN's page on the History
   * API for info on replaceState().
   */
  history.replaceState(state, "", "?" + $.param(state));

  shareLinkInput.val(location.href);
  console.debug("[DEBUG] New history.state:");
  console.debug(history.state);
}

/**
 * Sets the loop portion's start time to the current time of the video.
 */
function setStartTimeToCurrent() {
  state.start = parseInt(player.getCurrentTime(), 10);
  startTimeInput.val(state.start.toString()).change();
}

/**
 * Sets the loop portion's end time to the current time of the video.
 */
function setEndTimeToCurrent() {
  state.end = parseInt(player.getCurrentTime(), 10);
  endTimeInput.val(state.end.toString()).change();
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

  endTimeString = newEndTime.toString();
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

  // Update number input elements
  console.debug(
    "[DEBUG] Setting numeric input values from updateSliderAndInputAttributes."
  );
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
   * the URL's querystring has a different `end=`, we should honor that, so
   * that's why we use the state here.
   *
   * Note: Do this only after setting logical and visual end values for slider,
   * otherwise the second handle's position won't match the end time value.
   */
  endTimeInput.val(state.end.toString()).change();
}

/**
 * Checks if the given string is a valid HTTP or HTTPS URL.
 *
 * @param {string} urlString The string to validate.
 * @return {boolean} A boolean indicating if the string is a valid HTTP or
 *     HTTPS URL.
 */
function isValidHttpUrl(urlString) {
  console.debug(`[DEBUG] Checking if '${urlString}' is a valid URL.`);
  let urlObj;

  try {
    urlObj = new URL(urlString);
  } catch (err) {
    console.error(`[ERROR] ${err.name}: ${err.message}`);
    return false;
  }

  return urlObj.protocol === "http:" || urlObj.protocol === "https:";
}

/**
 * Extracts a YouTube video ID from a URL string. The URL can be either a known
 * YouTube domain (such as youtube.com or youtu.be) or any other URL that
 * contains a 'v=' in its querystring.
 *
 * For 'youtu.be' or 'youtube.com/embed' links, the last part of the URL's
 * pathname will be extracted as a potential ID. Note that the extracted ID is
 * validated, and only returned if deemed to be valid. Otherwise, null is
 * returned.
 *
 * @param {string} youtubeUrl A YouTube video URL string.
 * @return {string} A YouTube video ID, if a valid one is found. Otherwise,
 *    returns null.
 */
function extractVideoId(youtubeUrl) {
  console.log(`[INFO] Attempting to extract video ID from '${youtubeUrl}'.`);
  let videoId;
  let urlObj;

  try {
    urlObj = new URL(youtubeUrl);
  } catch (err) {
    // TODO #75: Show error toast to the user.
    console.error(`[ERROR] ${err.name}: ${err.message}`);
    return null;
  }

  // Check if there is a querystring in the URL and parse it
  if (urlObj.search !== "") {
    console.log("[INFO] Found querystring in URL, parsing it.");

    let qsParse = Qs.parse(urlObj.search, { ignoreQueryPrefix: true });
    if (!qsParse.hasOwnProperty("v") || qsParse.v === "") {
      console.error("[ERROR] Could not get video ID from YouTube URL.");
      return null;
    }

    videoId = qsParse.v;
  } else if (urlObj.pathname !== "") {
    console.log("[INFO] Extracting potential video ID from URL pathname.");
    // Handle 'youtu.be/id' and 'youtube.com/embed/id'
    let pathArray = urlObj.pathname.split("/");
    videoId = pathArray[pathArray.length - 1];
  }

  console.log("[INFO] Validating video ID.");
  // Validate video ID by checking the length
  if (videoId.length !== VIDEO_ID_LENGTH) {
    console.error(`[ERROR] Invalid video ID in URL: '${youtubeUrl}'.`);
    console.debug(`[DEBUG] Got unexpected length in ID: '${videoId}'.`);
    return null;
  }

  console.debug(`[DEBUG] Got a valid video ID from URL: '${videoId}'.`);
  return videoId;
}
