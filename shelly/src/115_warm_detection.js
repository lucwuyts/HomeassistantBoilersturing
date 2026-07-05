/******************************************************************************
 *
 * Boiler Controller Firmware (BCF)
 *
 * File        : 115_warm_detection.js
 * Description : Warm enough detection
 *
 ******************************************************************************/

function resetWarmEnough()
{
    if (!boiler.status.warm_enough)
    {
        return;
    }

    boiler.status.warm_enough = false;

    boiler.status.warm_enough_since = "";

    logInfo("Warm enough flag reset");

    savePersistentData();

    publishStatus();
}

//-----------------------------------------------------------------------------

function markWarmEnough()
{
    boiler.status.warm_enough = true;

    boiler.status.warm_enough_since = isoTimestamp();

    logInfo("Boiler warm enough detected");
}

//-----------------------------------------------------------------------------

function isWarmEnoughDetected()
{
    if (!boiler.status.relay)
    {
        return false;
    }

    if (boiler.status.runtime < CONFIG.WARMUP_MIN_RUNTIME)
    {
        return false;
    }

    if (boiler.energy.boiler_power <= 0)
    {
        return false;
    }

    return boiler.energy.house_power < boiler.energy.boiler_power;
}

//-----------------------------------------------------------------------------

function checkWarmEnough()
{
    if (!isWarmEnoughDetected())
    {
        return false;
    }

    markWarmEnough();

    stopBoiler(STOP_REASON.WARM_ENOUGH);

    return true;
}
