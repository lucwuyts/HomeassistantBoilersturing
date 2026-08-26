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

    boiler.status.starts_today_date =
        persistent.starts_today_date || "";

    boiler.status.total_starts = persistent.total_starts;

    boiler.status.total_runtime = persistent.total_runtime;

    boiler.status.warm_enough = persistent.warm_enough === true;

    boiler.status.warm_enough_since =
        persistent.warm_enough_since || "";

    boiler.status.watchdog_reboots = persistent.watchdog_reboots || 0;

    boiler.status.watchdog_reason = persistent.watchdog_reason || "";

    boiler.status.last_watchdog_reboot =
        persistent.last_watchdog_reboot || 0;

    boiler.status.script_error_count =
        persistent.script_error_count || 0;

    boiler.status.last_script_error =
        persistent.last_script_error || "";

    boiler.status.last_script_error_context =
        persistent.last_script_error_context || "";

    boiler.status.last_script_error_time =
        persistent.last_script_error_time || "";
}

//-----------------------------------------------------------------------------

function copyStatusToPersistent()
{
    persistent.firmware_boots = boiler.status.firmware_boots;

    persistent.starts_today = boiler.status.starts_today;

    persistent.starts_today_date = boiler.status.starts_today_date;

    persistent.total_starts = boiler.status.total_starts;

    persistent.total_runtime = boiler.status.total_runtime;

    persistent.warm_enough = boiler.status.warm_enough;

    persistent.warm_enough_since = boiler.status.warm_enough_since;

    persistent.watchdog_reboots = boiler.status.watchdog_reboots;

    persistent.watchdog_reason = boiler.status.watchdog_reason;

    persistent.last_watchdog_reboot =
        boiler.status.last_watchdog_reboot;

    persistent.script_error_count =
        boiler.status.script_error_count;

    persistent.last_script_error =
        boiler.status.last_script_error;

    persistent.last_script_error_context =
        boiler.status.last_script_error_context;

    persistent.last_script_error_time =
        boiler.status.last_script_error_time;
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

    log(DEBUG.TRACE, "[TRACE] ", "Persistent data saved");
}

//-----------------------------------------------------------------------------

function resetStatistics()
{
    boiler.status.starts_today = 0;

    boiler.status.starts_today_date = dateKey();

    boiler.status.total_starts = 0;

    boiler.status.total_runtime = 0;

    savePersistentData();

    log(DEBUG.INFO, "[INFO] ", "Statistics reset");
}

//-----------------------------------------------------------------------------

function resetDailyStatistics()
{
    boiler.status.starts_today = 0;

    boiler.status.starts_today_date = dateKey();

    savePersistentData();

    log(DEBUG.INFO, "[INFO] ", "Daily statistics reset");
}

//-----------------------------------------------------------------------------

function checkDailyStatisticsReset()
{
    let today = dateKey();

    if (today === "")
    {
        return;
    }

    if (boiler.status.starts_today_date === "")
    {
        resetDailyStatistics();

        return;
    }

    if (boiler.status.starts_today_date === today)
    {
        return;
    }

    resetDailyStatistics();

    publishStatus();
}

//-----------------------------------------------------------------------------

function loadPersistentData()
{
    let json = Script.storage.getItem(STORAGE.KEY);

    if (json === null)
    {
        log(DEBUG.INFO, "[INFO] ", "No persistent data found");

        savePersistentData();

        return;
    }

    try
    {
        persistent = JSON.parse(json);
    }
    catch(error)
    {
        log(DEBUG.WARNING, "[WARNING] ", "Persistent data corrupted");

        persistent =
        {
            version         : STORAGE.VERSION,

            firmware_boots  : 0,

            starts_today    : 0,

            starts_today_date : "",

            total_starts    : 0,

            total_runtime   : 0,

            warm_enough     : false,

            warm_enough_since : "",

            watchdog_reboots : 0,

            watchdog_reason : "",

            last_watchdog_reboot : 0,

            script_error_count : 0,

            last_script_error : "",

            last_script_error_context : "",

            last_script_error_time : ""
        };

        savePersistentData();

        return;
    }

    if (persistent.version !== STORAGE.VERSION)
    {
        log(DEBUG.WARNING, "[WARNING] ", "Persistent data version mismatch");
    }

    copyPersistentToStatus();

    log(DEBUG.INFO, "[INFO] ", "Persistent data loaded");

    log(DEBUG.INFO, "[INFO] ", "Firmware boots : " + boiler.status.firmware_boots);

    log(DEBUG.INFO, "[INFO] ", "Starts today   : " + boiler.status.starts_today);

    log(DEBUG.INFO, "[INFO] ", "Total starts   : " + boiler.status.total_starts);

    log(DEBUG.INFO, "[INFO] ", "Total runtime  : " + boiler.status.total_runtime + " s");
}
