/******************************************************************************
 *
 * Boiler Controller Firmware (BCF)
 *
 * File        : 140_main.js
 * Description : Main entry point
 *
 ******************************************************************************/

function main()
{
    log(DEBUG.INFO, "[INFO] ", "========================================");

    log(DEBUG.INFO, "[INFO] ", FIRMWARE.NAME);

    log(DEBUG.INFO, "[INFO] ", "Version : " + FIRMWARE.VERSION);

    log(DEBUG.INFO, "[INFO] ", "========================================");

    loadPersistentData();

    boiler.status.firmware_boots++;

    savePersistentData();

    forceRelayOff();

    startBootDelay();

    mqttInit();

    checkDailyStatisticsReset();

    publishStatus();

    Timer.set(
        CONFIG.WATCHDOG_INTERVAL,
        true,
        function()
        {
            safeCall("heartbeatTask", watchdogTask);
        }
    );

    Timer.set(
        CONFIG.RUNTIME_INTERVAL,
        true,
        function()
        {
            safeCall("systemTimerTask", systemTimerTask);
        }
    );

    setState(STATE.IDLE);

    log(DEBUG.INFO, "[INFO] ", "Startup completed");
}

//-----------------------------------------------------------------------------

safeCall("main", main);
