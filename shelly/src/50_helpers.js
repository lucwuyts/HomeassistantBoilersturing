/******************************************************************************
 *
 * Boiler Controller Firmware (BCF)
 *
 * File        : 50_helpers.js
 * Description : Helper functions
 *
 ******************************************************************************/

let monotonicMs = 0;

let wallClockSeconds = 0;

//-----------------------------------------------------------------------------

function advanceClock(ms)
{
    monotonicMs += ms;
}

//-----------------------------------------------------------------------------

function syncClockFromStatus(status)
{
    if (!status || !status.sys)
    {
        return;
    }

    if (status.sys.uptime > 0)
    {
        monotonicMs = Math.round(status.sys.uptime * 1000);
    }

    if (status.sys.unixtime > 0)
    {
        wallClockSeconds = status.sys.unixtime;
    }
}

//-----------------------------------------------------------------------------

function isoTimestamp()
{
    return "" + timestampMs();
}

//-----------------------------------------------------------------------------

function timestampMs()
{
    return monotonicMs;
}

//-----------------------------------------------------------------------------

function dateKey()
{
    if (wallClockSeconds > 0)
    {
        return "" + Math.floor(wallClockSeconds / 86400);
    }

    return "" + Math.floor(timestampMs() / 86400000);
}

//-----------------------------------------------------------------------------

let scriptErrorHandling = false;

//-----------------------------------------------------------------------------

function errorToText(error)
{
    let text = "";

    if (error && error.message)
    {
        text = "" + error.message;
    }
    else
    {
        text = "" + error;
    }

    if (text.length > CONFIG.SCRIPT_ERROR_MAX_LENGTH)
    {
        return text.substr(0, CONFIG.SCRIPT_ERROR_MAX_LENGTH);
    }

    return text;
}

//-----------------------------------------------------------------------------

function recordScriptError(context, error)
{
    if (scriptErrorHandling)
    {
        logError("Nested script error in " + context + ": " + errorToText(error));

        return;
    }

    scriptErrorHandling = true;

    try
    {
        boiler.status.script_error_count++;

        boiler.status.last_script_error = errorToText(error);

        boiler.status.last_script_error_context = context;

        boiler.status.last_script_error_time = isoTimestamp();

        boiler.status.watchdog_reason = "script error: " + context;

        logError(
            "Script error in " +
            context +
            ": " +
            boiler.status.last_script_error
        );

        savePersistentData();

        try
        {
            publishStatus();
        }
        catch(publishError)
        {
            logError(
                "Status publish after script error failed: " +
                errorToText(publishError)
            );
        }

        if (boiler.status.script_error_count >=
            CONFIG.SCRIPT_ERROR_REBOOT_LIMIT &&
            canWatchdogReboot())
        {
            performWatchdogReboot("script error: " + context);
        }
    }
    finally
    {
        scriptErrorHandling = false;
    }
}

//-----------------------------------------------------------------------------

function safeCall(context, callback)
{
    try
    {
        callback();
    }
    catch(error)
    {
        recordScriptError(context, error);
    }
}

//-----------------------------------------------------------------------------

function safeCallback(context, callback)
{
    return function(a, b, c)
    {
        safeCall(
            context,
            function()
            {
                callback(a, b, c);
            }
        );
    };
}
