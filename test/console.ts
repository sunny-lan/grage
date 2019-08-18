import '../index';

import * as WebSocket from 'ws';
import {createInterface} from 'readline';

const rl = createInterface({
    input: process.stdin,
    output: process.stdout
});

const ws = new WebSocket('ws://localhost:1337/ws');

ws.on('message', x => console.log('[recv]', x));

ws.once('open', () => {
    console.log('[ok]');
    rl.on('line', y=>{
        const z=y;
        ws.send(z, e=>{
            if(e)console.error(e);
        });
    });
});
