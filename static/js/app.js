// Video
const VIDEO_ID_LENGTH = 11;
// Timeouts
const TIMEOUT_TOOLTIP = 3000;
// Intervals
const INTERVAL_CHECK_CURRENT_TIME = 1000;

var player;
var state;
const videoIdInput = document.getElementById("video-id-new");
const startTimeInput = document.getElementById('start-time-new');
const endTimeInput = document.getElementById('end-time-new');
const totlOverlay = document.getElementById("totl-overlay");
const shareLinkInput = document.getElementById('share-link');
const shareBtn = document.getElementById("share-btn");
const shareModal = document.getElementById("share-modal");
const shareModalCloseButtons = document.querySelectorAll("[data-modal-close]");
const videoIdHint = document.getElementById("video-id-hint");
const videoIdRequiredError = document.getElementById("video-id-required-error");
const videoIdPatternError = document.getElementById("video-id-pattern-error");
const startTimeError = document.getElementById("start-time-error");
const endTimeError = document.getElementById("end-time-error");
const playerContainer = document.querySelector("#player")?.parentElement;
var isInitialVideo = true;

const newSlider = new DualRangeSlider('#loop-portion-slider-new', {
  min: 0,
  max: 100,
  valueMin: 25,
  valueMax: 75,
  onChange: (min, max) => {
    startTimeInput.value = min;
    endTimeInput.value = max;

    state.start = min;
    state.end = max;
    updateLoopPortion();
    // TODO Need to debounce this call
    updateHistoryState();
  }
});

/**
 * Event handler for input focus events.
 *
 * This handler looks for the custom data attributes 'data-autoselect' and
 * 'data-autocopy' in form input elements. If these are found and set to true,
 * the handler will execute the appropriate action, such as selecting the
 * input's text or copying it to the user's clipboard.
 */
function initializeApp() {
  console.log("[INFO] Document ready.");

  // Event handlers for controls
  document.getElementById('update-btn-new').onclick = updatePlayer;
  document.getElementById('start-to-current-btn-new').onclick = setStartTimeToCurrent;
  document.getElementById('end-to-current-btn-new').onclick = setEndTimeToCurrent;
  document.getElementById('toggle-vid-btn').onclick = togglePlayer;
  document.getElementById('lights-off-btn').onclick = enableTotl;

  // Custom modal handlers
  shareBtn.addEventListener("click", openShareModal);
  shareModalCloseButtons.forEach((el) => {
    el.addEventListener("click", closeShareModal);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && shareModal.getAttribute("aria-hidden") === "false") {
      closeShareModal();
    }
  });

  // Totl overlay click closes overlay.
  totlOverlay.addEventListener("click", disableTotl);

  // Event handlers for auto-select and auto-copy behaviors.
  document.querySelectorAll("input").forEach((input) => {
    input.addEventListener("focus", () => {
      if (input.dataset.autoselect === "true") {
        input.select();
      }

      if (input.dataset.autocopy === "true") {
        navigator.clipboard.writeText(input.value).then(
          () => {
            console.log("[INFO] Share link copied.");
            const tooltip = input.parentElement?.querySelector(".phix-tooltip-text");
            if (tooltip) {
              tooltip.classList.add("is-visible");
              setTimeout(() => {
                tooltip.classList.remove("is-visible");
              }, TIMEOUT_TOOLTIP);
            }
          },
          (err) => {
            console.error("[ERROR] Copying share link to clipboard failed.");
            console.error(err);
          }
        );
      }
    });
  });

  startTimeInput.addEventListener('input', () => {
    const parsedStart = parseInt(startTimeInput.value, 10);
    if (!Number.isNaN(parsedStart)) {
      setStartTimeValidationState(true);
      newSlider.setValues(parsedStart, newSlider.getValues().max);
    } else {
      setStartTimeValidationState(false);
    }
  });

  endTimeInput.addEventListener('input', () => {
    const parsedEnd = parseInt(endTimeInput.value, 10);
    if (!Number.isNaN(parsedEnd)) {
      setEndTimeValidationState(true);
      newSlider.setValues(newSlider.getValues().min, parsedEnd);
    } else {
      setEndTimeValidationState(false);
    }
  });

  // Load the Iframe Player API code asynchronously
  console.debug(
    "[DEBUG] Adding script tag for YouTube Iframe API script to DOM."
  );
  let tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  let firstScriptTag = document.getElementsByTagName("script")[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

  // State setting and updating
  // TODO #114: Move this to a separate function, setInitialState()
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

    if (!state.v) {
      state.v = videoIdInput.value;
    }

    if (Number.isNaN(state.start)) {
      state.start = parseInt(startTimeInput.value, 10);
    }

    if (Number.isNaN(state.end)) {
      state.end = parseInt(endTimeInput.value, 10);
    }

    console.debug("[DEBUG] State object set using querystring. Current state:");
    console.debug(state);

    /* Update text input for video ID (remember we can't update numeric inputs
     * here yet, because we need to set the "max" attributes. We can only set
     * those once the YT player is ready, so that we can get the video duration
     * and set the "max" attributes to that.
     */
    console.debug("[DEBUG] Setting video ID input field.");
    videoIdInput.value = state.v;
  } else {
    console.debug("[DEBUG] No querystring in URL, setting default values.");

    // Get state data from HTML form (i.e. default values)
    state = {
      v: videoIdInput.value,
      start: parseInt(startTimeInput.value, 10),
      end: parseInt(endTimeInput.value, 10),
    };
  }

  newSlider.setMax(state.end);
  newSlider.setValues(state.start, state.end);

  // Do this just in case history.state doesn't get automatically set
  // from the URL's querystring.
  updateHistoryState();
}

