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
