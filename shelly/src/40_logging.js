/******************************************************************************
 *
 * Boiler Controller Firmware (BCF)
 *
 * File        : 40_logging.js
 * Description : Logging
 *
 ******************************************************************************/

function log(level, text)
{
    if (level > CONFIG.DEBUG_LEVEL)
    {
        return;
    }

    let prefix = "";

    switch(level)
    {
        case DEBUG.ERROR:
            prefix = "[ERROR] ";
            break;

        case DEBUG.WARNING:
            prefix = "[WARNING] ";
            break;

        case DEBUG.INFO:
            prefix = "[INFO] ";
            break;

        default:
            prefix = "[TRACE] ";
            break;
    }

    print(isoTimestamp() + " " + prefix + text);
}

//-----------------------------------------------------------------------------

function logError(text)
{
    log(DEBUG.ERROR, text);
}

//-----------------------------------------------------------------------------

function logWarning(text)
{
    log(DEBUG.WARNING, text);
}

//-----------------------------------------------------------------------------

function logInfo(text)
{
    log(DEBUG.INFO, text);
}

//-----------------------------------------------------------------------------

function logTrace(text)
{
    log(DEBUG.TRACE, text);
}