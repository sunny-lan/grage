import {ConnectMessage, Message, ReceiveMessage, SendMessage} from "../src/lib";

function isReceiveMessage(m: Message): m is ReceiveMessage {
    return m.type === 'receive';
}

// @ts-ignore
window.grage = (function () {
    const ws = new WebSocket('ws://grage.herokuapp.com/ws');

    //list of listeners for when the websocket connects
    const openListeners: (() => void)[] = [];

    //list of listeners to each channel
    const channelListeners: {
        [id: string]: ((data: any) => void)[]
    } = {};

    const grage = {
        options: {
            debug: true,
            reloadTime: 5 * 1000,//time before the page reloads upon error
            refreshTime: 60 * 1000,
        },
        /**
         * Registers a listener which is called upon connection to server
         * @param cb the listener
         */
        onOpen(cb: () => void) {
            openListeners.push(cb);
        },
        /**
         * Gets the ID of the currently running app
         */
        getAppID() {
            const url = window.location.pathname.slice(1);
            const tokens = url.split('/');
            if (tokens[0] !== 'app')
                throw new Error('Cannot get data: invalid app');
            return tokens[1];
        },
        /**
         * Gets the locally stored data/settings for this app
         */
        getData() {
            const app = grage.getAppID();
            const data = window.localStorage.getItem(app);
            if (data)
                return JSON.parse(data);
        },
        /**
         * Saves some data to the local storage for this app.
         * Overwrites old data
         * @param data the data to save
         */
        setData(data: any) {
            const app = grage.getAppID();
            window.localStorage.setItem(grage.getAppID(), JSON.stringify(data));
        },
        /**
         * Terminates the connection and reloads the app.
         */
        terminate() {
            //close ws if not already
            if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
                ws.close();
            }
            //reload page in 5 seconds
            setTimeout(
                () => window.location.reload(false),
                grage.options.reloadTime
            );
        },
        /**
         * Refreshes a connection to a channel
         * @param id the id of the channel
         */
        refreshConnection(id: string) {
            const m: ConnectMessage = {
                type: "connect",
                id,
            };
            try {
                if (grage.options.debug)
                    console.log('[Send]', m);
                ws.send(JSON.stringify(m));
            } catch (error) {
                handleError(error);
            }
        },
        /**
         * Connects to a channel and listens to any messages on channel
         * @param id the id of the channel
         * @param handler the listener for messages
         * @param refresh called when the channel is refreshed
         */
        connect(id: string, handler: (data: any) => void, refresh?: () => void) {
            function doRefresh() {
                grage.refreshConnection(id);
                if (refresh) refresh();
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
        send(id: string, data: any) {
            const m: SendMessage = {
                type: "send",
                data,
                id,
            };
            try {
                if (grage.options.debug)
                    console.log('[Send]', m);
                ws.send(JSON.stringify(m));
            } catch (error) {
                handleError(error);
            }
        }
    };

    ws.onmessage = ev => {
        try {
            const m = JSON.parse(ev.data) as Message;
            if (grage.options.debug)
                console.log('[recv]', m);
            if (isReceiveMessage(m)) {
                //send to every listener in the proper channel
                for (const listener of channelListeners[m.id]) {
                    listener(m.data);
                }
            } else {
                console.warn('[Unknown message type]', m);
            }
        } catch (error) {
            handleError(error);
        }
    };


    ws.onopen = function handleOpen() {
        if (grage.options.debug)
            console.log('[Websocket open]');
        //call every listener upon connect
        for (const handler of openListeners)
            handler();
    };

    function handleError(error: Error) {
        console.error('[Websocket error]', error);
        //if debug, stop, else try reload page
        if (!grage.options.debug)
            grage.terminate();
        else {
            debugger;
            console.log('[Debug mode] frozen');
        }
    }

    ws.onerror = (ev) => {
        handleError(ev as any as Error);
    };

    ws.onclose = grage.terminate;

    return grage;
})();
