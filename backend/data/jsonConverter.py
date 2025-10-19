import json
import csv
# Load JSON data from a file
with open('car_data.json', 'r') as json_file:
   data = json.load(json_file)
# Open a CSV file for writing
with open('car_data.csv', 'w', newline='') as csv_file:
   writer = csv.writer(csv_file)
   # Write the header (keys of the JSON objects)
   header = data[0].keys()
   writer.writerow(header)
   # Write the rows (values of the JSON objects)
   for row in data:
       writer.writerow(row.values())
print("JSON has been successfully converted to CSV!")