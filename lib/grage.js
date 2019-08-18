function isReceiveMessage(m) {
    return m.type === 'receive';
}
// @ts-ignore
window.grage = (function () {
    var ws = new WebSocket('ws://grage.herokuapp.com/ws');
    //list of listeners for when the websocket connects
    var openListeners = [];
    //list of listeners to each channel
    var channelListeners = {};
    var grage = {
        options: {
            debug: true,
            reloadTime: 5 * 1000,
            refreshTime: 60 * 1000,
        },
        /**
         * Registers a listener which is called upon connection to server
         * @param cb the listener
         */
        onOpen: function (cb) {
            openListeners.push(cb);
        },
        /**
         * Gets the ID of the currently running app
         */
        getAppID: function () {
            var url = window.location.pathname.slice(1);
            var tokens = url.split('/');
            if (tokens[0] !== 'app')
                throw new Error('Cannot get data: invalid app');
            return tokens[1];
        },
        /**
         * Gets the locally stored data/settings for this app
         */
        getData: function () {
            var app = grage.getAppID();
            var data = window.localStorage.getItem(app);
            if (data)
                return JSON.parse(data);
        },
        /**
         * Saves some data to the local storage for this app.
         * Overwrites old data
         * @param data the data to save
         */
        setData: function (data) {
            var app = grage.getAppID();
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
         * Refreshes a connection to a channel
         * @param id the id of the channel
         */
        refreshConnection: function (id) {
            var m = {
                type: "connect",
                id: id,
            };
            try {
                if (grage.options.debug)
                    console.log('[Send]', m);
                ws.send(JSON.stringify(m));
            }
            catch (error) {
                handleError(error);
            }
        },
        /**
         * Connects to a channel and listens to any messages on channel
         * @param id the id of the channel
         * @param handler the listener for messages
         * @param refresh called when the channel is refreshed
         */
        connect: function (id, handler, refresh) {
            function doRefresh() {
                grage.refreshConnection(id);
                if (refresh)
                    refresh();
            }
            //if not connected to channel yet
            if (!channelListeners.hasOwnProperty(id)) {
                //initialize channelListeners
                channelListeners[id] = [];
                //set timer to periodically refresh connection
                doRefresh();
                setInterval(doRefresh, grage.options.refreshTime);
            }
            //add listener to channel
            channelListeners[id].push(handler);
        },
        /**
         * Sends data to channel
         * @param id the id of the channel
         * @param data the data to send
         */
        send: function (id, data) {
            var m = {
                type: "send",
                data: data,
                id: id,
            };
            try {
                if (grage.options.debug)
                    console.log('[Send]', m);
                ws.send(JSON.stringify(m));
            }
            catch (error) {
                handleError(error);
            }
        }
    };
    ws.onmessage = function (ev) {
        try {
            var m = JSON.parse(ev.data);
            if (grage.options.debug)
                console.log('[recv]', m);
            if (isReceiveMessage(m)) {
                //send to every listener in the proper channel
                for (var _i = 0, _a = channelListeners[m.id]; _i < _a.length; _i++) {
                    var listener = _a[_i];
                    listener(m.data);
                }
            }
            else {
                console.warn('[Unknown message type]', m);
            }
        }
        catch (error) {
            handleError(error);
        }
    };
    ws.onopen = function handleOpen() {
        if (grage.options.debug)
            console.log('[Websocket open]');
        //call every listener upon connect
        for (var _i = 0, openListeners_1 = openListeners; _i < openListeners_1.length; _i++) {
            var handler = openListeners_1[_i];
            handler();
        }
    };
    function handleError(error) {
        console.error('[Websocket error]', error);
        //if debug, stop, else try reload page
        if (!grage.options.debug)
            grage.terminate();
        else {
            debugger;
            console.log('[Debug mode] frozen');
        }
    }
    ws.onerror = function (ev) {
        handleError(ev);
    };
    ws.onclose = grage.terminate;
    return grage;
})();
