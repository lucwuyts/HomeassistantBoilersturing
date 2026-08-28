# Changelog

## 2026.08.28-02
- Shelly build-output wordt geminified om minder scriptgeheugen te gebruiken; de bronbestanden blijven leesbaar.
- `Switch.GetStatus` polling is vervangen door `Shelly.addStatusHandler`, zodat relaiswijzigingen eventgedreven verwerkt worden in plaats van via getimede RPC-queries.
- `Shelly.GetStatus` diagnosepolling is beperkt tot 1 keer per 5 minuten; de minuut-heartbeat blijft publiceren met cached diagnosewaarden zodat Home Assistant de Shelly nog kan bewaken.
- `Shelly.GetDeviceInfo` wordt niet meer elke heartbeat opgevraagd zodra de firmware-info bekend is.
- `heartbeatTask`, `safeCall` en `safeCallback` wrappers zijn verwijderd; foutafhandeling gebeurt nu direct op timer- en callbackgrenzen om de Shelly JavaScript-callstack minder diep te maken.

## v0.1.0
- Basisarchitectuur opgezet
- Quarter Detector toegevoegd
- Boilerparameters opgesplitst
- Eerste controllerlogica

