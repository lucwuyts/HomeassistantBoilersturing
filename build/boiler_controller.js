/******************************************************************************
 *
 * Boiler Controller Firmware (BCF)
 *
 * File        : 10_firmware.js
 * Description : Firmware information
 *
 ******************************************************************************/

const FIRMWARE =
{
    NAME        : "Boiler Controller",
    VERSION     : "2026.07.21-01",
    API         : 1
};

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
    STOP_HOLD             : 300,
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

    STOP_HOLD           : "Stop hold active",

    RESTART_DELAY       : "Restart delay active",

    WATCHDOG_TIMEOUT    : "Watchdog timeout"
};

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

        restart_delay   : 900,

        stop_hold       : CONFIG.STOP_HOLD,

        peak_safety_margin_wh : 50,

        peak_min_on_seconds   : 60
    },

    energy :
    {
        predicted_quarter_peak : 0,

        peak_limit             : 0,

        peak_margin            : 0,

        boiler_power           : 0,

        house_power            : 0,

        quarter_elapsed_seconds   : 0,

        quarter_remaining_seconds : 0,

        quarter_energy_wh         : 0,

        quarter_max_energy_wh     : 0,

        predicted_with_boiler_wh  : 0,

        predicted_without_boiler_wh : 0,

        peak_headroom_wh          : 0,

        latest_safe_off_seconds   : 0,

        peak_decision             : "unknown"
    },

    status :
    {
        state                  : STATE.BOOTING,

        relay                  : false,

        runtime                : 0,

        starts_today           : 0,

        starts_today_date      : "",

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

        stop_hold_active       : false,

        stop_hold_remaining    : 0,

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

    starts_today_date : "",

    total_starts    : 0,

    total_runtime   : 0,

    warm_enough     : false,

    warm_enough_since : "",

    watchdog_reboots : 0,

    watchdog_reason : "",

    last_watchdog_reboot : 0
};

/******************************************************************************
 *
 * Boiler Controller Firmware (BCF)
 *
 * File        : 40_logging.js
 * Description : Logging
 *
 ******************************************************************************/

function log(level, text)
{
    if (level > CONFIG.DEBUG_LEVEL)
    {
        return;
    }

    let prefix = "";

    switch(level)
    {
        case DEBUG.ERROR:
            prefix = "[ERROR] ";
            break;

        case DEBUG.WARNING:
            prefix = "[WARNING] ";
            break;

        case DEBUG.INFO:
            prefix = "[INFO] ";
            break;

        default:
            prefix = "[TRACE] ";
            break;
    }

    print(isoTimestamp() + " " + prefix + text);
}

//-----------------------------------------------------------------------------

function logError(text)
{
    log(DEBUG.ERROR, text);
}

//-----------------------------------------------------------------------------

function logWarning(text)
{
    log(DEBUG.WARNING, text);
}

//-----------------------------------------------------------------------------

function logInfo(text)
{
    log(DEBUG.INFO, text);
}

//-----------------------------------------------------------------------------

function logTrace(text)
{
    log(DEBUG.TRACE, text);
}

/******************************************************************************
 *
 * Boiler Controller Firmware (BCF)
 *
 * File        : 50_helpers.js
 * Description : Helper functions
 *
 ******************************************************************************/

function isoTimestamp()
{
    return new Date().toISOString();
}

//-----------------------------------------------------------------------------

function timestampMs()
{
    return new Date().getTime();
}

//-----------------------------------------------------------------------------

function twoDigits(value)
{
    if (value < 10)
    {
        return "0" + value;
    }

    return "" + value;
}

//-----------------------------------------------------------------------------

function dateKey()
{
    let now = new Date();

    let year = now.getFullYear();

    if (year < 2024)
    {
        return "";
    }

    return (
        year +
        "-" +
        twoDigits(now.getMonth() + 1) +
        "-" +
        twoDigits(now.getDate())
    );
}

/******************************************************************************
 *
 * Boiler Controller Firmware (BCF)
 *
 * File        : 60_persistence.js
 * Description : Persistent storage
 *
 ******************************************************************************/

