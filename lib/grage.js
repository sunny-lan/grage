function isRequestPing(m) {
    return m.type === 'rping';
}
function isPingMessage(m) {
    return m.type === 'ping';
}
function isChannelMessage(m) {
    return isDataMessage(m) || isRequestPing(m) || isPingMessage(m);
}
function isDataMessage(m) {
    return m.type === 'data';
}
var LiveState;
(function (LiveState) {
    LiveState[LiveState["ALIVE"] = 0] = "ALIVE";
    LiveState[LiveState["DEAD"] = 1] = "DEAD";
    LiveState[LiveState["UNKNOWN"] = 2] = "UNKNOWN";
})(LiveState || (LiveState = {}));
// @ts-ignore
window.grage = (function () {
    var ws = new WebSocket('ws://grage.herokuapp.com/ws');
    //list of listeners for when the websocket connects
    var openListeners = [];
    var channels = {};
    /**
     * Sends a message on the websocket, returns any error which occurs
     * @param m the message to send
     */
    function wsSend(m) {
        try {
            debug('[Send]', m);
            ws.send(JSON.stringify(m));
            return false;
        }
        catch (error) {
            handleError(error);
            return error;
        }
    }
    /**
     * console.logs the parameters if debug mode is on
     * @param args the parameters to console.log
     */
    function debug() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (grage.options.debug)
            console.log.apply(console, args);
    }
    var grage = {
        options: {
            /**
             * shows debug messages if set to true
             */
            debug: location.hostname === "localhost" || location.hostname === "127.0.0.1",
            /**
             * how long to wait before reloading the page
             * this prevents exploding if errors occur at page load time
             */
            reloadTime: 5 * 1000,
            /**
             * how long to wait before actively checking if a device is alive
             */
            aliveTimeout: 10 * 1000,
            /**
             * how long to wait for a device to respond to a ping request
             */
            pingTimeout: 5 * 1000,
            /**
             * if a device is not responding,
             * how long to wait before retrying another ping request
             */
            pingRetry: 30 * 1000,
        },
        /**
         * Registers a listener which is called upon connection to server
         * @param cb the listener
         */
        onOpen: function (cb) {
            if (openListeners === undefined)
                cb();
            else
                openListeners.push(cb);
        },
        /**
         * Gets the ID of the currently running app
         */
        getAppID: function () {
            var url = window.location.pathname.slice(1);
            var tokens = url.split('/');
            if (tokens[0] !== 'apps')
                throw new Error('Cannot get data: invalid app');
            return tokens[1];
        },
        /**
         * Gets the locally stored data/settings for this app
         */
        getData: function (defaultValue) {
            var app = grage.getAppID();
            var data = window.localStorage.getItem(app);
            if (data)
                return JSON.parse(data);
            else
                return defaultValue;
        },
        /**
         * Saves some data to the local storage for this app.
         * Overwrites old data
         * @param data the data to save
         */
        saveData: function (data) {
            window.localStorage.setItem(grage.getAppID(), JSON.stringify(data));
        },
        /**
         * Terminates the connection and reloads the app.
         */
        terminate: function () {
            //close ws if not already
            if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
                ws.close();
            }
            //reload page in 5 seconds
            setTimeout(function () { return window.location.reload(false); }, grage.options.reloadTime);
        },
        /**
         * Request a device to ping
         * @param id the device to request ping from
         */
        requestPing: function (id) {
            //send ping
            var m = {
                type: "rping",
                id: id,
                fromDevice: false
            };
            if (wsSend(m))
                return;
        },
        /**
         * Connects to a channel and listens to any messages on channel
         * @param id the id of the channel
         * @param cb the listener for messages
         */
        connect: function (id, cb) {
            //if not connected to channel yet
            if (!channels.hasOwnProperty(id)) {
                //initialize channelListeners
                channels[id] = {
                    dataListeners: [],
                    dataListenersOnce: [],
                    aliveListeners: [],
                    deadListeners: [],
                    state: LiveState.UNKNOWN,
                    prevState: LiveState.UNKNOWN,
                };
                //send channel connect message
                var m = {
                    type: "connect",
                    id: id,
                };
                if (wsSend(m))
                    return;
            }
            //request new data
            grage.requestPing(id);
            channels[id].dataListeners.push(cb);
        },
        /**
         * Listens to a single message from a channel
         * @param id the channel to listen to
         * @param cb the listener
         */
        once: function (id, cb) {
            channels[id].dataListenersOnce.push(cb);
        },
        /**
         * Sends data to channel
         * @param id the id of the channel
         * @param data the data to send
         */
        send: function (id, data) {
            var m = {
                type: "data",
                data: data,
                id: id,
                fromDevice: false,
            };
            if (wsSend(m))
                return;
        },
        onAlive: function (id, cb) {
            var channel = channels[id];
            if (channel.state === LiveState.ALIVE) {
                cb();
            }
            channel.aliveListeners.push(cb);
        },
        onDead: function (id, cb) {
            var channel = channels[id];
            if (channel.state === LiveState.DEAD)
                cb();
            channel.deadListeners.push(cb);
        }
    };
    /**
     * Call this when a device is known to be alive
     * @param id the device which is alive
     */
    function assertAlive(id) {
        debug('[Alive]', id);
        var channel = channels[id];
        //remove any pending timeout
        clearTimeout(channel.currentTimer);
        //channel just became alive
        if (channel.prevState !== LiveState.ALIVE) {
            channel.prevState = LiveState.ALIVE;
            //protect from stack explosion by running in next tick
            setTimeout(function () {
                debug('[Notifying alive]', id);
                for (var _i = 0, _a = channel.aliveListeners; _i < _a.length; _i++) {
                    var listener = _a[_i];
                    listener();
                }
            });
        }
        channel.state = LiveState.ALIVE;
        //make sure to periodically check if channel is actually alive
        channel.currentTimer = setTimeout(function checkAlive() {
            channel.state = LiveState.UNKNOWN;
            //channel has not said anything for a long time,
            //send it a ping to see if its still alive
            pingTest(id);
        }, grage.options.aliveTimeout);
    }
    /**
     * Tests if a device is still alive by pinging it and waiting for response
     * @param id the device
     */
    function pingTest(id) {
        var channel = channels[id];
        debug('Pinging', id, '...');
        grage.requestPing(id);
        //if device does respond, assertAlive will get called,
        //canceling the death timer
        channel.currentTimer = setTimeout(function dead() {
            //otherwise no response, its dead.
            assertDead(id);
        }, grage.options.pingTimeout);
    }
    /**
     * Called when it is known a device is dead
     * @param id the device known to be dead
     */
    function assertDead(id) {
        debug('[Dead]', id);
        var channel = channels[id];
        //remove any pending timeout
        clearTimeout(channel.currentTimer);
        //channel just became dead
        if (channel.prevState !== LiveState.DEAD) {
            channel.prevState = LiveState.DEAD;
            //protect from stack explosion by running in next tick
            setTimeout(function () {
                debug('[Notifying dead]', id);
                for (var _i = 0, _a = channel.deadListeners; _i < _a.length; _i++) {
                    var listener = _a[_i];
                    listener();
                }
            });
        }
        channel.state = LiveState.DEAD;
        //try pinging it again later
        setTimeout(function () { return pingTest(id); }, grage.options.pingRetry);
    }
    ws.onmessage = function (evt) {
        try {
            var m = JSON.parse(evt.data);
            debug('[recv]', m);
            //ignore messages from other browsers, ignore non subscribed messages
            if (isChannelMessage(m) && m.fromDevice && channels.hasOwnProperty(m.id)) {
                //since this device just sent a message,
                //it must be alive
                assertAlive(m.id);
                var channel = channels[m.id];
                if (isDataMessage(m)) {
                    //send to every listener in the proper channel
                    for (var _i = 0, _a = channel.dataListeners; _i < _a.length; _i++) {
                        var listener = _a[_i];
                        listener(m.data);
                    }
                    //send to every once listener
                    for (var _b = 0, _c = channel.dataListenersOnce; _b < _c.length; _b++) {
                        var listener = _c[_b];
                        listener(m.data);
                    }
                    //then clear list of once listeners
                    channel.dataListenersOnce = [];
                }
            }
            else {
                console.warn('[Unknown message type]', m);
            }
        }
        catch (error) {
            return handleError(error);
        }
    };
    ws.onopen = function handleOpen() {
        debug('[Websocket open]');
        //call every listener upon connect
        if (openListeners !== undefined)
            for (var _i = 0, openListeners_1 = openListeners; _i < openListeners_1.length; _i++) {
                var handler = openListeners_1[_i];
                handler();
            }
        openListeners = undefined;
    };
    function handleError(error) {
        console.error('[Websocket error]', error);
        //if debug, stop, else try reload page
        if (!grage.options.debug)
            grage.terminate();
        else {
            console.log('[Debug mode] frozen');
            debugger;
        }
    }
    ws.onerror = function (ev) {
        handleError(ev);
    };
    ws.onclose = grage.terminate;
    return grage;
})();
