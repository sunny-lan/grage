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
function isChannelMessage(m) {
    return isDataMessage(m) || isRequestPing(m) || isPingMessage(m);
}
exports.isChannelMessage = isChannelMessage;
function isDataMessage(m) {
    return m.type === 'data';
}
exports.isDataMessage = isDataMessage;
function isRequestPing(m) {
    return m.type === 'rping';
}
exports.isRequestPing = isRequestPing;
function isPingMessage(m) {
    return m.type === 'ping';
}
exports.isPingMessage = isPingMessage;
//# sourceMappingURL=lib.js.map