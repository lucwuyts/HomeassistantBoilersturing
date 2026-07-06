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
    CONTROLLER_TIMEOUT    : 120000,
    WATCHDOG_INTERVAL     : 60000,
    WATCHDOG_TIMEOUT      : 600000,
    WATCHDOG_MIN_UPTIME   : 300,
    WATCHDOG_REBOOT_GAP   : 3600000,
    BOOT_DELAY            : 30,
    RELAY_ID              : 0,
    WARMUP_MIN_RUNTIME    : 300,
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

    PEAK_LIMIT          : "Peak limit exceeded",

    WARM_ENOUGH         : "Boiler warm enough",

    RESTART_DELAY       : "Restart delay active",

    WATCHDOG_TIMEOUT    : "Watchdog timeout",

    CONTROLLER_DISABLED : "Controller disabled"
};
