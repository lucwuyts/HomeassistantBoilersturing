# Boiler Controller - Architectuur

Versie: **0.1 (Werkdocument)**

---

# Doel

Dit document beschrijft de architectuur van de Boiler Controller.

Het doel van de Boiler Controller is om een elektrische boiler maximaal tijdens de voordelige elektriciteitsuren te verwarmen, zonder de ingestelde kwartierpiek te overschrijden.

De regeling moet robuust zijn, eenvoudig uitbreidbaar en veilig blijven functioneren wanneer Home Assistant tijdelijk niet beschikbaar is.

---

# Ontwerpfilosofie

De boilercontroller is ontworpen als een deterministische toestandsmachine.

Elke beslissing wordt genomen op basis van objectieve sensorgegevens en instelbare parameters.

Alle logica is modulair opgebouwd zodat uitbreidingen (zoals PV-sturing, batterij-integratie of legionellaprogramma's) kunnen worden toegevoegd zonder de bestaande architectuur fundamenteel te wijzigen.

Veiligheid en comfort hebben altijd voorrang op kostenoptimalisatie.

## Home Assistant

Home Assistant bevat alle intelligentie.

Voorbeelden:

* berekenen van de kwartierpiek;
* bepalen van de beschikbare vermogensreserve;
* herkennen van superdaluren;
* toekomstige ondersteuning voor zonnepanelen;
* toekomstige ondersteuning voor thuisbatterij;
* dashboards;
* logging;
* configuratie.

Home Assistant beslist **wanneer** de boiler mag verwarmen.

---

## Shelly Pro 1

De Shelly is een autonome uitvoerder.

Taken:

* relais schakelen;
* lokale beveiligingen;
* nachtprogramma (fallback);
* detecteren dat de boiler op temperatuur is;
* minimale wachttijden;
* foutdetectie;
* communicatie met Home Assistant.

De Shelly beslist **hoe** de boiler veilig wordt aangestuurd.

---

# Architectuuroverzicht

```text
                  Home Assistant

               Planner / Intelligence

        ┌────────────────────────────┐
        │                            │
        │  Superdaluren              │
        │  Kwartierpiek              │
        │  Beschikbaar vermogen      │
        │  Dashboards                │
        │                            │
        └──────────────┬─────────────┘
                       │
                HTTP (Pull)
                       │
                       ▼
        ┌────────────────────────────┐
        │        Shelly Pro 1        │
        │                            │
        │  State Machine             │
        │  Boilerregeling            │
        │  Relais                    │
        │  Fallback                  │
        │                            │
        └──────────────┬─────────────┘
                       │
                       ▼
                  Elektrische boiler
```

---

# Toestandsmachine (State Machine)

De Shelly werkt steeds in exact één toestand.

```
                 +---------+
                 |  INIT   |
                 +---------+
                      |
                      v
              +---------------+
              |  FALLBACK     |
              +---------------+
                      |
          Home Assistant bereikbaar
                      |
                      v
          +----------------------+
          | WAIT_FOR_PERMISSION  |
          +----------------------+
              |             |
              |             |
      toestemming       geen toestemming
              |             |
              v             |
          +----------+      |
          | HEATING  |------+
          +----------+
              |
      Boiler op temperatuur
              |
              v
          +----------+
          |  DONE    |
          +----------+
              |
      Nieuwe verwarmingscyclus
              |
              +----------------------+
```

---

# Beschrijving van de toestanden

## INIT

Na het opstarten initialiseert de Shelly:

* configuratie;
* timers;
* opgeslagen variabelen;
* communicatie.

Daarna wordt beslist of Home Assistant bereikbaar is.

---

## FALLBACK

Fallback is de veilige bedrijfsmodus.

Hier gebruikt de Shelly uitsluitend:

* het lokale nachtprogramma;
* lokale beveiligingen.

Er wordt niet vertrouwd op Home Assistant.

Wanneer Home Assistant opnieuw bereikbaar wordt, schakelt de Shelly automatisch terug naar de slimme regeling.

---

## WAIT_FOR_PERMISSION

De Shelly wacht op toestemming van Home Assistant.

In deze toestand blijft het relais uitgeschakeld.

---

## HEATING

De boiler wordt verwarmd.

Tijdens deze toestand bewaakt de Shelly onder andere:

* boilervermogen;
* communicatie;
* thermostaat;
* wachttijden.

---

## DONE

De boiler is volledig op temperatuur.

Er wordt niet opnieuw verwarmd totdat een nieuwe verwarmingscyclus wordt gestart.

---

# Fallback-principe

Een belangrijk ontwerpdoel is dat een storing in Home Assistant nooit mag leiden tot het ontbreken van warm water.

Daarom bevat de Shelly een volledig zelfstandig nachtprogramma.

Wanneer Home Assistant gedurende langere tijd niet bereikbaar is, blijft de boiler volgens dit programma functioneren.

---

# Veiligheidsprincipes

De volgende regels zijn altijd van toepassing:

* de boiler mag nooit ongecontroleerd blijven inschakelen;
* communicatieverlies mag nooit tot onveilig gedrag leiden;
* na een herstart moet de controller zichzelf herstellen;
* alle belangrijke beslissingen worden gelogd.

---

# Uitbreidbaarheid

De architectuur voorziet uitbreidingen zonder bestaande software te wijzigen.

Mogelijke toekomstige uitbreidingen:

* zonnepanelen;
* thuisbatterij;
* dynamische elektriciteitsprijzen;
* legionella-programma;
* meerdere boilers;
* meerdere verwarmingsvensters;
* cloud logging.

---

# Ontwikkelstrategie

Tijdens de ontwikkeling wordt steeds dezelfde volgorde gevolgd.

1. Architectuur
2. Simulatie
3. Testen zonder relais
4. Testen met relais
5. Productieversie

Elke stap moet volledig getest zijn voordat de volgende stap wordt gestart.

---

# Versiegeschiedenis

## v0.1

* eerste architectuurdocument;
* scheiding tussen Planner en Uitvoerder;
* eerste state machine;
* fallback-principe vastgelegd.
