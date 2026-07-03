# Shelly Boiler Controller Firmware

## Doel

Firmware voor Shelly Pro 1 Gen2 die de elektrische boiler lokaal en veilig aanstuurt.

Shelly is de controller. Home Assistant stuurt alleen configuratie en energiemetingen via MQTT.

## Build

Bronbestanden staan in `shelly/src/` en worden door `build/build.ps1` in vaste volgorde samengevoegd tot:

```text
build/boiler_controller.js
```

Er wordt geen bundler, npm, import, module of TypeScript gebruikt.

## Modules

| Bestand | Functie |
| ------- | ------- |
| `10_firmware.js` | Firmwaregegevens |
| `20_constants.js` | Constants en enums |
| `30_objects.js` | Globale objecten |
| `40_logging.js` | Logging |
| `50_helpers.js` | Helpers |
| `60_persistence.js` | `Script.storage` persistentie |
| `70_mqtt.js` | MQTT subscribe/publish |
| `80_state.js` | State manager |
| `90_relay.js` | Relay manager |
| `100_restart_delay.js` | Restart delay |
| `110_boiler.js` | Boiler manager |
| `120_runtime.js` | Runtime timer |
| `130_heartbeat.js` | Heartbeat |
| `140_main.js` | Entry point |

## Nog te implementeren

- `boiler.energy` uit MQTT verwerken;
- lokale piekbeveiliging op basis van `peak_margin`;
- watchdog;
- echte relaissturing;
- reset statistics.
