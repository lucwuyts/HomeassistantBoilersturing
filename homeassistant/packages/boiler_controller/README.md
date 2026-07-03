# Home Assistant Package - Boiler Controller

## Doel

Deze package levert de Home Assistant-kant van de boilersturing.

Home Assistant is planner en databron. Shelly blijft de controller die lokaal beslist en het relais schakelt.

## Verantwoordelijkheden

Home Assistant doet:

- superdal en andere planningsvoorwaarden bepalen;
- kwartierpiek voorspellen;
- piekmarge berekenen;
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
- `boiler.energy.predicted_quarter_peak`
- `boiler.energy.peak_limit`
- `boiler.energy.peak_margin`
- `boiler.energy.boiler_power`
- `boiler.energy.house_power`

Shelly gebruikt deze waarden als invoer voor zijn lokale controllerbeslissing.

## Bestanden

| Bestand | Functie |
| ------- | ------- |
| `helpers.yaml` | Interne helpers |
| `boiler_parameters.yaml` | Instelbare boilerparameters |
| `templates.yaml` | Afgeleide sensoren zoals piekmarge en heating allowed |
| `automations.yaml` | Dagstatus en resetlogica |
| `scripts.yaml` | MQTT publisher |
| `controller_helpers.yaml` | Oudere controllerhelpers, nog te evalueren/opruimen |
