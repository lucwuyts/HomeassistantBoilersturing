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
    "..\shelly\src\107_stop_hold.js",
    "..\shelly\src\110_boiler.js",
    "..\shelly\src\115_warm_detection.js",
    "..\shelly\src\120_runtime.js",
    "..\shelly\src\125_watchdog.js",
    "..\shelly\src\130_heartbeat.js",
    "..\shelly\src\140_main.js"
)

$output = "..\build\boiler_controller.js"
$stateFile = "..\build\build_state.json"

function Remove-JsComments
{
    param(
        [string]$Source
    )

    $builder = [System.Text.StringBuilder]::new()
    $inString = $false
    $stringQuote = ""
    $escape = $false
    $inLineComment = $false
    $inBlockComment = $false

    for ($i = 0; $i -lt $Source.Length; $i++)
    {
        $char = $Source[$i]
        $next = if ($i + 1 -lt $Source.Length) { $Source[$i + 1] } else { [char]0 }

        if ($inLineComment)
        {
            if ($char -eq "`r" -or $char -eq "`n")
            {
                [void]$builder.Append($char)
                $inLineComment = $false
            }

            continue
        }

        if ($inBlockComment)
        {
            if ($char -eq "*" -and $next -eq "/")
            {
                $i++
                $inBlockComment = $false
            }

            continue
        }

        if ($inString)
        {
            [void]$builder.Append($char)

            if ($escape)
            {
                $escape = $false
            }
            elseif ($char -eq "\")
            {
                $escape = $true
            }
            elseif ($char -eq $stringQuote)
            {
                $inString = $false
                $stringQuote = ""
            }

            continue
        }

        if ($char -eq '"' -or $char -eq "'")
        {
            [void]$builder.Append($char)
            $inString = $true
            $stringQuote = $char
            continue
        }

        if ($char -eq "/" -and $next -eq "/")
        {
            $i++
            $inLineComment = $true
            continue
        }

        if ($char -eq "/" -and $next -eq "*")
        {
            $i++
            $inBlockComment = $true
            continue
        }

        [void]$builder.Append($char)
    }

    return $builder.ToString()
}

function Compress-JsWhitespace
{
    param(
        [string]$Source
    )

    $lines = @()

    foreach ($line in ($Source -split "\r?\n"))
    {
        $trimmed = $line.Trim()

        if ($trimmed -ne "")
        {
            $lines += $trimmed
        }
    }

    return ($lines -join "`n")
}

function ConvertTo-MinifiedJs
{
    param(
        [string]$Source
    )

    return Compress-JsWhitespace -Source (Remove-JsComments -Source $Source)
}

$today = Get-Date -Format "yyyy.MM.dd"
$compile = 1

if (Test-Path $stateFile)
{
    $state = Get-Content $stateFile -Raw | ConvertFrom-Json

    if ($state.date -eq $today)
    {
        $compile = [int]$state.compile + 1
    }
}

$buildVersion = "{0}-{1:D2}" -f $today, $compile

@{
    date = $today
    compile = $compile
    version = $buildVersion
} |
    ConvertTo-Json |
    Set-Content $stateFile

Remove-Item $output -ErrorAction Ignore

foreach($f in $files)
{
    if (!(Test-Path $f))
    {
        throw "Missing source file: $f"
    }

    $content = Get-Content $f -Raw

    $content = $content.TrimEnd()

    $content = $content.Replace(
        "__BUILD_VERSION__",
        $buildVersion
    )

    Add-Content $output $content -NoNewline

    if ($f -ne $files[-1])
    {
        Add-Content $output "`r`n"
    }
}

$content = Get-Content $output -Raw

$content = ConvertTo-MinifiedJs -Source $content

Set-Content $output $content.TrimEnd() -NoNewline

Write-Host ""
Write-Host "Build completed."
Write-Host $output
Write-Host "Version: $buildVersion"
Write-Host "Size: $((Get-Item $output).Length) bytes"
