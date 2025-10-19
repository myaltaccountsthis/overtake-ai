import json
import math
import numpy as np
from datetime import datetime

from model.track_util import get_track_info # needs to have model. to run, can't have to train

PERCENTAGE_SUBDIVISIONS = 8
EACH_PERCENTAGE = 1 / PERCENTAGE_SUBDIVISIONS
NUM_GEARS = 10

def get_lap_percentage_subdivision(percentage: float):
    arr = np.zeros((PERCENTAGE_SUBDIVISIONS + 1,))
    index = min(math.ceil(percentage * PERCENTAGE_SUBDIVISIONS), PERCENTAGE_SUBDIVISIONS)
    arr[index - 1] = index - percentage / EACH_PERCENTAGE
    arr[index] = 1 - arr[index - 1]
    return arr

def preprocess_frame(entry: dict) -> np.ndarray:
    speed = entry["speed"]
    throttle = entry["throttle"]
    brake = entry["brake"]
    rpm = entry["rpm"]
    n_gear = entry["n_gear"]
    drs = 1 if entry["drs"] >= 10 else 0


    # gear_one_hot = [0] * NUM_GEARS
    # gear_one_hot[n_gear] = 1

    lap_percentage = entry["track_percent"]
    lap_percentage_subdivision = get_lap_percentage_subdivision(lap_percentage)

    # features = np.concatenate([np.array([speed, throttle, brake, rpm, drs]), gear_one_hot, lap_percentage_subdivision])
    features = np.concatenate([np.array([speed, throttle, brake, rpm, drs, n_gear]), lap_percentage_subdivision])
    return features

# Preprocess the data
def preprocess_data(file_path: str) -> tuple[list, list]:
    data, corner_points = get_track_info(file_path)

    features_list = []
    labels = []

    for i in range(len(data)):
        entry = data[i]
        features = preprocess_frame(entry)
        features_list.append(features)

        # labels.append((data[i + 1]["track_percent"] - entry["track_percent"]) / (datetime.fromisoformat(data[i + 1]["date"]).timestamp() - datetime.fromisoformat(entry["date"]).timestamp()))
        labels.append(data[i]["percent_per_second"])
        if labels[-1] < 0:
            print("Negative label detected:", features_list[-1], labels[-1])
        # labels.append(data[i + 1]["track_percent"] - entry["track_percent"])

    return np.array(features_list), np.array(labels)

    # data = list[{"date": "2025-05-04T19:07:41.269000+00:00", "session_key": 10033, "driver_number": 55, "speed": 0, "brake": 0, "rpm": 0, "n_gear": 0, "drs": 0, "meeting_key": 1259, "throttle": 0, "x": -0.09701424016157034, "y": 0.02749757393235086, "z": -0.007114960805381543}]
    features_list = []
    labels = []  # Placeholder for labels if needed

    for i in range(len(data) - 3):
        entry = data[i]
        # timestamp = datetime.fromisoformat(entry["date"]).timestamp()
        speed = entry["speed"]
        throttle = entry["throttle"]
        brake = entry["brake"]
        rpm = entry["rpm"]
        n_gear = entry["n_gear"]
        drs = 1 if entry["drs"] >= 10 else 0

        # somehow get the lap percentage
        gear_one_hot = [0] * NUM_GEARS
        gear_one_hot[n_gear] = 1

        lap_percentage = entry["track_percent"]
        lap_percentage_subdivision = get_lap_percentage_subdivision(lap_percentage)

        features = np.concatenate([np.array([speed, throttle, brake, rpm, drs]), gear_one_hot, lap_percentage_subdivision])

        # Append the features to the list
        features_list.append(features)

        labels.append(data[i + 3]["track_percent"] - lap_percentage)

    return features_list, labels


if __name__ == "__main__":
    preprocess_data("data/car_data.json")
    # print(get_lap_percentage_subdivision(.5))
    # print(get_lap_percentage_subdivision(.48))
    # print(get_lap_percentage_subdivision(.83))
    # print(get_lap_percentage_subdivision(1))