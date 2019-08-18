export interface Message {
    type: 'error' | 'metadata' | 'connect' | 'send' | 'receive';
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
    type: 'send' | 'receive';
    id: string;
    data: any;
}

export interface SendMessage extends ChannelMessage {
    type: 'send';
}

export function isSendMessage(m: Message): m is SendMessage {
    return m.type === 'send';
}

export interface ReceiveMessage extends ChannelMessage {
    type: 'receive';
}

export function isReceiveMessage(m: Message): m is ReceiveMessage {
    return m.type === 'receive';
}
