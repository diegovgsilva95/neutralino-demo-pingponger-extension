# Neutralino Demo with a Node.js extension
Just a demo of how to make a Neutralino project with an extension.

# Purpose
Just to demonstrate the interaction between Neutralino and a Node.js extension. This example just ping-and-pongs an ever-increasing number, displaying the current number received by the client. 

# Dependencies
- ws
- @neutralinojs/neu (installed globally)
- neutralinojs-types (developer-only dependency, for VSCode autocompletion)

# Installation
1. Clone this repo. 
2. `cd` to it.
3. `npm i` to install the Node.js dependencies.
4. `neu update` to fetch Neutralino's binaries.
5. `neu run` to run it.

# Known issues
- For some reason unknown to me, the ping-ponging just works while on `"mode": "chrome"`. I couldn't make it work for `"mode": "window"`, maybe it's a thing with the native browser, I don't now yet.
- No way of setting Chrome's executable (e.g. I can't set it to use `/usr/bin/chromium` or `/opt/brave/brave`) on `"mode": "chrome"`. It's a Neutralino's thing.
