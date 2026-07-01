# Boiler State Machine

## Doel

Dit document beschrijft de logische werking van de slimme boilerregeling.

De state machine bepaalt **wanneer** de boiler mag verwarmen en **waarom** een overgang naar een andere toestand plaatsvindt.

Alle Home Assistant-automations zijn een implementatie van deze state machine.

---

# Ontwerpprincipes

De regeling probeert steeds het beste compromis te vinden tussen:

1. Comfort (voldoende warm water)
2. Lage elektriciteitskost
3. Beperken van de maandpiek
4. Betrouwbaarheid
5. Veiligheid

---

# States

## IDLE

### Beschrijving

Er is geen actieve verwarmingscyclus.

### Ingangsvoorwaarden

* boiler staat uit
* geen wachttimer actief
* geen foutconditie

### Acties

* Shelly OFF
* timers resetten indien nodig

### Mogelijke overgangen

| Event            | Nieuwe state  |
| ---------------- | ------------- |
| Warm water nodig | WAIT_FOR_SLOT |

---

## WAIT_FOR_SLOT

### Beschrijving

Er is warm water nodig, maar de regeling wacht op het meest geschikte kwartier.

### Acties

De regeling evalueert onder andere:

* huidige elektriciteitsprijs
* voorspelde kwartierprijzen
* resterende tijd van het kwartier
* huidig kwartiervermogen
* verwachte maandpiek
* minimale wachttijd
* superdalperiode

### Mogelijke overgangen

| Event                    | Nieuwe state |
| ------------------------ | ------------ |
| Startvoorwaarden voldaan | HEATING      |
| Boiler niet meer nodig   | IDLE         |
| Fout gedetecteerd        | ERROR        |

---

## HEATING

### Beschrijving

De boiler wordt actief verwarmd.

### Acties

Bij het betreden van deze state:

* Shelly ON
* starttijd registreren
* watchdog starten

Tijdens deze state wordt continu gecontroleerd:

* maximale verwarmingstijd
* piekvermogen
* thermostaat
* Shelly-status

### Mogelijke overgangen

| Event                | Nieuwe state |
| -------------------- | ------------ |
| Boiler warm          | FINISHED     |
| Maximum tijd bereikt | FINISHED     |
| Fout                 | ERROR        |

---

## FINISHED

### Beschrijving

De verwarmingscyclus is beëindigd.

### Acties

* Shelly OFF
* timers stoppen
* statistieken bijwerken
* interne variabelen resetten

### Mogelijke overgangen

| Event            | Nieuwe state |
| ---------------- | ------------ |
| Cleanup voltooid | IDLE         |

---

## ERROR

### Beschrijving

Er werd een fout vastgesteld.

### Mogelijke oorzaken

* Shelly offline
* communicatieprobleem
* veiligheidstimeout
* onverwachte toestand

### Acties

* Shelly OFF
* alarm loggen
* notificatie versturen (optioneel)

### Mogelijke overgangen

| Event         | Nieuwe state |
| ------------- | ------------ |
| Fout opgelost | IDLE         |

---

# Events

## Warm water nodig

Wordt actief wanneer de regeling beslist dat een nieuwe verwarmingscyclus noodzakelijk is.

---

## Goedkoop kwartier bereikt

De geplande starttijd is bereikt.

---

## Nieuw kwartier

Iedere 15 minuten wordt:

* kwartiervermogen bijgewerkt
* resterende energieruimte berekend
* planning eventueel aangepast

---

## Boiler warm

Gedetecteerd doordat de thermostaat opent en het opgenomen vermogen wegvalt.

---

## Timeout

De maximale verwarmingstijd werd overschreden.

---

## Home Assistant herstart

Na een herstart wordt de actuele toestand opnieuw opgebouwd aan de hand van:

* Shelly-status
* timers
* helpers
* sensoren

---

# Prioriteiten

De beslissingslogica gebruikt steeds onderstaande prioriteitsvolgorde:

| Prioriteit | Omschrijving                     |
| ---------- | -------------------------------- |
| 1          | Veiligheid                       |
| 2          | Bescherming van de boiler        |
| 3          | Comfort                          |
| 4          | Beperken van de maandpiek        |
| 5          | Elektriciteitskost minimaliseren |

---

# State-overgangen

| Huidige state | Event                  | Nieuwe state  |
| ------------- | ---------------------- | ------------- |
| IDLE          | Warm water nodig       | WAIT_FOR_SLOT |
| WAIT_FOR_SLOT | Goedkoop kwartier      | HEATING       |
| WAIT_FOR_SLOT | Boiler niet meer nodig | IDLE          |
| WAIT_FOR_SLOT | Fout                   | ERROR         |
| HEATING       | Boiler warm            | FINISHED      |
| HEATING       | Timeout                | FINISHED      |
| HEATING       | Fout                   | ERROR         |
| FINISHED      | Cleanup voltooid       | IDLE          |
| ERROR         | Fout opgelost          | IDLE          |

---

# Veiligheidsmechanismen

* Maximale verwarmingsduur.
* Watchdog voor vastgelopen automations.
* Shelly-statuscontrole.
* Herstel na Home Assistant-herstart.
* Geen dubbele verwarmingscycli.
* Altijd eerst uitschakelen bij een fout.

---

# Toekomstige uitbreidingen

* PV-overschot gebruiken.
* Negatieve elektriciteitsprijzen.
* Dynamische vermogensregeling.
* Legionella-programma.
* Vakantiemodus.
* Slimme voorspelling van warmwaterverbruik.
