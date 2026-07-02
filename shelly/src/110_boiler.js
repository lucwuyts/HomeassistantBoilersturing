/******************************************************************************
 *
 * Boiler Controller Firmware (BCF)
 *
 * File        : 110_boiler.js
 * Description : Boiler manager
 *
 ******************************************************************************/

function evaluateController()
{
    if (boiler.status.restart_delay_active)
    {
        logInfo("Restart delay active");

        return;
    }

    if (boiler.config.heating_enabled)
    {
        startBoiler();
    }
    else
    {
        stopBoiler(STOP_REASON.HEATING_NOT_ALLOWED);
    }
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

    boiler.status.last_start = isoTimestamp();

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

    boiler.status.runtime = 0;

    boiler.status.last_stop_reason = reason;

    boiler.status.last_stop = isoTimestamp();

    logInfo("Boiler stopped (" + reason + ")");

    relayOff();
}
