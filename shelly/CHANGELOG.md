2026.08.28-02
- Build-output geminified om minder Shelly scriptgeheugen te gebruiken.
- Relay polling via `Switch.GetStatus` verwijderd en vervangen door `Shelly.addStatusHandler`, zodat relaisstatuswijzigingen via Shelly statusnotificaties binnenkomen.
- Diagnosepolling via `Shelly.GetStatus` beperkt tot 1 keer per 5 minuten; de gewone heartbeat blijft elke minuut publiceren met cached status.
- `Shelly.GetDeviceInfo` wordt alleen nog opnieuw gevraagd zolang de firmware-info onbekend is.
- `heartbeatTask`, `safeCall` en `safeCallback` verwijderd om de callstack minder diep te maken; foutafhandeling staat nu direct in de timer- en callbackfuncties.

0.1.0-alpha1
- MQTT publish
- Heartbeat

0.1.0-alpha2
- MQTT subscribe
- JSON parser

0.1.0-alpha3
- Relay Manager (simulation)

0.1.0-alpha4
- Boiler Manager
- Stop reasons
