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
    let maxEnergy =
        boiler.energy.quarter_max_energy_wh;

    let predictedEnergy =
        boiler.energy.predicted_with_boiler_wh;

    let quarterEnergy =
        boiler.energy.quarter_energy_wh;

    let latestSafeOff =
        boiler.energy.latest_safe_off_seconds;

    if (maxEnergy <= 0)
    {
        return boiler.energy.peak_margin < 0;
    }

    if (predictedEnergy <= 0)
    {
        return boiler.energy.peak_margin < 0;
    }

    if (quarterEnergy >= maxEnergy)
    {
        return true;
    }

    if (latestSafeOff > 0)
    {
        return false;
    }

    if (!boiler.status.relay)
    {
        return true;
    }

    return boiler.status.runtime >= boiler.config.peak_min_on_seconds;
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

        forceRelayOff();

        return;
    }

    if (boiler.status.stop_hold_active)
    {
        logInfo("Stop hold active");

        return;
    }

    if (!boiler.config.heating_enabled)
    {
        stopBoiler(STOP_REASON.HEATING_NOT_ALLOWED);

        return;
    }

    if (boiler.status.warm_enough)
    {
        if (boiler.status.relay)
        {
            stopBoiler(STOP_REASON.WARM_ENOUGH);
        }

        logInfo("Boiler already warm enough");

        return;
    }

    if (isPeakLimitExceeded())
    {
        logWarning("Peak limit exceeded");

        if (boiler.status.relay)
        {
            startRestartDelay();

            stopBoiler(STOP_REASON.PEAK_LIMIT);
        }
        else if (updateLastStopReason(STOP_REASON.PEAK_LIMIT))
        {
            publishStatus();
        }

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
        if (updateLastStopReason(reason))
        {
            publishStatus();
        }

        return;
    }

    boiler.status.runtime = 0;

    updateLastStopReason(reason);

    if (reason !== STOP_REASON.WARM_ENOUGH)
    {
        startStopHold();
    }

    logInfo("Boiler stopped (" + reason + ")");

    savePersistentData();

    relayOff();
}
