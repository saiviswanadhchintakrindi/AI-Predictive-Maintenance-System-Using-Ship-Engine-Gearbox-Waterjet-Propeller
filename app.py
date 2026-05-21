from flask import Flask, request, jsonify, render_template
import joblib
import numpy as np

app = Flask(__name__)

# Load models
health_model = joblib.load("health_model.pkl")
alert_fault_model = joblib.load("alert_fault_model.pkl")
le_alert = joblib.load("le_alert.pkl")
le_fault = joblib.load("le_fault.pkl")
gearbox_pipeline = joblib.load("gearbox_pipeline.pkl")
waterjet_pipeline = joblib.load("waterjet_pipeline.pkl")

@app.route('/')
def home():
    return render_template("index.html")

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        equipment_type = data.get("equipment_type", "engine")

        if equipment_type == "engine":
            # Feature order must match training
            features = np.array([[ 
                float(data['Load']),
                float(data['Torque']),   # ✅ now from user
                float(data['Temperature']),
                float(data['Torsional_Vibration']),
                float(data['Lateral_Vibration']),
                float(data['Fuel_Rate'])
            ]])

            # Predict Health Score
            health_score = health_model.predict(features)[0]

            # Predict Alert + Fault
            pred = alert_fault_model.predict(features)

            alert = le_alert.inverse_transform([pred[0][0]])[0]
            fault = le_fault.inverse_transform([pred[0][1]])[0]

            return jsonify({
                "equipment_type": "engine",
                "health_score": round(float(health_score), 2),
                "alert": alert,
                "fault_type": fault
            })
            
        elif equipment_type == "gearbox":
            features = np.array([[
                float(data['Input_RPM']),
                float(data['Output_RPM']),
                float(data['Torque']),
                float(data['Temperature']),
                float(data['Vibration']),
                float(data['Gear_Ratio'])
            ]])
            
            model = gearbox_pipeline['model']
            scaler = gearbox_pipeline['scaler']
            le = gearbox_pipeline['label_encoder']
            
            scaled_features = scaler.transform(features)
            pred = model.predict(scaled_features)
            fault = le.inverse_transform(pred)[0]
            
            # Derive alert state from fault
            alert = "Good" if fault.lower() == "normal" else "Critical"
            
            return jsonify({
                "equipment_type": "gearbox",
                "health_score": None,
                "alert": alert,
                "fault_type": fault
            })

        elif equipment_type == "waterjet":
            features = np.array([[
                float(data['rpm']),
                float(data['pressure']),
                float(data['flow_rate']),
                float(data['nozzle_diameter']),
                float(data['jet_velocity']),
                float(data['vibration'])
            ]])
            
            model = waterjet_pipeline['model']
            scaler = waterjet_pipeline['scaler']
            le = waterjet_pipeline['label_encoder']
            
            scaled_features = scaler.transform(features)
            pred = model.predict(scaled_features)
            fault = le.inverse_transform(pred)[0]
            
            # Derive alert state from fault
            alert = "Good" if fault.lower() == "normal" else "Critical"
            
            return jsonify({
                "equipment_type": "waterjet",
                "health_score": None,
                "alert": alert,
                "fault_type": fault
            })

    except Exception as e:
        return jsonify({"error": str(e)})

if __name__ == '__main__':
    app.run(debug=True)