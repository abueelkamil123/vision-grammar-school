
from flask import Flask, request, jsonify, send_from_directory
import json
import os

app = Flask(__name__, static_folder='.')

DATA_FILE = 'database.json'

def load_data():
    if not os.path.exists(DATA_FILE):
        return {"students": [], "attendance": {}, "admin": None}
    with open(DATA_FILE, 'r') as f:
        return json.load(f)

def save_data(data):
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=4)

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = load_data()
    req = request.json
    if data['admin']:
        return jsonify({"error": "Admin already exists"}), 400
    data['admin'] = {"username": req['username'], "password": req['password']}
    save_data(data)
    return jsonify({"success": True})

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = load_data()
    req = request.json
    if data['admin'] and data['admin']['username'] == req['username'] and data['admin']['password'] == req['password']:
        return jsonify({"success": True, "username": req['username']})
    return jsonify({"error": "Invalid credentials"}), 401

@app.route('/api/students', methods=['GET', 'POST'])
def manage_students():
    data = load_data()
    if request.method == 'POST':
        data['students'] = request.json
        save_data(data)
        return jsonify({"success": True})
    return jsonify(data['students'])

@app.route('/api/attendance', methods=['GET', 'POST'])
def manage_attendance():
    data = load_data()
    if request.method == 'POST':
        data['attendance'] = request.json
        save_data(data)
        return jsonify({"success": True})
    return jsonify(data['attendance'])

if __name__ == '__main__':
    app.run(debug=True, port=5000)
