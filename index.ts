import * as WebSocket from 'ws';
import {ErrorMessage, isConnectMessage, isSendMessage, Message, MetadataMessage, ReceiveMessage} from "./lib";

const port = Number.parseInt(process.env.PORT || '1337');

console.log('listening on ', port);

const wss = new WebSocket.Server({port});


function makeWss(options = {
    connectionTimeout: 60 * 1000,
    ping: 60 * 1000,
}) {
    const channels: {
        [id: string]: WebSocket[];
    } = {};

    function getClients(id: string) {
        if (!channels.hasOwnProperty(id))
            channels[id] = [];
        return channels[id];
    }

    return {
        handleConnection(me: WebSocket) {
            const connectedChannels: string[] = [];
            const timers: { [id: string]: NodeJS.Timeout } = {};

            //regularly send ping with metadata
            const metadataTimer = setInterval(function sendMetadata() {
                const meta: MetadataMessage = {
                    type: 'metadata',
                    connectedChannels,
                    ...options,
                };
                me.send(JSON.stringify(meta), handleError);
            }, options.ping);

            /**
             * Connects to a channel.
             * Only renews timeout if already connected.
             * @param id the id of the channel to connect to
             */
            function connect(id: string) {
                //connect to channel
                const clients = getClients(id);

                //only add if already
                if (!clients.includes(me)) {
                    clients.push(me);
                    connectedChannels.push(id);
                }

                //automatically disconnect if timeout occurs
                if (timers.hasOwnProperty(id)) {
                    //clear any old timer
                    clearTimeout(timers[id]);
                }

                //store timeout in case we need to clear it later (see above)
                timers[id] = setTimeout(() => disconnect(id), options.connectionTimeout);
            }

            /**
             * Disconnects this client from a channel.
             * Does not throw error if client is not connected to channel.
             * @param id the channel to disconnect from
             */
            function disconnect(id: string) {
                //remove from list of clients in channel
                const clients = getClients(id);
                const idx = clients.indexOf(me);
                if (idx !== -1)
                    clients.splice(idx, 1);

                //remove from list of channels this is connected to
                const idx2 = connectedChannels.indexOf(id);
                if (idx2 !== -1)
                    connectedChannels.splice(idx2, 1);
            }

            /**
             * Terminates this websocket connection,
             * and cleans up from all connected channels
             */
            function terminate() {
                //stop sending metadata
                clearInterval(metadataTimer);

                //disconnect websocket if not already
                if (me.readyState === WebSocket.CONNECTING || me.readyState === WebSocket.OPEN) {
                    me.terminate();
                }

                //clean up connections to channels
                for (const id of connectedChannels) {
                    disconnect(id);
                }
            }

            me.on('close', terminate);

            /**
             * Handles when any user induced error occurs
             * @param error the error which occurred
             */
            function handleError(error?: Error) {
                //allows this function to be directly used in callbacks
                //where the error is undefined upon success
                if (error === undefined) {
                    return;
                }

                console.error('[user ws error]', error);

                //try to tell client what went wrong
                const errMsg: ErrorMessage = {
                    type: "error",
                    error: error.stack,
                };
                me.send(errMsg, (e) => {
                    if (e) {
                        //this prints if send failed
                        console.error('Error while sending error', e);
                    }
                    //terminate connection no matter what
                    terminate();
                });
            }

            me.on('message', function incoming(message) {
                try {
                    const m = JSON.parse(message.toString()) as Message;

                    if (isSendMessage(m)) {
                        const recvMessage: ReceiveMessage = {
                            type: "receive",
                            data: m.data,
                            id: m.id,
                        };
                        //send to every client in certain channel
                        for (const client of getClients(m.id)) {
                            //skip me (person who sent message)
                            if (client !== me)
                                client.send(JSON.stringify(recvMessage), handleError);
                        }
                    } else if (isConnectMessage(m)) {
                        connect(m.id);
                    } else {
                        handleError(new Error(`Invalid message type: ${m.type}`));
                    }
                } catch (error) {
                    handleError(error);
                }
            });
        }
    }
}

const wsHandler = makeWss();

wss.on('connection', wsHandler.handleConnection);
