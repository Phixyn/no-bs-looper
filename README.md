<h1 align="center">
  <!-- TODO #68: Replace with a project logo once we have one -->
  No BS YouTube Looper
</h1>

<div align="center">
  <h4>Loop YouTube videos easily and without distractions.</h4>

  <img src="https://img.shields.io/badge/%E2%9B%94-No%20BS%20Software-aa0000" alt="No BS software badge" />
  <img alt="GitHub release (latest by date)" src="https://img.shields.io/github/v/release/phixyn/no-bs-looper">
  <a href="https://www.gnu.org/licenses/gpl-3.0.en.html">
    <img src="https://img.shields.io/badge/license-GPLv3-blue.svg" alt="GPLv3 badge" />
  </a>

  <a href="http://ytlooper.phixyn.com/" title="Website">Website</a> • <a href="https://github.com/Phixyn/no-bs-looper/issues">Issue Tracker</a> • <a href="https://github.com/Phixyn/no-bs-looper/releases">Releases</a> • <a href="https://github.com/Phixyn/no-bs-looper/blob/master/.github/CONTRIBUTING.md" title="Contributing">Contributing</a>

  ![Preview Screenshot](docs/screenshots/desktop_demo_yt_controls.png?raw=true)
</div>

- - -

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
- [Usage](#usage)
    - [How to find the video ID?](#how-to-find-the-video-id)
- [Public Instances](#public-instances)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)
- [Acknowledgements](#acknowledgements)

- - -

## Overview

A **mobile-friendly** website that **loops YouTube videos.** It can loop an entire video or a portion of it. Try it out **[here!](http://ytlooper.phixyn.com/)**

I made this out of frustration with the current YouTube loopers out there. Most of them are full of ad banners and other intrusive elements, and don't work very well on mobile.

## Features

- Loop full YouTube videos or customize what to loop
- Mobile friendly
- Play videos while your phone is **locked**
- **Save and share** your loops
- Sleek **dark theme** with no ads, no banners and no distractions

## Getting Started

To get a local instance up and running, follow these steps. If it's too complicated, feel free to use a [public instance](#public-instances) of the website instead.

### Prerequisites

- Python 3.7+
- A HTTP server (e.g. Nginx or Apache)
- Docker (optional)

### Installation

1. Clone the repo.

```sh
git clone https://github.com/Phixyn/no-bs-looper.git
```

2. Install Python dependencies*

```sh
pip install -r requirements.txt
```

3. Open `ws_server.py` and scroll to the bottom.
4. Replace `HOST` and `PORT` with your desired values. Note that `HOST` should be the local address of your machine (e.g. `192.168.1.69`).
5. Open `static/js/app.js`
6. Replace the address in `const websocket = new WebSocket( ... );` with the address and port you set in step 4.
7. Copy all the files in the `static/` folder to a HTTP server such as Nginx or Apache.
8. Run the backend server: `python ws_server.py` (CTRL + C to quit it).

***Python virtual environment:**

I recommend setting up a virtual environment for the project. It's really easy:

```sh
python -m venv .env
```

Run that from the repo's root directory. Then activate it with either `source .env/bin/activate` or `.env\Scripts\activate.bat` on Windows. Once that's done you can install the project's requirements locally in the environment, instead of globally on your machine (see step 2).

**Docker:**

This project has a work-in-progress `Dockerfile` that you can use to spin up an Nginx server, if you prefer. You'll have to mount/bind a volume for the `static/` folder. Something like this could work for running the website on port 14666:

```sh
docker container run --name no-bs-looper -d -p 14666:80 -v E:\Phixyn\Projects\no-bs-looper\static:/usr/share/nginx/html phixyn/no-bs-looper
```

Obviously replace the path to the static folder with your own path. Note that it has to be an **absolute path.**

## Usage

Depending on your HTTP server's setup, this may vary. If you followed all the steps in the [Installation](#installation) section, you'll be able to access the website using your **local IP address**, or localhost. If you can't get it set up, use one of the [public instances](#public-instances) listed below.

Once you're in the website, paste a **video ID** onto the video ID text field and click **"Update".** Move the slider handles to loop a specific portion of the video, or leave them at the start and end to loop the full video.

You can **save and share** your loop by copying the URL in your address bar. The URL changes everytime you customize the loop or load a new video.

### How to find the video ID?

It's usually after the `v=` portion of a YouTube link. For example:

![https://www.youtube.com/watch?v=dQw4w9WgXcQ](docs/screenshots/video_id_example.png?raw=true)

For the above video, the video ID is `dQw4w9WgXcQ`.

Don't worry, you'll be able to use full video URLs [soon](https://github.com/Phixyn/no-bs-looper/issues/24).

## Public Instances

If you can't host your own instance of the website, use any of the public instances below.

| Owner  | Version                                                             | Link                                                       |
| ------ | ------------------------------------------------------------------- | ---------------------------------------------------------- |
| Phixyn | [v1.0.0](https://github.com/Phixyn/no-bs-looper/releases/tag/1.0.0) | [http://ytlooper.phixyn.com/](http://ytlooper.phixyn.com/) |

If you decide to **host your own** public instance, feel free to update the README with a link to it and **make a PR.**

## Roadmap

See [milestones](https://github.com/Phixyn/no-bs-looper/milestones) for a list of planned releases and associated issues.

## Contributing

This is still a **work in progress.** The Python backend server will soon be replaced and this will eventually be a full Node.js project. If you'd like to help out, please check out the [issues](https://github.com/Phixyn/no-bs-looper/issues) page for anything you might be able to help with.

Please take a look at the [contributing guidelines](https://github.com/Phixyn/no-bs-looper/blob/master/.github/CONTRIBUTING.md) if you're interested in helping. All contributions are **greatly appreciated!**

## License

**GPL-3.0 License**. For more information see [LICENSE](https://github.com/Phixyn/no-bs-looper/blob/master/LICENSE).

**TL;DR:** Use it anyway you want, modify the code anyway you want, but do share any changes you make (in the spirit of open source and no BS software).

## Contact

> Twitter [@phixyn](https://twitter.com/phixyn) &bull; [phixyn.com](http://phixyn.com)

## Acknowledgements

This software uses the following open source ❤︎ projects:

- [GitHub - foundation/foundation-sites: The most advanced responsive front-end framework in the world](https://github.com/foundation/foundation-sites)
- [GitHub - jquery/jquery: jQuery JavaScript Library](https://github.com/jquery/jquery/)
- [GitHub - ljharb/qs: A querystring parser with nesting support](https://github.com/ljharb/qs/)
- [GitHub - aaugustin/websockets: Library for building WebSocket servers and clients in Python](https://github.com/aaugustin/websockets)
