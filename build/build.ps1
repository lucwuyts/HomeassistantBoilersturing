$files = @(
    "..\shelly\src\10_firmware.js",
    "..\shelly\src\20_constants.js",
    "..\shelly\src\30_objects.js",
    "..\shelly\src\40_logging.js",
    "..\shelly\src\50_helpers.js",
    "..\shelly\src\60_persistence.js",
    "..\shelly\src\70_mqtt.js",
    "..\shelly\src\80_state.js",
    "..\shelly\src\90_relay.js",
    "..\shelly\src\100_restart_delay.js",
    "..\shelly\src\105_boot_delay.js",
    "..\shelly\src\110_boiler.js",
    "..\shelly\src\115_warm_detection.js",
    "..\shelly\src\120_runtime.js",
    "..\shelly\src\125_watchdog.js",
    "..\shelly\src\130_heartbeat.js",
    "..\shelly\src\140_main.js"
)

$output = "..\build\boiler_controller.js"

Remove-Item $output -ErrorAction Ignore

foreach($f in $files)
{
    if (!(Test-Path $f))
    {
        throw "Missing source file: $f"
    }

    Get-Content $f |
        Add-Content $output

    if ($f -ne $files[-1])
    {
        Add-Content $output "`r`n"
    }
}

$content = Get-Content $output -Raw

Set-Content $output $content.TrimEnd() -NoNewline

Write-Host ""
Write-Host "Build completed."
Write-Host $output
