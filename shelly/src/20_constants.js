/******************************************************************************
 *
 * Boiler Controller Firmware (BCF)
 *
 * File        : 20_constants.js
 * Description : Constants and enumerations
 *
 ******************************************************************************/

const CONFIG =
{
    HEARTBEAT_INTERVAL    : 60000,
    DEFAULT_MAX_RUNTIME   : 10800,
    DEBUG_LEVEL           : 2,
    RUNTIME_INTERVAL      : 1000
};

const STORAGE =
{
    KEY     : "statistics",
    VERSION : 1
};

const TOPIC =
{
    CONTROLLER : "boiler/v1/controller",
    STATUS     : "boiler/v1/status"
};

const DEBUG =
{
    ERROR   : 0,
    WARNING : 1,
    INFO    : 2,
    TRACE   : 3
};

const STATE =
{
    BOOTING : "BOOTING",
    IDLE    : "IDLE",
    HEATING : "HEATING",
    ERROR   : "ERROR"
};

const STOP_REASON =
{
    HEATING_NOT_ALLOWED : "Heating not allowed",

    MAX_RUNTIME         : "Maximum runtime exceeded",

    RESTART_DELAY       : "Restart delay active",

    WATCHDOG_TIMEOUT    : "Watchdog timeout",

    CONTROLLER_DISABLED : "Controller disabled"
};

