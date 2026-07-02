/***************************************************************************
 *
 * Boiler Controller Firmware (BCF)
 *
 * Version  : 0.0.1
 * Hardware : Shelly Pro 1
 * API      : v1
 *
 * Doel:
 *   - MQTT communicatie testen
 *   - Status publiceren
 *
 ***************************************************************************/

//=====================================================
// Constants
//=====================================================

const API_VERSION = 1;
const FIRMWARE = "BCF 0.0.1";

const TOPIC_STATUS = "boiler/v1/status";

//=====================================================
// Status object
//=====================================================

let status = {

  state: "BOOTING",

  relay: false,

  heating_enabled: false,

  runtime: 0,

  starts_today: 0,

  watchdog: true

};

//=====================================================
// Helpers
//=====================================================

function isoTimestamp() {

  return new Date().toISOString();

}

//-----------------------------------------------------

function publishStatus() {

  let payload = {

    api: API_VERSION,

    source: "Shelly",

    firmware: FIRMWARE,

    timestamp: isoTimestamp(),

    state: status.state,

    relay: status.relay,

    heating_enabled: status.heating_enabled,

    runtime: status.runtime,

    starts_today: status.starts_today,

    watchdog: status.watchdog,

    uptime: Shelly.getComponentStatus("Sys").uptime

  };

  MQTT.publish(
    TOPIC_STATUS,
    JSON.stringify(payload),
    1,
    true
  );

  print("Status published");

}

//=====================================================
// Main
//=====================================================

Timer.set(

  5000,

  false,

  function () {

    publishStatus();

  }

);