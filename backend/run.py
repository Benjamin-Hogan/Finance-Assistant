from src.app import app
from flask_cors import CORS
import os
import sys

# Add src directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

# Enable CORS for all routes
CORS(app, resources={r"/api/*": {"origins": "*"}})

if __name__ == '__main__':
    # Change the port to avoid conflicts with existing processes
    app.run(host='127.0.0.1', port=5002, debug=True)
