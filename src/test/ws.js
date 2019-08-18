"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("..");
const WebSocket = require("ws");
async function open(addr = 'ws://127.0.0.1:1337/ws') {
    const ws = new WebSocket(addr);
    return new Promise((resolve) => {
        ws.once('open', () => resolve(ws));
    });
}
async function wait(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
async function wm(ws) {
    return new Promise((resolve) => {
        ws.once('message', resolve);
    });
}
async function s(ws, d) {
    return new Promise((resolve, reject) => {
        ws.send(JSON.stringify(d), (e) => {
            if (e)
                reject(e);
            else
                resolve();
        });
    });
}
async function run() {
    const ws1 = await open();
    const ws2 = await open();
    console.log('1,2 open');
    await s(ws1, {
        type: 'connect',
        id: 'hello'
    });
    await s(ws2, {
        type: 'connect',
        id: 'hello'
    });
    await wait(1000);
    console.log('connected to hello');
    await s(ws1, {
        type: 'data',
        id: 'hello',
        data: 'lol',
        fromDevice: false,
    });
    console.log('sent lol');
    console.log('[2]', await wm(ws2));
}
run();
//# sourceMappingURL=ws.js.map