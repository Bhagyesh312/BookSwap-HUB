"""
Server-Sent Events (SSE) for real-time notifications.
Clients subscribe to /api/notifications/stream and receive events.
"""
import json
import queue
import threading
from flask import Blueprint, Response, request

notifications_bp = Blueprint('notifications', __name__, url_prefix='/api/notifications')

# Per-user queues: { user_id: [Queue, ...] }
_subscribers: dict[int, list[queue.Queue]] = {}
_lock = threading.Lock()


def _get_queues(user_id: int) -> list[queue.Queue]:
    with _lock:
        return _subscribers.get(user_id, [])


def push_notification(user_id: int, event_type: str, data: dict):
    """Push a notification to all SSE connections for a user."""
    payload = json.dumps({'type': event_type, **data})
    with _lock:
        for q in _subscribers.get(user_id, []):
            try:
                q.put_nowait(f"data: {payload}\n\n")
            except queue.Full:
                pass


@notifications_bp.route('/stream')
def stream():
    """SSE endpoint — client connects and receives real-time events.
    Accepts token via ?token= query param because EventSource cannot set headers.
    """
    from middleware import decode_token
    token = request.args.get('token', '')
    if not token:
        return {'error': 'Authentication required'}, 401
    try:
        payload = decode_token(token)
        user_id = payload['id']
    except Exception:
        return {'error': 'Invalid or expired token'}, 401
    q: queue.Queue = queue.Queue(maxsize=50)

    with _lock:
        _subscribers.setdefault(user_id, []).append(q)

    def generate():
        # Send a welcome ping
        yield f"data: {json.dumps({'type': 'connected', 'message': 'Connected to BookSwap Hub notifications'})}\n\n"
        try:
            while True:
                try:
                    msg = q.get(timeout=25)
                    yield msg
                except queue.Empty:
                    yield ": ping\n\n"  # keep-alive
        finally:
            with _lock:
                queues = _subscribers.get(user_id, [])
                if q in queues:
                    queues.remove(q)

    return Response(
        generate(),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no',
            'Connection': 'keep-alive',
        }
    )