function copyPersistentToStatus()
{
    boiler.status.firmware_boots = persistent.firmware_boots;

    boiler.status.starts_today = persistent.starts_today;

    boiler.status.starts_today_date =
        persistent.starts_today_date || "";

    boiler.status.total_starts = persistent.total_starts;

    boiler.status.total_runtime = persistent.total_runtime;

    boiler.status.warm_enough = persistent.warm_enough === true;

    boiler.status.warm_enough_since =
        persistent.warm_enough_since || "";

    boiler.status.watchdog_reboots = persistent.watchdog_reboots || 0;

    boiler.status.watchdog_reason = persistent.watchdog_reason || "";

    boiler.status.last_watchdog_reboot =
        persistent.last_watchdog_reboot || 0;
}

//-----------------------------------------------------------------------------

function copyStatusToPersistent()
{
    persistent.firmware_boots = boiler.status.firmware_boots;

    persistent.starts_today = boiler.status.starts_today;

    persistent.starts_today_date = boiler.status.starts_today_date;

    persistent.total_starts = boiler.status.total_starts;

    persistent.total_runtime = boiler.status.total_runtime;

    persistent.warm_enough = boiler.status.warm_enough;

    persistent.warm_enough_since = boiler.status.warm_enough_since;

    persistent.watchdog_reboots = boiler.status.watchdog_reboots;

    persistent.watchdog_reason = boiler.status.watchdog_reason;

    persistent.last_watchdog_reboot =
        boiler.status.last_watchdog_reboot;
}

//-----------------------------------------------------------------------------

function savePersistentData()
{
    copyStatusToPersistent();

    persistent.version = STORAGE.VERSION;

    Script.storage.setItem(
        STORAGE.KEY,
        JSON.stringify(persistent)
    );

    logTrace("Persistent data saved");
}

//-----------------------------------------------------------------------------

function resetStatistics()
{
    boiler.status.starts_today = 0;

    boiler.status.starts_today_date = dateKey();

    boiler.status.total_starts = 0;

    boiler.status.total_runtime = 0;

    savePersistentData();

    logInfo("Statistics reset");
}

//-----------------------------------------------------------------------------

function resetDailyStatistics()
{
    boiler.status.starts_today = 0;

    boiler.status.starts_today_date = dateKey();

    savePersistentData();

    logInfo("Daily statistics reset");
}

//-----------------------------------------------------------------------------

function checkDailyStatisticsReset()
{
    let today = dateKey();

    if (today === "")
    {
        return;
    }

    if (boiler.status.starts_today_date === "")
    {
        resetDailyStatistics();

        return;
    }

    if (boiler.status.starts_today_date === today)
    {
        return;
    }

    resetDailyStatistics();

    publishStatus();
}

//-----------------------------------------------------------------------------

function loadPersistentData()
{
    let json = Script.storage.getItem(STORAGE.KEY);

    if (json === null)
    {
        logInfo("No persistent data found");

        savePersistentData();

        return;
    }

    try
    {
        persistent = JSON.parse(json);
    }
    catch(error)
    {
        logWarning("Persistent data corrupted");

        persistent =
        {
            version         : STORAGE.VERSION,

            firmware_boots  : 0,

            starts_today    : 0,

            starts_today_date : "",

            total_starts    : 0,

            total_runtime   : 0,

            warm_enough     : false,

            warm_enough_since : "",

            watchdog_reboots : 0,

            watchdog_reason : "",

            last_watchdog_reboot : 0
        };

        savePersistentData();

        return;
    }

    if (persistent.version !== STORAGE.VERSION)
    {
        logWarning("Persistent data version mismatch");
    }

    copyPersistentToStatus();

    logInfo("Persistent data loaded");

    logInfo("Firmware boots : " + boiler.status.firmware_boots);

    logInfo("Starts today   : " + boiler.status.starts_today);

    logInfo("Total starts   : " + boiler.status.total_starts);

    logInfo("Total runtime  : " + boiler.status.total_runtime + " s");
}

/******************************************************************************
 *
 * Boiler Controller Firmware (BCF)
 *
 * File        : 70_mqtt.js
 * Description : MQTT manager
 *
 ******************************************************************************/

