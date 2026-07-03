# Shelly Boiler State Machine

## Doel

Dit document beschrijft de lokale state machine op de Shelly. Home Assistant levert planning en meetwaarden; de Shelly beslist lokaal over relais en veiligheid.

## Huidige states

| State | Betekenis |
| ----- | --------- |
| `BOOTING` | Firmware start op en initialiseert storage, MQTT en timers |
| `IDLE` | Boiler staat uit en wacht op geldige toestemming |
| `HEATING` | Relais is aan en runtime wordt bewaakt |
| `ERROR` | Veiligheids- of communicatiefout |

## Belangrijke statusvelden

| Veld | Betekenis |
| ---- | --------- |
| `relay` | Werkelijke lokale relaisstatus volgens Shelly |
| `runtime` | Runtime van de huidige cyclus in seconden |
| `restart_delay_active` | Tijdelijke wachttijd actief |
| `restart_remaining` | Resterende wachttijd in seconden |
| `last_stop_reason` | Reden waarom Shelly de boiler stopte |

## Beslissingsvolgorde

Shelly evalueert in vaste volgorde:

1. Is restart delay actief?
2. Staat `heating_enabled` toe dat er verwarmd mag worden?
3. Is piekbeveiliging actief of is `peak_margin` onvoldoende?
4. Is de maximale runtime overschreden?
5. Is de watchdog/communicatie veilig?
6. Mag het relais aan?

## Overgangen

| Huidige state | Conditie | Nieuwe state | Actie |
| ------------- | -------- | ------------ | ----- |
| `BOOTING` | Init klaar | `IDLE` | Status publiceren |
| `IDLE` | Verwarmen toegestaan en veilig | `HEATING` | Relais aan, runtime reset |
| `HEATING` | `heating_enabled = false` | `IDLE` | Relais uit |
| `HEATING` | `peak_margin < 0` | `IDLE` | Relais uit, restart delay starten |
| `HEATING` | Max runtime bereikt | `IDLE` | Relais uit, restart delay starten |
| Elke state | Veiligheidsfout | `ERROR` | Relais uit |
| `ERROR` | Fout opgelost | `IDLE` | Status publiceren |

## Restart delay

Restart delay voorkomt pendelen. Shelly start deze wachttijd na lokale stops die niet onmiddellijk opnieuw mogen starten, zoals max runtime of piekbeveiliging.

Home Assistant levert de duur via `boiler.config.restart_delay`; Shelly beheert de timer zelf.

## Watchdog

De watchdog bewaakt of Home Assistant nog recente geldige MQTT-berichten stuurt. Bij timeout moet Shelly veilig blijven: relais uit of fallback volgens firmwarebeleid.
