/******************************************************************************
 *
 * Boiler Controller Firmware (BCF)
 *
 * File        : 90_relay.js
 * Description : Relay manager
 *
 ******************************************************************************/

function relayOn()
{
    if (boiler.status.relay)
    {
        return;
    }

    boiler.status.relay = true;

    logInfo("Relay would switch ON (simulation)");

    publishStatus();
}

//-----------------------------------------------------------------------------

function relayOff()
{
    if (!boiler.status.relay)
    {
        return;
    }

    boiler.status.relay = false;

    logInfo("Relay would switch OFF (simulation)");

    publishStatus();
}