function copyKnownFields(source, target, label)
{
    for (let key in source)
    {
        if (target.hasOwnProperty(key))
        {
            target[key] = source[key];

            logInfo(label + "." + key + " = " + target[key]);
        }
    }
}

//-----------------------------------------------------------------------------

function processControllerCommand(command)
{
    if (command.reset_statistics === true)
    {
        resetStatistics();
    }

    if (command.reset_warm_enough === true)
    {
        resetWarmEnough();
    }
}

//-----------------------------------------------------------------------------

function markControllerOnline()
{
    if (!boiler.status.controller_online)
    {
        logInfo("Controller online");
    }

    boiler.status.controller_online = true;

    boiler.status.watchdog = true;

    boiler.status.last_controller_update = isoTimestamp();

    boiler.status.last_controller_seen = timestampMs();
}

//-----------------------------------------------------------------------------

function processControllerMessage(topic, message)
{
    logInfo("Controller message received");

    updateLastMqttSeen();

    let data;

    try
    {
        data = JSON.parse(message);
    }
    catch(error)
    {
        logError("Invalid JSON");

        return;
    }

    if (!data.boiler)
    {
        logError("Missing boiler object");

        return;
    }

    markControllerOnline();

    if (data.boiler.command)
    {
        processControllerCommand(data.boiler.command);
    }

    if (!data.boiler.config)
    {
        if (!data.boiler.command)
        {
            logError("Missing config object");

            return;
        }

        if (data.boiler.command.reset_warm_enough === true &&
            boiler.status.controller_config_received)
        {
            evaluateController();
        }

        publishStatus();

        return;
    }

    copyKnownFields(
        data.boiler.config,
        boiler.config,
        "config"
    );

    boiler.status.controller_config_received = true;

    if (data.boiler.energy)
    {
        copyKnownFields(
            data.boiler.energy,
            boiler.energy,
            "energy"
        );
    }

    evaluateController();

    publishStatus();
}

//-----------------------------------------------------------------------------

function mqttInit()
{
    logInfo("MQTT framework initialized");

    MQTT.subscribe(
        TOPIC.CONTROLLER,
        processControllerMessage
    );

    logInfo("Subscribed to " + TOPIC.CONTROLLER);
}

//-----------------------------------------------------------------------------

function mqttPublish(topic, object)
{
    MQTT.publish(
        topic,
        JSON.stringify(object),
        1,
        true
    );
}

//-----------------------------------------------------------------------------

function publishStatus()
{
    boiler.status.last_update = isoTimestamp();

    let payload =
    {
        api        : FIRMWARE.API,
        source     : "Shelly",
        firmware   : FIRMWARE.VERSION,
        timestamp  : boiler.status.last_update,
        boiler     : boiler
    };

    mqttPublish(
        TOPIC.STATUS,
        payload
    );

    logTrace("Status published");
}

/******************************************************************************
 *
 * Boiler Controller Firmware (BCF)
 *
 * File        : 80_state.js
 * Description : State manager
 *
 ******************************************************************************/

function setState(newState)
{
    if (boiler.status.state === newState)
    {
        return;
    }

    boiler.status.state = newState;

    publishStatus();

    logInfo("State -> " + newState);
}

//-----------------------------------------------------------------------------

function updateLastStopReason(reason)
{
    if (reason === "")
    {
        return false;
    }

    if (!boiler.status.relay && boiler.status.last_stop_reason === reason)
    {
        return false;
    }

    boiler.status.last_stop_reason = reason;

    boiler.status.last_stop = isoTimestamp();

    return true;
}

/******************************************************************************
 *
 * Boiler Controller Firmware (BCF)
 *
 * File        : 90_relay.js
 * Description : Relay manager
 *
 ******************************************************************************/

let relaySyncInProgress = false;

//-----------------------------------------------------------------------------

function applyRelayState(on, source)
{
    if (boiler.status.relay === on)
    {
        return false;
    }

    boiler.status.relay = on;

    boiler.status.state = on ? STATE.HEATING : STATE.IDLE;

    if (!on)
    {
        boiler.status.runtime = 0;
    }

    logInfo("Relay state synced " + (on ? "ON" : "OFF") + " (" + source + ")");

    publishStatus();

    return true;
}

