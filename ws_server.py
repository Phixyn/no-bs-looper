#!/usr/bin/env python
"""Backend server for the no BS YouTube looper.

Provides a way to send GET requests to YouTube, bypassing CORS. Uses
websocket to communicate with clients. Scroll to the bottom to find
and change the IP address and port number to bind the websocket
server to.
"""


__author__ = "Phixyn"
__version__ = "1.1.3"


import asyncio
import json
import logging
import sys
import urllib.parse
import urllib.request
from json.decoder import JSONDecodeError
from typing import Any, Dict
from urllib.error import HTTPError, URLError

import websockets
from websockets.client import WebSocketClientProtocol

# Not my API key btw
GOOG_API_KEY = "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8"
LOG_LEVEL = logging.DEBUG

# Create a Formatter to specify how logging messages are displayed
# e.g. [2017-10-20 02:28:14][INFO] Initializing...
LOG_FORMATTER = logging.Formatter("[%(asctime)s][%(levelname)s] %(message)s", datefmt="%Y-%m-%d %H:%M:%S")

# Set up logger
logger = logging.getLogger()
logger.setLevel(LOG_LEVEL)

# Set up logging handler for stdout
loggerConsoleHandler = logging.StreamHandler(sys.stdout)
loggerConsoleHandler.setFormatter(LOG_FORMATTER)
logger.addHandler(loggerConsoleHandler)


def get_raw_html(url: str) -> str:
    """Makes a simple HTTP GET request to the specified URL and returns the
    raw HTML response, if successful. Used to make the (old) video info API
    request to YouTube.

    This function is not currently used.

    Args:
        url: The URL of the webpage to get the HTML from.

    Returns:
        The response, in bytes, from the urllib request. This contains the
        raw HTML, which can be passed to a HTML parser. If the request fails,
        an error is printed and None is returned.
    """
    # TODO move to config/const
    user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:64.0) Gecko/20100101 Firefox/64.0"

    logger.debug("Making GET request to '{}'...".format(url))
    http_request = urllib.request.Request(url)
    http_request.add_header("User-Agent", user_agent)
    raw_html = None

    try:
        with urllib.request.urlopen(http_request) as response:
            # print(response.info())
            # TODO honestly not sure whether to use utf-8 or ascii
            # raw_html = response.read().decode("utf-8")
            raw_html = response.read().decode("ascii")
    except HTTPError as http_error:
        logger.error("The server couldn't fullfil the request.")
        logger.error("HTTP error code: %d", http_error.code)
    except URLError as url_error:
        logger.error("An error occurred in the HTTP request.")
        if hasattr(url_error, "reason"):
            logger.error("Failed to reach server.")
            logger.error("Reason: %s", url_error.reason)

    return raw_html


def get_video_info(video_id: str) -> Dict[str, Any]:
    """Gets information about a video, such as video length, channel and other
    metadata. Part of a workaround to avoid registering and using a developer
    account for private YT APIs. Credits for this hack go to all the
    communities that develop YouTube related tools (in particular: youtube-dl,
    yt-dlp and pytube). I found this workaround on the yt-dlp and pytube repos
    on GitHub, so extra thank you to those communities!

    This function makes a HTTP POST request to a public endpoint that returns
    the video info in a JSON format. Presumably, this endpoint is normally used
    by the YouTube mobile and TV apps. The fact that it's a public endpoint is
    handy, as it means that we don't need a developer account or any sort of
    API keys. We also don't have to worry about rate limits and quotas.

    Note that the API key included in the header is not associated with any
    personal account of mine or other developers. It's not hard to guess how
    this API key was found, though :P

    The request made is similar (if not identical) to the request made by the
    YT Android app, which can be observed in the HTTP request body. The request
    body also includes the ID of the video we're requesting information for.

    Args:
        video_id: The ID of the video to get the information for.

    Returns:
        A Dict containing YouTube video info, or an error message.
    """
    logger.debug("Getting video info for video ID: '{}'".format(video_id))

    api_response = None

    request_url = f"https://www.youtube.com/youtubei/v1/player"
    # Yes indeed, we are the Android YT app now. Didn't you know?
    request_body = {
        "context": {
            "client": {
                "clientName": "ANDROID",
                "clientVersion": "16.05"
            }
        },
        "videoId": video_id
    }
    # Request body must be valid JSON *and* encoded
    json_body = json.dumps(request_body)
    encoded_json_body = json_body.encode("utf-8")

    http_request = urllib.request.Request(
        request_url,
        data=encoded_json_body,
        method="POST"
    )
    http_request.add_header("Content-Type", "application/json")
    http_request.add_header('Content-Length', len(encoded_json_body))
    http_request.add_header("X-Goog-Api-Key", GOOG_API_KEY)

    try:
        with urllib.request.urlopen(http_request) as http_response:
            # UTF-8 charset has to be used to handle characters such as
            # emojis, often used in video titles.
            api_response = http_response.read().decode("utf-8")
    except HTTPError as http_error:
        logger.error("The server couldn't fullfil the request.")
        logger.error("HTTP error code: %d", http_error.code)
    except URLError as url_error:
        logger.error("An error occurred in the HTTP request.")
        if hasattr(url_error, "reason"):
            logger.error("Failed to reach server.")
            logger.error("Reason: %s", url_error.reason)

    # Debug - Write JSON to file
    # with open("debug_api_response.json", "w") as debug_file:
    #     json.dump(json.loads(api_response), debug_file)
    #     logger.debug("Wrote parsed response JSON to debug file.")

    try:
        # The response is in JSON, which can be parsed and stored as a Dict
        return json.loads(api_response)
    except (TypeError, JSONDecodeError) as e:
        logger.error(
            "Video info response from YT API was not in a valid JSON format."
        )
        logger.error(e)
        logger.debug("Response content was:")
        logger.debug(api_response)
        return {
            "no_bs_error": {
                "error": "Server error.",
                "description": "Error getting video info from YT API."
            }
        }


