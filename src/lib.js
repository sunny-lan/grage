export function isErrorMessage(m) {
    return m.type === 'error';
}
export function isMetadataMessage(m) {
    return m.type === 'metadata';
}
export function isConnectMessage(m) {
    return m.type === 'connect';
}
export function isSendMessage(m) {
    return m.type === 'send';
}
export function isReceiveMessage(m) {
    return m.type === 'receive';
}