//-----------------------------------------------------------------------------

function syncRelayState()
{
    if (relaySyncInProgress)
    {
        return;
    }

    relaySyncInProgress = true;

    Shelly.call(
        "Switch.Get",
        {
            id : CONFIG.RELAY_ID
        },
        function(result, error_code, error_message)
        {
            relaySyncInProgress = false;

            if (error_code !== 0)
            {
                logError("Relay state read failed: " + error_message);

                return;
            }

            if (!result || typeof result.output !== "boolean")
            {
                logError("Relay state read returned invalid data");

                return;
            }

            if (applyRelayState(result.output, "switch"))
            {
                evaluateController();
            }
        }
    );
}

//-----------------------------------------------------------------------------

function setRelay(on)
{
    Shelly.call(
        "Switch.Set",
        {
            id : CONFIG.RELAY_ID,
            on : on
        },
        function(result, error_code, error_message)
        {
            if (error_code !== 0)
            {
                logError("Relay switch failed: " + error_message);

                publishStatus();

                return;
            }

            applyRelayState(on, "controller");

            logInfo("Relay switched " + (on ? "ON" : "OFF"));
        }
    );
}

//-----------------------------------------------------------------------------

function relayOn()
{
    if (boiler.status.relay)
    {
        return;
    }

    logInfo("Relay switch ON requested");

    setRelay(true);
}

//-----------------------------------------------------------------------------

function relayOff()
{
    if (!boiler.status.relay)
    {
        return;
    }

    logInfo("Relay switch OFF requested");

    setRelay(false);
}

//-----------------------------------------------------------------------------

function forceRelayOff()
{
    logInfo("Relay force OFF requested");

    setRelay(false);
}

/******************************************************************************
 *
 * Boiler Controller Firmware (BCF)
 *
 * File        : 100_restart_delay.js
 * Description : Restart delay manager
 *
 ******************************************************************************/

function startRestartDelay()
{
    if (boiler.status.restart_delay_active)
    {
        return;
    }

    boiler.status.restart_delay_active = true;

    boiler.status.restart_remaining =
        boiler.config.restart_delay;

    logInfo(
        "Restart delay started (" +
        boiler.status.restart_remaining +
        " s)"
    );

    publishStatus();
}

/******************************************************************************
 *
 * Boiler Controller Firmware (BCF)
 *
 * File        : 105_boot_delay.js
 * Description : Boot delay manager
 *
 ******************************************************************************/

function startBootDelay()
{
    boiler.status.boot_delay_active = true;

    boiler.status.boot_delay_remaining = CONFIG.BOOT_DELAY;

    logInfo(
        "Boot delay started (" +
        boiler.status.boot_delay_remaining +
        " s)"
    );
}

//-----------------------------------------------------------------------------

function updateBootDelay()
{
    if (!boiler.status.boot_delay_active)
    {
        return;
    }

    boiler.status.boot_delay_remaining--;

    if (boiler.status.boot_delay_remaining > 0)
    {
        return;
    }

    boiler.status.boot_delay_active = false;

    boiler.status.boot_delay_remaining = 0;

    logInfo("Boot delay expired");

    publishStatus();

    evaluateController();
}

/******************************************************************************
 *
 * Boiler Controller Firmware (BCF)
 *
 * File        : 107_stop_hold.js
 * Description : Short anti-cycle hold after stop
 *
 ******************************************************************************/

function startStopHold()
{
    boiler.status.stop_hold_active = true;

    boiler.status.stop_hold_remaining = boiler.config.stop_hold;

    logInfo(
        "Stop hold started (" +
        boiler.status.stop_hold_remaining +
        " s)"
    );
}

//-----------------------------------------------------------------------------

function updateStopHold()
{
    if (!boiler.status.stop_hold_active)
    {
        return;
    }

    boiler.status.stop_hold_remaining--;

    if (boiler.status.stop_hold_remaining > 0)
    {
        return;
    }

    boiler.status.stop_hold_active = false;

    boiler.status.stop_hold_remaining = 0;

    logInfo("Stop hold expired");

    publishStatus();

    evaluateController();
}

