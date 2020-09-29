# Contributing

Thank you for taking the time to contribute to this project :heart:

All types of contributions are **encouraged and valued.** This document contains information on how to make a contribution, including code style, commit message guidelines and branching model.

- - -

## Table of Contents

- [Questions and Concerns](#questions-and-concerns)
- [Issues and Bugs](#issues-and-bugs)
- [Feature Requests](#feature-requests)
- [Contributing Code](#contributing-code)
    - [Commit Message Guidelines](#commit-message-guidelines)
    - [Code Style](#code-style)

## Questions and Concerns

For formal questions or concerns regarding this project, send an email to [phixyn@gmail.com](mailto:phixyn@gmail.com). Informal questions can be sent on Twitter [@phixyn](https://twitter.com/phixyn).

## Issues and Bugs

Before reporting an issue, search the [Issues](https://github.com/Phixyn/no-bs-looper/issues) page to see if it's already been reported. If it has, feel free to vote on it by adding a :thumbsup: reaction. If you have additional information, **leave a comment** on the existing issue.

To submit a new issue, click **"New issue"** on the issues page and use the **"Bug report"** issue type. Fill in the relevant sections and feel free to attach a screenshot if it's appropriate.

## Feature Requests

Before requesting a new feature, search the [Issues](https://github.com/Phixyn/no-bs-looper/issues) page to see if it's already been requested. If it has, feel free to vote on it by adding a :thumbsup: reaction and comment on it.

To submit a new feature request or improvement, click **"New issue"** on the issues page and use the **"Feature request"** issue type. Fill in the relevant sections and submit it.

## Contributing Code

Make sure you check the **current list** of [pull requests](https://github.com/Phixyn/no-bs-looper/pulls) to make sure you aren't working on something someone else has already done.

1. Fork the repository.
2. Branch from the `master` branch. The `production` branch is used for the latest release and is not meant to be used for development. Always make sure you branch from the **latest** `master`, otherwise your branch will be behind. For example:

```sh
git checkout master
git pull
git checkout -b your-branch
```

3. Do the work that needs to be done. Make sure to follow the [code style guidelines](#code-style).
4. Use **git commits** as you go along, rather than making one big commit at the end. See [commit message guidelines](#commit-message-guidelines).
5. After your work is done, push the changes to your fork and **create a pull request** targetting the `master` branch of this repository.
6. Make sure that the items in the [Merging Checklist](https://github.com/Phixyn/no-bs-looper/blob/master/.github/PULL_REQUEST_TEMPLATE.md#merging-checklist) at the bottom of the pull request description are all done.
7. I will review the pull request and merge it or give feedback if any additional changes are needed.

### Commit Message Guidelines

While I'm not strict on what commit message conventions are used, it's good to have some consistency in the project. If possible, use **jQuery style commit messages**, which follow this format:

```text
Component: Short description (max 79 characters)

If appropriate, a longer description of the changes made, limiting each line
to 79 characters. Also, leave a blank line between the short description and
this.

A footer linking any associated GitHub issues with a closing keyword, for
example:

Closes #33.
```

**Here are some examples:**

* Core: Drop support for Edge Legacy (i.e. non-Chromium Microsoft Edge)
* Tests: Recognize callbacks with dots in the Node.js mock server
* CSS: Remove the opacity CSS hook

For more examples, see the [jQuery repository's commit history](https://github.com/jquery/jquery/commits/master).

### Code Style

Please follow the **Google JavaScript code style** guide, which can be [found here](https://google.github.io/styleguide/jsguide.html).
