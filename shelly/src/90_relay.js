/******************************************************************************
 *
 * Boiler Controller Firmware (BCF)
 *
 * File        : 90_relay.js
 * Description : Relay manager
 *
 ******************************************************************************/

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

    log(DEBUG.INFO, "[INFO] ", "Relay state synced " + (on ? "ON" : "OFF") + " (" + source + ")");

    publishStatus();

    return true;
}

//-----------------------------------------------------------------------------

function handleRelayStatus(status)
{
    if (!status ||
        status.component !== ("switch:" + CONFIG.RELAY_ID) ||
        !status.delta ||
        typeof status.delta.output !== "boolean")
    {
        return;
    }

    if (applyRelayState(status.delta.output, "status"))
    {
        evaluateController();
    }
}

//-----------------------------------------------------------------------------

function readInitialRelayState()
{
    let status = Shelly.getComponentStatus("switch", CONFIG.RELAY_ID);

    if (!status || typeof status.output !== "boolean")
    {
        log(DEBUG.WARNING, "[WARNING] ", "Initial relay state unavailable");

        return;
    }

    applyRelayState(status.output, "initial");
}

//-----------------------------------------------------------------------------

function relayInit()
{
    try
    {
        readInitialRelayState();

        Shelly.addStatusHandler(
            safeCallback(
                "relayStatusHandler",
                handleRelayStatus
            )
        );

        log(DEBUG.INFO, "[INFO] ", "Relay status handler registered");
    }
    catch(error)
    {
        recordScriptError("Shelly.addStatusHandler relay", error);
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

        log(DEBUG.INFO, "[INFO] ", "Relay switch " + (on ? "ON" : "OFF") + " queued");

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
                        log(DEBUG.ERROR, "[ERROR] ", "Relay switch failed: " + error_message);

                        publishStatus();
                    }
                    else
                    {
                        applyRelayState(on, "controller");

                        log(DEBUG.INFO, "[INFO] ", "Relay switched " + (on ? "ON" : "OFF"));
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

    log(DEBUG.INFO, "[INFO] ", "Relay switch ON requested");

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

    log(DEBUG.INFO, "[INFO] ", "Relay switch OFF requested");

    setRelay(false);
}

//-----------------------------------------------------------------------------

function forceRelayOff()
{
    log(DEBUG.INFO, "[INFO] ", "Relay force OFF requested");

    setRelay(false);
}
