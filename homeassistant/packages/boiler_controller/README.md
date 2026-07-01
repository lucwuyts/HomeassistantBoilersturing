# Boiler Controller

## Doel

De Boiler Controller bepaalt wanneer de elektrische boiler mag verwarmen.

Alle intelligentie bevindt zich in Home Assistant.
De Shelly voert uitsluitend de opdrachten uit en rapporteert de actuele toestand terug.

---

## Verantwoordelijkheden

- Beslissen of de boiler mag verwarmen.
- Rekening houden met:
  - Superdaluren
  - Piekvermogen
  - Wachttijden
  - Boiler reeds verwarmd vandaag
- Publiceren van de controllerstatus naar de Shelly.

---

## Architectuur

```
Energy Tools
      │
      ▼
Boiler Controller
      │
      ▼
MQTT / HTTP Publisher
      │
      ▼
Shelly Controller
      │
      ▼
Boiler
```

---

## Bestanden

| Bestand | Functie |
|---------|---------|
| helpers.yaml | Interne toestand van de controller |
| boiler_parameters.yaml | Instelbare parameters |
| templates.yaml | Afgeleide sensoren en controllerstatus |
| automations.yaml | Controllerlogica |
| scripts.yaml | Hulpscripts |
| architecture.md | Architectuurbeschrijving |
| protocol.md | Communicatieprotocol |
| README.md | Deze documentatie |

---

## Ontwerpprincipes

- Alle beslissingen gebeuren in Home Assistant.
- De Shelly bevat zo weinig mogelijk logica.
- Geen hardgecodeerde parameters.
- Elke component heeft één verantwoordelijkheid.
- Alle onderdelen moeten afzonderlijk testbaar zijn.

---

## Status

Projectstatus: **In ontwikkeling**