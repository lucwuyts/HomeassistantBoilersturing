# TODO

## Home Assistant

- [x] Boiler helpers
- [x] Energy quarter detector
- [x] MQTT publisher naar `boiler/v1/controller`
- [x] Energy-blok in MQTT payload
- [ ] Automations opschonen rond publicatiemomenten
- [ ] MQTT status van Shelly uitlezen in sensoren
- [ ] Dashboard/debugkaart

## Shelly

- [x] Broncode opgesplitst in modules
- [x] Buildscript met expliciete bestandslijst
- [x] MQTT publish/subscribe
- [x] JSON parsing
- [x] Runtime timer
- [x] Restart delay basis
- [x] Relay simulation
- [x] Heartbeat
- [x] Persistence Manager via `Script.storage`
- [ ] `boiler.energy` verwerken uit MQTT
- [ ] Piekbeveiliging op basis van `peak_margin`
- [ ] Watchdog
- [ ] Echte relaissturing
- [ ] Reset statistics

## Documentatie

- [x] Architectuur actualiseren
- [x] MQTT protocol actualiseren
- [x] State machine actualiseren
- [ ] Status payload exact afstemmen na Shelly energy-implementatie
