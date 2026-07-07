/******************************************************************************
 *
 * Boiler Controller Firmware (BCF)
 *
 * File        : 107_stop_hold.js
 * Description : Short anti-cycle hold after stop
 *
 ******************************************************************************/

function startStopHold()
{
    boiler.status.stop_hold_active = true;

    boiler.status.stop_hold_remaining = boiler.config.stop_hold;

    logInfo(
        "Stop hold started (" +
        boiler.status.stop_hold_remaining +
        " s)"
    );
}

//-----------------------------------------------------------------------------

function updateStopHold()
{
    if (!boiler.status.stop_hold_active)
    {
        return;
    }

    boiler.status.stop_hold_remaining--;

    if (boiler.status.stop_hold_remaining > 0)
    {
        return;
    }

    boiler.status.stop_hold_active = false;

    boiler.status.stop_hold_remaining = 0;

    logInfo("Stop hold expired");

    publishStatus();

    evaluateController();
}
