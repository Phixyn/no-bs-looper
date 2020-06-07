"""Proxy to bypass CORS."""


__author__ = "Phixyn"


import json
import http.server
import socketserver
import urllib.request
import urllib.parse

from urllib.error import URLError


class PhixReverseProxy(http.server.BaseHTTPRequestHandler):
    """
    Subclass of BaseHTTPRequestHandler used to handle GET requests to our
    very simple HTTP API server.
    """
    def end_headers(self):
        """Override end_headers to add the CORS-allowing header just after
        very other header has been set."""
        self.send_header('Access-Control-Allow-Origin', '*')
        http.server.BaseHTTPRequestHandler.end_headers(self)

    def get_raw_html(self, url):
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

    def do_GET(self):
        """
        Handles GET requests on the server.
        """
        # Our API only supports /get_yt_video_length right now
        if ("/get_yt_video_length" not in self.path):
            self.send_error(501, "Unsupported endpoint", f"GET request for endpoint {self.path} not supported")
            error_object = {
                "error": f"GET request for endpoint {self.path} not supported."
            }
            return
        else:
            # Look for video_id query parameter in URL. Send 400 if not found or not-parseable.
            video_id = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query).get('video_id', None)
            if not video_id:
                self.send_error(400 , "Malformed request", f"video_id query parameter is missing or invalid")
                return

            print(video_id[0])
            # Log information about the GET request
            print(f"Received GET request\
                \nPath: {str(self.path)}\
                \nHeaders:\n{str(self.headers)}")

            url = f"https://www.youtube.com/get_video_info?html5=1&video_id={video_id[0]}"
            # Perform request to YouTube server. It replies with a formencoded string,
            # which can be parsed with parse_qs.
            parsed_qs = urllib.parse.parse_qs(self.get_raw_html(url))
            # Video details are in the player_response object
            player_response = json.loads(parsed_qs["player_response"][0])
            video_length = player_response["videoDetails"]["lengthSeconds"]
            response_for_client = {
                "lengthSeconds": video_length
            }
            # TODO send error in case something above went wrong
            # Protip to test error, change video_id[0] in url to just video_id
            # to cause an error with the request.
            
            # Send response to client
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(response_for_client).encode("utf-8"))

            return


if __name__ == '__main__':
    PORT = 14670
    # wuauw I commited an IP address some hacker is gonna hack my pc oh no
    server_address = ('192.168.1.71', PORT)
    httpd = http.server.HTTPServer(server_address, PhixReverseProxy)
    print('HTTP server is running')
    httpd.serve_forever()
