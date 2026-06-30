/**********************************************************************
 *
 *  Boiler Controller
 *
 *  Hardware : Shelly Pro 1
 *  Firmware : Shelly OS 1.7.x
 *
 *  Version  : 0.1.0
 *
 *----------------------------------------------------------------------
 *
 *  Change history
 *
 *  0.1.0  Initial communication framework
 *
 **********************************************************************/

//======================================================================
// CONFIGURATION
//======================================================================

const CONFIG = {

    DEBUG: true,

    POLL_INTERVAL: 5000,

    HA_HOST: "10.0.250.76",

    HA_PORT: 8123,

    STATUS_PATH: "/local/boiler/status.json"

};

const URL =
    "http://" +
    CONFIG.HA_HOST +
    ":" +
    CONFIG.HA_PORT +
    CONFIG.STATUS_PATH;


//======================================================================
// LOGGER
//======================================================================

const Log = {

    info: function(msg) {

        print("[SBC] " + msg);

    },

    debug: function(msg) {

        if (CONFIG.DEBUG)
            print("[DBG] " + msg);

    },

    error: function(msg) {

        print("[ERR] " + msg);

    }

};


//======================================================================
// HOME ASSISTANT COMMUNICATION
//======================================================================

const HA = {

    connected: false,

    busy: false,

    lastUpdate: 0,

    apiVersion: 0,

    revision: -1,

    allowHeat: false,

    superdal: false,

    housePower: 0,

    message: "",


    //------------------------------------------------------------------

    process: function(status) {

        if (status.api_version === undefined) {

            Log.error("api_version missing");

            return;

        }

        // Alleen loggen als er iets gewijzigd is

        if (status.revision == this.revision)
            return;

        this.connected = true;

        this.lastUpdate = Date.now();

        this.apiVersion = status.api_version;

        this.revision = status.revision;

        this.allowHeat = status.allow_heat;

        this.superdal = status.superdal;

        this.housePower = status.house_power;

        this.message = status.message;

        Log.info("--------------------------------");

        Log.info("Revision    : " + this.revision);

        Log.info("Allow Heat  : " + this.allowHeat);

        Log.info("Superdal    : " + this.superdal);

        Log.info("House Power : " + this.housePower + " W");

        Log.info("Message     : " + this.message);

    },


    //------------------------------------------------------------------

    update: function() {

        if (this.busy)
            return;

        this.busy = true;

        Shelly.call(

            "HTTP.GET",

            {

                url: URL,

                timeout: 5

            },

            function(result, errorCode, errorMessage) {

                HA.busy = false;

                if (errorCode !== 0) {

                    HA.connected = false;

                    Log.error("HTTP Error : " + errorCode);

                    Log.error(errorMessage);

                    return;

                }

                if (result.code != 200) {

                    HA.connected = false;

                    Log.error("HTTP Status : " + result.code);

                    return;

                }

                let status;

                try {

                    status = JSON.parse(result.body);

                }

                catch(e) {

                    HA.connected = false;

                    Log.error("JSON Parse Error");

                    Log.debug(result.body);

                    return;

                }

                HA.process(status);

            }

        );

    }

};


//======================================================================
// CONTROLLER
//======================================================================

const Controller = {

    run: function() {

        // Leeg in versie 0.1.0

    }

};


//======================================================================
// STARTUP
//======================================================================

Log.info("");

Log.info("======================================");

Log.info(" Boiler Controller v0.1.0");

Log.info("======================================");

Log.info("Home Assistant : " + URL);

HA.update();

Timer.set(

    CONFIG.POLL_INTERVAL,

    true,

    function() {

        HA.update();

        Controller.run();

    }

);