/******************************************************************************
 *
 * Boiler Controller Firmware (BCF)
 *
 * File        : 110_boiler.js
 * Description : Boiler manager
 *
 ******************************************************************************/

function isPeakLimitExceeded()
{
    let maxEnergy =
        boiler.energy.quarter_max_energy_wh;

    let predictedEnergy =
        boiler.energy.predicted_with_boiler_wh;

    let quarterEnergy =
        boiler.energy.quarter_energy_wh;

    let latestSafeOff =
        boiler.energy.latest_safe_off_seconds;

    if (maxEnergy <= 0)
    {
        return boiler.energy.peak_margin < 0;
    }

    if (predictedEnergy <= 0)
    {
        return boiler.energy.peak_margin < 0;
    }

    if (quarterEnergy >= maxEnergy)
    {
        return true;
    }

    if (latestSafeOff > 0)
    {
        return false;
    }

    if (!boiler.status.relay)
    {
        return true;
    }

    return boiler.status.runtime >= boiler.config.peak_min_on_seconds;
}

//-----------------------------------------------------------------------------

function evaluateController()
{
    if (boiler.status.boot_delay_active)
    {
        logInfo("Boot delay active");

        return;
    }

    if (boiler.status.restart_delay_active)
    {
        logInfo("Restart delay active");

        forceRelayOff();

        return;
    }

    if (boiler.status.stop_hold_active)
    {
        logInfo("Stop hold active");

        return;
    }

    if (!boiler.config.heating_enabled)
    {
        stopBoiler(STOP_REASON.HEATING_NOT_ALLOWED);

        return;
    }

    if (boiler.status.warm_enough)
    {
        if (boiler.status.relay)
        {
            stopBoiler(STOP_REASON.WARM_ENOUGH);
        }

        logInfo("Boiler already warm enough");

        return;
    }

    if (isPeakLimitExceeded())
    {
        logWarning("Peak limit exceeded");

        if (boiler.status.relay)
        {
            startRestartDelay();

            stopBoiler(STOP_REASON.PEAK_LIMIT);
        }
        else if (updateLastStopReason(STOP_REASON.PEAK_LIMIT))
        {
            publishStatus();
        }

        return;
    }

    startBoiler();
}

//-----------------------------------------------------------------------------

function startBoiler()
{
    if (boiler.status.relay)
    {
        return;
    }

    boiler.status.runtime = 0;

    boiler.status.starts_today++;

    boiler.status.total_starts++;

    boiler.status.last_start = isoTimestamp();

    logInfo("Boiler started");

    savePersistentData();

    relayOn();
}

//-----------------------------------------------------------------------------

function stopBoiler(reason)
{
    if (!boiler.status.relay)
    {
        if (updateLastStopReason(reason))
        {
            publishStatus();
        }

        return;
    }

    boiler.status.runtime = 0;

    updateLastStopReason(reason);

    if (reason !== STOP_REASON.WARM_ENOUGH)
    {
        startStopHold();
    }

    logInfo("Boiler stopped (" + reason + ")");

    savePersistentData();

    relayOff();
}

/******************************************************************************
 *
 * Boiler Controller Firmware (BCF)
 *
 * File        : 115_warm_detection.js
 * Description : Warm enough detection
 *
 ******************************************************************************/

function resetWarmEnough()
{
    if (!boiler.status.warm_enough)
    {
        return;
    }

    boiler.status.warm_enough = false;

    boiler.status.warm_enough_since = "";

    logInfo("Warm enough flag reset");

    savePersistentData();

    publishStatus();
}

//-----------------------------------------------------------------------------

function markWarmEnough()
{
    boiler.status.warm_enough = true;

    boiler.status.warm_enough_since = isoTimestamp();

    logInfo("Boiler warm enough detected");
}

//-----------------------------------------------------------------------------

function isWarmEnoughDetected()
{
    if (!boiler.status.relay)
    {
        return false;
    }

    if (boiler.status.runtime < CONFIG.WARMUP_MIN_RUNTIME)
    {
        return false;
    }

    if (boiler.energy.boiler_power <= 0)
    {
        return false;
    }

    return boiler.energy.house_power < boiler.energy.boiler_power;
}

//-----------------------------------------------------------------------------

