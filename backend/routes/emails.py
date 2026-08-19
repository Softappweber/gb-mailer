# backend/routes/emails.py

@emails_bp.route('/send-bulk', methods=['POST'])
@login_required
def send_bulk_emails():
    try:
        data = request.json
        contact_ids = data.get('contact_ids', [])
        subject = data.get('subject', '')
        body = data.get('body', '')
        
        # Get contacts
        contacts = Contact.select().where(
            Contact.id.in_(contact_ids),
            Contact.user_id == current_user.id
        )
        
        sent_count = 0
        failed = []
        
        for contact in contacts:
            try:
                # Personalize email
                personalized_body = body
                for field in ['name', 'company', 'position']:
                    if f'{{{{{field}}}}}}' in personalized_body:
                        value = getattr(contact, field, '') or ''
                        personalized_body = personalized_body.replace(
                            f'{{{{{field}}}}}', value
                        )
                
                # Also replace custom fields
                if contact.custom_fields:
                    for key, value in contact.custom_fields.items():
                        if f'{{{{{key}}}}}' in personalized_body:
                            personalized_body = personalized_body.replace(
                                f'{{{{{key}}}}}', str(value)
                            )
                
                # Send email using SMTP
                send_email(
                    to=contact.email,
                    subject=subject,
                    body=personalized_body
                )
                
                # Log the send
                EmailLog.create(
                    user_id=current_user.id,
                    contact_id=contact.id,
                    subject=subject,
                    status='sent',
                    sent_at=datetime.now()
                )
                
                sent_count += 1
                
            except Exception as e:
                failed.append({
                    'email': contact.email,
                    'error': str(e)
                })
                EmailLog.create(
                    user_id=current_user.id,
                    contact_id=contact.id,
                    subject=subject,
                    status='failed',
                    error=str(e)
                )
        
        return jsonify({
            'success': True,
            'sent': sent_count,
            'failed': failed
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
