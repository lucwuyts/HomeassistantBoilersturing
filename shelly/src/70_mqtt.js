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

            log(DEBUG.TRACE, "[TRACE] ", label + "." + key + " = " + target[key]);
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
        log(DEBUG.INFO, "[INFO] ", "Controller online");
    }

    boiler.status.controller_online = true;

    boiler.status.watchdog = true;

    boiler.status.last_controller_update = "" + monotonicMs;

    boiler.status.last_controller_seen = monotonicMs;
}

//-----------------------------------------------------------------------------

function processControllerMessage(topic, message)
{
    log(DEBUG.INFO, "[INFO] ", "Controller message received");

    updateLastMqttSeen();

    let data;

    try
    {
        data = JSON.parse(message);
    }
    catch(error)
    {
        log(DEBUG.ERROR, "[ERROR] ", "Invalid JSON");

        return;
    }

    if (!data.boiler)
    {
        log(DEBUG.ERROR, "[ERROR] ", "Missing boiler object");

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
            log(DEBUG.ERROR, "[ERROR] ", "Missing config object");

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
    log(DEBUG.INFO, "[INFO] ", "MQTT framework initialized");

    MQTT.subscribe(
        TOPIC.CONTROLLER,
        function(topic, message)
        {
            try
            {
                processControllerMessage(topic, message);
            }
            catch(error)
            {
                recordScriptError("processControllerMessage", error);
            }
        }
    );

    log(DEBUG.INFO, "[INFO] ", "Subscribed to " + TOPIC.CONTROLLER);
}

//-----------------------------------------------------------------------------

function mqttPublish(topic, object)
{
    MQTT.publish(
        topic,
        JSON.stringify(object),
        1,
        false
    );
}

//-----------------------------------------------------------------------------

function publishStatus()
{
    boiler.status.last_update = "" + monotonicMs;

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

    log(DEBUG.TRACE, "[TRACE] ", "Status published");
}

