from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import os
from datetime import datetime

app = Flask(__name__, static_folder='static', static_url_path='')
CORS(app)

DATABASE = 'attendees.db'

# =====================================================
# DATABASE INITIALIZATION
# =====================================================

def init_db():
    """Create database if it doesn't exist"""
    if os.path.exists(DATABASE):
        return
    
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute('''CREATE TABLE guests
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  name TEXT UNIQUE NOT NULL,
                  status TEXT DEFAULT 'pending',
                  added_date TEXT NOT NULL)''')
    conn.commit()
    conn.close()
    print("✅ Database initialized")

# =====================================================
# GUEST MANAGEMENT API ENDPOINTS
# =====================================================

@app.route('/api/guests', methods=['POST'])
def add_guest():
    """Add a new guest"""
    data = request.json
    name = data.get('name', '').strip()
    
    # Validation
    if not name:
        return jsonify({'success': False, 'message': 'Name required'}), 400
    
    if len(name) > 50:
        return jsonify({'success': False, 'message': 'Name too long'}), 400
    
    try:
        conn = sqlite3.connect(DATABASE)
        c = conn.cursor()
        c.execute('''INSERT INTO guests (name, status, added_date) 
                     VALUES (?, 'pending', ?)''',
                  (name, datetime.now().isoformat()))
        conn.commit()
        guest_id = c.lastrowid
        conn.close()
        
        return jsonify({
            'success': True,
            'message': f'{name} added successfully',
            'guest': {'id': guest_id, 'name': name, 'status': 'pending'}
        }), 201
        
    except sqlite3.IntegrityError:
        return jsonify({'success': False, 'message': 'Guest already exists'}), 400
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/guests', methods=['GET'])
def get_guests():
    """Get all guests"""
    try:
        conn = sqlite3.connect(DATABASE)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        c.execute('SELECT id, name, status FROM guests ORDER BY id ASC')
        
        guests = [dict(row) for row in c.fetchall()]
        conn.close()
        
        return jsonify({'success': True, 'guests': guests}), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/guests/<int:guest_id>', methods=['PUT'])
def update_guest(guest_id):
    """Update guest status"""
    data = request.json
    status = data.get('status')
    
    if status not in ['pending', 'confirmed', 'declined']:
        return jsonify({'success': False, 'message': 'Invalid status'}), 400
    
    try:
        conn = sqlite3.connect(DATABASE)
        c = conn.cursor()
        c.execute('UPDATE guests SET status = ? WHERE id = ?', (status, guest_id))
        conn.commit()
        conn.close()
        
        if c.rowcount == 0:
            return jsonify({'success': False, 'message': 'Guest not found'}), 404
        
        return jsonify({'success': True, 'message': 'Status updated'}), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/guests/<int:guest_id>', methods=['DELETE'])
def delete_guest(guest_id):
    """Delete a guest"""
    try:
        conn = sqlite3.connect(DATABASE)
        c = conn.cursor()
        c.execute('DELETE FROM guests WHERE id = ?', (guest_id,))
        conn.commit()
        conn.close()
        
        if c.rowcount == 0:
            return jsonify({'success': False, 'message': 'Guest not found'}), 404
        
        return jsonify({'success': True, 'message': 'Guest removed'}), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# =====================================================
# STATISTICS ENDPOINT
# =====================================================

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get guest statistics"""
    try:
        conn = sqlite3.connect(DATABASE)
        c = conn.cursor()
        
        c.execute('SELECT COUNT(*) FROM guests')
        total = c.fetchone()[0]
        
        c.execute("SELECT COUNT(*) FROM guests WHERE status='confirmed'")
        confirmed = c.fetchone()[0]
        
        c.execute("SELECT COUNT(*) FROM guests WHERE status='pending'")
        pending = c.fetchone()[0]
        
        c.execute("SELECT COUNT(*) FROM guests WHERE status='declined'")
        declined = c.fetchone()[0]
        
        conn.close()
        
        return jsonify({
            'success': True,
            'total': total,
            'confirmed': confirmed,
            'pending': pending,
            'declined': declined
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# =====================================================
# EXPORT ENDPOINT
# =====================================================

@app.route('/api/export', methods=['GET'])
def export_guests():
    """Export all guests as JSON"""
    try:
        conn = sqlite3.connect(DATABASE)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        c.execute('SELECT * FROM guests ORDER BY id ASC')
        
        guests = [dict(row) for row in c.fetchall()]
        conn.close()
        
        return jsonify({
            'success': True,
            'export_date': datetime.now().isoformat(),
            'guests': guests
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# =====================================================
# SERVE FRONTEND
# =====================================================

@app.route('/')
def index():
    """Serve the main page"""
    return app.send_static_file('index.html')

# =====================================================
# ERROR HANDLERS
# =====================================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'success': False, 'message': 'Not found'}), 404

@app.errorhandler(500)
def server_error(error):
    return jsonify({'success': False, 'message': 'Server error'}), 500

# =====================================================
# MAIN
# =====================================================

if __name__ == '__main__':
    init_db()
    print("🚀 Starting Flask server on http://localhost:5000")
    print("📝 Press Ctrl+C to stop")
    app.run(debug=True, port=5000)