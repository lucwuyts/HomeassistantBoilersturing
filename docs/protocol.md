# Boiler Controller - MQTT Protocol

Protocolversie: 1

## Topics

| Richting | Topic | Doel |
| -------- | ----- | ---- |
| Home Assistant naar Shelly | `boiler/v1/controller` | Configuratie en energiemetingen |
| Shelly naar Home Assistant | `boiler/v1/status` | Actuele Shelly-status |

## Controllerbericht

Home Assistant publiceert retained met QoS 1 naar `boiler/v1/controller`.

Voorbeeld:

```json
{
  "api": 1,
  "source": "EnergyManager",
  "software": "BEM 0.1.0",
  "timestamp": "2026-07-03T12:00:00+02:00",
  "boiler": {
    "config": {
      "heating_enabled": true,
      "max_runtime": 10800,
      "restart_delay": 900,
      "stop_hold": 300,
      "peak_safety_margin_wh": 50,
      "peak_min_on_seconds": 60
    },
    "energy": {
      "predicted_quarter_peak": 4200,
      "peak_limit": 4000,
      "peak_margin": -200,
      "boiler_power": 1500,
      "house_power": 2700,
      "quarter_elapsed_seconds": 450,
      "quarter_remaining_seconds": 450,
      "quarter_energy_wh": 480,
      "quarter_max_energy_wh": 1000,
      "predicted_with_boiler_wh": 1017.5,
      "predicted_without_boiler_wh": 830,
      "peak_headroom_wh": -17.5,
      "latest_safe_off_seconds": 410,
      "peak_decision": "run_until_off"
    }
  }
}
```

### `boiler.config`

| Veld | Type | Eenheid | Betekenis |
| ---- | ---- | ------ | --------- |
| `heating_enabled` | boolean | - | HA geeft aan dat verwarmen volgens planning mag |
| `max_runtime` | number | seconden | Maximale runtime voor een verwarmingscyclus |
| `restart_delay` | number | seconden | Wachttijd na stop of piekbeveiliging |
| `stop_hold` | number | seconden | Minimale lokale wachttijd na een gewone stop om korte herstarts te vermijden |
| `peak_safety_margin_wh` | number | Wh | Veiligheidsmarge onder de kwartierlimiet |
| `peak_min_on_seconds` | number | seconden | Minimum looptijd voor piekstop, behalve bij echte overschrijding van de kwartierlimiet |

### `boiler.energy`

| Veld | Type | Eenheid | Betekenis |
| ---- | ---- | ------ | --------- |
| `predicted_quarter_peak` | number | W | Door HA voorspelde kwartierpiek. Als het relais uit staat, telt HA het boilervermogen alleen mee wanneer verwarmen toegestaan is en Shelly niet `warm_enough` meldt. HA rekent eventuele kW-bronnen om naar W voor MQTT |
| `peak_limit` | number | W | Ingestelde maximale kwartierpiek |
| `peak_margin` | number | W | `peak_limit - predicted_quarter_peak` |
| `boiler_power` | number | W | Verwacht vermogen van de boiler |
| `house_power` | number | W | Actueel woningverbruik volgens HA |
| `quarter_elapsed_seconds` | number | seconden | Verstreken seconden in het huidige kwartier |
| `quarter_remaining_seconds` | number | seconden | Resterende seconden in het huidige kwartier |
| `quarter_energy_wh` | number | Wh | Gemeten kwartierenergie tot nu toe |
| `quarter_max_energy_wh` | number | Wh | Maximaal toegelaten kwartierenergie, `peak_limit * 0.25` |
| `predicted_with_boiler_wh` | number | Wh | Verwachte kwartierenergie als het huidige vermogen aanhoudt, plus boilervermogen wanneer de boiler nog mag starten |
| `predicted_without_boiler_wh` | number | Wh | Verwachte kwartierenergie als het boilervermogen wegvalt |
| `peak_headroom_wh` | number | Wh | `quarter_max_energy_wh - predicted_with_boiler_wh` |
| `latest_safe_off_seconds` | number | seconden | Laatste veilige uitschakelmoment binnen het kwartier, gerekend vanaf nu |
| `peak_decision` | string | - | Diagnose uit HA: `ok`, `run_until_off`, `min_on_hold`, `stop` of `exceeded` |

