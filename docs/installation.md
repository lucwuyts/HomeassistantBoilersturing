# Boiler Controller - Installatie en Release

## Home Assistant

Plaats deze packagebestanden onder de Home Assistant package-map voor de boilercontroller:

| Bestand | Doel |
| ------- | ---- |
| `boiler_parameters.yaml` | Instelbare parameters zoals boilervermogen, pieklimiet en timers |
| `templates.yaml` | Planning, kwartierberekening en diagnose-sensoren |
| `automations.yaml` | MQTT publicatie, warm-enough reset en Shelly offline alerts |
| `scripts.yaml` | MQTT payloads naar Shelly |
| `mqtt_status.yaml` | MQTT sensoren op basis van Shelly status |

Optionele Lovelace snippets:

| Bestand | Doel |
| ------- | ---- |
| `dashboard_debug_card.yaml` | Debugkaart voor status en diagnose |
| `dashboard_parameters_card.yaml` | Kaart om boilerparameters in te stellen |

## Vereiste Home Assistant entities

De package verwacht deze bestaande bronentities:

| Entity | Doel |
| ------ | ---- |
| `sensor.verbruik_boven_4` | Actueel totaal woningverbruik in W |
| `sensor.peak_current_average_quarterly_demand_2` | Lopende kwartiergemiddelde waarde in kW |
| `input_boolean.energy_new_quarter` | Puls bij start van een nieuw kwartier |
| `script.whatsapp_callmebot_checked_send` | Optionele WhatsApp alert voor Shelly offline/online |

Als de WhatsApp alert niet gebruikt wordt, verwijder of vervang dan de twee acties met `script.whatsapp_callmebot_checked_send` in `automations.yaml`.

## MQTT topics

| Topic | Richting | Retained |
| ----- | -------- | -------- |
| `boiler/v1/controller` | Home Assistant naar Shelly | ja voor configuratie |
| `boiler/v1/status` | Shelly naar Home Assistant | ja |

De MQTT broker draait extern. Home Assistant en Shelly moeten allebei met dezelfde broker verbonden zijn.

## Shelly build

Maak het Shelly script vanuit de projectmap:

```powershell
cd build
powershell -ExecutionPolicy Bypass -File .\build.ps1
```

Het resultaat staat in:

```text
build/boiler_controller.js
```

Upload dit volledige bestand als Shelly script. De buildversie gebruikt het formaat:

```text
YYYY.MM.DD-NN
```

## Controle na installatie

Controleer in Home Assistant:

- `sensor.shelly_boiler_script_version` toont de nieuwe buildversie.
- `sensor.shelly_boiler_state` wordt gevuld.
- `binary_sensor.shelly_boiler_relay` volgt het echte relais.
- `sensor.boiler_predicted_quarter_peak_w` en `sensor.boiler_quarter_energy_wh` blijven ook buiten superdal/nachtuur berekenen.
- `binary_sensor.boiler_shelly_offline` blijft `off` zolang Shelly heartbeat binnenkomt.

Controleer op MQTT:

- `boiler/v1/controller` bevat het laatste retained controllerbericht van Home Assistant.
- `boiler/v1/status` bevat het laatste retained heartbeat/statusbericht van Shelly.

## Release checklist

Voor een release:

1. YAML valideren of Home Assistant configuratiecheck uitvoeren.
2. `build/build.ps1` draaien.
3. `build/boiler_controller.js` uploaden naar Shelly.
4. Shelly script starten.
5. In Home Assistant controleren of de scriptversie, heartbeat en relaisstatus binnenkomen.
6. Dashboard controleren tijdens minstens een verwarmingscyclus.
