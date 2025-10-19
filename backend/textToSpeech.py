# from elevenlabs.client import ElevenLabs
# elevenLabs = ElevenLabs(api_key='sk_22ec0ec93084c727bcaad9e44dfdcc80b1a64a01f3bc5a15')

# print("Successful")

from elevenlabs import stream
from elevenlabs.client import ElevenLabs
elevenlabs = ElevenLabs()#api_key='sk_22ec0ec93084c727bcaad9e44dfdcc80b1a64a01f3bc5a15')
audio_stream = elevenlabs.text_to_speech.stream(
    text="This is a test",
    voice_id="JBFqnCBsd6RMkjVDRZzb",
    model_id="eleven_multilingual_v2"
)
# option 1: play the streamed audio locally
stream(audio_stream)

# for chunk in audio_stream:
#     if isinstance(chunk, bytes):
#         print(chunk)