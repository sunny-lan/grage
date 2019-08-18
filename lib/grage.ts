import {ConnectMessage, DataMessage, Message, RequestPing} from "../src/lib";

function isDataMessage(m: Message): m is DataMessage {
    return m.type === 'data';
}

type ChannelListener = (data: any) => void;

// @ts-ignore
window.grage = (function () {
    const ws = new WebSocket('ws://grage.herokuapp.com/ws');

    //list of listeners for when the websocket connects
    let openListeners: (() => void)[] | undefined = [];

    //list of listeners to each channel
    const channelListeners: {
        [id: string]: ChannelListener[]
    } = {};
    const onceListeners: {
        [id: string]: ChannelListener[]
    } = {};

    /**
     * Sends a message on the websocket, returns any error which occurs
     * @param m the message to send
     */
    function wsSend(m: Message) {
        try {
            if (grage.options.debug)
                console.log('[Send]', m);
            ws.send(JSON.stringify(m));
            return false;
        } catch (error) {
            handleError(error);
            return error;
        }
    }

    const grage = {
        options: {
            debug: true,
            reloadTime: 5 * 1000,//delay before the page reloads upon error
            refreshTime: 60 * 1000,
            pingTimeout: 5 * 1000,
        },
        /**
         * Registers a listener which is called upon connection to server
         * @param cb the listener
         */
        onOpen(cb: () => void) {
            if (openListeners === undefined)
                cb();
            else
                openListeners.push(cb);
        },
        /**
         * Gets the ID of the currently running app
         */
        getAppID() {
            const url = window.location.pathname.slice(1);
            const tokens = url.split('/');
            if (tokens[0] !== 'apps')
                throw new Error('Cannot get data: invalid app');
            return tokens[1];
        },
        /**
         * Gets the locally stored data/settings for this app
         */
        getData(defaultValue?: any) {
            const app = grage.getAppID();
            const data = window.localStorage.getItem(app);
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
        saveData(data: any) {
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
         * Request a device to ping
         * @param id the device to request ping from
         */
        requestPing(id: string) {
            //send ping
            const m: RequestPing = {
                type: "rping",
                id,
                fromDevice: false
            };
            if (wsSend(m)) return;
        },
        /**
         * Connects to a channel and listens to any messages on channel
         * @param id the id of the channel
         * @param cb the listener for messages
         * @param init called when confirmation received that channel is alive
         */
        connect(id: string, cb: ChannelListener, init?: () => void) {
            //if not connected to channel yet
            if (!channelListeners.hasOwnProperty(id)) {
                //initialize channelListeners
                channelListeners[id] = [];

                //send channel connect message
                const m: ConnectMessage = {
                    type: "connect",
                    id,
                };
                if (wsSend(m)) return;
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
        once(id: string, cb: ChannelListener) {
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
        send(id: string, data: any) {
            const m: DataMessage = {
                type: "data",
                data,
                id,
                fromDevice: false,
            };
            if (wsSend(m)) return;
        }
    };

    ws.onmessage = ev => {
        try {
            const m = JSON.parse(ev.data) as Message;
            if (grage.options.debug)
                console.log('[recv]', m);
            if (isDataMessage(m)) {
                //ignore messages from other browsers
                if (m.fromDevice) {
                    if (channelListeners[m.id]) {
                        //send to every listener in the proper channel
                        for (const listener of channelListeners[m.id]) {
                            listener(m.data);
                        }
                    }

                    if (onceListeners[m.id]) {
                        //send to every once listener
                        for (const listener of onceListeners[m.id]) {
                            listener(m.data);
                        }
                        //then clear list of once listeners
                        delete onceListeners[m.id];
                    }
                }
            } else {
                console.warn('[Unknown message type]', m);
            }
        } catch (error) {
            return handleError(error);
        }
    };


    ws.onopen = function handleOpen() {
        if (grage.options.debug)
            console.log('[Websocket open]');
        //call every listener upon connect
        if (openListeners !== undefined)
            for (const handler of openListeners)
                handler();
        openListeners = undefined;
    };

    function handleError(error: Error) {
        console.error('[Websocket error]', error);
        //if debug, stop, else try reload page
        if (!grage.options.debug)
            grage.terminate();
        else {
            console.log('[Debug mode] frozen');
            debugger;
        }
    }

    ws.onerror = (ev) => {
        handleError(ev as any as Error);
    };

    ws.onclose = grage.terminate;

    return grage;
})();
