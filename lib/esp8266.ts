import {SendMessage} from "../src/lib";

enum PinMode {
    INPUT = 0x00,
    INPUT_PULLUP = 0x02,
    OUTPUT = 0x01,
}

enum InterruptMode {
    RISING = 0x01,
    FALLING = 0x02,
    CHANGE = 0x03,
    ONLOW = 0x04,
    ONHIGH = 0x05,
}

enum LogicLevel {
    HIGH = 0x01,
    LOW = 0x00,
}

enum Pin {
    D0 = 16,
    D1 = 5,
    D2 = 4,
    D3 = 0,
    D4 = 2,
    D5 = 14,
    D6 = 12,
    D7 = 13,
    D8 = 15,
    D9 = 3,
    D10 = 1,
    _A0 = 17,
}

export type StateData={
    pinReadings:number[]
}

// @ts-ignore
window.esp8266 = {
    LogicLevel,
    PinMode,
    InterruptMode,
    Pin,

    pinMode(pin: Pin, mode: PinMode) {
        return {
            command: 'pinMode',
            pin, mode,
        }
    },
    digitalWrite(pin: Pin, value: LogicLevel) {
        return {
            command: 'digitalWrite',
            pin, value,
        };
    },
    attachInterrupt(pin: Pin, mode: InterruptMode) {
        return {
            command: 'attachInterrupt',
            pin, mode,
        };
    },
    detachInterrupt(pin: Pin) {
        return {
            command: 'detachInterrupt',
            pin
        };
    },
    digitalRead() {
        return {
            command: 'digitalRead',
        };
    },
};
