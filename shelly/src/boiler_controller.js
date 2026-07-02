/******************************************************************************
 *
 * Boiler Controller Firmware (BCF)
 *
 * Version    : 0.1.0-alpha1
 * Hardware   : Shelly Pro 1
 * API        : v1
 *
 * Copyright (c) 2026
 * Luc Wuyts
 *
 ******************************************************************************/

//=============================================================================
// Firmware
//=============================================================================

const FIRMWARE =
{
    NAME        : "Boiler Controller Firmware",
    VERSION     : "0.1.0-alpha1",
    API         : 1
};

//=============================================================================
// Configuration
//=============================================================================

const CONFIG =
{
    HEARTBEAT_INTERVAL    : 60000,
    DEFAULT_MAX_RUNTIME   : 10800,
    DEBUG_LEVEL           : 2
};

//=============================================================================
// MQTT Topics
//=============================================================================

const TOPIC =
{
    CONTROLLER : "boiler/v1/controller",
    STATUS     : "boiler/v1/status"
};

//=============================================================================
// Enumerations
//=============================================================================

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
    WATCHDOG_TIMEOUT    : "Watchdog timeout",
    CONTROLLER_DISABLED : "Controller disabled"
};

//=============================================================================
// Boiler Object
//=============================================================================

let boiler =
{
    config :
    {
        heating_enabled : false,
        max_runtime     : CONFIG.DEFAULT_MAX_RUNTIME
    },

    status :
    {
        state           : STATE.BOOTING,
        relay           : false,
        runtime         : 0,
        starts_today    : 0,
        watchdog        : true,
        last_update     : ""
    }
};


//=============================================================================
// MQTT Message Handler
//=============================================================================

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

    if (!data.boiler.config)
    {
        logError("Missing config object");

        return;
    }

    for (let key in data.boiler.config)
    {
        if (boiler.config.hasOwnProperty(key))
        {
            boiler.config[key] = data.boiler.config[key];

            logInfo(
                key + " = " + boiler.config[key]
            );
        }
    }

    
    evaluateController();
}


//=============================================================================
// Logging
//=============================================================================

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

//=============================================================================
// Helpers
//=============================================================================

function isoTimestamp()
{
    return new Date().toISOString();
}

//=============================================================================
// MQTT
//=============================================================================

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

//=============================================================================
// State Manager
//=============================================================================

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


//=============================================================================
// Controller
//=============================================================================

function evaluateController()
{
    if (boiler.config.heating_enabled)
    {
        startBoiler();
    }
    else
    {
        stopBoiler(STOP_REASON.HEATING_NOT_ALLOWED);
    }
}

//=============================================================================
// Relay Manager
//=============================================================================

function relayOn()
{
    if (boiler.status.relay)
    {
        return;
    }

    boiler.status.relay = true;

    logInfo("Relay would switch ON (simulation)");

    publishStatus();
}

//-----------------------------------------------------------------------------

function relayOff()
{
    if (!boiler.status.relay)
    {
        return;
    }

    boiler.status.relay = false;

    logInfo("Relay would switch OFF (simulation)");

    publishStatus();
}


//=============================================================================
// Heating Manager
//=============================================================================
//=============================================================================
// Boiler Manager
//=============================================================================

function startBoiler()
{
    if (boiler.status.relay)
    {
        return;
    }

    boiler.status.runtime = 0;

    boiler.status.starts_today++;

    logInfo("Boiler started");

    relayOn();
}

//-----------------------------------------------------------------------------

function stopBoiler(reason)
{
    if (!boiler.status.relay)
    {
        return;
    }

    logInfo("Boiler stopped (" + reason + ")");

    relayOff();
}


//=============================================================================
// Heartbeat
//=============================================================================

function heartbeatTask()
{
    publishStatus();
}

//=============================================================================
// Main
//=============================================================================

function main()
{
    logInfo("========================================");
    logInfo(FIRMWARE.NAME);
    logInfo("Version : " + FIRMWARE.VERSION);
    logInfo("========================================");

    mqttInit();

    publishStatus();

    Timer.set(
        CONFIG.HEARTBEAT_INTERVAL,
        true,
        heartbeatTask
    );

    setState(STATE.IDLE);

    logInfo("Startup completed");
}

//=============================================================================

main();