//
// This script is intended to enhance solar and energy monitoring.
// it runs inside the ioBroker Javacript engine

// Most energy meters and solar monitoring systems provide a total-prodction data value [kWh].
// From this value productions for certain time intervalls [kWh] and average power values [kW] are derived.
// feel free to add/remove time intervalls by initializing the aYielsDeltaCrons Map.

const debug           = false;

// ----- START CONFIGURATION PART

// Add your energy meters to the map
// Insert the existing source energy meter value names and define corresponding target value names
// the target value names with all values will be created in your value tree
// remove the examples
var aEnergyMeters = new Map();

// example: a Grid-connected Energy Meter, consumption only
aEnergyMeters.set('smartmeter.0.1-0:1_8_0__0.value', 'javascript.0.Strom_Wärmepumpe.'); /*Stromverbrauch Wärmepume insgesamt in kWh*/

// example: a Grid-connected Energy Meter, consumption and production
aEnergyMeters.set('smartmeter.1.1-0:1_8_0__255.value', 'javascript.0.Strom_Allgemein.');  /*Stromverbrauch Allgemein insgesamt in kWh*/
aEnergyMeters.set('smartmeter.1.1-0:2_8_0__255.value', 'javascript.0.Strom_Einspeisung.');  /*Stromeinspeisung Allgemein insgesamt in kWh*/

// example: a Hoymiles HM-600 Solar Inverter connected through MQTT and https://github.com/tbnobody/OpenDTU
aEnergyMeters.set('mqtt.0.solar.11417xxxxxxx.0.yieldtotal', 'javascript.0.Ertrag_Carport.');  /*Ertrag Carport insgesamt in kWh*/

// example: a Growatt Solar Inverter connected through Growatt Shine API
aEnergyMeters.set('growatt.0.1001xxx.devices.PYHxxxxxxx.deviceData.eTotal', 'javascript.0.Ertrag_Schuppen.');  /*Ertrag Schuppen insgesamt in kWh*/

// ------ END CONFIGURATION PART


var aYieldDeltaCrons = new Map();
// Maps Value Names to Cron Intervals and Multiplicators for the Power Track (if Multiplicator is !=0, a Power Track is created and the yield during the interval is multiplied by the multiplicator to derive kW from kWh)
aYieldDeltaCrons.set ("Hour",["0 * * * *",0]);
aYieldDeltaCrons.set ("Day",["59 23 * * *",0]);
aYieldDeltaCrons.set ("Week",["0 0 * * 1",0]);
aYieldDeltaCrons.set ("Month",["0 0 1 * *",0]);
aYieldDeltaCrons.set ("15Min",["*/15 * * * *",4]);
aYieldDeltaCrons.set ("10Min",["*/10 * * * *",6]);
aYieldDeltaCrons.set ("1Min",["* * * * *",60]);
aYieldDeltaCrons.set ("Tick",["-n/a-",120]); // Tick is special, it fires on value change instead of cron schedule, we assume once per 30 sec

function calculateDeltaYield (idLast, idDelta, idSourceEMeter, idPower, iPowerMultiplicator) {
    const nLast = parseFloat(getState(idLast).val);
    const nActual = parseFloat(getState(idSourceEMeter).val);
    const nDiff = ((nActual) - (nLast));
    setState(idDelta, nDiff, true);
    setState(idLast, nActual, true);
    if (iPowerMultiplicator != 0) {
        const nPower = nDiff * parseFloat(iPowerMultiplicator);
        setState(idPower, nPower, true);
    }

    if(debug) log("processing " + idSourceEMeter + " Value: " + nActual + " "+ idDelta +" Delta: "+ nDiff );
}

// Initialize Values and Cron-Jobs
for (var [sourceEMeter, destYieldDevice] of aEnergyMeters) {
    if(debug) log("Processing Energy Meter:" + sourceEMeter + " creating " + destYieldDevice );

    const sUnitkWh          = "kWh"; 
    const sUnitkW           = "kW"; 
    const nInitialYield = parseFloat(getState(sourceEMeter).val);

    for (var [sDelta, aCronDefAndPower] of aYieldDeltaCrons) {
        const sCronDefinition = aCronDefAndPower[0];
        const iPowerMultiplicator = aCronDefAndPower[1];

        const sYieldDevSplit = destYieldDevice.split(".");
        const sYieldDevName = sYieldDevSplit[sYieldDevSplit.length - 2];

        const sDescriptionYield = sYieldDevName + " delta " + sDelta;
        const sDescriptionPower = sYieldDevName + " Power " + sDelta;
        const sLastDescription = sYieldDevName + " total at last " + sDelta;
        const idLast = destYieldDevice + "last_" + sDelta;
        const idPower = destYieldDevice + "power_" + sDelta;
        const idIntegral = destYieldDevice + sDelta;
        const idEMeter = sourceEMeter;
        if (iPowerMultiplicator != 0) {
            createState(idPower, 0, {
                name: sDescriptionPower,
                desc: sDescriptionPower,
                type: 'number',
                unit: sUnitkW,
                role: 'value'
            });
        }
        createState(idIntegral, 0, {
            name: sDescriptionYield,
            desc: sDescriptionYield,
            type: 'number',
            unit: sUnitkWh,
            role: 'value'
        });
        createState(idLast, nInitialYield, {
            name: sLastDescription,
            desc: sLastDescription,
            type: 'number',
            unit: sUnitkWh,
            role: 'value'
        });
        if (sDelta == "Tick") {
            on ({id: idEMeter, change: 'any'}, function(data) {
                calculateDeltaYield(idLast, idIntegral, idEMeter,idPower, iPowerMultiplicator);
            });
        }else {
            schedule(sCronDefinition, function () {
                calculateDeltaYield(idLast, idIntegral, idEMeter, idPower, iPowerMultiplicator);
            });
        }
    };
};

