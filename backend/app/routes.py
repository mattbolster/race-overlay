from flask import Blueprint, request, jsonify
from .scraper import start_scraper, stop_scraper, get_race_data, get_scraper_status
from . import socketio

scraper_bp = Blueprint('scraper', __name__)

@scraper_bp.route('/api/start', methods=['POST'])
def start():
    try:
        race_url = request.get_json().get('race_url')
        if not race_url:
            return jsonify({'error': 'No URL provided'}), 400

        success = start_scraper(race_url)
        if not success:
            return jsonify({'error': 'Failed to start scraper'}), 500

        return jsonify({'status': 'started'}), 200

    except Exception as e:
        print('[ERROR] Failed to start scraper:', e)
        return jsonify({'error': str(e)}), 500


@scraper_bp.route('/api/stop', methods=['POST'])
def stop():
    stop_scraper()
    return jsonify({'status': 'stopped'}), 200


@scraper_bp.route('/api/data')
def data():
    return jsonify(get_race_data()), 200


@scraper_bp.route('/api/status')
def status():
    return jsonify(get_scraper_status()), 200


@scraper_bp.route('/api/test_emit')
def test_emit():
    socketio.emit('race_update', {
        'data': [{
            "position": 1,
            "display_number": "99",
            "competitor": "Test Racer",
            "laps": "3",
            "last_lap": "1:43.210",
            "difference": "-",
            "gap": "-",
            "total_time": "5:10.000",
            "best_lap": "1:43.210",
            "is_fastest_lap": True,
            "lap_progress": 50.0
        }]
    }, namespace='/')
    return jsonify({"status": "test emitted"}), 200
