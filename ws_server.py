#!/usr/bin/env python
"""WS backend server for the no BS looper."""


__author__ = "Phixyn"
__version__ = "1.0.0"


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

LOG_LEVEL = logging.INFO

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
    raw HTML response, if successful. Used to make the video info API
    request to YouTube.
    
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
        return json.dumps({"error": "Server did not understand received message."})
    elif not "get_video_info" in parsed_message.keys():
        # This is a bit lazy, so probably should be improved. But for now, we
        # only care about one message: {"get_video_info": "video_id"}
        # TODO probably need better error lulw
        return json.dumps({"error": "Unsupported message."})
    else:
        # TODO add more logging and could probably go to a separate function
        video_id = parsed_message["get_video_info"]
        url = f"https://www.youtube.com/get_video_info?html5=1&video_id={video_id}"
        # Perform request to YouTube server. It replies with a formencoded string,
        # which can be parsed with parse_qs.
        parsed_qs = urllib.parse.parse_qs(get_raw_html(url))
        # Video details are in the player_response object
        player_response = json.loads(parsed_qs["player_response"][0])
        video_length = player_response["videoDetails"]["lengthSeconds"]
        # TODO send error in case something above went wrong
        # Protip to test error, pass invalid or private video ID in url.
        return json.dumps({"length_seconds": video_length})


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
    # wuauw I commited an IP address some hacker is gonna hack my pc oh no
    HOST = "192.168.1.71"
    PORT = 14670

    start_server = websockets.serve(server_handler, HOST, PORT)
    asyncio.get_event_loop().run_until_complete(start_server)
    asyncio.get_event_loop().run_forever()
