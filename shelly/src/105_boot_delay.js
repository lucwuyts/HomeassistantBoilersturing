/******************************************************************************
 *
 * Boiler Controller Firmware (BCF)
 *
 * File        : 105_boot_delay.js
 * Description : Boot delay manager
 *
 ******************************************************************************/

function startBootDelay()
{
    boiler.status.boot_delay_active = true;

    boiler.status.boot_delay_remaining = CONFIG.BOOT_DELAY;

    log(DEBUG.INFO, "[INFO] ",
        "Boot delay started (" +
        boiler.status.boot_delay_remaining +
        " s)"
    );
}

//-----------------------------------------------------------------------------

function updateBootDelay()
{
    if (!boiler.status.boot_delay_active)
    {
        return;
    }

    boiler.status.boot_delay_remaining--;

    if (boiler.status.boot_delay_remaining > 0)
    {
        return;
    }

    boiler.status.boot_delay_active = false;

    boiler.status.boot_delay_remaining = 0;

    log(DEBUG.INFO, "[INFO] ", "Boot delay expired");

    publishStatus();

    evaluateController();
}
