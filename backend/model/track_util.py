from pathlib import Path
import json
from typing import List, Dict, Any, Tuple
from datetime import datetime

def load_car_data(path: str = None) -> List[Dict[str, Any]]:
    """
    Load JSON from a file named 'car_data.json' (by default) and return a list of dicts.
    Accepts JSON that is:
      - a list of objects -> returned as-is (filtered to dicts)
      - an object whose values are objects -> returned as list(values)
      - a single object -> returned as [object]
    """
    if path is None:
        path = Path(__file__).parent / "car_data.json"
    path = Path(path)

    if not path.exists():
        raise FileNotFoundError(f"Car data file not found: {path}")

    with path.open("r", encoding="utf-8") as fh:
        data = json.load(fh)

    # Normalize to list[dict]
    if isinstance(data, list):
        return [item for item in data if isinstance(item, dict)]
    if isinstance(data, dict):
        # If it's a mapping of id -> object, return the values
        values = [v for v in data.values() if isinstance(v, dict)]
        if values:
            return values
        # Otherwise, treat the dict itself as a single record
        return [data]

    raise ValueError("Unsupported JSON format for car data; expected object or list of objects.")

def preprocess_car_data(cars: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Preprocess car data by removing ones with zero x, y, z coordinates.
    """
    cars = list(filter(lambda car: all(abs(car[coord]) > 1 for coord in ["x", "y", "z"]), cars))
    cars = list(filter(lambda car: car["speed"] >= 50, cars))
    cars = cars[1115:]  # Remove initial invalid data, specific value that's near start
    return cars

def distance(p1: Tuple[float, float], p2: Tuple[float, float]) -> float:
    """
    Calculate Euclidean distance between two points.
    """
    return ((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2) ** 0.5

def get_corner_points(cars: List[Dict[str, Any]]) -> List[Tuple[float, float]]:
    """
    Identify corner points in the car data based on changes in direction.
    Returns a list of (x, y) tuples representing corner points.
    """
    corner_points = []
    direction = (cars[1]['x'] - cars[0]['x'], cars[1]['y'] - cars[0]['y'])
    prev = (cars[0]['x'], cars[0]['y'])
    for i in range(len(cars) - 1):
        prev_car = cars[i - 1]
        curr_car = cars[i]

        vec = (curr_car['x'] - prev_car['x'], curr_car['y'] - prev_car['y'])
        mag_dir = (distance((0, 0), direction))
        mag_vec = (distance((0, 0), vec))
        direction = (direction[0] / mag_dir * mag_vec, direction[1] / mag_dir * mag_vec)

        prev = (prev[0] + direction[0], prev[1] + direction[1])

        if len(corner_points) > 1 and distance(corner_points[0], (curr_car['x'], curr_car['y'])) < 100:
            break

        if distance(prev, (curr_car['x'], curr_car['y'])) > 150:
            direction = (curr_car['x'] - prev_car['x'], curr_car['y'] - prev_car['y'])
            prev = (curr_car['x'], curr_car['y'])
            corner_points.append((curr_car['x'], curr_car['y']))


    return corner_points

def get_dist_from_track_and_dist(pos: Tuple[float, float], corner_points: List[Tuple[float, float]], turn_local: bool = False) -> Tuple[float, float]:
    """
    Calculate the distance from the track based on corner points.
    """
    assert len(corner_points) > 1

    distance_covered = 0.0
    total_length = distance(corner_points[0], corner_points[-1])
    for i in range(len(corner_points) - 1):
        total_length += distance(corner_points[i], corner_points[i + 1])
    closest_dist = float('inf')
    closest_percent = 0.0
    for i in range(len(corner_points)):
        start = corner_points[i]
        end = corner_points[(i + 1) % len(corner_points)]
        segment_length = distance(start, end)
        assert segment_length > 0.0

        dist_to_segment = min(distance(pos, start), distance(pos, end))
        seg = (end[0] - start[0], end[1] - start[1])
        seg_len_sq = seg[0] * seg[0] + seg[1] * seg[1]
        closest_point = None

        if seg_len_sq == 0:
            closest_point = start
        else:
            t = ((pos[0] - start[0]) * seg[0] + (pos[1] - start[1]) * seg[1]) / seg_len_sq
            t = max(0.0, min(1.0, t))
            closest_point = (start[0] + seg[0] * t, start[1] + seg[1] * t)

        dist_to_segment = distance(pos, closest_point)
        if dist_to_segment < closest_dist:
            closest_dist = dist_to_segment
            closest_percent = (distance_covered + distance(start, closest_point)) / total_length if not turn_local else distance(start, closest_point) / segment_length

        distance_covered += segment_length
    return closest_dist, closest_percent

def get_track_percentage(pos: Tuple[float, float], corner_points: List[Tuple[float, float]], turn_local: bool = False) -> float:
    """
    Calculate the percentage along the track based on corner points.
    """
    if not corner_points:
        return 0.0

    closest_dist, closest_percent = get_dist_from_track_and_dist(pos, corner_points, turn_local)

    if closest_dist == float('inf'):
        exit("No closest point found")
        return 0.0
    
    return closest_percent

def assign_percent_per_second(cars: List[Dict[str, Any]], corner_points: List[Tuple[float, float]]) -> None:
    """
    Assign estimated percentage per second along the track for each car data point.
    """
    for car in cars:
        percent = get_track_percentage((car['x'], car['y']), corner_points)
        edge_percent = get_track_percentage((car['x'], car['y']), corner_points, turn_local=True)
        car['track_percent'] = percent
        car['edge_percent'] = edge_percent
    
    avg_lap_time = 93.0 # seconds
    prev_percent = 0.0
    # prev_lap_percent = 0.0
    # start_time = datetime.fromisoformat(cars[0]['date'])
    lap = 1
    # points_buffer = []
    # laps = []
    for i in range(len(cars)):
        curr_car = cars[i]
        if curr_car['track_percent'] < prev_percent:
            lap += 1
            # lap_time = (datetime.fromisoformat(curr_car['date']) - start_time).total_seconds()
            # lap_time /= (1 + curr_car['track_percent'] - prev_lap_percent)
            # for buffered_car in points_buffer:
            #     buffered_car['lap_time'] = lap_time
            # laps.append(lap_time)
            # start_time = datetime.fromisoformat(curr_car['date'])
            # points_buffer = []
            # prev_lap_percent = curr_car['track_percent']
            # print(curr_car["track_percent"])
        curr_car['lap'] = lap
        prev_percent = curr_car['track_percent']
        # points_buffer.append(curr_car)

        j = i + 1
        while j < len(cars) and (datetime.fromisoformat(cars[j]['date']) - datetime.fromisoformat(curr_car['date'])).total_seconds() < 1:
            j += 1
        if (j == len(cars)):
            j -= 1
            if j == i:
                curr_car['percent_per_second'] = 0.0
                continue
        percent_diff = cars[j]['track_percent'] - curr_car['track_percent']
        time_diff = (datetime.fromisoformat(cars[j]['date']) - datetime.fromisoformat(curr_car['date'])).total_seconds()
        curr_car['percent_per_second'] = percent_diff / time_diff
        curr_car['estimate_lap_time'] = (avg_lap_time + (1 / curr_car['percent_per_second'])) / 2


def get_track_info(file_path: str = "data/car_data.json") -> Tuple[List[Dict[str, Any]], List[Tuple[float, float]]]:
    """
    INIT FUNCTION
    Get predefined track corner points and start/finish points. Returns cars and corner points.
    """
    cars = load_car_data(file_path)
    # print(f"Loaded {len(cars)} car records")
    
    cars = preprocess_car_data(cars)
    # print(f"{len(cars)} car records after preprocessing")

    corner_points = get_corner_points(cars)
    # print(f"Identified {len(corner_points)} corner points: {corner_points}")
    assign_percent_per_second(cars, corner_points)
    # for car in cars[:30]:
    #     dist, percent = get_dist_from_track_and_dist((car['x'], car['y']), corner_points)
    #     print(f"Car at ({car['x']:.1f}, {car['y']:.1f}) is {dist:.1f} units from track, at {percent*100:.2f}% along the track")
    # plot_car_data(cars, corner_points)
    return cars, corner_points

def plot_car_data(cars: List[Dict[str, Any]], corner_points: List[Tuple[float, float]] = []) -> None:
    """
    Plot car data on a 2D scatter plot using matplotlib.
    """
    import matplotlib.pyplot as plt

    x_coords = [car['x'] for car in cars]
    y_coords = [car['y'] for car in cars]

    plt.figure(figsize=(10, 8))
    plt.scatter(x_coords, y_coords, s=1, alpha=0.5)

    assert len(corner_points) > 0
    plt.scatter([corner_points[0][0]], [corner_points[0][1]], s=50, color='green', label='Start Point')
    cp_x, cp_y = zip(*corner_points)
    plt.scatter(cp_x, cp_y, s=10, color='red', label='Corner Points')
    plt.legend()
    

    plt.title("Car Data Scatter Plot")
    plt.xlabel("X Coordinate")
    plt.ylabel("Y Coordinate")
    plt.axis('equal')
    plt.grid(True)
    plt.show()

# Example usage (remove or adapt in production)
if __name__ == "__main__":
    cars = load_car_data("../data/car_data.json")  # looks for car_data.json next to this file
    print(f"Loaded {len(cars)} car records")
    
    cars = preprocess_car_data(cars)
    print(f"{len(cars)} car records after preprocessing")

    corner_points = get_corner_points(cars)
    # print(f"Identified {len(corner_points)} corner points: {corner_points}")

    assign_percent_per_second(cars, corner_points)
    # print("Assigned percent per second to car data: ", [cars[i]["percent_per_second"] for i in range(20)])
    print("First 10 cars: ", cars[:10])

    # for car in cars[:30]:
    #     dist, percent = get_dist_from_track_and_dist((car['x'], car['y']), corner_points)
    #     print(f"Car at ({car['x']:.1f}, {car['y']:.1f}) is {dist:.1f} units from track, at {percent*100:.2f}% along the track")
    plot_car_data(cars, corner_points)
