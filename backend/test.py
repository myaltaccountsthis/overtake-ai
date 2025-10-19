from datetime import datetime, timedelta
import requests
import json
import matplotlib.pyplot as plt

class Session:
    def __init__(self, session_key, default_driver = 55):
        self.session_key = session_key
        self.default_driver = default_driver
        self.session_data = self.fetch("sessions")[0]

        self.session_start = datetime.fromisoformat(self.fetch("car_data", {"driver_number": default_driver, "speed": 0})[0]["date"])
        self.session_end = datetime.fromisoformat(self.fetch("car_data", {"driver_number": default_driver, "speed": 0})[-1]["date"])


    def fetch(self, path, params: dict = {}):
        url = f"https://api.openf1.org/v1/{path}"
        params["session_key"] = self.session_key
        print(params)
        response = requests.get(url, params=params, timeout=30)
        response.raise_for_status()
        return response.json()

    def fetch_interval(self, path, start: datetime, end: datetime, params: dict = {}):
        start_iso = start.isoformat()
        end_iso = end.isoformat()
        params = {"date>": start_iso, "date<": end_iso, **params}
        return self.fetch(path, params)

    def fetch_all(self, path, params: dict = {}):
        timestamp = self.session_start
        all_data = []
        while timestamp < self.session_end:
            chunk_end = min(timestamp.replace(microsecond=920983) + timedelta(minutes=120), self.session_end)
            chunk_data = self.fetch_interval(path, timestamp, chunk_end, params)
            all_data.extend(chunk_data)
            timestamp = chunk_end

        return all_data


session = Session(10033)
print(session.session_start.isoformat(), session.session_end.isoformat())

# Fetch location points for driver 55 across the whole session using params dict
points = session.fetch_all(
    "location",
    {"driver_number": 55},
)

car_data = session.fetch_all(
    "car_data",
    {"driver_number": 55},
)

loc_index = 0
for entry in car_data:
    while loc_index < len(points) - 1 and datetime.fromisoformat(points[loc_index]["date"]) < datetime.fromisoformat(entry["date"]):
        loc_index += 1
    location = points[loc_index]
    pos = (location["x"], location["y"], location["z"])
    if datetime.fromisoformat(location["date"]) >= datetime.fromisoformat(entry["date"]):
        # Linearly interpolate between this point and the previous one
        prev_location = points[loc_index - 1]
        prev_pos = (prev_location["x"], prev_location["y"], prev_location["z"])
        t1 = (datetime.fromisoformat(entry["date"]) - datetime.fromisoformat(prev_location["date"])).total_seconds()
        t2 = (datetime.fromisoformat(location["date"]) - datetime.fromisoformat(prev_location["date"])).total_seconds()
        pos = (
            prev_pos[0] + (pos[0] - prev_pos[0]) * t1 / t2,
            prev_pos[1] + (pos[1] - prev_pos[1]) * t1 / t2,
            prev_pos[2] + (pos[2] - prev_pos[2]) * t1 / t2,
        )

    entry["x"], entry["y"], entry["z"] = pos

with open("data/car_data.json", "w") as file:
    json.dump(car_data, file)

# with open("data/location.json", "w") as file:
#     json.dump(points, file)

# Only use a fraction of the data for plotting to keep it light
# points = points[::10]  # Take every 10th point

# Extract x and y coordinates
x_coords = [point['x'] for point in car_data]
y_coords = [point['y'] for point in car_data]

# Create 2D scatter plot
plt.figure(figsize=(10, 8))
plt.scatter(x_coords, y_coords, alpha=0.2, s=5)
plt.xlabel('X Coordinate')
plt.ylabel('Y Coordinate')
plt.title('2D Scatter Plot of Location Data')
plt.grid(True, alpha=0.3)
plt.axis('equal')
plt.show()

