# Boiler Controller Roadmap

## v0.2 - Firmwarestructuur en MQTT basis

- [x] Shelly-broncode opsplitsen
- [x] Buildscript met vaste concateneervolgorde
- [x] MQTT controller topic
- [x] MQTT status topic
- [x] Persistence via `Script.storage`
- [x] HA payload uitbreiden met energy-metingen

## v0.3 - Lokale Shelly-controller

- [ ] `boiler.energy` opslaan in Shelly status/object
- [x] Piekbeveiliging op basis van voorspelde kwartierenergie
- [ ] Watchdog voor HA MQTT updates
- [ ] Stop reasons uitbreiden
- [ ] Statusbericht uitbreiden met energy en watchdogstatus

## v0.4 - Productietest

- [ ] Echte relaissturing op Shelly Pro 1
- [ ] Test zonder aangesloten boiler
- [ ] Test met boiler onder toezicht
- [ ] Dashboard en diagnose in Home Assistant

## v1.0 - Stabiele release

- [ ] Documentatie compleet
- [ ] Foutscenario's getest
- [ ] Release build reproduceerbaar
- [ ] Installatiehandleiding
