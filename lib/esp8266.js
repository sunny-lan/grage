var PinMode;
(function (PinMode) {
    PinMode[PinMode["INPUT"] = 0] = "INPUT";
    PinMode[PinMode["INPUT_PULLUP"] = 2] = "INPUT_PULLUP";
    PinMode[PinMode["OUTPUT"] = 1] = "OUTPUT";
})(PinMode || (PinMode = {}));
var InterruptMode;
(function (InterruptMode) {
    InterruptMode[InterruptMode["RISING"] = 1] = "RISING";
    InterruptMode[InterruptMode["FALLING"] = 2] = "FALLING";
    InterruptMode[InterruptMode["CHANGE"] = 3] = "CHANGE";
    InterruptMode[InterruptMode["ONLOW"] = 4] = "ONLOW";
    InterruptMode[InterruptMode["ONHIGH"] = 5] = "ONHIGH";
})(InterruptMode || (InterruptMode = {}));
var LogicLevel;
(function (LogicLevel) {
    LogicLevel[LogicLevel["HIGH"] = 1] = "HIGH";
    LogicLevel[LogicLevel["LOW"] = 0] = "LOW";
})(LogicLevel || (LogicLevel = {}));
var Pin;
(function (Pin) {
    Pin[Pin["D0"] = 16] = "D0";
    Pin[Pin["D1"] = 5] = "D1";
    Pin[Pin["D2"] = 4] = "D2";
    Pin[Pin["D3"] = 0] = "D3";
    Pin[Pin["D4"] = 2] = "D4";
    Pin[Pin["D5"] = 14] = "D5";
    Pin[Pin["D6"] = 12] = "D6";
    Pin[Pin["D7"] = 13] = "D7";
    Pin[Pin["D8"] = 15] = "D8";
    Pin[Pin["D9"] = 3] = "D9";
    Pin[Pin["D10"] = 1] = "D10";
    Pin[Pin["_A0"] = 17] = "_A0";
})(Pin || (Pin = {}));
// @ts-ignore
window.esp8266 = {
    LogicLevel: LogicLevel,
    PinMode: PinMode,
    InterruptMode: InterruptMode,
    Pin: Pin,
    pinMode: function (pin, mode) {
        return {
            command: 'pinMode',
            pin: pin, mode: mode,
        };
    },
    digitalWrite: function (pin, value) {
        return {
            command: 'digitalWrite',
            pin: pin, value: value,
        };
    },
    attachInterrupt: function (pin, mode) {
        return {
            command: 'attachInterrupt',
            pin: pin, mode: mode,
        };
    },
    detachInterrupt: function (pin) {
        return {
            command: 'detachInterrupt',
            pin: pin
        };
    },
};
