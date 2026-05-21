import joblib

try:
    pipeline = joblib.load("gearbox_pipeline.pkl")
    print(type(pipeline))
    if isinstance(pipeline, dict):
        print("Keys:", pipeline.keys())
        for key, value in pipeline.items():
            print(f"Key: {key}, Type: {type(value)}")
            if hasattr(value, "feature_names_in_"):
                print(f"Features for {key}:", value.feature_names_in_)
            elif hasattr(value, "named_steps"):
                print(f"Steps for {key}:", value.named_steps.keys())
                for step_name, step in value.named_steps.items():
                    if hasattr(step, "feature_names_in_"):
                        print(f"  Features for step {step_name}:", step.feature_names_in_)
            if hasattr(value, "classes_"):
                print(f"Classes for {key}:", value.classes_)
except Exception as e:
    print("Error:", e)
