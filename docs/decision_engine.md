# Decision Logic

## Doel

De beslissingslogica is verdeeld over Home Assistant en Shelly.

Home Assistant berekent planning en energiewaarden. Shelly neemt de lokale controllerbeslissing en schakelt het relais.

## Home Assistant planner

Home Assistant bepaalt:

- of de gebruiker/controller verwarmen toestaat;
- of het huidige moment binnen superdal, nachttarief of een andere gunstige periode valt;
- de voorspelde kwartierpiek;
- de pieklimiet;
- de piekmarge;
- het verwachte boilervermogen;
- het actuele woningvermogen.

Het resultaat wordt gepubliceerd via MQTT als `boiler.config` en `boiler.energy`.

## Shelly controller

Shelly beslist:

- of het relais aan of uit moet;
- of max runtime bereikt is;
- of restart delay actief is;
- of de boiler warm genoeg is;
- of de voorspelde piek te hoog is;
- of communicatie met Home Assistant nog betrouwbaar is;
- of persistentie moet worden bijgewerkt.

## Lokale beslissingsvolgorde Shelly

```text
Restart delay actief?
    ja -> niet starten

Heating enabled false?
    ja -> stoppen

Warm enough actief?
    ja -> niet starten

Peak margin negatief?
    ja -> stoppen en restart delay starten

Max runtime bereikt?
    ja -> stoppen en restart delay starten

Watchdog fout?
    ja -> veilige fallback of stoppen

Anders:
    verwarmen toegestaan
```

## Piekbeslissing

Home Assistant berekent:

```text
peak_margin = peak_limit - predicted_quarter_peak
```

Shelly interpreteert:

```text
peak_margin < 0 betekent: verwarmen is lokaal niet veilig voor de kwartierpiek.
```

Shelly schakelt dan de boiler tijdelijk uit en start restart delay. Home Assistant geeft dus geen direct stopcommando; het levert de meetwaarde waarop Shelly beslist.

## Warm genoeg

Home Assistant stuurt `heating_enabled` op basis van planning en tarief. Tijdens superdal en nachttarief mag deze waarde dus `true` zijn, ook wanneer Shelly eerder `warm_enough` meldde.

Shelly gebruikt `warm_enough` lokaal:

```text
warm_enough true betekent: verwarmen mag volgens HA, maar Shelly start het relais niet omdat de boiler al voldoende opgewarmd is.
```

De vlag is een status- en diagnoseveld voor Home Assistant en Grafana. Ze is geen HA-planningsvoorwaarde.

## Prioriteiten

| Prioriteit | Omschrijving |
| ---------- | ------------ |
| 1 | Veiligheid |
| 2 | Communicatie/watchdog |
| 3 | Bescherming tegen piekoverschrijding |
| 4 | Comfort |
| 5 | Energieprijs of optimalisatie |

## Uitbreidingen

Nieuwe optimalisaties zoals PV, batterij of dynamische tarieven horen eerst in Home Assistant. Alleen de noodzakelijke uitkomst of meetwaarde gaat naar Shelly. Shelly blijft beperkt tot lokale, deterministische veiligheids- en relaisbeslissingen.
