import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async


class ClassroomConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.schedule_id = self.scope['url_route']['kwargs']['schedule_id']
        self.room = f"class_{self.schedule_id}"

        # ── If class already ended, immediately notify and close ──
        status = await self._get_schedule_status()
        if status == 'completed':
            await self.accept()
            await self.send(text_data=json.dumps({
                'type': 'class-ended',
                'schedule_id': self.schedule_id,
                'reason': 'already_ended'
            }))
            await self.close()
            return

        await self.channel_layer.group_add(self.room, self.channel_name)
        await self.accept()
        print(f"✅ WebSocket Connected: {self.channel_name} | Room: {self.room}")

    async def disconnect(self, code):
        await self.channel_layer.group_discard(self.room, self.channel_name)
        await self.channel_layer.group_send(self.room, {
            'type': 'peer_disconnected',
            'channel': self.channel_name
        })
        print(f"❌ WebSocket Disconnected: {self.channel_name}")

    async def receive(self, text_data):
        data = json.loads(text_data)
        msg_type = data.get('type')

        if msg_type == 'teacher-ready':
            await self.channel_layer.group_send(self.room, {
                'type': 'teacher_ready',
                'teacher_channel': self.channel_name,
                'teacher_name': data.get('teacher_name', 'Teacher')
            })

        elif msg_type == 'student-joined':
            await self.channel_layer.group_send(self.room, {
                'type': 'student_joined',
                'student_channel': self.channel_name,
                'student_id': data.get('student_id'),
                'student_name': data.get('student_name', 'Student')
            })

        elif msg_type == 'offer':
            target = data.get('to')
            if target:
                await self.channel_layer.send(target, {
                    'type': 'forward_message',
                    'data': {
                        'type': 'offer',
                        'offer': data.get('offer'),
                        'from': self.channel_name,
                        'teacher_name': data.get('teacher_name', 'Teacher')
                    }
                })

        elif msg_type == 'answer':
            target = data.get('to')
            if target:
                await self.channel_layer.send(target, {
                    'type': 'forward_message',
                    'data': {
                        'type': 'answer',
                        'answer': data.get('answer'),
                        'from': self.channel_name
                    }
                })

        elif msg_type == 'ice-candidate':
            target = data.get('to')
            if target:
                await self.channel_layer.send(target, {
                    'type': 'forward_message',
                    'data': {
                        'type': 'ice-candidate',
                        'candidate': data.get('candidate'),
                        'from': self.channel_name
                    }
                })

        elif msg_type == 'emotion-update':
            emotion      = data.get('emotion', 'Neutral')
            confidence   = data.get('confidence', 0.0)
            student_id   = data.get('student_id')
            student_name = data.get('student_name', 'Student')
            # ── lag fix: client already throttles DB log (har 10s ek vela)
            # log_to_db=True alyashivay DB write skip karo → WebSocket fast rahat
            should_log   = data.get('log_to_db', False)

            if student_id and should_log:
                await self._log_emotion(student_id, emotion, confidence)

            await self.channel_layer.group_send(self.room, {
                'type': 'emotion_update',
                'student_id': student_id,
                'student_name': student_name,
                'emotion': emotion,
                'confidence': confidence,
                'from_channel': self.channel_name
            })

        elif msg_type == 'class-ended':
            await self.channel_layer.group_send(self.room, {
                'type': 'class_ended',
                'schedule_id': data.get('schedule_id')
            })

        elif msg_type == 'chat-message':
            await self.channel_layer.group_send(self.room, {
                'type': 'chat_message',
                'sender_name': data.get('sender_name', 'Unknown'),
                'sender_role': data.get('sender_role', 'student'),
                'message':     data.get('message', ''),
                'from_channel': self.channel_name
            })

    # ══ Event Handlers ══

    async def teacher_ready(self, event):
        await self.send(text_data=json.dumps({
            'type': 'teacher-ready',
            'teacher_channel': event['teacher_channel'],
            'teacher_name': event['teacher_name']
        }))

    async def student_joined(self, event):
        await self.send(text_data=json.dumps({
            'type': 'student-joined',
            'student_channel': event['student_channel'],
            'student_id': event['student_id'],
            'student_name': event['student_name']
        }))

    async def forward_message(self, event):
        await self.send(text_data=json.dumps(event['data']))

    async def emotion_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'emotion-update',
            'student_id': event['student_id'],
            'student_name': event['student_name'],
            'emotion': event['emotion'],
            'confidence': event['confidence']
        }))

    async def class_ended(self, event):
        await self.send(text_data=json.dumps({
            'type': 'class-ended',
            'schedule_id': event['schedule_id']
        }))

    async def peer_disconnected(self, event):
        await self.send(text_data=json.dumps({
            'type': 'peer-disconnected',
            'channel': event['channel']
        }))

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'chat-message',
            'sender_name': event['sender_name'],
            'sender_role': event['sender_role'],
            'message':     event['message']
        }))

    # ══ DB Helpers ══

    @database_sync_to_async
    def _get_schedule_status(self):
        try:
            from notifications.models import ClassSchedule
            s = ClassSchedule.objects.only('status').get(id=self.schedule_id)
            return s.status
        except Exception:
            return 'unknown'

    @database_sync_to_async
    def _log_emotion(self, student_id, emotion, confidence):
        """Save one emotion snapshot per call (caller already throttles to ~10 s)."""
        try:
            from notifications.models import EmotionLog, ClassSchedule
            from students.models import Student
            schedule = ClassSchedule.objects.get(id=self.schedule_id)
            student  = Student.objects.get(id=student_id)
            EmotionLog.objects.create(
                schedule=schedule,
                student=student,
                emotion=emotion,
                confidence=round(float(confidence), 3),
            )
        except Exception as e:
            print(f"⚠️ EmotionLog save error: {e}")
