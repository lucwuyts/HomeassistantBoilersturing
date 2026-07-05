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

        startRestartDelay();

        stopBoiler(STOP_REASON.PEAK_LIMIT);

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
