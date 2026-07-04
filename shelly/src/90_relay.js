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
