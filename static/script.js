// ✅ Fault → Solution mapping
function getSolution(fault) {
    if (!fault) return "No data available.";

    fault = fault.toLowerCase();

    if (fault.includes("bearing")) {
       return "• Inspect lubrication levels and quality check for contaminants.\n" +
       "• Monitor for unusual noise or localized heat buildup.\n" +
       "• Schedule a bearing replacement or overhaul before a total seizure occurs.";
    }
    else if (fault.includes("overload")) {
        return "• Reduce the operational load or RPM immediately to prevent overheating.\n" +
       "• Inspect for mechanical obstructions or increased friction in the system.\n" +
       "• Verify that the engine is operating within its rated power and torque curve.";
    } 
    else if (fault.includes("cooling")) {
        return "• Check coolant levels and inspect for leaks in the piping or radiator.\n" +
       "• Inspect the cooling pump and thermostat for proper operation.\n" +
       "• Clean the heat exchangers or sea-strainers to ensure adequate heat transfer.";
    } 
    else if (fault.includes("misalignment")) {
       return "• Perform a laser alignment or dial indicator check on the shaft and couplings.\n" +
       "• Inspect mounts and foundation bolts for looseness or wear.\n" +
       "• Re-align the engine and driven component to manufacturer specifications.";
    } 
    else if (fault.includes("imbalance")) {
        return "Balance rotating parts and inspect for uneven wear.";
    } 
    else if (fault.includes("gear wear")) {
        return "• Check gearbox oil for metal particles and verify proper lubrication.\n" +
        "• Monitor vibration signatures for increasing gear mesh frequencies.\n" +
        "• Schedule gearbox inspection and plan for gear replacement during next maintenance window.";
    }
    else if (fault.includes("tooth breakage")) {
        return "• CRITICAL: Stop operation immediately to prevent catastrophic gearbox failure.\n" +
        "• Drain oil and inspect for broken tooth fragments.\n" +
        "• Replace affected gear components and perform a full internal inspection.";
    }
    else if (fault.includes("blockage")) {
        return "• Check waterjet intake for debris or marine growth and clear immediately.\n" +
        "• Monitor pressure readings to ensure normal flow is restored.\n" +
        "• Inspect the nozzle for partial obstructions.";
    }
    else if (fault.includes("cavitation")) {
        return "• Reduce RPM immediately to minimize cavitation damage to the impeller.\n" +
        "• Check for air ingestion in the intake or improper hull flow.\n" +
        "• Schedule an inspection of the impeller and wear ring for pitting.";
    }
    else if (fault.includes("none") || fault.includes("normal")) {
        return "No immediate action required. Continue regular scheduled maintenance and monitoring.";
    } 
    else {
        return "Perform inspection and schedule maintenance.";
    }
}


let currentEquipment = 'engine';

