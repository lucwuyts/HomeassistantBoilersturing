# Boiler Controller - Architectuur

Versie: 0.2 werkdocument

## Doel

De Boiler Controller stuurt een elektrische boiler aan via een Shelly Pro 1 Gen2. Het systeem moet maximaal gebruikmaken van gunstige energieperiodes, maar veilig blijven werken wanneer Home Assistant tijdelijk niet beschikbaar is.

## Hoofdprincipe

```text
Home Assistant beslist WANNEER verwarmen gewenst is.
Shelly beslist OF verwarmen veilig kan.
```

Daarmee is de Shelly de echte controller. Home Assistant is planner, configuratiebron en energiedatabron.

## Verantwoordelijkheden

### Home Assistant

Home Assistant doet:

- superdaluren en nachttariefvenster bepalen;
- kwartierpiek en voorspelde kwartierenergie berekenen;
- beschikbare piekruimte in W en Wh berekenen;
- tarieven en energiemanagement verwerken;
- gebruikersparameters beheren;
- MQTT-configuratie en energiemetingen publiceren.

Home Assistant doet niet:

- het relais rechtstreeks schakelen;
- runtime bewaken;
- restart delay afdwingen;
- watchdog of veiligheid afdwingen;
- persistentie van Shelly-statistieken beheren.

### Shelly

Shelly doet:

- MQTT controllerbericht ontvangen;
- configuratie toepassen;
- energiemetingen lokaal beoordelen;
- relais schakelen;
- runtime bewaken;
- detecteren of de boiler warm genoeg is;
- restart delay beheren;
- piekbeveiliging toepassen;
- watchdog/fallback bij uitval van Home Assistant;
- statistieken persistent bewaren via `Script.storage`.

## Architectuuroverzicht

```text
Home Assistant
  Energy tools
  Boiler planner
  MQTT publisher
        |
        | boiler/v1/controller
        v
Shelly Pro 1
  MQTT Manager
  Boiler Manager
  Relay Manager
  Runtime Manager
  Restart Delay Manager
  Persistence Manager
  Heartbeat Manager
        |
        v
Elektrische boiler
```

## MQTT-richting

Home Assistant publiceert naar `boiler/v1/controller`.

Shelly publiceert naar `boiler/v1/status`.

Het controllerbericht bevat configuratie en energiemetingen. De energiemetingen zijn invoer voor de Shelly-beslissing; ze zijn geen relaiscommando.

## Piekbeveiliging

De kwartierdetectie en piekberekening blijven in Home Assistant. Home Assistant stuurt onder andere `predicted_quarter_peak`, `peak_limit`, `peak_margin`, `quarter_energy_wh`, `quarter_max_energy_wh`, `predicted_with_boiler_wh` en `peak_headroom_wh` naar Shelly. W-bronsensoren en kW-bronsensoren worden in Home Assistant naar de juiste MQTT-eenheid omgerekend.

Shelly beslist lokaal:

- als verwarmen volgens HA niet toegestaan is: relais uit;
- als de boiler lokaal als warm genoeg gemarkeerd is: relais uit;
- als het laatste veilige uitschakelmoment voor de kwartierpiek bereikt is: relais uit en restart delay starten;
- anders: verwarmen mag, zolang lokale veiligheid OK is.

`warm_enough` is een Shelly-status en diagnoseveld. Home Assistant gebruikt dit niet om `heating_enabled` uit te zetten. Tijdens superdal en nachttarief mag Home Assistant dus nog steeds verwarming toestaan; Shelly beslist lokaal of hij effectief niets meer doet omdat de boiler al warm genoeg is.

## Persistentie

Shelly gebruikt `Script.storage`, niet KVS RPC.

Persistent opgeslagen:

- `firmware_boots`;
- `starts_today`;
- `total_starts`;
- `total_runtime`;
- `warm_enough`;
- `warm_enough_since`.

Opslaan gebeurt alleen bij boot, boiler start, boiler stop en reset van statistieken. Niet periodiek.

## Ontwikkelregels

- Geen architectuurwijzigingen tijdens refactoring.
- Nieuwe Shelly-code hoort in het juiste genummerde bestand.
- Geen externe libraries.
- Alle logging via `logError()`, `logWarning()`, `logInfo()` en `logTrace()`.
- Build moet altijd een volledig Shelly-script opleveren.

