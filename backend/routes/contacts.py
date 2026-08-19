from flask import Blueprint, request, jsonify, current_app
from flask_login import login_required, current_user
import pandas as pd
import json
import uuid
from datetime import datetime
import os

contacts_bp = Blueprint('contacts', __name__, url_prefix='/api/contacts')

@contacts_bp.route('/', methods=['GET'])
@login_required
def get_contacts():
    """Get contacts with pagination"""
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 50))
        search = request.args.get('search', '')
        
        # Build query - adjust for your database
        # This is a placeholder - you need to use your actual DB connection
        
        # If using Supabase:
        # result = supabase.table('contacts').select('*', count='exact')...
        
        # Placeholder response
        return jsonify({
            'data': [],
            'total': 0,
            'page': page,
            'total_pages': 0
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@contacts_bp.route('/upload', methods=['POST'])
@login_required
def upload_contacts():
    """Upload contacts from file"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['file']
        mapping = request.form.get('mapping')
        
        if not mapping:
            return jsonify({'error': 'No mapping provided'}), 400
        
        # Read file
        if file.filename.endswith('.csv'):
            df = pd.read_csv(file)
        else:
            df = pd.read_excel(file)
        
        mapping_data = json.loads(mapping)
        
        # Process each row
        contacts = []
        for _, row in df.iterrows():
            contact = {
                'id': str(uuid.uuid4()),
                'user_id': str(current_user.id),
                'custom_fields': {},
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            }
            
            # Map standard fields
            for field in ['first_name', 'last_name', 'email', 'phone', 'company', 'job_title', 'address', 'city', 'country']:
                if mapping_data.get(field) and mapping_data[field] in df.columns:
                    value = str(row[mapping_data[field]]) if pd.notna(row[mapping_data[field]]) else ''
                    contact[field] = value
            
            # Store all other columns as custom fields
            for col in df.columns:
                if col not in mapping_data.values():
                    if pd.notna(row[col]):
                        contact['custom_fields'][col] = str(row[col])
            
            contacts.append(contact)
        
        # Insert contacts - adjust for your database
        # If using Supabase:
        # result = supabase.table('contacts').insert(contacts).execute()
        
        return jsonify({
            'success': True,
            'message': f'Uploaded {len(contacts)} contacts',
            'total': len(contacts)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@contacts_bp.route('/preview', methods=['POST'])
@login_required
def preview_file():
    """Preview file columns"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['file']
        
        # Read first few rows
        if file.filename.endswith('.csv'):
            df = pd.read_csv(file, nrows=5)
        else:
            df = pd.read_excel(file, nrows=5)
        
        columns = df.columns.tolist()
        preview = df.head(3).to_dict('records')
        
        # Convert NaN to None
        for row in preview:
            for key, value in row.items():
                if pd.isna(value):
                    row[key] = ''
        
        return jsonify({
            'columns': columns,
            'preview': preview,
            'total_columns': len(columns)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@contacts_bp.route('/<uuid:contact_id>', methods=['DELETE'])
@login_required
def delete_contact(contact_id):
    """Delete a contact"""
    try:
        # Delete from database - adjust for your setup
        # If using Supabase:
        # result = supabase.table('contacts').delete().eq('id', str(contact_id)).eq('user_id', str(current_user.id)).execute()
        
        return jsonify({'success': True}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
