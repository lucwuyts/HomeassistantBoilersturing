/******************************************************************************
 *
 * Boiler Controller Firmware (BCF)
 *
 * File        : 40_logging.js
 * Description : Logging
 *
 ******************************************************************************/

function log(level, prefix, text)
{
    if (level > CONFIG.DEBUG_LEVEL)
    {
        return;
    }

    print(prefix + text);
}
