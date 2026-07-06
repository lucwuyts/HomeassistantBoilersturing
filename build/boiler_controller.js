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
    VERSION     : "0.2.0",
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

        controller_online      : false,

        controller_timeout     : CONFIG.CONTROLLER_TIMEOUT / 1000,

        last_controller_update : "",

        last_controller_seen   : 0,

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

    warm_enough_since : ""
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

    boiler.status.total_starts = persistent.total_starts;

    boiler.status.total_runtime = persistent.total_runtime;

    boiler.status.warm_enough = persistent.warm_enough === true;

    boiler.status.warm_enough_since =
        persistent.warm_enough_since || "";
}

//-----------------------------------------------------------------------------

function copyStatusToPersistent()
{
    persistent.firmware_boots = boiler.status.firmware_boots;

    persistent.starts_today = boiler.status.starts_today;

    persistent.total_starts = boiler.status.total_starts;

    persistent.total_runtime = boiler.status.total_runtime;

    persistent.warm_enough = boiler.status.warm_enough;

    persistent.warm_enough_since = boiler.status.warm_enough_since;
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

    boiler.status.total_starts = 0;

    boiler.status.total_runtime = 0;

    savePersistentData();

    logInfo("Statistics reset");
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

            total_starts    : 0,

            total_runtime   : 0,

            warm_enough     : false,

            warm_enough_since : ""
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

        publishStatus();

        return;
    }

    let heatingWasEnabled = boiler.config.heating_enabled;

    copyKnownFields(
        data.boiler.config,
        boiler.config,
        "config"
    );

    if (
        boiler.status.controller_config_received &&
        !heatingWasEnabled &&
        boiler.config.heating_enabled
    )
    {
        resetWarmEnough();
    }

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


/******************************************************************************
 *
 * Boiler Controller Firmware (BCF)
 *
 * File        : 90_relay.js
 * Description : Relay manager
 *
 ******************************************************************************/

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

            boiler.status.relay = on;

            logInfo("Relay switched " + (on ? "ON" : "OFF"));

            publishStatus();
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
 * File        : 110_boiler.js
 * Description : Boiler manager
 *
 ******************************************************************************/

function isPeakLimitExceeded()
{
    return boiler.energy.peak_margin < 0;
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

        return;
    }

    if (!boiler.config.heating_enabled)
    {
        stopBoiler(STOP_REASON.HEATING_NOT_ALLOWED);

        return;
    }

    if (boiler.status.warm_enough)
    {
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
        return;
    }

    boiler.status.runtime = 0;

    boiler.status.last_stop_reason = reason;

    boiler.status.last_stop = isoTimestamp();

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
    checkControllerWatchdog();

    updateBootDelay();

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
 * File        : 130_heartbeat.js
 * Description : Heartbeat manager
 *
 ******************************************************************************/

function heartbeatTask()
{
    publishStatus();
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

    publishStatus();

    Timer.set(
        CONFIG.HEARTBEAT_INTERVAL,
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


