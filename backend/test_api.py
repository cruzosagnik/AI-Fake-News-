import requests

try:
    res = requests.post("http://localhost:8000/analyze-text", json={"text": "This is a test article about how the earth is flat.", "language": "en"})
    print("Status:", res.status_code)
    print("Body:", res.text)
except Exception as e:
    print("Error:", e)