initializeApp();

// YouTube Player event handlers

/**
 * Creates an <iframe> element (and YouTube player) after the API code
 * is downloaded.
 */
function onYouTubeIframeAPIReady() {
  console.log("[INFO] YouTube Iframe API ready.");

  player = new YT.Player("player", {
    width: "100%",
    height: "100%",
    videoId: state.v,
    playerVars: {
      version: 3,
      rel: 0,
      start: state.start,
      modestBranding: 1,
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

  // console.log("[onPlayerReady] player object:");
  console.log("[onPlayerReady] player getDuration():");
  console.log(player.getDuration());
  console.log("[onPlayerReady] player.playerInfo.duration:");
  console.log(player.playerInfo.duration);
  if (isInitialVideo === false) {
    state.end = player.playerInfo.duration;
  }
  updateSliderAndInputAttributes(state.start, player.playerInfo.duration);
  startTimeInput.value = state.start;

  /* Using a playlist is required to ensure that full videos loop without
   * stopping. See comment above player.loadPlaylist() in updatePlayer()
   * for more information.
   */
  player.cuePlaylist([state.v, state.v]);
  player.setLoop(true);
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
    }, INTERVAL_CHECK_CURRENT_TIME);
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
 *
 * Note: getDuration() returns 0 until video metadata is loaded, so the
 * slider and input max attributes are updated via a setTimeout after load.
 *
 * TODO #48: Rename updatePlayer to be more descriptive?
 */
function updatePlayer() {
  console.debug("[DEBUG] Updating player (state.v, state.start).");

  // Initial video is the one that shows when page first loads, thus this
  // should be set to false the first time a new video is loaded.
  if (isInitialVideo) {
    isInitialVideo = false;
  }

  let videoIdInputVal = videoIdInput.value.trim();
  if (videoIdInputVal === "") {
    setVideoIdValidationState(false, "required");
    return;
  }

  if (isValidHttpUrl(videoIdInputVal)) {
    let videoId = extractVideoId(videoIdInputVal);

    if (videoId === null) {
      setVideoIdValidationState(false, "pattern");
      console.error(
        `[ERROR] Invalid video URL or ID in input: '${videoIdInputVal}'.`
      );
      return;
    }

    setVideoIdValidationState(true);
    state.v = videoId;
  } else if (videoIdInputVal.length === VIDEO_ID_LENGTH) {
    setVideoIdValidationState(true);
    state.v = videoIdInputVal;
  } else {
    setVideoIdValidationState(false, "pattern");
    console.error(
      `[ERROR] Invalid video URL or ID in input: '${videoIdInputVal}'.`
    );
    return;
  }

  // Validate time inputs
  const parsedStart = parseInt(startTimeInput.value, 10);
  const parsedEnd = parseInt(endTimeInput.value, 10);
  const startValid = startTimeInput.value.trim() !== "" && !Number.isNaN(parsedStart);
  const endValid = endTimeInput.value.trim() !== "" && !Number.isNaN(parsedEnd);
  setStartTimeValidationState(startValid);
  setEndTimeValidationState(endValid);
  if (!startValid || !endValid) {
    return;
  }

  console.log(`[INFO] Loading new video in player with ID '${state.v}'.`);
  /* loadPlaylist() and setLoop() are required to make infinite loops of full
   * videos (i.e. not portions of a video). It's for this same reason that we
   * set 'loop: 1' in the 'playerVars' and call 'cuePlaylist()' (see
   * onYouTubeIframeAPIReady() and onPlayerReady()) when setting up the player.
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
  player.loadPlaylist([state.v, state.v]);
  player.setLoop(true);

  // On new videos, reset start time to 0. The video duration is not yet
  // available, so wait for playback metadata to load before updating the
  // slider and input max attributes.
  state.start = 0;
  setTimeout(() => {
    console.log("[INFO] [updatePlayer] player.playerInfo.duration:");
    console.log(player.playerInfo.duration);

    state.end = player.playerInfo.duration;
    updateSliderAndInputAttributes(state.start, player.playerInfo.duration);
    startTimeInput.value = state.start;
  }, 5000);
}

/**
 * Toggles the opacity of the player's parent element, making the player
 * visible or invisible while preserving the layout space.
 */
function togglePlayer() {
  if (!playerContainer) {
    return;
  }

  if (playerContainer.style.opacity === "0") {
    playerContainer.style.opacity = "1";
  } else {
    playerContainer.style.opacity = "0";
  }
}

/**
 * Toggles the "Turn off the lights" (TOTL) feature on by displaying the TOTL
 * overlay. This overlay is a div with a dark background that covers every
 * element except the player.
 */
function enableTotl() {
  totlOverlay.style.display = "block";
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      totlOverlay.classList.add("is-visible");
    });
  });
}

