/******************************************************************************
 *
 * Boiler Controller Firmware (BCF)
 *
 * File        : 125_watchdog.js
 * Description : Software watchdog and diagnostics
 *
 ******************************************************************************/

function updateLastMqttSeen()
{
    boiler.status.last_mqtt_seen = "" + monotonicMs;

    boiler.status.last_mqtt_seen_ms = monotonicMs;
}

//-----------------------------------------------------------------------------

function updateControllerAge()
{
    if (boiler.status.last_controller_seen === 0)
    {
        boiler.status.last_controller_age = 0;

        return;
    }

    boiler.status.last_controller_age = Math.round(
        (monotonicMs - boiler.status.last_controller_seen) / 1000
    );
}

//-----------------------------------------------------------------------------

function updateDiagnostics(status)
{
    if (status.sys)
    {
        if (status.sys.uptime > 0)
        {
            monotonicMs = Math.round(status.sys.uptime * 1000);
        }

        if (status.sys.unixtime > 0)
        {
            wallClockSeconds = status.sys.unixtime;
        }

        boiler.status.uptime = status.sys.uptime || 0;

        boiler.status.ram_free = status.sys.ram_free || 0;
    }

    if (status.wifi)
    {
        boiler.status.wifi_rssi = status.wifi.rssi || 0;

        boiler.status.wifi_connected =
            status.wifi.status === "got ip" ||
            status.wifi.status === "connected";
    }

    if (status.mqtt)
    {
        boiler.status.mqtt_connected =
            status.mqtt.connected === true;

        if (boiler.status.mqtt_connected)
        {
            updateLastMqttSeen();
        }
    }

    boiler.status.script_version = FIRMWARE.VERSION;

    updateControllerAge();
}

//-----------------------------------------------------------------------------

function updateDeviceInfo(info)
{
    boiler.status.firmware_version =
        info.ver ||
        info.fw_id ||
        info.version ||
        boiler.status.firmware_version;

    boiler.status.script_version = FIRMWARE.VERSION;
}

//-----------------------------------------------------------------------------

function publishWatchdogStatus()
{
    evaluateSoftwareWatchdog();

    publishStatus();
}

//-----------------------------------------------------------------------------

function watchdogProblemReason()
{
    if (!boiler.status.wifi_connected)
    {
        return "wifi disconnected";
    }

    if (!boiler.status.mqtt_connected)
    {
        return "mqtt disconnected";
    }

    return "";
}

//-----------------------------------------------------------------------------

function resetWatchdogProblem()
{
    if (boiler.status.watchdog_problem_since === 0)
    {
        return;
    }

    boiler.status.watchdog_problem_since = 0;

    boiler.status.watchdog_reason = "";

    log(DEBUG.INFO, "[INFO] ", "Watchdog healthy");
}

//-----------------------------------------------------------------------------

function canWatchdogReboot()
{
    let uptime = boiler.status.uptime;

    if (uptime <= 0 && boiler.status.watchdog_problem_since > 0)
    {
        uptime = Math.round(
            (monotonicMs - boiler.status.watchdog_problem_since) / 1000
        );
    }

    if (uptime < CONFIG.WATCHDOG_MIN_UPTIME)
    {
        return false;
    }

    if (boiler.status.last_watchdog_reboot === 0)
    {
        return true;
    }

    if (monotonicMs < boiler.status.last_watchdog_reboot)
    {
        return true;
    }

    return (monotonicMs - boiler.status.last_watchdog_reboot) >
        CONFIG.WATCHDOG_REBOOT_GAP;
}

//-----------------------------------------------------------------------------

function performWatchdogReboot(reason)
{
    boiler.status.watchdog_reboots++;

    boiler.status.watchdog_reason = reason;

    boiler.status.last_watchdog_reboot = monotonicMs;

    savePersistentData();

    publishStatus();

    log(DEBUG.ERROR, "[ERROR] ", "Watchdog reboot: " + reason);

    Shelly.call("Shelly.Reboot");
}

//-----------------------------------------------------------------------------

function evaluateSoftwareWatchdog()
{
    let reason = watchdogProblemReason();

    handleWatchdogReason(reason);
}

//-----------------------------------------------------------------------------

function handleWatchdogReason(reason)
{
    if (reason === "")
    {
        resetWatchdogProblem();

        return;
    }

    if (boiler.status.watchdog_problem_since === 0)
    {
        boiler.status.watchdog_problem_since = monotonicMs;

        boiler.status.watchdog_reason = reason;

        log(DEBUG.WARNING, "[WARNING] ", "Watchdog problem: " + reason);

        return;
    }

    boiler.status.watchdog_reason = reason;

    if ((monotonicMs - boiler.status.watchdog_problem_since) <
        CONFIG.WATCHDOG_TIMEOUT)
    {
        return;
    }

    if (!canWatchdogReboot())
    {
        log(DEBUG.WARNING, "[WARNING] ", "Watchdog reboot suppressed: " + reason);

        return;
    }

    performWatchdogReboot(reason);
}

//-----------------------------------------------------------------------------

function watchdogTask()
{
    Shelly.call(
        "Shelly.GetStatus",
        {},
        safeCallback(
            "Shelly.GetStatus",
            function(result, error_code, error_message)
            {
                if (error_code !== 0)
                {
                    handleWatchdogReason(
                        "diagnostics failed: " + error_message
                    );

                    publishStatus();

                    return;
                }

                updateDiagnostics(result);

                Shelly.call(
                    "Shelly.GetDeviceInfo",
                    {},
                    safeCallback(
                        "Shelly.GetDeviceInfo",
                        function(info, info_error_code, info_error_message)
                        {
                            if (info_error_code === 0)
                            {
                                updateDeviceInfo(info);
                            }
                            else
                            {
                                log(DEBUG.WARNING, "[WARNING] ",
                                    "Device info failed: " +
                                    info_error_message
                                );
                            }

                            publishWatchdogStatus();
                        }
                    )
                );
            }
        )
    );
}
