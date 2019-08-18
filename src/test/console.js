"use strict";
//import '../index';
Object.defineProperty(exports, "__esModule", { value: true });
const WebSocket = require("ws");
const readline_1 = require("readline");
const rl = readline_1.createInterface({
    input: process.stdin,
    output: process.stdout
});
const ws = new WebSocket('ws://grage.herokuapp.com/ws');
ws.on('message', x => console.log('[recv]', x));
ws.once('open', () => {
    console.log('[ok]');
    rl.on('line', y => {
        const z = y;
        ws.send(z, e => {
            if (e)
                console.error(e);
        });
    });
});
//# sourceMappingURL=console.js.map