function disableTotl() {
  totlOverlay.classList.remove("is-visible");
  setTimeout(() => {
    if (!totlOverlay.classList.contains("is-visible")) {
      totlOverlay.style.display = "none";
    }
  }, 250);
}

/**
 * Updates the start and end times for the video's loop portion based on the
 * values in the HTML input elements (i.e. set by the user!).
 *
 * Note: The slider and input elements are data bound.
 */
function updateLoopPortion() {
  let startTime = parseInt(startTimeInput.value, 10);
  let endTime = parseInt(endTimeInput.value, 10);

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

  const queryString = new URLSearchParams({
    v: state.v,
    start: state.start.toString(),
    end: state.end.toString(),
  }).toString();
  history.replaceState(state, "", `?${queryString}`);

  shareLinkInput.value = location.href;
  console.debug("[DEBUG] New history.state:");
  console.debug(history.state);
}

/**
 * Sets the loop portion's start time to the current time of the video.
 */
function setStartTimeToCurrent() {
  state.start = parseInt(player.getCurrentTime(), 10);
  startTimeInput.value = state.start;
  setStartTimeValidationState(true);
  newSlider.setValues(state.start, newSlider.getValues().max);
}

/**
 * Sets the loop portion's end time to the current time of the video.
 */
function setEndTimeToCurrent() {
  state.end = parseInt(player.getCurrentTime(), 10);
  endTimeInput.value = state.end;
  setEndTimeValidationState(true);
  newSlider.setValues(newSlider.getValues().min, state.end);
}

/**
 * Updates slider and input attributes using the given new start time
 * and new end time. Whenever a new video is loaded and the start/end
 * times change, attributes such as max value and data-end need to be
 * updated so that users can correctly input and set start and end times.
 *
 * If these are not updated, there is a large chance that the slider will
 * no longer match the length of the video, and that users will not be
 * able to enter the expected end time values.
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

  endTimeInput.max = newEndTime;
  startTimeInput.max = newEndTime - 1;
  console.debug("[DEBUG] Finished setting numeric input max attributes.");

  // Update slider values and ARIA values.
  newSlider.setMax(newEndTime);
  newSlider.setValues(newStartTime, state.end);
  console.debug(
    "[DEBUG] Finished setting slider max and current values."
  );

  // Update number input elements
  console.debug(
    "[DEBUG] Setting numeric input values from updateSliderAndInputAttributes."
  );
  startTimeInput.value = newStartTime;
  endTimeInput.value = state.end;
}

function setVideoIdValidationState(isValid, errorType) {
  const inputRow = videoIdInput.closest(".input-row");
  if (isValid) {
    videoIdInput.classList.remove("is-invalid-input");
    videoIdRequiredError.classList.remove("is-visible");
    videoIdPatternError.classList.remove("is-visible");
    inputRow.classList.remove("is-invalid");
    return;
  }

  videoIdInput.classList.add("is-invalid-input");
  if (errorType === "pattern") {
    videoIdRequiredError.classList.remove("is-visible");
    videoIdPatternError.classList.add("is-visible");
  } else {
    videoIdPatternError.classList.remove("is-visible");
    videoIdRequiredError.classList.add("is-visible");
  }
  inputRow.classList.add("is-invalid");
}

function setStartTimeValidationState(isValid) {
  const inputRow = startTimeInput.closest(".input-row");
  if (isValid) {
    startTimeInput.classList.remove("is-invalid-input");
    startTimeError.classList.remove("is-visible");
    inputRow.classList.remove("is-invalid");
    return;
  }

  startTimeInput.classList.add("is-invalid-input");
  startTimeError.classList.add("is-visible");
  inputRow.classList.add("is-invalid");
}

function setEndTimeValidationState(isValid) {
  const inputRow = endTimeInput.closest(".input-row");
  if (isValid) {
    endTimeInput.classList.remove("is-invalid-input");
    endTimeError.classList.remove("is-visible");
    inputRow.classList.remove("is-invalid");
    return;
  }

  endTimeInput.classList.add("is-invalid-input");
  endTimeError.classList.add("is-visible");
  inputRow.classList.add("is-invalid");
}

function openShareModal() {
  shareModal.setAttribute("aria-hidden", "false");
  shareModal.classList.add("is-open");
  shareLinkInput.focus();
}

function closeShareModal() {
  shareModal.setAttribute("aria-hidden", "true");
  shareModal.classList.remove("is-open");
  shareBtn.focus();
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
  if (urlObj.search !== "" && urlObj.search.includes("si=") !== true) {
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
