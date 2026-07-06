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
