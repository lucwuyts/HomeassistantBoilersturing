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
| `stop_hold_active` | Korte anti-pendel wachttijd na een stop |
| `stop_hold_remaining` | Resterende anti-pendel wachttijd in seconden |
| `warm_enough` | Shelly heeft lokaal beslist dat de boiler voldoende opgewarmd is |
| `last_stop_reason` | Reden waarom Shelly de boiler stopte |

## Beslissingsvolgorde

Shelly evalueert in vaste volgorde:

1. Is restart delay actief?
2. Is stop-hold actief?
3. Staat `heating_enabled` toe dat er verwarmd mag worden?
4. Is `warm_enough` actief?
5. Is piekbeveiliging actief of is `peak_margin` onvoldoende?
6. Is de maximale runtime overschreden?
7. Is de watchdog/communicatie veilig?
8. Mag het relais aan?

## Overgangen

| Huidige state | Conditie | Nieuwe state | Actie |
| ------------- | -------- | ------------ | ----- |
| `BOOTING` | Init klaar | `IDLE` | Status publiceren |
| `IDLE` | Verwarmen toegestaan en veilig | `HEATING` | Relais aan, runtime reset |
| `HEATING` | `heating_enabled = false` | `IDLE` | Relais uit |
| `HEATING` | Boiler warm genoeg gedetecteerd | `IDLE` | Relais uit, `warm_enough` zetten |
| `IDLE` | `warm_enough = true` | `IDLE` | Relais blijft uit |
| `HEATING` | `peak_margin < 0` | `IDLE` | Relais uit, restart delay starten |
| `HEATING` | Max runtime bereikt | `IDLE` | Relais uit, restart delay starten |
| Elke state | Veiligheidsfout | `ERROR` | Relais uit |
| `ERROR` | Fout opgelost | `IDLE` | Status publiceren |

## Restart delay

Restart delay voorkomt pendelen. Shelly start deze wachttijd na lokale stops die niet onmiddellijk opnieuw mogen starten, zoals max runtime of piekbeveiliging.

Home Assistant levert de duur via `boiler.config.restart_delay`; Shelly beheert de timer zelf.

## Stop-hold

Na een gewone stop houdt Shelly het relais kort uit om snelle herstarts na korte onderbrekingen te voorkomen. Dit is een lokale anti-pendelbeveiliging en staat los van de langere restart delay na piekbeveiliging of max runtime.

## Warm genoeg

Shelly detecteert zelf of de boiler warm genoeg is. Home Assistant gebruikt `warm_enough` alleen voor weergave, diagnose en grafieken.

`heating_enabled` mag tijdens superdal en nachttarief `true` blijven. Als `warm_enough` actief is, blijft Shelly lokaal in `IDLE` en wordt het relais niet opnieuw ingeschakeld.

De vlag wordt niet automatisch gereset wanneer `heating_enabled` opnieuw `true` wordt. Home Assistant stuurt alleen bij de start van een nieuwe superdalcyclus een expliciet `reset_warm_enough` command.

## Watchdog

De watchdog bewaakt of Home Assistant nog recente geldige MQTT-berichten stuurt. Bij timeout moet Shelly veilig blijven: relais uit of fallback volgens firmwarebeleid.
