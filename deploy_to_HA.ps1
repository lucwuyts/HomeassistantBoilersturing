param(
    [string] $Destination = $env:HA_PACKAGES_PATH
)

$exitCode = 0

try
{
    if ([string]::IsNullOrWhiteSpace($Destination))
    {
        throw "Set HA_PACKAGES_PATH or pass -Destination with the Home Assistant packages path."
    }

    $source =
        Join-Path $PSScriptRoot "homeassistant\packages\*"

    Copy-Item `
        $source `
        $Destination `
        -Recurse -Force `
        -ErrorAction Stop

    Write-Host ""
    Write-Host "Home Assistant packages copied successfully." -ForegroundColor Green
    Write-Host "Destination: $Destination"
}
catch
{
    $exitCode = 1

    Write-Host ""
    Write-Host "Home Assistant package deployment failed." -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}
finally
{
    Write-Host ""
    Read-Host "Press Enter to close this window"
}

exit $exitCode
