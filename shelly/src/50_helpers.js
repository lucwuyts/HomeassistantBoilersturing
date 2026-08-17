/******************************************************************************
 *
 * Boiler Controller Firmware (BCF)
 *
 * File        : 50_helpers.js
 * Description : Helper functions
 *
 ******************************************************************************/

function isoTimestamp()
{
    return new Date().toISOString();
}

//-----------------------------------------------------------------------------

function timestampMs()
{
    return new Date().getTime();
}

//-----------------------------------------------------------------------------

function twoDigits(value)
{
    if (value < 10)
    {
        return "0" + value;
    }

    return "" + value;
}

//-----------------------------------------------------------------------------

function dateKey()
{
    let now = new Date();

    let year = now.getFullYear();

    if (year < 2024)
    {
        return "";
    }

    return (
        year +
        "-" +
        twoDigits(now.getMonth() + 1) +
        "-" +
        twoDigits(now.getDate())
    );
}

//-----------------------------------------------------------------------------

let scriptErrorHandling = false;

//-----------------------------------------------------------------------------

function errorToText(error)
{
    if (error && error.message)
    {
        return "" + error.message;
    }

    return "" + error;
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
