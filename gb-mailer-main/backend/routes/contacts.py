from flask import Blueprint, request, jsonify
import pandas as pd
import json
import uuid
from datetime import datetime
import os
from supabase import create_client

contacts_bp = Blueprint('contacts', __name__, url_prefix='/api/contacts')

# Initialize Supabase
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_KEY')

if supabase_url and supabase_key:
    supabase = create_client(supabase_url, supabase_key)
else:
    supabase = None
    print("⚠️ Supabase not configured - using sample data")

@contacts_bp.route('/', methods=['GET'])
def get_contacts():
    """Get contacts from Supabase"""
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 50))
        search = request.args.get('search', '')
        
        if supabase:
            # Query Supabase
            query = supabase.table('contacts').select('*', count='exact')
            
            if search:
                query = query.or_(f"first_name.ilike.%{search}%,email.ilike.%{search}%,company.ilike.%{search}%")
            
            start = (page - 1) * limit
            query = query.range(start, start + limit - 1)
            
            result = query.execute()
            
            return jsonify({
                'data': result.data,
                'total': len(result.data),
                'page': page,
                'total_pages': 1
            }), 200
        else:
            # Sample data for testing
            sample_contacts = [
                {
                    'id': str(uuid.uuid4()),
                    'first_name': 'John',
                    'last_name': 'Doe',
                    'email': 'john@example.com',
                    'phone': '+1234567890',
                    'company': 'Acme Inc',
                    'job_title': 'CEO',
                    'custom_fields': {}
                },
                {
                    'id': str(uuid.uuid4()),
                    'first_name': 'Jane',
                    'last_name': 'Smith',
                    'email': 'jane@example.com',
                    'phone': '+0987654321',
                    'company': 'Tech Corp',
                    'job_title': 'CTO',
                    'custom_fields': {}
                }
            ]
            
            return jsonify({
                'data': sample_contacts,
                'total': len(sample_contacts),
                'page': page,
                'total_pages': 1
            }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@contacts_bp.route('/upload', methods=['POST'])
def upload_contacts():
    """Upload contacts from file"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['file']
        mapping_data = request.form.get('mapping')
        
        if not mapping_data:
            return jsonify({'error': 'No mapping provided'}), 400
        
        if file.filename.endswith('.csv'):
            df = pd.read_csv(file)
        else:
            df = pd.read_excel(file)
        
        mapping = json.loads(mapping_data)
        
        contacts = []
        for _, row in df.iterrows():
            contact = {
                'id': str(uuid.uuid4()),
                'custom_fields': {},
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            }
            
            field_mapping = {
                'first_name': 'first_name',
                'last_name': 'last_name', 
                'email': 'email',
                'phone': 'phone',
                'company': 'company',
                'job_title': 'job_title'
            }
            
            for field, col_name in field_mapping.items():
                if mapping.get(col_name) and mapping[col_name] in df.columns:
                    val = row[mapping[col_name]]
                    if pd.notna(val):
                        contact[field] = str(val)
            
            for col in df.columns:
                if col not in mapping.values():
                    if pd.notna(row[col]):
                        contact['custom_fields'][col] = str(row[col])
            
            contacts.append(contact)
        
        # Insert into Supabase if configured
        if supabase:
            for contact in contacts:
                supabase.table('contacts').insert(contact).execute()
        
        return jsonify({
            'success': True,
            'message': f'Uploaded {len(contacts)} contacts',
            'total': len(contacts)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@contacts_bp.route('/preview', methods=['POST'])
def preview_file():
    """Preview file columns"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['file']
        
        if file.filename.endswith('.csv'):
            df = pd.read_csv(file, nrows=5)
        else:
            df = pd.read_excel(file, nrows=5)
        
        columns = df.columns.tolist()
        preview = df.head(3).to_dict('records')
        
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

@contacts_bp.route('/<contact_id>', methods=['DELETE'])
def delete_contact(contact_id):
    """Delete a contact"""
    try:
        if supabase:
            supabase.table('contacts').delete().eq('id', contact_id).execute()
        return jsonify({'success': True}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
