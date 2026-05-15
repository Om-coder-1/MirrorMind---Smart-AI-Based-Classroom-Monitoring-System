from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/class/(?P<schedule_id>\d+)/$', consumers.ClassroomConsumer.as_asgi()),
]
