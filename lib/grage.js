function isDataMessage(m) {
    return m.type === 'data';
}
// @ts-ignore
window.grage = (function () {
    var ws = new WebSocket('ws://grage.herokuapp.com/ws');
    //list of listeners for when the websocket connects
    var openListeners = [];
    //list of listeners to each channel
    var channelListeners = {};
    var onceListeners = {};
    /**
     * Sends a message on the websocket, returns any error which occurs
     * @param m the message to send
     */
    function wsSend(m) {
        try {
            if (grage.options.debug)
                console.log('[Send]', m);
            ws.send(JSON.stringify(m));
            return false;
        }
        catch (error) {
            handleError(error);
            return error;
        }
    }
    var grage = {
        options: {
            debug: true,
            reloadTime: 5 * 1000,
            refreshTime: 60 * 1000,
            pingTimeout: 5 * 1000,
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
         * @param init called when confirmation received that channel is alive
         */
        connect: function (id, cb, init) {
            //if not connected to channel yet
            if (!channelListeners.hasOwnProperty(id)) {
                //initialize channelListeners
                channelListeners[id] = [];
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
            channelListeners[id].push(cb);
        },
        /**
         * Listens to a single message from a channel
         * @param id the channel to listen to
         * @param cb the listener
         */
        once: function (id, cb) {
            if (!onceListeners.hasOwnProperty(id)) {
                onceListeners[id] = [];
            }
            onceListeners[id].push(cb);
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
        }
    };
    ws.onmessage = function (ev) {
        try {
            var m = JSON.parse(ev.data);
            if (grage.options.debug)
                console.log('[recv]', m);
            if (isDataMessage(m)) {
                //ignore messages from other browsers
                if (m.fromDevice) {
                    if (channelListeners[m.id]) {
                        //send to every listener in the proper channel
                        for (var _i = 0, _a = channelListeners[m.id]; _i < _a.length; _i++) {
                            var listener = _a[_i];
                            listener(m.data);
                        }
                    }
                    if (onceListeners[m.id]) {
                        //send to every once listener
                        for (var _b = 0, _c = onceListeners[m.id]; _b < _c.length; _b++) {
                            var listener = _c[_b];
                            listener(m.data);
                        }
                        //then clear list of once listeners
                        delete onceListeners[m.id];
                    }
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
        if (grage.options.debug)
            console.log('[Websocket open]');
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
