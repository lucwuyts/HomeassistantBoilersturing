# Boiler Controller - Communicatieprotocol

Versie: **0.1 (Werkdocument)**

---

# Doel

Dit document beschrijft de communicatie tussen **Home Assistant** en de **Shelly Pro 1** die de elektrische boiler aanstuurt.

Het protocol is bewust eenvoudig gehouden zodat:

* de Shelly autonoom kan blijven werken;
* Home Assistant de volledige beslissingslogica bevat;
* uitbreidingen later mogelijk blijven zonder bestaande software te wijzigen.

---

# Architectuur

```
                Home Assistant
                 (Planner)
                      │
        HTTP GET      │
        JSON          │
                      ▼
              Shelly Pro 1
             (Uitvoerder)
                      │
                 Relais boiler
```

## Verantwoordelijkheden

### Home Assistant

Home Assistant is verantwoordelijk voor alle berekeningen.

Voorbeelden:

* superdaluren bepalen;
* kwartierpiek berekenen;
* beschikbare vermogensmarge bepalen;
* toekomstige uitbreidingen (PV, batterij, dynamische tarieven...).

Home Assistant schakelt **nooit rechtstreeks** het relais van de boiler.

---

### Shelly

De Shelly is verantwoordelijk voor de lokale regeling.

Voorbeelden:

* relais schakelen;
* detecteren dat de boiler op temperatuur is;
* minimale wachttijden;
* fallback bij uitval van Home Assistant;
* lokaal nachtprogramma.

---

# Communicatie

De Shelly leest periodiek de toestand van Home Assistant.

Er wordt bewust gekozen voor **pull** in plaats van **push**.

Voordelen:

* de Shelly bepaalt zelf de updatefrequentie;
* geen periodieke automations in Home Assistant;
* eenvoudige foutdetectie;
* de Shelly merkt onmiddellijk wanneer Home Assistant niet meer bereikbaar is.

---

# JSON formaat

Voorlopige versie:

```json
{
  "api_version": 1,
  "allow_heat": true,
  "superdal": true,
  "house_power": 1835,
  "quarter_energy": 624,
  "previous_quarter_energy": 915,
  "peak_limit": 4000,
  "boiler_power": 1500,
  "message": "Normal operation"
}
```

---

# Beschrijving van de velden

| Veld                    | Type    | Betekenis                                        |
| ----------------------- | ------- | ------------------------------------------------ |
| api_version             | integer | Protocolversie                                   |
| allow_heat              | boolean | Home Assistant geeft toestemming om te verwarmen |
| superdal                | boolean | Bevindt zich momenteel in een superdalvenster    |
| house_power             | integer | Actueel opgenomen vermogen (W)                   |
| quarter_energy          | integer | Verbruik in huidig kwartier (Wh)                 |
| previous_quarter_energy | integer | Verbruik vorig kwartier (Wh)                     |
| peak_limit              | integer | Maximale toegelaten kwartierpiek (W)             |
| boiler_power            | integer | Gemiddeld opgenomen vermogen van de boiler (W)   |
| message                 | string  | Diagnostische informatie                         |

---

# Fallback

Wanneer de Shelly gedurende een instelbare tijd geen geldige gegevens meer ontvangt:

* wordt de communicatie als verbroken beschouwd;
* schakelt de Shelly automatisch over op de interne fallback-regeling;
* blijft de boiler werken volgens het lokale nachtprogramma.

Zo blijft warm water beschikbaar, ook wanneer Home Assistant uitvalt.

---

# Ontwerpprincipes

Tijdens de ontwikkeling gelden de volgende regels:

1. Home Assistant is de planner.
2. De Shelly is de uitvoerder.
3. De Shelly moet ook zonder Home Assistant veilig kunnen functioneren.
4. Nieuwe functies mogen bestaande installaties niet verstoren.
5. Elke uitbreiding moet achterwaarts compatibel blijven.

---

# Versiegeschiedenis

## v0.1

* eerste ontwerp;
* architectuur vastgelegd;
* keuze voor pull-communicatie;
* fallback-regeling op de Shelly.
