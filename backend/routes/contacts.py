# backend/routes/contacts.py

@contacts_bp.route('/upload', methods=['POST'])
@login_required
def upload_contacts():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['file']
        mapping = request.form.get('mapping')  # JSON string of column mapping
        
        if not file.filename.endswith(('.xlsx', '.xls', '.csv')):
            return jsonify({'error': 'Please upload Excel or CSV file'}), 400
        
        # Read file
        if file.filename.endswith('.csv'):
            df = pd.read_csv(file)
        else:
            df = pd.read_excel(file)
        
        # Get all columns
        all_columns = df.columns.tolist()
        
        # Parse mapping
        mapping_data = json.loads(mapping) if mapping else {}
        
        # Display columns (5-6 columns user wants to see)
        display_columns = mapping_data.get('display_columns', ['name', 'email'])
        
        # Map standard fields
        field_mapping = {
            'name': mapping_data.get('name', 'name'),
            'email': mapping_data.get('email', 'email'),
            'phone': mapping_data.get('phone', 'phone'),
            'company': mapping_data.get('company', 'company'),
            'position': mapping_data.get('position', 'position'),
            'website': mapping_data.get('website', 'website')
        }
        
        # Process each row
        contacts = []
        for _, row in df.iterrows():
            # Get standard fields
            contact_data = {
                'user_id': current_user.id,
                'custom_fields': {},
                'column_mapping': mapping_data
            }
            
            # Map standard fields
            for field, column in field_mapping.items():
                if column and column in df.columns:
                    contact_data[field] = str(row[column]) if pd.notna(row[column]) else ''
            
            # Store all other columns as custom fields
            for col in all_columns:
                if col not in field_mapping.values():
                    if pd.notna(row[col]):
                        contact_data['custom_fields'][col] = str(row[col])
            
            contacts.append(contact_data)
        
        # Bulk insert
        Contact.insert_many(contacts).execute()
        
        return jsonify({
            'success': True,
            'message': f'Uploaded {len(contacts)} contacts',
            'display_columns': display_columns,
            'all_columns': all_columns
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
