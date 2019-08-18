import makeWss from "./ws";
import * as express from 'express';
import * as expressWs from 'express-ws';

const port = Number.parseInt(process.env.PORT || '1337');

const app = express();
expressWs(app);

const wsHandler = makeWss();

// @ts-ignore
app.ws('/ws', wsHandler);

app.use('/apps', express.static('apps'));
app.use('/lib', express.static('lib'));

app.listen(port, () =>
    console.log('listening on ', port));
