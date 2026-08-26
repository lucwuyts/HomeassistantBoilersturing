const FIRMWARE =
{
NAME        : "Boiler Controller",
VERSION     : "2026.08.26-06",
API         : 1
};
const CONFIG =
{
HEARTBEAT_INTERVAL    : 60000,
CONTROLLER_TIMEOUT    : 120000,
WATCHDOG_INTERVAL     : 60000,
WATCHDOG_TIMEOUT      : 600000,
WATCHDOG_MIN_UPTIME   : 300,
WATCHDOG_REBOOT_GAP   : 3600000,
BOOT_DELAY            : 30,
STOP_HOLD             : 300,
SCRIPT_ERROR_REBOOT_LIMIT : 5,
SCRIPT_ERROR_MAX_LENGTH   : 120,
RELAY_ID              : 0,
WARMUP_MIN_RUNTIME    : 300,
DEFAULT_MAX_RUNTIME   : 10800,
DEBUG_LEVEL           : 2,
RUNTIME_INTERVAL      : 1000
};
const STORAGE =
{
KEY     : "statistics",
VERSION : 1
};
const TOPIC =
{
CONTROLLER : "boiler/v1/controller",
STATUS     : "boiler/v1/status"
};
const DEBUG =
{
ERROR   : 0,
WARNING : 1,
INFO    : 2,
TRACE   : 3
};
const STATE =
{
BOOTING : "BOOTING",
IDLE    : "IDLE",
HEATING : "HEATING",
ERROR   : "ERROR"
};
const STOP_REASON =
{
HEATING_NOT_ALLOWED : "Heating not allowed",
MAX_RUNTIME         : "Maximum runtime exceeded",
PEAK_LIMIT          : "Peak limit exceeded",
WARM_ENOUGH         : "Boiler warm enough",
STOP_HOLD           : "Stop hold active",
RESTART_DELAY       : "Restart delay active",
WATCHDOG_TIMEOUT    : "Watchdog timeout"
};
let boiler =
{
config :
{
heating_enabled : false,
max_runtime     : CONFIG.DEFAULT_MAX_RUNTIME,
restart_delay   : 900,
stop_hold       : CONFIG.STOP_HOLD,
peak_safety_margin_wh : 50,
peak_min_on_seconds   : 60
},
energy :
{
predicted_quarter_peak : 0,
peak_limit             : 0,
peak_margin            : 0,
boiler_power           : 0,
house_power            : 0,
quarter_elapsed_seconds   : 0,
quarter_remaining_seconds : 0,
quarter_energy_wh         : 0,
quarter_max_energy_wh     : 0,
predicted_with_boiler_wh  : 0,
predicted_without_boiler_wh : 0,
peak_headroom_wh          : 0,
latest_safe_off_seconds   : 0,
peak_decision             : "unknown"
},
status :
{
state                  : STATE.BOOTING,
relay                  : false,
runtime                : 0,
starts_today           : 0,
starts_today_date      : "",
total_starts           : 0,
total_runtime          : 0,
firmware_boots         : 0,
watchdog               : false,
watchdog_reboots       : 0,
watchdog_reason        : "",
last_watchdog_reboot   : 0,
script_error_count     : 0,
last_script_error      : "",
last_script_error_context : "",
last_script_error_time : "",
watchdog_problem_since : 0,
uptime                 : 0,
wifi_rssi              : 0,
wifi_connected         : false,
mqtt_connected         : false,
ram_free               : 0,
firmware_version       : "",
script_version         : FIRMWARE.VERSION,
controller_online      : false,
controller_timeout     : CONFIG.CONTROLLER_TIMEOUT / 1000,
last_controller_update : "",
last_controller_seen   : 0,
last_controller_age    : 0,
last_mqtt_seen         : "",
last_mqtt_seen_ms      : 0,
controller_config_received : false,
last_update            : "",
last_start             : "",
last_stop              : "",
last_stop_reason       : "",
stop_hold_active       : false,
stop_hold_remaining    : 0,
warm_enough            : false,
warm_enough_since      : "",
warmup_min_runtime     : CONFIG.WARMUP_MIN_RUNTIME,
boot_delay_active      : false,
boot_delay_remaining   : 0,
restart_delay_active   : false,
restart_remaining      : 0
}
};
let persistent =
{
version         : STORAGE.VERSION,
firmware_boots  : 0,
starts_today    : 0,
starts_today_date : "",
total_starts    : 0,
total_runtime   : 0,
warm_enough     : false,
warm_enough_since : "",
watchdog_reboots : 0,
watchdog_reason : "",
last_watchdog_reboot : 0,
script_error_count : 0,
last_script_error : "",
last_script_error_context : "",
last_script_error_time : ""
};
function log(level, prefix, text)
{
if (level > CONFIG.DEBUG_LEVEL)
{
return;
}
print(prefix + text);
}
let monotonicMs = 0;
let wallClockSeconds = 0;
function advanceClock(ms)
{
monotonicMs += ms;
}
function dateKey()
{
if (wallClockSeconds > 0)
{
return "" + Math.floor(wallClockSeconds / 86400);
}
return "" + Math.floor(monotonicMs / 86400000);
}
let scriptErrorHandling = false;
function errorToText(error)
{
let text = "";
if (error && error.message)
{
text = "" + error.message;
}
else
{
text = "" + error;
}
if (text.length > CONFIG.SCRIPT_ERROR_MAX_LENGTH)
{
return text.substr(0, CONFIG.SCRIPT_ERROR_MAX_LENGTH);
}
return text;
}
function recordScriptError(context, error)
{
if (scriptErrorHandling)
{
log(DEBUG.ERROR, "[ERROR] ", "Nested script error in " + context + ": " + errorToText(error));
return;
}
scriptErrorHandling = true;
try
{
boiler.status.script_error_count++;
boiler.status.last_script_error = errorToText(error);
boiler.status.last_script_error_context = context;
boiler.status.last_script_error_time = "" + monotonicMs;
boiler.status.watchdog_reason = "script error: " + context;
log(DEBUG.ERROR, "[ERROR] ",
"Script error in " +
context +
": " +
boiler.status.last_script_error
);
savePersistentData();
try
{
publishStatus();
}
catch(publishError)
{
log(DEBUG.ERROR, "[ERROR] ",
"Status publish after script error failed: " +
errorToText(publishError)
);
}
if (boiler.status.script_error_count >=
CONFIG.SCRIPT_ERROR_REBOOT_LIMIT &&
canWatchdogReboot())
{
performWatchdogReboot("script error: " + context);
}
}
finally
{
scriptErrorHandling = false;
}
}
function safeCall(context, callback)
{
try
{
callback();
}
catch(error)
{
recordScriptError(context, error);
}
}
function safeCallback(context, callback)
{
return function(a, b, c)
{
safeCall(
context,
function()
{
callback(a, b, c);
}
);
};
}
function copyPersistentToStatus()
{
boiler.status.firmware_boots = persistent.firmware_boots;
boiler.status.starts_today = persistent.starts_today;
boiler.status.starts_today_date =
persistent.starts_today_date || "";
boiler.status.total_starts = persistent.total_starts;
boiler.status.total_runtime = persistent.total_runtime;
boiler.status.warm_enough = persistent.warm_enough === true;
boiler.status.warm_enough_since =
persistent.warm_enough_since || "";
boiler.status.watchdog_reboots = persistent.watchdog_reboots || 0;
boiler.status.watchdog_reason = persistent.watchdog_reason || "";
boiler.status.last_watchdog_reboot =
persistent.last_watchdog_reboot || 0;
boiler.status.script_error_count =
persistent.script_error_count || 0;
boiler.status.last_script_error =
persistent.last_script_error || "";
boiler.status.last_script_error_context =
persistent.last_script_error_context || "";
boiler.status.last_script_error_time =
persistent.last_script_error_time || "";
}
function copyStatusToPersistent()
{
persistent.firmware_boots = boiler.status.firmware_boots;
persistent.starts_today = boiler.status.starts_today;
persistent.starts_today_date = boiler.status.starts_today_date;
persistent.total_starts = boiler.status.total_starts;
persistent.total_runtime = boiler.status.total_runtime;
persistent.warm_enough = boiler.status.warm_enough;
persistent.warm_enough_since = boiler.status.warm_enough_since;
persistent.watchdog_reboots = boiler.status.watchdog_reboots;
persistent.watchdog_reason = boiler.status.watchdog_reason;
persistent.last_watchdog_reboot =
boiler.status.last_watchdog_reboot;
persistent.script_error_count =
boiler.status.script_error_count;
persistent.last_script_error =
boiler.status.last_script_error;
persistent.last_script_error_context =
boiler.status.last_script_error_context;
persistent.last_script_error_time =
boiler.status.last_script_error_time;
}
function savePersistentData()
{
copyStatusToPersistent();
persistent.version = STORAGE.VERSION;
Script.storage.setItem(
STORAGE.KEY,
JSON.stringify(persistent)
);
log(DEBUG.TRACE, "[TRACE] ", "Persistent data saved");
}
function resetStatistics()
{
boiler.status.starts_today = 0;
boiler.status.starts_today_date = dateKey();
boiler.status.total_starts = 0;
boiler.status.total_runtime = 0;
savePersistentData();
log(DEBUG.INFO, "[INFO] ", "Statistics reset");
}
function resetDailyStatistics()
{
boiler.status.starts_today = 0;
boiler.status.starts_today_date = dateKey();
savePersistentData();
log(DEBUG.INFO, "[INFO] ", "Daily statistics reset");
}
function checkDailyStatisticsReset()
{
let today = dateKey();
if (today === "")
{
return;
}
if (boiler.status.starts_today_date === "")
{
resetDailyStatistics();
return;
}
if (boiler.status.starts_today_date === today)
{
return;
}
resetDailyStatistics();
publishStatus();
}
function loadPersistentData()
{
let json = Script.storage.getItem(STORAGE.KEY);
if (json === null)
{
log(DEBUG.INFO, "[INFO] ", "No persistent data found");
savePersistentData();
return;
}
try
{
persistent = JSON.parse(json);
}
catch(error)
{
log(DEBUG.WARNING, "[WARNING] ", "Persistent data corrupted");
persistent =
{
version         : STORAGE.VERSION,
firmware_boots  : 0,
starts_today    : 0,
starts_today_date : "",
total_starts    : 0,
total_runtime   : 0,
warm_enough     : false,
warm_enough_since : "",
watchdog_reboots : 0,
watchdog_reason : "",
last_watchdog_reboot : 0,
script_error_count : 0,
last_script_error : "",
last_script_error_context : "",
last_script_error_time : ""
};
savePersistentData();
return;
}
if (persistent.version !== STORAGE.VERSION)
{
log(DEBUG.WARNING, "[WARNING] ", "Persistent data version mismatch");
}
copyPersistentToStatus();
log(DEBUG.INFO, "[INFO] ", "Persistent data loaded");
log(DEBUG.INFO, "[INFO] ", "Firmware boots : " + boiler.status.firmware_boots);
log(DEBUG.INFO, "[INFO] ", "Starts today   : " + boiler.status.starts_today);
log(DEBUG.INFO, "[INFO] ", "Total starts   : " + boiler.status.total_starts);
log(DEBUG.INFO, "[INFO] ", "Total runtime  : " + boiler.status.total_runtime + " s");
}
function copyKnownFields(source, target, label)
{
for (let key in source)
{
if (target.hasOwnProperty(key))
{
target[key] = source[key];
log(DEBUG.TRACE, "[TRACE] ", label + "." + key + " = " + target[key]);
}
}
}
function processControllerCommand(command)
{
if (command.reset_statistics === true)
{
resetStatistics();
}
if (command.reset_warm_enough === true)
{
resetWarmEnough();
}
}
function markControllerOnline()
{
if (!boiler.status.controller_online)
{
log(DEBUG.INFO, "[INFO] ", "Controller online");
}
boiler.status.controller_online = true;
boiler.status.watchdog = true;
boiler.status.last_controller_update = "" + monotonicMs;
boiler.status.last_controller_seen = monotonicMs;
}
function processControllerMessage(topic, message)
{
log(DEBUG.INFO, "[INFO] ", "Controller message received");
updateLastMqttSeen();
let data;
try
{
data = JSON.parse(message);
}
catch(error)
{
log(DEBUG.ERROR, "[ERROR] ", "Invalid JSON");
return;
}
if (!data.boiler)
{
log(DEBUG.ERROR, "[ERROR] ", "Missing boiler object");
return;
}
markControllerOnline();
if (data.boiler.command)
{
processControllerCommand(data.boiler.command);
}
if (!data.boiler.config)
{
if (!data.boiler.command)
{
log(DEBUG.ERROR, "[ERROR] ", "Missing config object");
return;
}
if (data.boiler.command.reset_warm_enough === true &&
boiler.status.controller_config_received)
{
evaluateController();
}
publishStatus();
return;
}
copyKnownFields(
data.boiler.config,
boiler.config,
"config"
);
boiler.status.controller_config_received = true;
if (data.boiler.energy)
{
copyKnownFields(
data.boiler.energy,
boiler.energy,
"energy"
);
}
evaluateController();
publishStatus();
}
function mqttInit()
{
log(DEBUG.INFO, "[INFO] ", "MQTT framework initialized");
MQTT.subscribe(
TOPIC.CONTROLLER,
safeCallback(
"processControllerMessage",
processControllerMessage
)
);
log(DEBUG.INFO, "[INFO] ", "Subscribed to " + TOPIC.CONTROLLER);
}
function mqttPublish(topic, object)
{
MQTT.publish(
topic,
JSON.stringify(object),
1,
false
);
}
function publishStatus()
{
boiler.status.last_update = "" + monotonicMs;
let payload =
{
api        : FIRMWARE.API,
source     : "Shelly",
firmware   : FIRMWARE.VERSION,
timestamp  : boiler.status.last_update,
boiler     : boiler
};
mqttPublish(
TOPIC.STATUS,
payload
);
log(DEBUG.TRACE, "[TRACE] ", "Status published");
}
function setState(newState)
{
if (boiler.status.state === newState)
{
return;
}
boiler.status.state = newState;
publishStatus();
log(DEBUG.INFO, "[INFO] ", "State -> " + newState);
}
function updateLastStopReason(reason)
{
if (reason === "")
{
return false;
}
if (!boiler.status.relay && boiler.status.last_stop_reason === reason)
{
return false;
}
boiler.status.last_stop_reason = reason;
boiler.status.last_stop = "" + monotonicMs;
return true;
}
let relaySyncInProgress = false;
let relayCommandInProgress = false;
let relayCommandTarget = null;
let relayPendingTarget = null;
function applyRelayState(on, source)
{
if (boiler.status.relay === on)
{
return false;
}
boiler.status.relay = on;
boiler.status.state = on ? STATE.HEATING : STATE.IDLE;
if (!on)
{
boiler.status.runtime = 0;
}
log(DEBUG.INFO, "[INFO] ", "Relay state synced " + (on ? "ON" : "OFF") + " (" + source + ")");
publishStatus();
return true;
}
function syncRelayState()
{
if (relaySyncInProgress || relayCommandInProgress)
{
return;
}
relaySyncInProgress = true;
try
{
Shelly.call(
"Switch.GetStatus",
{
id : CONFIG.RELAY_ID
},
safeCallback(
"Switch.GetStatus",
function(result, error_code, error_message)
{
relaySyncInProgress = false;
if (error_code !== 0)
{
log(DEBUG.ERROR, "[ERROR] ", "Relay state read failed: " + error_message);
return;
}
if (!result || typeof result.output !== "boolean")
{
log(DEBUG.ERROR, "[ERROR] ", "Relay state read returned invalid data");
return;
}
if (applyRelayState(result.output, "switch"))
{
evaluateController();
}
}
)
);
}
catch(error)
{
relaySyncInProgress = false;
recordScriptError("Switch.GetStatus call", error);
}
}
function setRelay(on)
{
if (relayCommandInProgress)
{
if (relayCommandTarget === on || relayPendingTarget === on)
{
return;
}
relayPendingTarget = on;
log(DEBUG.INFO, "[INFO] ", "Relay switch " + (on ? "ON" : "OFF") + " queued");
return;
}
relayCommandInProgress = true;
relayCommandTarget = on;
try
{
Shelly.call(
"Switch.Set",
{
id : CONFIG.RELAY_ID,
on : on
},
safeCallback(
"Switch.Set",
function(result, error_code, error_message)
{
let pending = relayPendingTarget;
relayCommandInProgress = false;
relayCommandTarget = null;
relayPendingTarget = null;
if (error_code !== 0)
{
log(DEBUG.ERROR, "[ERROR] ", "Relay switch failed: " + error_message);
publishStatus();
}
else
{
applyRelayState(on, "controller");
log(DEBUG.INFO, "[INFO] ", "Relay switched " + (on ? "ON" : "OFF"));
}
if (pending !== null && pending !== boiler.status.relay)
{
setRelay(pending);
}
}
)
);
}
catch(error)
{
relayCommandInProgress = false;
relayCommandTarget = null;
relayPendingTarget = null;
recordScriptError("Switch.Set call", error);
}
}
function relayOn()
{
if (boiler.status.relay ||
relayCommandTarget === true ||
relayPendingTarget === true)
{
return;
}
log(DEBUG.INFO, "[INFO] ", "Relay switch ON requested");
setRelay(true);
}
function relayOff()
{
if ((!boiler.status.relay && relayCommandTarget !== true) ||
relayCommandTarget === false ||
relayPendingTarget === false)
{
return;
}
log(DEBUG.INFO, "[INFO] ", "Relay switch OFF requested");
setRelay(false);
}
function forceRelayOff()
{
log(DEBUG.INFO, "[INFO] ", "Relay force OFF requested");
setRelay(false);
}
function startRestartDelay()
{
if (boiler.status.restart_delay_active)
{
return;
}
boiler.status.restart_delay_active = true;
boiler.status.restart_remaining =
boiler.config.restart_delay;
log(DEBUG.INFO, "[INFO] ",
"Restart delay started (" +
boiler.status.restart_remaining +
" s)"
);
publishStatus();
}
function startBootDelay()
{
boiler.status.boot_delay_active = true;
boiler.status.boot_delay_remaining = CONFIG.BOOT_DELAY;
log(DEBUG.INFO, "[INFO] ",
"Boot delay started (" +
boiler.status.boot_delay_remaining +
" s)"
);
}
function updateBootDelay()
{
if (!boiler.status.boot_delay_active)
{
return;
}
boiler.status.boot_delay_remaining--;
if (boiler.status.boot_delay_remaining > 0)
{
return;
}
boiler.status.boot_delay_active = false;
boiler.status.boot_delay_remaining = 0;
log(DEBUG.INFO, "[INFO] ", "Boot delay expired");
publishStatus();
evaluateController();
}
function startStopHold()
{
boiler.status.stop_hold_active = true;
boiler.status.stop_hold_remaining = boiler.config.stop_hold;
log(DEBUG.INFO, "[INFO] ",
"Stop hold started (" +
boiler.status.stop_hold_remaining +
" s)"
);
}
function updateStopHold()
{
if (!boiler.status.stop_hold_active)
{
return;
}
boiler.status.stop_hold_remaining--;
if (boiler.status.stop_hold_remaining > 0)
{
return;
}
boiler.status.stop_hold_active = false;
boiler.status.stop_hold_remaining = 0;
log(DEBUG.INFO, "[INFO] ", "Stop hold expired");
publishStatus();
evaluateController();
}
function isPeakLimitExceeded()
{
let maxEnergy =
boiler.energy.quarter_max_energy_wh;
let predictedEnergy =
boiler.energy.predicted_with_boiler_wh;
let quarterEnergy =
boiler.energy.quarter_energy_wh;
let latestSafeOff =
boiler.energy.latest_safe_off_seconds;
if (maxEnergy <= 0)
{
return boiler.energy.peak_margin < 0;
}
if (predictedEnergy <= 0)
{
return boiler.energy.peak_margin < 0;
}
if (quarterEnergy >= maxEnergy)
{
return true;
}
if (latestSafeOff > 0)
{
return false;
}
if (!boiler.status.relay)
{
return true;
}
return boiler.status.runtime >= boiler.config.peak_min_on_seconds;
}
function evaluateController()
{
if (boiler.status.boot_delay_active)
{
log(DEBUG.INFO, "[INFO] ", "Boot delay active");
return;
}
if (boiler.status.restart_delay_active)
{
log(DEBUG.INFO, "[INFO] ", "Restart delay active");
forceRelayOff();
return;
}
if (boiler.status.stop_hold_active)
{
log(DEBUG.INFO, "[INFO] ", "Stop hold active");
return;
}
if (!boiler.config.heating_enabled)
{
stopBoiler(STOP_REASON.HEATING_NOT_ALLOWED);
return;
}
if (boiler.status.warm_enough)
{
if (boiler.status.relay)
{
stopBoiler(STOP_REASON.WARM_ENOUGH);
}
log(DEBUG.INFO, "[INFO] ", "Boiler already warm enough");
return;
}
if (isPeakLimitExceeded())
{
log(DEBUG.WARNING, "[WARNING] ", "Peak limit exceeded");
if (boiler.status.relay)
{
startRestartDelay();
stopBoiler(STOP_REASON.PEAK_LIMIT);
}
else if (updateLastStopReason(STOP_REASON.PEAK_LIMIT))
{
publishStatus();
}
return;
}
startBoiler();
}
function startBoiler()
{
if (boiler.status.relay)
{
return;
}
boiler.status.runtime = 0;
boiler.status.starts_today++;
boiler.status.total_starts++;
boiler.status.last_start = "" + monotonicMs;
log(DEBUG.INFO, "[INFO] ", "Boiler started");
savePersistentData();
relayOn();
}
function stopBoiler(reason)
{
if (!boiler.status.relay)
{
if (updateLastStopReason(reason))
{
publishStatus();
}
return;
}
boiler.status.runtime = 0;
updateLastStopReason(reason);
if (reason !== STOP_REASON.WARM_ENOUGH)
{
startStopHold();
}
log(DEBUG.INFO, "[INFO] ", "Boiler stopped (" + reason + ")");
savePersistentData();
relayOff();
}
function resetWarmEnough()
{
if (!boiler.status.warm_enough)
{
return;
}
boiler.status.warm_enough = false;
boiler.status.warm_enough_since = "";
log(DEBUG.INFO, "[INFO] ", "Warm enough flag reset");
savePersistentData();
publishStatus();
}
function markWarmEnough()
{
boiler.status.warm_enough = true;
boiler.status.warm_enough_since = "" + monotonicMs;
log(DEBUG.INFO, "[INFO] ", "Boiler warm enough detected");
}
function isWarmEnoughDetected()
{
if (!boiler.status.relay)
{
return false;
}
if (boiler.status.runtime < CONFIG.WARMUP_MIN_RUNTIME)
{
return false;
}
if (boiler.energy.boiler_power <= 0)
{
return false;
}
return boiler.energy.house_power < boiler.energy.boiler_power;
}
function checkWarmEnough()
{
if (!isWarmEnoughDetected())
{
return false;
}
markWarmEnough();
stopBoiler(STOP_REASON.WARM_ENOUGH);
return true;
}
function systemTimerTask()
{
advanceClock(CONFIG.RUNTIME_INTERVAL);
syncRelayState();
checkDailyStatisticsReset();
checkControllerWatchdog();
updateBootDelay();
updateStopHold();
if (boiler.status.relay)
{
boiler.status.runtime++;
boiler.status.total_runtime++;
if (checkWarmEnough())
{
return;
}
if (boiler.status.runtime >= boiler.config.max_runtime)
{
log(DEBUG.WARNING, "[WARNING] ", "Maximum runtime exceeded");
startRestartDelay();
stopBoiler(STOP_REASON.MAX_RUNTIME);
}
}
if (boiler.status.restart_delay_active)
{
if (boiler.status.relay)
{
relayOff();
}
boiler.status.restart_remaining--;
if (boiler.status.restart_remaining <= 0)
{
boiler.status.restart_delay_active = false;
boiler.status.restart_remaining = 0;
log(DEBUG.INFO, "[INFO] ", "Restart delay expired");
publishStatus();
evaluateController();
}
}
}
function checkControllerWatchdog()
{
if (boiler.status.last_controller_seen === 0)
{
return;
}
if (!boiler.status.controller_online)
{
return;
}
if ((monotonicMs - boiler.status.last_controller_seen) <= CONFIG.CONTROLLER_TIMEOUT)
{
return;
}
boiler.status.controller_online = false;
boiler.status.watchdog = false;
log(DEBUG.WARNING, "[WARNING] ", "Controller offline");
publishStatus();
}
function updateLastMqttSeen()
{
boiler.status.last_mqtt_seen = "" + monotonicMs;
boiler.status.last_mqtt_seen_ms = monotonicMs;
}
function updateControllerAge()
{
if (boiler.status.last_controller_seen === 0)
{
boiler.status.last_controller_age = 0;
return;
}
boiler.status.last_controller_age = Math.round(
(monotonicMs - boiler.status.last_controller_seen) / 1000
);
}
function updateDiagnostics(status)
{
if (status.sys)
{
if (status.sys.uptime > 0)
{
monotonicMs = Math.round(status.sys.uptime * 1000);
}
if (status.sys.unixtime > 0)
{
wallClockSeconds = status.sys.unixtime;
}
boiler.status.uptime = status.sys.uptime || 0;
boiler.status.ram_free = status.sys.ram_free || 0;
}
if (status.wifi)
{
boiler.status.wifi_rssi = status.wifi.rssi || 0;
boiler.status.wifi_connected =
status.wifi.status === "got ip" ||
status.wifi.status === "connected";
}
if (status.mqtt)
{
boiler.status.mqtt_connected =
status.mqtt.connected === true;
if (boiler.status.mqtt_connected)
{
updateLastMqttSeen();
}
}
boiler.status.script_version = FIRMWARE.VERSION;
updateControllerAge();
}
function updateDeviceInfo(info)
{
boiler.status.firmware_version =
info.ver ||
info.fw_id ||
info.version ||
boiler.status.firmware_version;
boiler.status.script_version = FIRMWARE.VERSION;
}
function publishWatchdogStatus()
{
evaluateSoftwareWatchdog();
publishStatus();
}
function watchdogProblemReason()
{
if (!boiler.status.wifi_connected)
{
return "wifi disconnected";
}
if (!boiler.status.mqtt_connected)
{
return "mqtt disconnected";
}
return "";
}
function resetWatchdogProblem()
{
if (boiler.status.watchdog_problem_since === 0)
{
return;
}
boiler.status.watchdog_problem_since = 0;
boiler.status.watchdog_reason = "";
log(DEBUG.INFO, "[INFO] ", "Watchdog healthy");
}
function canWatchdogReboot()
{
let uptime = boiler.status.uptime;
if (uptime <= 0 && boiler.status.watchdog_problem_since > 0)
{
uptime = Math.round(
(monotonicMs - boiler.status.watchdog_problem_since) / 1000
);
}
if (uptime < CONFIG.WATCHDOG_MIN_UPTIME)
{
return false;
}
if (boiler.status.last_watchdog_reboot === 0)
{
return true;
}
if (monotonicMs < boiler.status.last_watchdog_reboot)
{
return true;
}
return (monotonicMs - boiler.status.last_watchdog_reboot) >
CONFIG.WATCHDOG_REBOOT_GAP;
}
function performWatchdogReboot(reason)
{
boiler.status.watchdog_reboots++;
boiler.status.watchdog_reason = reason;
boiler.status.last_watchdog_reboot = monotonicMs;
savePersistentData();
publishStatus();
log(DEBUG.ERROR, "[ERROR] ", "Watchdog reboot: " + reason);
Shelly.call("Shelly.Reboot");
}
function evaluateSoftwareWatchdog()
{
let reason = watchdogProblemReason();
handleWatchdogReason(reason);
}
function handleWatchdogReason(reason)
{
if (reason === "")
{
resetWatchdogProblem();
return;
}
if (boiler.status.watchdog_problem_since === 0)
{
boiler.status.watchdog_problem_since = monotonicMs;
boiler.status.watchdog_reason = reason;
log(DEBUG.WARNING, "[WARNING] ", "Watchdog problem: " + reason);
return;
}
boiler.status.watchdog_reason = reason;
if ((monotonicMs - boiler.status.watchdog_problem_since) <
CONFIG.WATCHDOG_TIMEOUT)
{
return;
}
if (!canWatchdogReboot())
{
log(DEBUG.WARNING, "[WARNING] ", "Watchdog reboot suppressed: " + reason);
return;
}
performWatchdogReboot(reason);
}
function watchdogTask()
{
Shelly.call(
"Shelly.GetStatus",
{},
safeCallback(
"Shelly.GetStatus",
function(result, error_code, error_message)
{
if (error_code !== 0)
{
handleWatchdogReason(
"diagnostics failed: " + error_message
);
publishStatus();
return;
}
updateDiagnostics(result);
Shelly.call(
"Shelly.GetDeviceInfo",
{},
safeCallback(
"Shelly.GetDeviceInfo",
function(info, info_error_code, info_error_message)
{
if (info_error_code === 0)
{
updateDeviceInfo(info);
}
else
{
log(DEBUG.WARNING, "[WARNING] ",
"Device info failed: " +
info_error_message
);
}
publishWatchdogStatus();
}
)
);
}
)
);
}
function heartbeatTask()
{
watchdogTask();
}
function main()
{
log(DEBUG.INFO, "[INFO] ", "========================================");
log(DEBUG.INFO, "[INFO] ", FIRMWARE.NAME);
log(DEBUG.INFO, "[INFO] ", "Version : " + FIRMWARE.VERSION);
log(DEBUG.INFO, "[INFO] ", "========================================");
loadPersistentData();
boiler.status.firmware_boots++;
savePersistentData();
forceRelayOff();
startBootDelay();
mqttInit();
checkDailyStatisticsReset();
publishStatus();
Timer.set(
CONFIG.WATCHDOG_INTERVAL,
true,
function()
{
safeCall("heartbeatTask", heartbeatTask);
}
);
Timer.set(
CONFIG.RUNTIME_INTERVAL,
true,
function()
{
safeCall("systemTimerTask", systemTimerTask);
}
);
setState(STATE.IDLE);
log(DEBUG.INFO, "[INFO] ", "Startup completed");
}
safeCall("main", main);