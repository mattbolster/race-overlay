from flask import Flask, render_template, request
import threading
import requests
import time

app = Flask(__name__)

data_file = 'data/overlay.txt'

def fetch_livetiming(race_url):
    while True:
        try:
            # Replace this with actual scraping logic!
            response = requests.get(race_url)
            data = response.json()  # Adjust parsing!
            
            # Extract relevant info (replace with actual fields)
            positions = []
            for racer in data['racers']:
                positions.append(f"{racer['position']} {racer['name']} Last Lap: {racer['last_lap']}")
            
            with open(data_file, 'w') as f:
                f.write('\n'.join(positions))
                
        except Exception as e:
            print("Error:", e)
        time.sleep(5)  # Refresh interval

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        race_url = request.form['race_url']
        threading.Thread(target=fetch_livetiming, args=(race_url,), daemon=True).start()
        return "Started fetching race data!"
    return render_template('index.html')

@app.route('/overlay')
def overlay():
    with open(data_file) as f:
        content = f.read()
    return f"<pre>{content}</pre>"

if __name__ == '__main__':
    app.run(debug=True)
