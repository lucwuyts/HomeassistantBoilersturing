param(
    [string] $Destination = $env:HA_PACKAGES_PATH
)

if ([string]::IsNullOrWhiteSpace($Destination))
{
    throw "Set HA_PACKAGES_PATH or pass -Destination with the Home Assistant packages path."
}

$source =
    Join-Path $PSScriptRoot "homeassistant\packages\*"

Copy-Item `
    $source `
    $Destination `
    -Recurse -Force