function checkWarmEnough()
{
    if (!isWarmEnoughDetected())
    {
        return false;
    }

    markWarmEnough();

    stopBoiler(STOP_REASON.WARM_ENOUGH);

    return true;
}

/******************************************************************************
 *
 * Boiler Controller Firmware (BCF)
 *
 * File        : 120_runtime.js
 * Description : Runtime manager
 *
 ******************************************************************************/

function systemTimerTask()
{
    syncRelayState();

    checkDailyStatisticsReset();

    checkControllerWatchdog();

    updateBootDelay();

    updateStopHold();

    if (boiler.status.relay)
    {
        boiler.status.runtime++;

        boiler.status.total_runtime++;

        if (checkWarmEnough())
        {
            return;
        }

        if (boiler.status.runtime >= boiler.config.max_runtime)
        {
            logWarning("Maximum runtime exceeded");

            startRestartDelay();

            stopBoiler(STOP_REASON.MAX_RUNTIME);
        }
    }

    if (boiler.status.restart_delay_active)
    {
        if (boiler.status.relay)
        {
            relayOff();
        }

        boiler.status.restart_remaining--;

        if (boiler.status.restart_remaining <= 0)
        {
            boiler.status.restart_delay_active = false;

            boiler.status.restart_remaining = 0;

            logInfo("Restart delay expired");

            publishStatus();

            evaluateController();
        }
    }
}

//-----------------------------------------------------------------------------

function checkControllerWatchdog()
{
    if (boiler.status.last_controller_seen === 0)
    {
        return;
    }

    if (!boiler.status.controller_online)
    {
        return;
    }

    if ((timestampMs() - boiler.status.last_controller_seen) <= CONFIG.CONTROLLER_TIMEOUT)
    {
        return;
    }

    boiler.status.controller_online = false;

    boiler.status.watchdog = false;

    logWarning("Controller offline");

    publishStatus();
}

/******************************************************************************
 *
 * Boiler Controller Firmware (BCF)
 *
 * File        : 125_watchdog.js
 * Description : Software watchdog and diagnostics
 *
 ******************************************************************************/

function updateLastMqttSeen()
{
    boiler.status.last_mqtt_seen = isoTimestamp();

    boiler.status.last_mqtt_seen_ms = timestampMs();
}

//-----------------------------------------------------------------------------

function updateControllerAge()
{
    if (boiler.status.last_controller_seen === 0)
    {
        boiler.status.last_controller_age = 0;

        return;
    }

    boiler.status.last_controller_age = Math.round(
        (timestampMs() - boiler.status.last_controller_seen) / 1000
    );
}

//-----------------------------------------------------------------------------

function updateDiagnostics(status)
{
    if (status.sys)
    {
        boiler.status.uptime = status.sys.uptime || 0;

        boiler.status.ram_free = status.sys.ram_free || 0;
    }

    if (status.wifi)
    {
        boiler.status.wifi_rssi = status.wifi.rssi || 0;

        boiler.status.wifi_connected =
            status.wifi.status === "got ip" ||
            status.wifi.status === "connected";
    }

    if (status.mqtt)
    {
        boiler.status.mqtt_connected =
            status.mqtt.connected === true;

        if (boiler.status.mqtt_connected)
        {
            updateLastMqttSeen();
        }
    }

    boiler.status.script_version = FIRMWARE.VERSION;

    updateControllerAge();
}

//-----------------------------------------------------------------------------

function updateDeviceInfo(info)
{
    boiler.status.firmware_version =
        info.ver ||
        info.fw_id ||
        info.version ||
        boiler.status.firmware_version;

    boiler.status.script_version = FIRMWARE.VERSION;
}

//-----------------------------------------------------------------------------

function publishWatchdogStatus()
{
    evaluateSoftwareWatchdog();

    publishStatus();
}

//-----------------------------------------------------------------------------

function watchdogProblemReason()
{
    if (!boiler.status.wifi_connected)
    {
        return "wifi disconnected";
    }

    if (!boiler.status.mqtt_connected)
    {
        return "mqtt disconnected";
    }

    return "";
}

//-----------------------------------------------------------------------------

