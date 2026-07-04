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

    copyKnownFields(
        data.boiler.config,
        boiler.config,
        "config"
    );

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

