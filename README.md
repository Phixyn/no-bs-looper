# No BS YouTube Looper

<div align="center">
  <!-- TODO project logo here once we have one -->
  <h4> 🔂 Loop YouTube videos easily and without any distractions. 📽️ </h4>

  <!--TODO needs updating links/badges-->

  <img src="https://img.shields.io/badge/python-v3.7+-blue.svg" alt="Python 3.7+" />

  <a href="https://www.gnu.org/licenses/gpl-3.0.en.html">
    <img src="https://img.shields.io/badge/license-GPLv3-blue.svg" alt="License" />
  </a>

  <a href="http://ytlooper.phixyn.com/" title="Demo">Demo</a> • <a href="https://github.com/Phixyn/no-bs-looper/blob/master/.github/CONTRIBUTING.md" title="Contributing">Contributing</a> • <a href="https://github.com/Phixyn/no-bs-looper/issues">Issues/Feature Request</a> • <a href="https://github.com/Phixyn/no-bs-looper/projects/2">Sprint Board</a>

  <!-- TODO: Screenshot here, or above h4. Could also add a GIF (Poro video maybe?) -->
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

This is a mobile-friendly website that loops YouTube videos. It can loop an entire video over and over again, or a portion of a video. **[See it in action here!](http://ytlooper.phixyn.com/)**

I made this out of frustration with the current YouTube loopers out there. Most of them are full of ad banners and other intrusive elements, or are very broken on mobile. Some of them don't even work anymore.

This is still a work in progress. The Python backend server will soon be replaced and this will eventually be a full Node.js project. If you'd like to help out, please check out the [issues](https://github.com/Phixyn/no-bs-looper/issues) page for anything you might be able to help with. All contributions are **greatly appreciated**!

### Features

* Loop full videos or customize loops using a two-sided slider
* Mobile friendly
* **Play videos while your phone is locked!** <!-- TODO showcase this in one of the screenshots -->
* Save and share your loops using URLs
* Sleek dark theme with no ads, no banners and no distractions
* Minimal design and easy on the eyes (hopefully, [let me know](https://github.com/Phixyn/no-bs-looper/issues) if not!)
* No BS! **Simple, elegant and does the job**.

## Getting Started

To get a local instance up and running follow these steps. If it's too complicated (it kinda is right now tbh), feel free to use a [public instance](#public-instances) of the project instead.

**If you decide to host this website, feel free to submit a PR adding a link to your instance in this README.**

### Prerequisites

* Python 3.7+
* A HTTP server (e.g. Nginx or Apache)
* Docker (optional)

### Installation

1. Clone the repo

```sh
git clone https://github.com/Phixyn/no-bs-looper.git
```

2. Install Python dependencies

```sh
pip install -r requirements.txt
```

3. Open `ws_server.py` and scroll to the bottom
4. Replace `HOST` and `PORT` with your desired values. Note that `HOST` should be the local address of your machine (e.g. `192.168.1.69`).
5. Open `static/js/app.js`
6. Replace the address in `const websocket = new WebSocket( ... );` with the address and port your set in step 4.
7. Copy all the files in the `static/` folder to a HTTP server such as Nginx or Apache
8. Run the backend server: `python ws_server.py` (CTRL + C to quit it).

**Python virtual environment:**

I recommend setting up a virtual environment for the project. It's really easy:

```sh
python -m venv .env
```

Run that from the repo's root directory. Then activate it with either `source .env/bin/activate` or `.env\Scripts\activate.bat` on Windows. Once that's done you can install the project's requirements locally in the environment, instead of globally on your machine (see step 2).

**Docker:**

This project does have a work-in-progress `Dockerfile` that you can use to spin up an Nginx server, if you prefer. You'll have to mount/bind a volume for the `static/` folder. Something like this could work for running the website on port 14666:

```sh
docker container run --name no-bs-looper -d -p 14666:80 -v E:\Phixyn\Projects\no-bs-looper\static:/usr/share/nginx/html phixyn/no-bs-looper
```

Obviously replace the path to the static folder with your own path. Note that it has to be an absolute path.

## Usage

Depending on your HTTP server's setup, this may vary. If you followed all the steps in the [Installation](#installation) section, you'll be able to access the website using your local IP address, or localhost. If you can't get it set up, use one of the [public instances](#public-instances) listed below.

Once you're in the website, paste a **video ID** onto the video ID text field and click **"Update"**. Move the slider handles to loop a specific portion of the video, or leave them at the start and end to loop the full video.

You can save and share your loop by copying the URL in your address bar (it changes everytime you customize the loop or load a new video).

### How to find the video ID?

It's usually after the `v=` portion of a YouTube link. For example:

<!-- TODO screenshot here -->
`https://www.youtube.com/watch?v=dQw4w9WgXcQ`

For the above video, the video ID is `dQw4w9WgXcQ`.

Don't worry, you'll be allowed to use full video URLs [soon(TM)](https://github.com/Phixyn/no-bs-looper/issues/24).

## Public Instances

If you can't host your own instance of the website, use any of the public instances below.

| Owner  | Version                                          | Link                                                       |
| ------ | ------------------------------------------------ | ---------------------------------------------------------- |
| Phixyn | [v1.0.0](https://github.com/Phixyn/no-bs-looper) | [http://ytlooper.phixyn.com/](http://ytlooper.phixyn.com/) |

## Roadmap

See [milestones](https://github.com/Phixyn/no-bs-looper/milestones).

## Contributing

Please take a look at the [contributing guidelines](https://github.com/Phixyn/no-bs-looper/blob/master/.github/CONTRIBUTING.md) if you're interested in helping! Any contributions you make are **greatly appreciated**.

<!-- TODO: CONTRIBUTING.md file -->

## License

**GPL-3.0 License**. For more information see [LICENSE](https://github.com/Phixyn/no-bs-looper/blob/master/LICENSE).

**TL;DR:** Use it anyway you want, modify the code anyway you want, but do share any changes you make (in the spirit of open source and no BS software).

## Contact

> Twitter [@phixyn](https://twitter.com/phixyn) • [phixyn.com](http://phixyn.com)

## Acknowledgements

This software uses the following open source ❤︎ projects:

* [Foundation for Sites](https://foundation.zurb.com/sites.html)
* [GitHub - jquery/jquery: jQuery JavaScript Library](https://github.com/jquery/jquery/)
* [GitHub - ljharb/qs: A querystring parser with nesting support](https://github.com/ljharb/qs/)
* [GitHub - aaugustin/websockets: Library for building WebSocket servers and clients in Python](https://github.com/aaugustin/websockets)