def process_message(message: Dict[str, Any]) -> Dict[str, Any]:
    """Processes a received message from a client. If the message is not
    supported or valid, returns an error object. Otherwise, performs a
    GET request to get the video info from YouTube and returns an object
    containing said info.

    Args:
        message: A JSON object containing the message.

    Returns:
        A JSON object containing YouTube video info, or an error.
    """
    parsed_message = None

    try:
        parsed_message = json.loads(message)
    except JSONDecodeError as e:
        logger.error("Unable to parse websocket message.")
        logger.error(e)

    if not parsed_message:
        return json.dumps({
            "type": "error",
            "content": {
                "error": "Malformed message.",
                "description": "Server did not understand received message."
            }
        })
    elif not "get_video_info" in parsed_message:
        # TODO
        # This is a bit lazy, so probably should be improved. But for now, we
        # only care about one message: {"get_video_info": "video_id"}
        return json.dumps({
            "type": "error",
            "content": {
                "error": "Unsupported message.",
                "description": "The request made to the server is not supported."
            }
        })
    else:
        # Get and return video length for the given video ID
        # TODO add more logging and could probably go to a separate function
        video_id = parsed_message["get_video_info"]

        video_info = get_video_info(video_id)
        if "no_bs_error" in video_info:
            return json.dumps({
                "type": "error",
                "content": video_info["no_bs_error"]
            })

        # Video details are in the videoDetails object of the YT API response
        # Protip to test errors: pass invalid or private video ID to
        # get_video_info().
        video_details = video_info.get("videoDetails", None)
        if not video_details:
            logger.error("Video info JSON did not contain a video details object.")
            logger.debug("get_video_info() returned:")
            logger.debug(video_info)
            return json.dumps({
                "type": "error",
                "content": {
                    "error": "Server error.",
                    "description": "The YT API response did not contain a video details object."
                }
            })

        video_length = video_details.get("lengthSeconds", None)
        if not video_length:
            logger.error("Video details object did not contain a video length.")
            logger.debug(f"Video length was: {video_length}")
            return json.dumps({
                "type": "error",
                "content": {
                    "error": "Server error.",
                    "description": "The YT API response did not contain a video length."
                }
            })

        return json.dumps({
            "type": "video_info",
            "content": {
                "length_seconds": video_length
            }
        })


async def server_handler(websocket, path):
    """Handler function for the websocket server. Processes each message
    received and sends back a response to the client.
    """
    async for request_message in websocket:
        # request_message = await websocket.recv()
        logger.info(f"Received: {request_message}")

        response_message = process_message(request_message)
        logger.info(f"Sending: {response_message}")
        await websocket.send(response_message)


if __name__ == "__main__":
    # TODO Move to config file
    # Add your local IP address here
    HOST = ""
    PORT = 14670

    start_server = websockets.serve(server_handler, HOST, PORT)
    asyncio.get_event_loop().run_until_complete(start_server)
    asyncio.get_event_loop().run_forever()
