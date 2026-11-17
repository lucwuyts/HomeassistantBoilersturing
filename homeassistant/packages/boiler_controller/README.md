# Home Assistant Package - Boiler Controller

## Doel

Deze package levert de Home Assistant-kant van de boilersturing.

Home Assistant is planner en databron. Shelly blijft de controller die lokaal beslist en het relais schakelt.

## Verantwoordelijkheden

Home Assistant doet:

- het dagelijkse startmoment op basis van een instelbare tijdhelper bepalen;
- kwartierpiek voorspellen;
- piekmarge en kwartierenergie-headroom berekenen;
- gebruikersparameters beheren;
- MQTT-bericht naar `boiler/v1/controller` publiceren.

Verwarmen is toegestaan vanaf `input_datetime.boiler_day_start_time` (eerste standaardwaarde 11:00). De laatst ingestelde tijd wordt door Home Assistant hersteld na een herstart. Er is geen vast einduur of tariefvenster. `warm_enough` wordt op het ingestelde startuur gereset en ook wanneer het startuur wordt aangepast terwijl verwarmen al toegestaan is; er geldt geen dagmarker. Het actuele vermogen komt van `sensor.verbruik_ade`; Shelly krijgt ook een versheidsvlag en kan een oude vermogenswaarde niet gebruiken om `warm_enough` te zetten. De dag- en nachtenergieregisters worden samengevoegd in `sensor.boiler_meter_total_energy`.

De debugkaart heeft een knop om `warm_enough` handmatig te forceren en de boiler te stoppen. Hiervoor moet Shelly-build `2026.11.11-02` of nieuwer actief zijn.

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
| `boiler_parameters.yaml` | Instelbare boilerparameters |
| `templates.yaml` | Afgeleide sensoren zoals piekmarge en heating allowed |
| `automations.yaml` | MQTT publicatie, warm-enough reset en Shelly offline alerts |
| `scripts.yaml` | MQTT publisher |
| `mqtt_status.yaml` | MQTT entities op basis van echte Shelly-status |
| `dashboard_debug_card.yaml.txt` | Lovelace debugkaart voor status en diagnose |
| `dashboard_parameters_card.yaml.txt` | Lovelace kaart om boilerparameters in te stellen |

## Actuele status

Gebruik voor dashboards de entities uit `mqtt_status.yaml`. De actuele boilerstatus komt van Shelly via MQTT, niet uit Home Assistant input helpers.

Voor diagnose kan de Lovelace snippet uit `dashboard_debug_card.yaml.txt` in een dashboard worden geplakt. Voor instellingen kan `dashboard_parameters_card.yaml.txt` gebruikt worden.

Zie [../../../docs/installation.md](../../../docs/installation.md) voor installatie- en releasecontrole.

