import * as WebSocket from 'ws';
import {createInterface} from 'readline';

const rl = createInterface({
    input: process.stdin,
    output: process.stdout
});

const ws = new WebSocket('ws://grage.herokuapp.com/ws');

ws.on('message', x => console.log('[recv]', x));

ws.once('open', () => {
    console.log('[ok]');
    rl.on('line', y=>{
        const z=eval(y);
        ws.send(z, e=>{
            if(e)console.error(e);
        });
    });
});