function resetWatchdogProblem()
{
    if (boiler.status.watchdog_problem_since === 0)
    {
        return;
    }

    boiler.status.watchdog_problem_since = 0;

    boiler.status.watchdog_reason = "";

    logInfo("Watchdog healthy");
}

//-----------------------------------------------------------------------------

function canWatchdogReboot()
{
    let uptime = boiler.status.uptime;

    if (uptime <= 0 && boiler.status.watchdog_problem_since > 0)
    {
        uptime = Math.round(
            (timestampMs() - boiler.status.watchdog_problem_since) / 1000
        );
    }

    if (uptime < CONFIG.WATCHDOG_MIN_UPTIME)
    {
        return false;
    }

    if (boiler.status.last_watchdog_reboot === 0)
    {
        return true;
    }

    return (timestampMs() - boiler.status.last_watchdog_reboot) >
        CONFIG.WATCHDOG_REBOOT_GAP;
}

//-----------------------------------------------------------------------------

function performWatchdogReboot(reason)
{
    boiler.status.watchdog_reboots++;

    boiler.status.watchdog_reason = reason;

    boiler.status.last_watchdog_reboot = timestampMs();

    savePersistentData();

    publishStatus();

    logError("Watchdog reboot: " + reason);

    Shelly.call("Shelly.Reboot");
}

//-----------------------------------------------------------------------------

function evaluateSoftwareWatchdog()
{
    let reason = watchdogProblemReason();

    handleWatchdogReason(reason);
}

//-----------------------------------------------------------------------------

function handleWatchdogReason(reason)
{
    if (reason === "")
    {
        resetWatchdogProblem();

        return;
    }

    if (boiler.status.watchdog_problem_since === 0)
    {
        boiler.status.watchdog_problem_since = timestampMs();

        boiler.status.watchdog_reason = reason;

        logWarning("Watchdog problem: " + reason);

        return;
    }

    boiler.status.watchdog_reason = reason;

    if ((timestampMs() - boiler.status.watchdog_problem_since) <
        CONFIG.WATCHDOG_TIMEOUT)
    {
        return;
    }

    if (!canWatchdogReboot())
    {
        logWarning("Watchdog reboot suppressed: " + reason);

        return;
    }

    performWatchdogReboot(reason);
}

//-----------------------------------------------------------------------------

function watchdogTask()
{
    Shelly.call(
        "Shelly.GetStatus",
        {},
        function(result, error_code, error_message)
        {
            if (error_code !== 0)
            {
                handleWatchdogReason(
                    "diagnostics failed: " + error_message
                );

                publishStatus();

                return;
            }

            updateDiagnostics(result);

            Shelly.call(
                "Shelly.GetDeviceInfo",
                {},
                function(info, info_error_code, info_error_message)
                {
                    if (info_error_code === 0)
                    {
                        updateDeviceInfo(info);
                    }
                    else
                    {
                        logWarning(
                            "Device info failed: " +
                            info_error_message
                        );
                    }

                    publishWatchdogStatus();
                }
            );
        }
    );
}

/******************************************************************************
 *
 * Boiler Controller Firmware (BCF)
 *
 * File        : 130_heartbeat.js
 * Description : Heartbeat manager
 *
 ******************************************************************************/

function heartbeatTask()
{
    watchdogTask();
}

/******************************************************************************
 *
 * Boiler Controller Firmware (BCF)
 *
 * File        : 140_main.js
 * Description : Main entry point
 *
 ******************************************************************************/

function main()
{
    logInfo("========================================");

    logInfo(FIRMWARE.NAME);

    logInfo("Version : " + FIRMWARE.VERSION);

    logInfo("========================================");

    loadPersistentData();

    boiler.status.firmware_boots++;

    savePersistentData();

    forceRelayOff();

    startBootDelay();

    mqttInit();

    checkDailyStatisticsReset();

    publishStatus();

    Timer.set(
        CONFIG.WATCHDOG_INTERVAL,
        true,
        heartbeatTask
    );

    Timer.set(
        CONFIG.RUNTIME_INTERVAL,
        true,
        systemTimerTask
    );

    setState(STATE.IDLE);

    logInfo("Startup completed");
}

//-----------------------------------------------------------------------------

main();