/******************************************************************************
 *
 * Boiler Controller Firmware (BCF)
 *
 * File        : 60_persistence.js
 * Description : Persistent storage
 *
 ******************************************************************************/

function copyPersistentToStatus()
{
    boiler.status.firmware_boots = persistent.firmware_boots;

    boiler.status.starts_today = persistent.starts_today;

    boiler.status.total_starts = persistent.total_starts;

    boiler.status.total_runtime = persistent.total_runtime;

    boiler.status.warm_enough = persistent.warm_enough === true;

    boiler.status.warm_enough_since =
        persistent.warm_enough_since || "";

    boiler.status.watchdog_reboots = persistent.watchdog_reboots || 0;

    boiler.status.watchdog_reason = persistent.watchdog_reason || "";

    boiler.status.last_watchdog_reboot =
        persistent.last_watchdog_reboot || 0;
}

//-----------------------------------------------------------------------------

function copyStatusToPersistent()
{
    persistent.firmware_boots = boiler.status.firmware_boots;

    persistent.starts_today = boiler.status.starts_today;

    persistent.total_starts = boiler.status.total_starts;

    persistent.total_runtime = boiler.status.total_runtime;

    persistent.warm_enough = boiler.status.warm_enough;

    persistent.warm_enough_since = boiler.status.warm_enough_since;

    persistent.watchdog_reboots = boiler.status.watchdog_reboots;

    persistent.watchdog_reason = boiler.status.watchdog_reason;

    persistent.last_watchdog_reboot =
        boiler.status.last_watchdog_reboot;
}

//-----------------------------------------------------------------------------

function savePersistentData()
{
    copyStatusToPersistent();

    persistent.version = STORAGE.VERSION;

    Script.storage.setItem(
        STORAGE.KEY,
        JSON.stringify(persistent)
    );

    logTrace("Persistent data saved");
}

//-----------------------------------------------------------------------------

function resetStatistics()
{
    boiler.status.starts_today = 0;

    boiler.status.total_starts = 0;

    boiler.status.total_runtime = 0;

    savePersistentData();

    logInfo("Statistics reset");
}

//-----------------------------------------------------------------------------

function loadPersistentData()
{
    let json = Script.storage.getItem(STORAGE.KEY);

    if (json === null)
    {
        logInfo("No persistent data found");

        savePersistentData();

        return;
    }

    try
    {
        persistent = JSON.parse(json);
    }
    catch(error)
    {
        logWarning("Persistent data corrupted");

        persistent =
        {
            version         : STORAGE.VERSION,

            firmware_boots  : 0,

            starts_today    : 0,

            total_starts    : 0,

            total_runtime   : 0,

            warm_enough     : false,

            warm_enough_since : "",

            watchdog_reboots : 0,

            watchdog_reason : "",

            last_watchdog_reboot : 0
        };

        savePersistentData();

        return;
    }

    if (persistent.version !== STORAGE.VERSION)
    {
        logWarning("Persistent data version mismatch");
    }

    copyPersistentToStatus();

    logInfo("Persistent data loaded");

    logInfo("Firmware boots : " + boiler.status.firmware_boots);

    logInfo("Starts today   : " + boiler.status.starts_today);

    logInfo("Total starts   : " + boiler.status.total_starts);

    logInfo("Total runtime  : " + boiler.status.total_runtime + " s");
}
