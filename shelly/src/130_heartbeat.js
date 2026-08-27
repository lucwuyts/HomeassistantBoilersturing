/******************************************************************************
 *
 * Boiler Controller Firmware (BCF)
 *
 * File        : 130_heartbeat.js
 * Description : Heartbeat manager
 *
 ******************************************************************************/

/*
 * Er staat bewust geen heartbeatTask() wrapper meer in dit bestand.
 *
 * De watchdog-timer in 140_main.js roept watchdogTask rechtstreeks aan via
 * safeCall("heartbeatTask", watchdogTask). Zo blijft de bestaande
 * error-context herkenbaar, maar vermijden we een extra functieaanroep op de
 * beperkte Shelly JavaScript callstack.
 */
