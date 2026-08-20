/******************************************************************************
 *
 * Boiler Controller Firmware (BCF)
 *
 * File        : 90_relay.js
 * Description : Relay manager
 *
 ******************************************************************************/

let relaySyncInProgress = false;

let relayCommandInProgress = false;

let relayCommandTarget = null;

let relayPendingTarget = null;

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
    if (relaySyncInProgress || relayCommandInProgress)
    {
        return;
    }

    relaySyncInProgress = true;

    try
    {
        Shelly.call(
            "Switch.Get",
            {
                id : CONFIG.RELAY_ID
            },
            safeCallback(
                "Switch.Get",
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
            )
        );
    }
    catch(error)
    {
        relaySyncInProgress = false;

        recordScriptError("Switch.Get call", error);
    }
}

//-----------------------------------------------------------------------------

function setRelay(on)
{
    if (relayCommandInProgress)
    {
        if (relayCommandTarget === on || relayPendingTarget === on)
        {
            return;
        }

        relayPendingTarget = on;

        logInfo("Relay switch " + (on ? "ON" : "OFF") + " queued");

        return;
    }

    relayCommandInProgress = true;

    relayCommandTarget = on;

    try
    {
        Shelly.call(
            "Switch.Set",
            {
                id : CONFIG.RELAY_ID,
                on : on
            },
            safeCallback(
                "Switch.Set",
                function(result, error_code, error_message)
                {
                    let pending = relayPendingTarget;

                    relayCommandInProgress = false;

                    relayCommandTarget = null;

                    relayPendingTarget = null;

                    if (error_code !== 0)
                    {
                        logError("Relay switch failed: " + error_message);

                        publishStatus();
                    }
                    else
                    {
                        applyRelayState(on, "controller");

                        logInfo("Relay switched " + (on ? "ON" : "OFF"));
                    }

                    if (pending !== null && pending !== boiler.status.relay)
                    {
                        setRelay(pending);
                    }
                }
            )
        );
    }
    catch(error)
    {
        relayCommandInProgress = false;

        relayCommandTarget = null;

        relayPendingTarget = null;

        recordScriptError("Switch.Set call", error);
    }
}

//-----------------------------------------------------------------------------

function relayOn()
{
    if (boiler.status.relay ||
        relayCommandTarget === true ||
        relayPendingTarget === true)
    {
        return;
    }

    logInfo("Relay switch ON requested");

    setRelay(true);
}

//-----------------------------------------------------------------------------

function relayOff()
{
    if ((!boiler.status.relay && relayCommandTarget !== true) ||
        relayCommandTarget === false ||
        relayPendingTarget === false)
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
