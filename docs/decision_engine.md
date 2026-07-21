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
- de kwartierenergie tot nu toe;
- de voorspelde kwartierenergie met en zonder boiler;
- de resterende Wh-ruimte in het kwartier;
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

Laatste veilige uitschakelmoment bereikt?
    ja -> stoppen en restart delay starten zodra minimum looptijd dit toelaat

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
max_quarter_energy_wh = peak_limit * 0.25

predicted_with_boiler_wh =
    quarter_energy_wh
    + (projected_power_w * remaining_seconds / 3600)

projected_power_w is het actuele woningvermogen. Als het relais uit staat,
telt Home Assistant het boilervermogen alleen mee wanneer verwarmen toegestaan
is en Shelly niet `warm_enough` meldt.

peak_headroom_wh =
    max_quarter_energy_wh - predicted_with_boiler_wh

latest_safe_off_seconds =
    aantal seconden dat de boiler nog kan blijven verwarmen
    zonder de kwartierlimiet minus veiligheidsmarge te overschrijden
```

Shelly interpreteert:

```text
latest_safe_off_seconds > 0 betekent:
    boiler mag blijven verwarmen.

latest_safe_off_seconds <= 0 betekent:
    boiler moet uit om de kwartierlimiet te beschermen.
```

Shelly schakelt dus niet uit zodra de projectie boven de limiet zou eindigen als de boiler tot het einde van het kwartier aan blijft. Shelly wacht tot het laatste veilige uitschakelmoment bereikt is, zodat de boiler zo lang mogelijk kan verwarmen.

Binnen `peak_min_on_seconds` stopt Shelly alleen meteen wanneer de gemeten kwartierenergie de harde kwartierlimiet al bereikt heeft.

Home Assistant geeft dus geen direct stopcommando; het levert de meetwaarden waarop Shelly beslist.

## Warm genoeg

Home Assistant stuurt `heating_enabled` op basis van planning en tarief. Tijdens superdal en nachttarief mag deze waarde dus `true` zijn, ook wanneer Shelly eerder `warm_enough` meldde.

Shelly gebruikt `warm_enough` lokaal:

```text
warm_enough true betekent: verwarmen mag volgens HA, maar Shelly start het relais niet omdat de boiler al voldoende opgewarmd is.
```

De vlag is een status- en diagnoseveld voor Home Assistant en Grafana. Ze is geen HA-planningsvoorwaarde.

Home Assistant reset `warm_enough` alleen expliciet bij het begin van een nieuwe superdalcyclus via een niet-retained MQTT-command. Een overgang naar het gewone nachttarief reset deze vlag niet.

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
