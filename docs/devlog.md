# No BS Looper Development Log

```
Version: 1.0.0
Description: A no BS YouTube looper.
Project start: 2 June 2020
GitHub: https://github.com/Phixyn/no-bs-looper
Issue tracker: https://github.com/Phixyn/no-bs-looper/issues

Devlog template: 1.1.0
```

- - -

## Navigation

- [Navigation](#navigation)
- [Todo List](#todo-list)
- [Links](#links)
    - [General](#general)
    - [YouTube Player API](#youtube-player-api)
    - [Actual BS Loopers](#actual-bs-loopers)
    - [Docker](#docker)
    - [Foundation](#foundation)
    - [Design and UX](#design-and-ux)
    - [JavaScript](#javascript)
    - [jQuery](#jquery)
    - [CORS](#cors)
    - [Browser History API](#browser-history-api)
    - [URL API](#url-api)
    - [Similar Projects](#similar-projects)
    - [Websockets](#websockets)
    - [Libraries/modules](#librariesmodules)
    - [Testing](#testing)
    - [Chrome Web App](#chrome-web-app)
    - [Meta tag stuff](#meta-tag-stuff)
        - [Validators/testing](#validatorstesting)
    - [Life-Saving StackOverflow Answers](#life-saving-stackoverflow-answers)
    - [Inspiring README Files](#inspiring-readme-files)
    - [Contributing and other `.github` files](#contributing-and-other-github-files)
- [Notepad](#notepad)
    - [Test links](#test-links)
- [Scrap Paper](#scrap-paper)
    - [Build the Nginx Container](#build-the-nginx-container)
    - [Parsing YouTube Video URLs To Get ID](#parsing-youtube-video-urls-to-get-id)
    - [Simple websocket onerror handler](#simple-websocket-onerror-handler)
    - [querystring bla](#querystring-bla)

- - -

## Todo List

> ✅ List of what needs to be done. Try to keep this short and actionable. Most tasks should be in Trello, Jira or whatever the most hip and trendy tool is.

* [ ] Document Websocket/IPC messages/communication protocol in this devlog and/or `docs/` folder
* [ ] GitHub wiki pages for project with guides/demo/screenshots, and a page for a list of hosted instances that people can add to (just like simiki)
* [ ] Improve Python websocket server with [graceful shutdown](https://websockets.readthedocs.io/en/stable/deployment.html)
* [ ] Investigate websocket channels to send messages to multiple connected clients (not sure if needed, seems to work fine?)
* [ ] Server: Address all TODO comments
* [ ] Better align slider with video seek player control (I'm not sure this can be any better tbh)
* [ ] Add HTTPS? Needs to be a Redhawk task tbh.

## Links

> 📚 Help reduce open tabs! Keep all links related to the project here. If a link is relavant to more than one project, do add it to other devlogs too and/or bookmark it. Try to give a brief description of what the webpage has and why it's relevant to the project, and/or why we may find it useful.

### General

* [Current sprint board](https://github.com/Phixyn/no-bs-looper/projects/2)
* [Convert HH:MM:SS to seconds - Online tools](https://www.tools4noobs.com/online_tools/hh_mm_ss_to_seconds/)

### YouTube Player API

* [YouTube Player API Reference for iframe Embeds](https://developers.google.com/youtube/iframe_api_reference)
* [YouTube Player Demo  |  YouTube IFrame Player API  |  Google Developers](https://developers.google.com/youtube/youtube_player_demo)
* [YouTube Embedded Players and Player Parameters](https://developers.google.com/youtube/player_parameters.html?playerVersion=HTML5)
* [YouTube API Services Terms of Service  |  Google Developers](https://developers.google.com/youtube/terms/api-services-terms-of-service)
* [Youtube iFrame Embed API - YouTube](https://www.youtube.com/watch?v=SVSf8fNp_kg)

### Actual BS Loopers

* [https://www.infinitelooper.com/](https://www.infinitelooper.com/)
* [https://listenonrepeat.com/](https://listenonrepeat.com/)
* [https://youtubeloop.net/](https://youtubeloop.net/)

### Docker

* [Exploring Docker [1] - Getting Started - YouTube](https://www.youtube.com/watch?v=Kyx2PsuwomE)
* [Use volumes | Docker Documentation](https://docs.docker.com/storage/volumes/)
* [How To Use the Official NGINX Docker Image - Docker Blog](https://www.docker.com/blog/tips-for-deploying-nginx-official-image-with-docker/)
* [Best practices for writing Dockerfiles | Docker Documentation](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/#leverage-build-cache)
* [Dockerfile reference | Docker Documentation](https://docs.docker.com/engine/reference/builder/#copy)
* [docker run | Docker Documentation](https://docs.docker.com/engine/reference/commandline/run/)

### Foundation

* [Download | Foundation for Sites](https://download.get.foundation/sites/download/)
* [Foundation Icon Fonts 3 | Playground from ZURB](https://zurb.com/playground/foundation-icon-fonts-3) - Redhawk could probably use these...
* [XY Grid | Foundation for Sites 6 Docs](https://get.foundation/sites/docs/xy-grid.html)
* [Forms | Foundation for Sites 6 Docs](https://get.foundation/sites/docs/forms.html)
* [Abide | Foundation for Sites 6 Docs](https://get.foundation/sites/docs/abide.html) - Fancy looking form validation, could use as an improvement
* [Slider | Foundation for Sites 6 Docs](https://get.foundation/sites/docs/slider.html)
* [foundation-sites/foundation.slider.js at develop · foundation/foundation-sites · GitHub](https://github.com/foundation/foundation-sites/blob/develop/js/foundation.slider.js#L259) - Foundation Slider plugin source code
* [Range slider-fill doesn't update correctly for sliders with two handles. · GitHub](https://github.com/foundation/foundation-sites/issues/10768)

### Design and UX

* [Designing Efficient Web Forms: On Structure, Inputs, Labels And Actions — Smashing Magazine](https://www.smashingmagazine.com/2017/06/designing-efficient-web-forms/)
* [58 Form Design Best Practices & Form UX Examples](https://www.ventureharbour.com/form-design-best-practices/)

### JavaScript

* [Google JavaScript Style Guide](https://google.github.io/styleguide/jsguide.html#jsdoc)
* [Better Understanding of Timers in JavaScript: SetTimeout vs RequestAnimationFrame | by Moon | JavaScript In Plain English | Medium](https://medium.com/javascript-in-plain-english/better-understanding-of-timers-in-javascript-settimeout-vs-requestanimationframe-bf7f99b9ff9b)
* [Scheduling: setTimeout and setInterval](https://javascript.info/settimeout-setinterval)

### jQuery

* [jQuery API Documentation](https://api.jquery.com/)
* [jQuery change() Method](https://www.w3schools.com/jquery/event_change.asp)
* [jQuery.param() | jQuery API Documentation](https://api.jquery.com/jQuery.param/)
* [jQuery.ready | jQuery API Documentation](https://api.jquery.com/jQuery.ready/)
* [.ready() | jQuery API Documentation](https://api.jquery.com/ready/)
* [javascript - Is it safe to put all your code inside `$(document).ready`? - Stack Overflow](https://stackoverflow.com/questions/18647548/is-it-safe-to-put-all-your-code-inside-document-ready)
* [Document Loading | jQuery API Documentation](https://api.jquery.com/category/events/document-loading/)
* [jQuery: When to use `$(document).ready()` and when `$(window).load()` (Example)](https://coderwall.com/p/_jothq/jquery-when-to-use-document-ready-and-when-window-load)
* [DOMContentLoaded vs jQuery.ready vs onload, How To Decide When Your Code Should Run - Eager Blog](https://eager.io/blog/how-to-decide-when-your-code-should-run/)
* [jQuery 3 - window load inside ready state will not be triggered · GitHub](https://github.com/jquery/jquery/issues/3194)

### CORS

* [Ajax Cross Origin - How it works](http://www.ajax-cross-origin.com/how.html)
* [Cross-Origin Resource Sharing (CORS) - HTTP | MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
* [Hacking It Out: When CORS won't let you be great | by Shalvah | Netscape | Medium](https://medium.com/netscape/hacking-it-out-when-cors-wont-let-you-be-great-35f6206cc646)

### Browser History API

* [Working with the History API - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/History_API/Working_with_the_History_API)

### URL API

* https://developer.mozilla.org/en-US/docs/Web/API/URL/URL
* https://developer.mozilla.org/en-US/docs/Web/API/URL
* https://url.spec.whatwg.org/#dom-url-href

### Similar Projects

* [Developing a Progressive Fetch YouTube Downloader | by Param Singh | Medium](https://medium.com/@paramsingh_66174/developing-a-progressive-fetch-youtube-downloader-75a709bff1ef)
* [Reverse-Engineering YouTube | Alexey Golub](https://tyrrrz.me/blog/reverse-engineering-youtube)

### Websockets

* [Writing WebSocket client applications - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications)
* [WebSocket.readyState - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/readyState)
* [GitHub - aaugustin/websockets: Library for building WebSocket servers and clients in Python](https://github.com/aaugustin/websockets) - Python library we're using
    * [Getting started — websockets 8.1 documentation](https://websockets.readthedocs.io/en/stable/intro.html)
    * [Deployment — websockets 8.1 documentation](https://websockets.readthedocs.io/en/stable/deployment.html)

### Libraries/modules

* [GitHub - ljharb/qs: A querystring parser with nesting support](https://github.com/ljharb/qs)
    * [qs - Libraries - cdnjs](https://cdnjs.com/libraries/qs) - for minified qs
* [noUiSlider - JavaScript Range Slider | Refreshless.com](https://refreshless.com/nouislider/)

### Testing

* [QUnit - JavaScript testing framework](https://qunitjs.com/)

### Chrome Web App

* [Add Your Web App to a User's Home Screen](https://codelabs.developers.google.com/codelabs/add-to-home-screen/index.html?index=..%2F..index#0)

### Meta tag stuff

* [Meta Tags — Preview, Edit and Generate](https://metatags.io/) - **Warning:** super laggy, open in Chrome
* [About Twitter Cards | Docs | Twitter Developer](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)

#### Validators/testing

* [Twitter](https://cards-dev.twitter.com/validator)
* [Facebook/Open Graph](https://developers.facebook.com/tools/debug/)
* [LinkedIn](https://www.linkedin.com/post-inspector/inspect/)
* [Structured Data](https://search.google.com/structured-data/testing-tool/u/0/)

### Life-Saving StackOverflow Answers

* [javascript - How do I programmatically force an onchange event on an input? - Stack Overflow](https://stackoverflow.com/a/340330)
    * [jQuery change() Method](https://www.w3schools.com/jquery/event_change.asp)

### Inspiring README Files

* [GitHub - matiassingers/awesome-readme: A curated list of awesome READMEs](https://github.com/matiassingers/awesome-readme)
* https://github.com/ArmynC/ArminC-AutoExec/#readme - Really like the logo at the top with that bottom border
* https://github.com/nhn/tui.editor#readme - Nice GIF at the top demo'ing the application
* https://github.com/Redocly/redoc#readme - Nice image showing both the desktop and mobile version
* https://github.com/sulu/sulu#readme - Usage of bold in the first paragraph, nice GIF showing different states of the CMS
* https://github.com/thelounge/thelounge#readme - Clean logo, clean header, clean badges, clean screenshot, cleanest README ever
* https://github.com/choojs/choo#readme - Nice header, badges and links
* https://github.com/IgorAntun/node-chat#readme - Clean and simple
* https://github.com/alichtman/stronghold#readme - Clean header
* https://github.com/anfederico/clairvoyant#readme - Nice logo
* https://github.com/Hexworks/zircon - Nice header and GIF

### Contributing and other `.github` files

* https://github.com/tylucaskelley/github-templates - Pretty solid templates tbh
* https://github.com/roots/guidelines/blob/master/CONTRIBUTING.md - Short and to the point contributing.md file
* https://github.com/pahimar/dot-github - Pretty detailed templates, especially for bugs/feature requests. May use in the future.

## Notepad

> 📓 A section to keep general notes about the project, scribbles and things that don't really fit in any other section.

* `YT.loaded` and `YT.ready` might be useful? Part of the iframe_api script.

### Test links

* http://localhost:14669/no-bs-looper/index.html
* http://localhost:14669/no-bs-looper/index.html?v=TtsQl_X3cbw&start=828&end=1155

## Scrap Paper

> 📝 For code snippets, experimental code, things that need to be moved to a gist, or just temporary code.

### Build the Nginx Container

```text
docker image build -t phixyn/no-bs-looper .
```

**Run on port 14666:**

```text
docker container run -d -p 14666:80 phixyn/no-bs-looper
```

**With mounting/binding:**

```text
docker container run --name no-bs-looper -d -p 14666:80 -v E:\Phixyn\Projects\no-bs-looper\static:/usr/share/nginx/html phixyn/no-bs-looper
```

### Parsing YouTube Video URLs To Get ID

```javascript
var getYoutubeIdByUrl = function( url ){
  var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
  var match = url.match(regExp);
  
  if(match&&match[7].length==11){ 
    return match[7];
  }
  
  return false;
};

var yt_video_id = getYoutubeIdByUrl( video_url );
```

### Simple websocket onerror handler

```javascript
websocket.onerror = (err) => {
  console.error("Socket encountered error: ", err.message, "Closing socket");
  websocket.close();
};
```

### querystring bla

```javascript
var newState = {"id": "abcd123", "start_time": 100};
$.param(newState); // can also use Qs.stringify()
// location.search = $.param(newState);
// history.pushState(newState, "", "?" + $.param(newState));
// .replaceState might be less laggy
history.replaceState(newState, "", "?" + $.param(newState));
history.state;
```
