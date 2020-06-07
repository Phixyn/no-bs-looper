#!/usr/bin/env python
"""WS backend server for the no BS looper."""


__author__ = "Phixyn"
__version__ = "1.0.0"


import asyncio
import json
import logging
import sys
import urllib.request
import urllib.parse
import websockets

from json.decoder import JSONDecodeError
from urllib.error import URLError
from websockets.client import WebSocketClientProtocol


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
    raw HTML response, if successful. Used to make the video info API
    request to YouTube.
    
    Args:
        url: The URL of the webpage to get the HTML from.

    Returns:
        The decoded response from the urllib request. If the request fails,
        an error is printed and None is returned.
    """
    # TODO move to config/const
    user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:64.0) Gecko/20100101 Firefox/64.0"

    http_request = urllib.request.Request(url)
    http_request.add_header("User-Agent", user_agent)
    raw_html = None

    try:
        with urllib.request.urlopen(http_request) as response:
            print(response.info())
            # TODO honestly not sure whether to use utf-8 or ascii
            # raw_html = response.read().decode("utf-8")
            raw_html = response.read().decode("ascii")
    except URLError as e:
        if hasattr(e, "reason"):
            # TODO replace with logger
            print("Failed to reach server.")
            print("Reason: ", e.reason)
        # HTTPError
        elif hasattr(e, "code"):
            print("The server couldn't fullfil the request.")
            print("HTTP error code: ", e.code)

    return raw_html


def process_message(message: str) -> str:
    """
    TODO

    This should probably accept and work with bytes instead of str.
    If we can easily send byte data from the web app, it should be
    done.
    """
    parsed_message = None

    try:
        parsed_message = json.loads(message)
    except JSONDecodeError as e:
        logger.error("Unable to parse websocket message.")
        logger.error(e)

    if not parsed_message:
        return json.dumps({"error": "Server did not understand received message."})
    elif not "request_video_info" in parsed_message.keys():
        # This is a bit lazy, so probably should be improved. But for now, we
        # only care about one message: {"request_video_info": "video_id"}
        # TODO probably need better error lulw
        return json.dumps({"error": "Unsupported message."})
    else:
        # TODO add more logging and could probably go to a separate function
        video_id = parsed_message["request_video_info"]
        # print(video_id)    
        url = f"https://www.youtube.com/get_video_info?html5=1&video_id={video_id}"
        # Perform request to YouTube server. It replies with a formencoded string,
        # which can be parsed with parse_qs.
        parsed_qs = urllib.parse.parse_qs(get_raw_html(url))
        # Video details are in the player_response object
        player_response = json.loads(parsed_qs["player_response"][0])
        video_length = player_response["videoDetails"]["lengthSeconds"]
        response_for_client = {
            "lengthSeconds": video_length
        }
        # TODO send error in case something above went wrong
        # Protip to test error, pass invalid or private video ID in url.

        return json.dumps(response_for_client)


async def server_handler(websocket, path):
    """Handler function for the websocket server."""
    request_message = await websocket.recv()
    logger.info(f"Received: {request_message}")

    response_message = process_message(request_message)
    logger.info(f"Sending: {response_message}")
    await websocket.send(response_message)


if __name__ == "__main__":
    # wuauw I commited an IP address some hacker is gonna hack my pc oh no
    HOST = "192.168.1.71"
    PORT = 14670

    start_server = websockets.serve(server_handler, HOST, PORT)
    asyncio.get_event_loop().run_until_complete(start_server)
    asyncio.get_event_loop().run_forever()
