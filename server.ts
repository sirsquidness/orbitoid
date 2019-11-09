import WebSocket = require("ws");
import { WSASERVICE_NOT_FOUND } from "constants";

import request = require("request");






const tmi = require('tmi.js')
const conf = require('./config.json') as any;

// Define configuration options
const opts = {
  identity: {
    username: conf['bot_username'],
    password: conf['bot_secret']
  },
  channels: [
    conf["channel"]
  ]
};

const server = new WebSocket.Server({port: 8888});

var users: Map<string, string | Promise<string>> = new Map()

// Create a client with our options
const client = new tmi.client(opts);

// Register our event handlers (defined below)
client.on('message', onMessageHandler);
client.on('connected', onConnectedHandler);

// Connect to Twitch:
client.connect();

// Called every time a message comes in
function onMessageHandler (target: string, context: any, msg: string, self: string) {
  if (self) { return; } // Ignore messages from the bot

  var user = context['username']
  if (!user) {
      return
  }

  if (users.get(user) == null) {
      getUserProfile(user)
      .then((v) => {
        users.set(user, v)
        sendUser(user, v)
      });
    
  } else if (typeof users.get(user) == "string") {
    sendUser(user, users.get(user) as string)
  } else {
      //TODO: do we need to do anything here?
      //var u = users.get(user) as Promise<string>
  }
}

function sendUser(user :string, url: string): void {
    server.clients.forEach((client) => {
      _sendUser(user, url, client)
    })
}

function _sendUser(user :string, url: string, socket: WebSocket): void {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({"type": "activity", "username": user,"url": url}))
  }
}

function getUserProfile(user: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    request.get("https://api.twitch.tv/helix/users?login=" + user, {headers: {"Client-ID": conf["bot_clientid"]}}, (err, res, body) => {
        if (err != null) {
            reject(err);
            return
        }
        console.log(err, body, user)
        var d = JSON.parse(body) as any
        resolve(d["data"][0]["profile_image_url"])
    })
  })
}

// Function called when the "dice" command is issued
function rollDice () {
  const sides = 6;
  return Math.floor(Math.random() * sides) + 1;
}

// Called every time the bot connects to Twitch chat
function onConnectedHandler (addr: string, port: string) {
  console.log(`* Connected to ${addr}:${port}`);
}

var hostUrl = getUserProfile(conf['channel'])

server.on("connection", (socket, req) => {
  console.log("New connection")
  users.forEach((url, user) => {
    if (typeof url == "string") {
      _sendUser(user, url as string, socket)
    }
  })
  hostUrl.then((hostUrl) => {
    socket.send(JSON.stringify({"type": "host", "url": hostUrl}))
  })
})