/******************************************************************************
 *
 * Boiler Controller Firmware (BCF)
 *
 * File        : 100_restart_delay.js
 * Description : Restart delay manager
 *
 ******************************************************************************/

function startRestartDelay()
{
    if (boiler.status.restart_delay_active)
    {
        return;
    }

    boiler.status.restart_delay_active = true;

    boiler.status.restart_remaining =
        boiler.config.restart_delay;

    logInfo(
        "Restart delay started (" +
        boiler.status.restart_remaining +
        " s)"
    );

    publishStatus();
}