Shelly mag onbekende velden negeren. Nieuwe velden moeten achterwaarts compatibel worden toegevoegd.

## Controllercommand

Home Assistant mag een niet-retained command naar hetzelfde controller-topic publiceren voor expliciete beheeracties.

Voorbeeld:

```json
{
  "api": 1,
  "source": "EnergyManager",
  "software": "BEM 0.1.0",
  "timestamp": "2026-07-04T13:30:00+02:00",
  "boiler": {
    "command": {
      "reset_statistics": true
    }
  }
}
```

| Veld | Type | Betekenis |
| ---- | ---- | --------- |
| `reset_statistics` | boolean | Reset Shelly verwarmingsstatistieken `starts_today`, `total_starts` en `total_runtime` |
| `reset_warm_enough` | boolean | Reset Shelly `warm_enough` vlag bij start van een nieuwe superdalcyclus |

Commands worden niet retained gepubliceerd. Een reset mag niet opnieuw uitgevoerd worden na een MQTT- of Shelly-herstart.

## Interpretatie door Shelly

Shelly gebruikt `boiler.config` en `boiler.energy` als invoer voor de lokale beslissing.

Basislogica:

```text
Als heating_enabled false is:
    boiler stoppen

Anders als latest_safe_off_seconds <= 0:
    boiler stoppen zodra minimum looptijd dit toelaat
    restart delay starten

Anders:
    verwarmen toestaan als lokale veiligheid OK is
```

De exacte beslissing blijft in de Shelly-firmware. Home Assistant stuurt geen relaiscommando.

## Statusbericht

Shelly publiceert retained met QoS 1 naar `boiler/v1/status`.

Voorbeeld:

```json
{
  "api": 1,
  "source": "Shelly",
  "firmware": "0.2.0",
  "timestamp": "2026-07-03T12:00:10.000Z",
  "boiler": {
    "config": {
      "heating_enabled": true,
      "max_runtime": 10800,
      "restart_delay": 900
    },
    "status": {
      "state": "HEATING",
      "relay": true,
      "runtime": 123,
      "starts_today": 4,
      "starts_today_date": "2026-07-03",
      "total_starts": 27,
      "total_runtime": 34122,
      "uptime": 86400,
      "wifi_rssi": -48,
      "wifi_connected": true,
      "mqtt_connected": true,
      "ram_free": 104832,
      "firmware_version": "1.7.5",
      "script_version": "0.2.0",
      "watchdog": true,
      "watchdog_reboots": 0,
      "watchdog_reason": "",
      "controller_online": true,
      "controller_timeout": 120,
      "last_controller_update": "2026-07-03T12:00:00.000Z",
      "last_controller_age": 10,
      "last_mqtt_seen": "2026-07-03T12:00:10.000Z",
      "warm_enough": false,
      "warm_enough_since": "",
      "warmup_min_runtime": 300,
      "boot_delay_active": false,
      "boot_delay_remaining": 0,
      "stop_hold_active": false,
      "stop_hold_remaining": 0,
      "restart_delay_active": false,
      "restart_remaining": 0,
      "last_stop_reason": ""
    }
  }
}
```

## Foutafhandeling

- Ongeldig JSON-bericht: Shelly negeert bericht en logt fout.
- Ontbrekend `boiler.config`: Shelly negeert bericht en logt fout.
- Ontbrekend `boiler.energy`: Shelly behoudt bestaande energiewaarden of gebruikt veilige defaults.
- Geen nieuw geldig HA-bericht binnen watchdogtijd: Shelly publiceert `controller_online: false` en `watchdog: false` in het statusbericht.

