# Reason Codes

Reason codes beschrijven waarom verwarmen wel of niet toegestaan is. Home Assistant mag reason codes gebruiken voor planning en diagnose. Shelly gebruikt eigen stopredenen voor lokale controlleracties.

## Home Assistant planner reasons

| Code | Omschrijving |
| ---- | ------------ |
| 0 | Verwarmen toegestaan |
| 1 | Buiten superdal/gunstige periode |
| 3 | Boiler vandaag reeds verwarmd |
| 4 | Wachttijd of planning actief |
| 5 | Verwachte kwartierpiek te hoog |
| 6 | Communicatieprobleem |
| 7 | Fallback actief |

## Shelly stop reasons

| Code/tekst | Betekenis |
| ---------- | --------- |
| `Heating not allowed` | HA-configuratie staat verwarmen niet toe |
| `Maximum runtime exceeded` | Shelly max runtime bereikt |
| `Restart delay active` | Shelly restart delay blokkeert starten |
| `Watchdog timeout` | Geen recente geldige HA-berichten |
| `Peak limit exceeded` | Shelly stopt omdat het laatste veilige uitschakelmoment voor de kwartierpiek bereikt is |
| `Boiler warm enough` | Shelly detecteerde dat de boiler warm genoeg is |
