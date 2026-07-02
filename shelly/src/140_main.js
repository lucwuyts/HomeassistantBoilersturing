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

    mqttInit();

    publishStatus();

    Timer.set(
        CONFIG.HEARTBEAT_INTERVAL,
        true,
        heartbeatTask
    );

    Timer.set(
        CONFIG.RUNTIME_INTERVAL,
        true,
        systemTimerTask
    );

    setState(STATE.IDLE);

    logInfo("Startup completed");
}

//-----------------------------------------------------------------------------

main();
