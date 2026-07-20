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
