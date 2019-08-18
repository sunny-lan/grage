"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isErrorMessage(m) {
    return m.type === 'error';
}
exports.isErrorMessage = isErrorMessage;
function isMetadataMessage(m) {
    return m.type === 'metadata';
}
exports.isMetadataMessage = isMetadataMessage;
function isConnectMessage(m) {
    return m.type === 'connect';
}
exports.isConnectMessage = isConnectMessage;
function isSendMessage(m) {
    return m.type === 'send';
}
exports.isSendMessage = isSendMessage;
function isReceiveMessage(m) {
    return m.type === 'receive';
}
exports.isReceiveMessage = isReceiveMessage;
//# sourceMappingURL=lib.js.map