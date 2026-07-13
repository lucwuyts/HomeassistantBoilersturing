# Boiler Controller Roadmap

## v0.2 - Firmwarestructuur en MQTT basis

- [x] Shelly-broncode opsplitsen
- [x] Buildscript met vaste concateneervolgorde
- [x] MQTT controller topic
- [x] MQTT status topic
- [x] Persistence via `Script.storage`
- [x] HA payload uitbreiden met energy-metingen

## v0.3 - Lokale Shelly-controller

- [x] `boiler.energy` opslaan in Shelly status/object
- [x] Piekbeveiliging op basis van voorspelde kwartierenergie
- [x] Watchdog voor HA MQTT updates
- [x] Stop reasons uitbreiden
- [x] Statusbericht uitbreiden met energy en watchdogstatus

## v0.4 - Productietest

- [x] Echte relaissturing op Shelly Pro 1
- [x] Test zonder aangesloten boiler
- [x] Test met boiler onder toezicht
- [x] Dashboard en diagnose in Home Assistant

## v1.0 - Stabiele release

- [ ] Documentatie compleet
- [ ] Foutscenario's getest
- [ ] Release build reproduceerbaar
- [x] Installatiehandleiding
