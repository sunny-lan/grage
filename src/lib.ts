export interface Message {
    type: 'error' | 'metadata' | 'connect' | 'data' | 'receive' | 'rping' | 'ping';
}


export interface ErrorMessage extends Message {
    type: 'error';
    error: string;
}

export function isErrorMessage(m: Message): m is ErrorMessage {
    return m.type === 'error';
}

export interface MetadataMessage extends Message {
    type: 'metadata';
    connectionTimeout: number;
    connectedChannels: string[];

    [key: string]: any;
}

export function isMetadataMessage(m: Message): m is MetadataMessage {
    return m.type === 'metadata';
}

export interface ConnectMessage extends Message {
    type: 'connect';
    id: string;
}

export function isConnectMessage(m: Message): m is ConnectMessage {
    return m.type === 'connect';
}

export interface ChannelMessage extends Message {
    type: 'data' | 'rping' | 'ping';
    id: string;
    fromDevice: boolean;
}

export function isChannelMessage(m: Message): m is ChannelMessage {
    return isDataMessage(m) || isRequestPing(m) || isPingMessage(m);
}

export interface DataMessage extends ChannelMessage {
    type: 'data';
    data: any;
}

export function isDataMessage(m: Message): m is DataMessage {
    return m.type === 'data';
}

export interface RequestPing extends ChannelMessage {
    type: 'rping',
    fromDevice: false,
}

export interface Ping extends ChannelMessage {
    type: 'ping',
    fromDevice: true,
}

export function isRequestPing(m: Message): m is RequestPing {
    return m.type === 'rping';
}

export function isPingMessage(m: Message): m is Ping {
    return m.type === 'ping';
}
