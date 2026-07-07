/******************************************************************************
 *
 * Boiler Controller Firmware (BCF)
 *
 * File        : 120_runtime.js
 * Description : Runtime manager
 *
 ******************************************************************************/

function systemTimerTask()
{
    checkControllerWatchdog();

    updateBootDelay();

    updateStopHold();

    if (boiler.status.relay)
    {
        boiler.status.runtime++;

        boiler.status.total_runtime++;

        if (checkWarmEnough())
        {
            return;
        }

        if (boiler.status.runtime >= boiler.config.max_runtime)
        {
            logWarning("Maximum runtime exceeded");

            startRestartDelay();

            stopBoiler(STOP_REASON.MAX_RUNTIME);
        }
    }

    if (boiler.status.restart_delay_active)
    {
        if (boiler.status.relay)
        {
            relayOff();
        }

        boiler.status.restart_remaining--;

        if (boiler.status.restart_remaining <= 0)
        {
            boiler.status.restart_delay_active = false;

            boiler.status.restart_remaining = 0;

            logInfo("Restart delay expired");

            publishStatus();

            evaluateController();
        }
    }
}

//-----------------------------------------------------------------------------

function checkControllerWatchdog()
{
    if (boiler.status.last_controller_seen === 0)
    {
        return;
    }

    if (!boiler.status.controller_online)
    {
        return;
    }

    if ((timestampMs() - boiler.status.last_controller_seen) <= CONFIG.CONTROLLER_TIMEOUT)
    {
        return;
    }

    boiler.status.controller_online = false;

    boiler.status.watchdog = false;

    logWarning("Controller offline");

    publishStatus();
}
