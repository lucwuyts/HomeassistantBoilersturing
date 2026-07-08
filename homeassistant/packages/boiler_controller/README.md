# Home Assistant Package - Boiler Controller

## Doel

Deze package levert de Home Assistant-kant van de boilersturing.

Home Assistant is planner en databron. Shelly blijft de controller die lokaal beslist en het relais schakelt.

## Verantwoordelijkheden

Home Assistant doet:

- superdal en andere planningsvoorwaarden bepalen;
- kwartierpiek voorspellen;
- piekmarge en kwartierenergie-headroom berekenen;
- gebruikersparameters beheren;
- MQTT-bericht naar `boiler/v1/controller` publiceren.

Home Assistant doet niet:

- het boilerrelais rechtstreeks schakelen;
- runtime bewaken;
- restart delay afdwingen;
- watchdog of veiligheid overnemen.

## MQTT payload

`scripts.yaml` publiceert:

- `boiler.config.heating_enabled`
- `boiler.config.max_runtime`
- `boiler.config.restart_delay`
- `boiler.config.stop_hold`
- `boiler.config.peak_safety_margin_wh`
- `boiler.config.peak_min_on_seconds`
- `boiler.energy.predicted_quarter_peak`
- `boiler.energy.peak_limit`
- `boiler.energy.peak_margin`
- `boiler.energy.boiler_power`
- `boiler.energy.house_power`
- `boiler.energy.quarter_elapsed_seconds`
- `boiler.energy.quarter_remaining_seconds`
- `boiler.energy.quarter_energy_wh`
- `boiler.energy.quarter_max_energy_wh`
- `boiler.energy.predicted_with_boiler_wh`
- `boiler.energy.predicted_without_boiler_wh`
- `boiler.energy.peak_headroom_wh`
- `boiler.energy.latest_safe_off_seconds`
- `boiler.energy.peak_decision`

Shelly gebruikt deze waarden als invoer voor zijn lokale controllerbeslissing.

## Bestanden

| Bestand | Functie |
| ------- | ------- |
| `helpers.yaml` | Interne helpers |
| `boiler_parameters.yaml` | Instelbare boilerparameters |
| `templates.yaml` | Afgeleide sensoren zoals piekmarge en heating allowed |
| `automations.yaml` | Dagstatus en resetlogica |
| `scripts.yaml` | MQTT publisher |
| `mqtt_status.yaml` | MQTT entities op basis van echte Shelly-status |
| `dashboard_debug_card.yaml` | Lovelace debugkaart voor status en diagnose |
| `controller_helpers.yaml` | Oudere controllerhelpers, niet gebruiken als actuele Shelly-status |

## Actuele status

Gebruik voor dashboards de entities uit `mqtt_status.yaml`. `input_select.boiler_state` is een oudere helper en is niet langer de waarheid over de actuele boilerstatus.

Voor diagnose kan de Lovelace snippet uit `dashboard_debug_card.yaml` in een dashboard worden geplakt.

