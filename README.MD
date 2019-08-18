# What is grage?

It is a server to help devices with a internet connection
communicate with webapps running in the browser through Websockets.

Initial purpose was to control a garage door from a web interface.

A program to fully control a ESP8266 through grage is already written 
and exists here: //TODO add link//. Simply upload it to the ESP8266 using
the Arduino editor.

Custom web interfaces for grage devices can be written in pure
HTML/CSS/Javascript, which can be statically hosted. A simple
library is included to make this easier.

## Running the server

Note: There is an existing server at [grage.herokuapp.com]

###Step 1

Clone the repo.

###Step 2

#####Running locally

`cd` into to the repo, and run `node src/index.js`.
Node v10 or higher is recommended.

#####Heroku

The app is also prepared to run Heroku.
There are no addons required, just create the app and push.

## Developing your own interfaces/modifying the existing ones

If you want to make your own interfaces for modify an included one,
please read the sections below. An example 'garage door controller'
app is included in `/apps/garage-door`.

### Prerequisites

 - HTML (CSS optional)
 - Basic Javascript
 - Know how to write programs for the 
 device you are trying to control.
 In examples, it will be the ESP8266.
 To follow with the examples, you will need basic
 Arduino knowledge:
    - pinMode
    - digitalWrite
    - digitalRead

### Protocol overview

Fortunately the protocol of grage is very simple. In order to communicate with eachother,
both the user (browser) and the device have to connect to the server.

The server acts as a chat server. It hosts an number of channels, where all connected
clients can communicate with eachother. Any message sent to a channel will be broadcast
to all clients in that channel (except the sender).

Note: *Channel names can be any ASCII printable string*

To communicate with eachother, the user and device have to connect to the same channel.
A device must always be connected to the same channel, every single time it boots.
The user can talk to a device as long as they know what channel it is on. Therefore
channel names should be kept private.

The actual message format is JSON.

These are the message formats which a client is allowed to send to server:

####Send data
```json
{
  "type": "data",
  "id": "...",
  "data": ...,
  "fromDevice": false
}
```
This causes the server to broadcast whatever data is included in `data` to the channel named `id`.
The `fromDevice` field must `true` if the message is sent from a device, and `false` if
sent from a browser.

####Connect to channel
```json
{
  "type": "connect",
  "id": "..."
}
```
This connects the client to the channel with name `id`.
 All subsequent messages sent to channel `id` will be sent to this client.