function setEquipment(equipment) {
    currentEquipment = equipment;

    // Update buttons
    document.getElementById('btnEngine').classList.toggle('active', equipment === 'engine');
    document.getElementById('btnGearbox').classList.toggle('active', equipment === 'gearbox');
    document.getElementById('btnWaterjet').classList.toggle('active', equipment === 'waterjet');

    // Update form visibility
    document.getElementById('engineInputs').classList.toggle('hidden', equipment !== 'engine');
    document.getElementById('gearboxInputs').classList.toggle('hidden', equipment !== 'gearbox');
    document.getElementById('waterjetInputs').classList.toggle('hidden', equipment !== 'waterjet');
    
    // Update constant info visibility
    const engineConstantInfo = document.getElementById('engineConstantInfo');
    if (engineConstantInfo) {
        engineConstantInfo.classList.toggle('hidden', equipment !== 'engine');
    }

    // Toggle required fields so HTML validation doesn't block submit on hidden fields
    const engineFields = document.getElementById('engineInputs').querySelectorAll('input');
    engineFields.forEach(el => el.required = (equipment === 'engine'));

    const gearboxFields = document.getElementById('gearboxInputs').querySelectorAll('input');
    gearboxFields.forEach(el => el.required = (equipment === 'gearbox'));

    const waterjetFields = document.getElementById('waterjetInputs').querySelectorAll('input');
    waterjetFields.forEach(el => el.required = (equipment === 'waterjet'));

    // Hide/show health score (only visible for engine)
    document.getElementById('healthScoreContainer').classList.toggle('hidden', equipment !== 'engine');
    
    // Reset results
    document.getElementById("meterValue").innerText = "--";
    document.getElementById("meterFill").style.strokeDasharray = "0, 100";
    document.getElementById("meterFill").style.stroke = "#34d399";
    document.getElementById("alertResult").innerText = "Pending...";
    document.getElementById("faultResult").innerText = "None";
    if (document.getElementById("solutionText")) {
        document.getElementById("solutionText").innerText = "No recommendation yet";
    }
    const alertBoxUI = document.getElementById("alertBoxUI");
    alertBoxUI.className = "alert-box";

    // Scroll to the top of the page smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 🚀 Form submit
document.getElementById("predictionForm").addEventListener("submit", async function(e) {
    e.preventDefault();

    try {
        const formData = new FormData(this);
        let data = {};

        if (currentEquipment === 'engine') {
            data = {
                equipment_type: 'engine',
                Load: parseFloat(formData.get("Load")),
                Torque: parseFloat(formData.get("Torque")),
                Temperature: parseFloat(formData.get("Temperature")),
                Torsional_Vibration: parseFloat(formData.get("Torsional_Vibration")),
                Lateral_Vibration: parseFloat(formData.get("Lateral_Vibration")),
                Fuel_Rate: parseFloat(formData.get("Fuel_Rate"))
            };
        } else if (currentEquipment === 'gearbox') {
            data = {
                equipment_type: 'gearbox',
                Input_RPM: parseFloat(formData.get("Input_RPM")),
                Output_RPM: parseFloat(formData.get("Output_RPM")),
                Torque: parseFloat(formData.get("TorqueGearbox")),
                Temperature: parseFloat(formData.get("TemperatureGearbox")),
                Vibration: parseFloat(formData.get("Vibration")),
                Gear_Ratio: parseFloat(formData.get("Gear_Ratio"))
            };
        } else if (currentEquipment === 'waterjet') {
            data = {
                equipment_type: 'waterjet',
                rpm: parseFloat(formData.get("Waterjet_RPM")),
                pressure: parseFloat(formData.get("Waterjet_Pressure")),
                flow_rate: parseFloat(formData.get("Flow_Rate")),
                nozzle_diameter: parseFloat(formData.get("Nozzle_Diameter")),
                jet_velocity: parseFloat(formData.get("Jet_Velocity")),
                vibration: parseFloat(formData.get("Waterjet_Vibration"))
            };
        }

        const response = await fetch("/predict", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(data)
        });

        const result = await response.json();
        console.log(result);

        if (result.error) {
            alert("Backend Error: " + result.error);
            return;
        }

        const healthBox = document.getElementById("meterValue");
        const alertBox = document.getElementById("alertResult");
        const faultBox = document.getElementById("faultResult");
        const solutionText = document.getElementById("solutionText");

        // 🎯 Health meter (only for engine)
        if (currentEquipment === 'engine' && result.health_score !== null) {
            const value = result.health_score;
            const clampedValue = Math.min(Math.max(value, 0), 100);

            document.getElementById("meterFill").style.strokeDasharray = `${clampedValue}, 100`;

            let strokeColor = "#34d399";
            if (value < 50) strokeColor = "#f87171";
            else if (value < 80) strokeColor = "#fbd38d";

            document.getElementById("meterFill").style.stroke = strokeColor;
            healthBox.innerText = value;
        }

        // 🚨 Alert
        alertBox.innerText = result.alert;

        // ⚙️ Fault
        faultBox.innerText = result.fault_type;

        // 🛠️ Solution
        if (solutionText) {
            solutionText.innerText = getSolution(result.fault_type);
        }

        // Alert color UI
        const alertBoxUI = document.getElementById("alertBoxUI");
        alertBoxUI.className = "alert-box";

        if (result.alert.toLowerCase() === "good") {
            alertBoxUI.classList.add("state-normal");
        } else if (result.alert.toLowerCase().includes("warning")) {
            alertBoxUI.classList.add("state-warning");
        } else {
            alertBoxUI.classList.add("state-danger");
        }

    } catch (err) {
        console.error("ERROR:", err);
        alert("Something went wrong. Check console (F12).");
    }
});


// 🔥 Scroll animation
const elements = document.querySelectorAll(".fade-in");

const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add("show");
        }
    });
}, { threshold: 0.2 });

elements.forEach(el => observer.observe(el));   