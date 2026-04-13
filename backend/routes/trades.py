from flask import Blueprint, request, jsonify, g
from models import db, TradeRequest, Book, User
from middleware import require_auth

trades_bp = Blueprint('trades', __name__, url_prefix='/api/trades')

@trades_bp.route('', methods=['POST'])
@require_auth
def create_trade():
    """Propose a trade to another user"""
    try:
        current_user = User.query.get(g.user['id'])
        if not current_user:
            return jsonify({'error': 'User not found'}), 404

        data = request.get_json()
        target_book_id = data.get('targetBookId')
        offered_book_id = data.get('offeredBookId')

        if not target_book_id or not offered_book_id:
            return jsonify({'error': 'Both target and offered book IDs are required'}), 400

        target_book = Book.query.get(target_book_id)
        if not target_book:
            return jsonify({'error': 'Target book not found'}), 404
            
        if not target_book.listed_by:
            return jsonify({'error': 'Target book does not belong to a user, cannot trade'}), 400

        if target_book.listed_by == current_user.id:
            return jsonify({'error': 'You cannot propose a trade for your own book'}), 400

        offered_book = Book.query.get(offered_book_id)
        if not offered_book:
            return jsonify({'error': 'Offered book not found'}), 404
            
        if offered_book.listed_by != current_user.id:
            return jsonify({'error': 'You can only offer books that you have listed'}), 403

        # Check if trade already exists
        existing_trade = TradeRequest.query.filter_by(
            requester_id=current_user.id,
            target_book_id=target_book_id,
            status='pending'
        ).first()
        
        if existing_trade:
            return jsonify({'error': 'You already have a pending trade request for this book'}), 400

        trade = TradeRequest(
            requester_id=current_user.id,
            receiver_id=target_book.listed_by,
            offered_book_id=offered_book_id,
            target_book_id=target_book_id
        )

        db.session.add(trade)
        db.session.commit()

        return jsonify({
            'message': 'Trade proposal sent successfully',
            'trade': trade.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to submit trade proposal'}), 500


@trades_bp.route('', methods=['GET'])
@require_auth
def get_user_trades():
    """Get all sent and received trades for the current user"""
    try:
        current_user = User.query.get(g.user['id'])
        if not current_user:
            return jsonify({'error': 'User not found'}), 404

        sent = TradeRequest.query.filter_by(requester_id=current_user.id).order_by(TradeRequest.created_at.desc()).all()
        received = TradeRequest.query.filter_by(receiver_id=current_user.id).order_by(TradeRequest.created_at.desc()).all()

        return jsonify({
            'sent': [t.to_dict() for t in sent],
            'received': [t.to_dict() for t in received]
        }), 200

    except Exception as e:
        return jsonify({'error': 'Failed to fetch trades'}), 500


@trades_bp.route('/<int:trade_id>', methods=['PUT'])
@require_auth
def respond_to_trade(trade_id):
    """Accept or decline a trade request"""
    try:
        current_user = User.query.get(g.user['id'])
        if not current_user:
            return jsonify({'error': 'User not found'}), 404

        trade = TradeRequest.query.get(trade_id)
        if not trade:
            return jsonify({'error': 'Trade not found'}), 404

        if trade.receiver_id != current_user.id:
            return jsonify({'error': 'Unauthorized'}), 403

        data = request.get_json()
        action = data.get('action') # 'accept' or 'decline'

        if action == 'accept':
            trade.status = 'accepted'
        elif action == 'decline':
            trade.status = 'declined'
        else:
            return jsonify({'error': 'Invalid action'}), 400

        db.session.commit()

        return jsonify({
            'message': f'Trade {trade.status} successfully',
            'trade': trade.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to respond to trade'}), 500
