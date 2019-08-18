"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("./ws");
const express = require("express");
const expressWs = require("express-ws");
const port = Number.parseInt(process.env.PORT || '1337');
const app = express();
expressWs(app);
const wsHandler = ws_1.default();
// @ts-ignore
app.ws('/ws', wsHandler);
app.use('/apps', express.static('apps'));
app.listen(port, () => console.log('listening on ', port));
//# sourceMappingURL=index.js.map