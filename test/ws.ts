import '../index';

import * as WebSocket from 'ws';
import {ConnectMessage, Message, SendMessage} from "../lib";

const ws1 = new WebSocket('ws://127.0.0.1:1337');
const ws2 = new WebSocket('ws://127.0.0.1:1337');

async function open(ws: WebSocket){
    return new Promise((resolve) => {
        ws.once('open', resolve);
    });
}

async function wait(ms:number){
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

async function wm<T extends Message>(ws: WebSocket): Promise<T> {
    return new Promise((resolve) => {
        ws.once('message', resolve);
    });
}

async function s<T extends Message>(ws: WebSocket, d: T) {
    return new Promise((resolve, reject) => {
        ws.send(JSON.stringify(d), (e) => {
            if (e) reject(e);
            else resolve();
        });
    });
}

async function run() {
    await open(ws1);
    await open(ws2);
    console.log('1,2 open');
    await s<ConnectMessage>(ws1, {
        type: 'connect',
        id: 'hello'
    });
    await s<ConnectMessage>(ws2, {
        type: 'connect',
        id: 'hello'
    });
    await wait(1000);
    console.log('connected to hello');
    await s<SendMessage>(ws1, {
        type: 'send',
        id: 'hello',
        data: 'lol'
    });
    console.log('sent lol');
    console.log('[2]', await wm(ws2));
}

run();
