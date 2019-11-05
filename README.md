## Orbitoid

A fun little BRB/idle screen for your twitch stream.

It will (when finished) watch your Twitch chat for people talking. As they talk, their avatar will appear in your solar system, orbiting you.


### Usage

At the moment, compile the typescript and run a local dev server with:

Copy `config.json.example` to `config.json` and customise it as follows:

* `bot_username` is the username of a Twitch account. I create a separate Twitch account dedicated for my bot. You can use your regular account if you feel like a risk taker
* `bot_secret` is the OAuth secret for your account. You can generate one [here](https://twitchapps.com/tmi/) (no idea why it asks for so many permissions, use that one at your own risk). This value is used for connecting to Chat.
* `bot_clientid`  is a bot identifier. Visit [the dev apps console](https://dev.twitch.tv/console/apps/) to create a new app for your account. You need to provide an OAuth Redirect URL - use `http://localhost` for this, as we won't use it and the value doesn't matter. This is used for retrieving user avatars from the API.
* `channel` is the name of the channel in which to monitor chat. eg, for `https://twitch.tv/sirsirsquidness` we would put a value of `sirsirsquidness`.

```
# install dependencies
npm install -g typescript
npm install
# compile
tsc
# start chat server
node server.js
# start static file server
python -m SimpleHTTPServer
```

Then open http://localhost:8000

**This is currently super insecure**. Anyone on your network can access the static file server, which includes serving your `config.json` file containing credentials. Do not expose this to the internet or untrusted networks! This will be fixed "soon". 
