/******************************************************************************
 *
 * Boiler Controller Firmware (BCF)
 *
 * File        : 30_objects.js
 * Description : Global objects
 *
 ******************************************************************************/

let boiler =
{
    config :
    {
        heating_enabled : false,

        max_runtime     : CONFIG.DEFAULT_MAX_RUNTIME,

        restart_delay   : 900
    },

    energy :
    {
        predicted_quarter_peak : 0,

        peak_limit             : 0,

        peak_margin            : 0,

        boiler_power           : 0,

        house_power            : 0
    },

    status :
    {
        state                  : STATE.BOOTING,

        relay                  : false,

        runtime                : 0,

        starts_today           : 0,

        total_starts           : 0,

        total_runtime          : 0,

        firmware_boots         : 0,

        watchdog               : false,

        watchdog_reboots       : 0,

        watchdog_reason        : "",

        last_watchdog_reboot   : 0,

        watchdog_problem_since : 0,

        uptime                 : 0,

        wifi_rssi              : 0,

        wifi_connected         : false,

        mqtt_connected         : false,

        ram_free               : 0,

        firmware_version       : "",

        script_version         : FIRMWARE.VERSION,

        controller_online      : false,

        controller_timeout     : CONFIG.CONTROLLER_TIMEOUT / 1000,

        last_controller_update : "",

        last_controller_seen   : 0,

        last_controller_age    : 0,

        last_mqtt_seen         : "",

        last_mqtt_seen_ms      : 0,

        controller_config_received : false,

        last_update            : "",

        last_start             : "",

        last_stop              : "",

        last_stop_reason       : "",

        warm_enough            : false,

        warm_enough_since      : "",

        warmup_min_runtime     : CONFIG.WARMUP_MIN_RUNTIME,

        boot_delay_active      : false,

        boot_delay_remaining   : 0,

        restart_delay_active   : false,

        restart_remaining      : 0
    }
};

let persistent =
{
    version         : STORAGE.VERSION,

    firmware_boots  : 0,

    starts_today    : 0,

    total_starts    : 0,

    total_runtime   : 0,

    warm_enough     : false,

    warm_enough_since : "",

    watchdog_reboots : 0,

    watchdog_reason : "",

    last_watchdog_reboot : 0
};
