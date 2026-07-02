/******************************************************************************
 *
 * Boiler Controller Firmware (BCF)
 *
 * File        : 80_state.js
 * Description : State manager
 *
 ******************************************************************************/

function setState(newState)
{
    if (boiler.status.state === newState)
    {
        return;
    }

    boiler.status.state = newState;

    publishStatus();

    logInfo("State -> " + newState);
}
