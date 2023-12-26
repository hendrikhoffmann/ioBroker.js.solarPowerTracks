# ioBroker.js.solarPowerTracks
A javascript for ioBroker that calculates power values [kW] out of yield values [kWh]
This script is intended to enhance solar and energy monitoring.
It runs inside the ioBroker Javacript engine.

Most energy meters and solar monitoring systems provide a total-prodction data value [kWh].
From this value, productions for certain time intervalls [kWh] and average power values [kW] can be derived derived.

The script takes a user definalbe nuber of energy meter yield tracks and stores new values for
- monthly production/consumption [kWh]
- weekly production/consumption [kWh]
- daily production/consumption [kWh]
- hourly production/consumption [kWh]
- 15 min production/consumption [kWh] 
- 10 min production/consumption [kWh] 
- 1 min production/consumption [kWh] 
- production/consumption since last data update [kWh] 

- average power [kW] during last 15 min
- average power [kW] during last 10 min
- average power [kW] during last 1 min
- average power [kW] since last data update [kWh] 
