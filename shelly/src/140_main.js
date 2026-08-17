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
    logInfo("========================================");

    logInfo(FIRMWARE.NAME);

    logInfo("Version : " + FIRMWARE.VERSION);

    logInfo("========================================");

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
            safeCall("heartbeatTask", heartbeatTask);
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

    logInfo("Startup completed");
}

//-----------------------------------------------------------------------------

safeCall("main", main);
