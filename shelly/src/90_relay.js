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
