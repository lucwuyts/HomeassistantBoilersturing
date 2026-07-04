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
    if (boiler.status.relay)
    {
        boiler.status.runtime++;

        boiler.status.total_runtime++;

        if (boiler.status.runtime >= boiler.config.max_runtime)
        {
            logWarning("Maximum runtime exceeded");

            startRestartDelay();

            stopBoiler(STOP_REASON.MAX_RUNTIME);
        }
    }

    if (boiler.status.restart_delay_active)
    {
        boiler.status.restart_remaining--;

        if (boiler.status.restart_remaining <= 0)
        {
            boiler.status.restart_delay_active = false;

            boiler.status.restart_remaining = 0;

            logInfo("Restart delay expired");

            evaluateController();
        }
    }
}
