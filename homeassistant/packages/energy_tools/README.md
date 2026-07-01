# Energy Tools

## Doel

Energy Tools bevat algemene bouwstenen voor energiegerelateerde automatiseringen.

Deze package bevat geen boilerlogica en kan door meerdere projecten gebruikt worden.

---

## Verantwoordelijkheden

- Detecteren van een nieuw energiekwartier.
- Leveren van algemene energiebouwstenen.
- Synchroniseren met de officiële kwartiermeter.

---

## Bestanden

| Bestand | Functie |
|---------|---------|
| helpers.yaml | Interne helpers |
| quarter_detector.yaml | Detectie van een nieuw kwartier |
| README.md | Deze documentatie |

---

## Ontwerpprincipes

- Onafhankelijk van de boilercontroller.
- Herbruikbaar voor andere projecten.
- Synchronisatie gebeurt op basis van de slimme meter en niet op basis van de systeemklok.

---

## Huidige componenten

### Quarter Detector

Input:

```
sensor.peak_current_average_quarterly_demand_2
```

Output:

```
input_boolean.energy_new_quarter
```

Deze detector volgt de officiële kwartierovergang van de digitale meter.

---

## Mogelijke toekomstige uitbreidingen

- Quarter Peak Predictor
- Peak Margin Calculator
- Load Estimator
- Dynamic Peak Limit
- Energy Statistics

---

## Status

Projectstatus: **In ontwikkeling**