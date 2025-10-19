import model.track_util as util
import json
import random

cars, corner_points = util.get_track_info(None)
for car in cars:
    base_rankings = [
        {"position": 1, "name": "Fax Veryappen", "time": "1:30.123"},
        {"position": 2, "name": "Mewis Jamilton", "time": "1:31.456"},
        {"position": 3, "name": "John Doe", "time": "1:32.789"},
        {"position": 4, "name": "Jane Smith", "time": "1:33.012"},
        {"position": 5, "name": "Six Seven", "time": "1:36.767"}
    ]

    shuffled = base_rankings[:]  # copy
    random.shuffle(shuffled)

    new_ranking = []
    # parse times and apply small random delta
    parsed = []
    for entry in shuffled:
        m, rest = entry["time"].split(":")
        s, ms = rest.split(".")
        total_seconds = int(m) * 60 + int(s) + int(ms) / 1000.0
        delta = random.uniform(-0.8, 0.8)
        parsed.append(max(0.0, total_seconds + delta))

    # enforce strictly increasing times (at least 1 ms apart)
    min_gap = 0.001
    adjusted = []
    prev = None
    for t in parsed:
        if prev is None:
            cur = t
        else:
            cur = max(t, prev + min_gap)
        adjusted.append(cur)
        prev = cur

    # format times safely using integer milliseconds to avoid rollover issues
    for idx, sec in enumerate(adjusted, start=1):
        total_ms = int(round(sec * 1000))
        minutes = total_ms // 60000
        rem = total_ms % 60000
        seconds = rem // 1000
        milliseconds = rem % 1000
        time_str = f"{minutes}:{seconds:02d}.{milliseconds:03d}"
        new_ranking.append({"position": idx, "name": shuffled[idx - 1]["name"], "time": time_str})

    car["ranking"] = new_ranking
print(json.dumps(cars, indent=2))
