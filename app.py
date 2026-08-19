from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__, 
    template_folder='templates',
    static_folder='static'
)
CORS(app)

# Import routes
from backend.routes.contacts import contacts_bp
from backend.routes.emails import emails_bp

app.register_blueprint(contacts_bp)
app.register_blueprint(emails_bp)

@app.route('/')
@app.route('/contacts')
def contacts_page():
    return render_template('contacts.html')

@app.route('/health')
def health_check():
    return jsonify({'status': 'ok'}), 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=False, host='0.0.0.0', port=port)
