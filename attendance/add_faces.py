import cv2
import pickle
import os
import numpy as np
from deepface import DeepFace

# =========================
# CONFIG
# =========================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)

EMBED_FILE = os.path.join(DATA_DIR, "embeddings.pkl")
IDS_FILE = os.path.join(DATA_DIR, "ids.pkl")

CASCADE_PATH = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"

# =========================
# LOAD CASCADE
# =========================

face_cascade = cv2.CascadeClassifier(CASCADE_PATH)

if face_cascade.empty():
    print("❌ Failed to load Haarcascade")
    exit()

print("✅ Cascade Loaded Successfully")

# =========================
# INPUT STUDENT ID
# =========================

student_id = input("Enter Student ID: ").strip()

if student_id == "":
    print("❌ Student ID cannot be empty")
    exit()

# =========================
# OPEN CAMERA
# =========================

cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("❌ Could not open webcam")
    exit()

print("📸 Collecting 30 face embeddings...")

embeddings = []
ids = []
count = 0
max_samples = 30  # DeepFace doesn't need 100 samples

while count < max_samples:
    ret, frame = cap.read()

    if not ret:
        continue

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.3, 5)

    for x, y, w, h in faces:
        face = frame[y : y + h, x : x + w]

        try:
            # Get embedding
            result = DeepFace.represent(
                face, model_name="Facenet", enforce_detection=False
            )

            embedding = result[0]["embedding"]

            embeddings.append(embedding)
            ids.append(student_id)

            count += 1

            cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
            cv2.putText(
                frame,
                f"Samples: {count}/{max_samples}",
                (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                (0, 255, 0),
                2,
            )

        except Exception as e:
            print("Embedding error:", e)

        if count >= max_samples:
            break

    cv2.imshow("Capturing DeepFace Embeddings - ESC to Exit", frame)

    if cv2.waitKey(1) == 27:
        break

cap.release()
cv2.destroyAllWindows()

embeddings = np.array(embeddings)

# =========================
# LOAD OLD DATA
# =========================

if os.path.exists(EMBED_FILE):
    with open(EMBED_FILE, "rb") as f:
        old_embeds = pickle.load(f)
    embeddings = np.vstack((old_embeds, embeddings))

if os.path.exists(IDS_FILE):
    with open(IDS_FILE, "rb") as f:
        old_ids = pickle.load(f)
    ids = old_ids + ids

# =========================
# SAVE DATA
# =========================

with open(EMBED_FILE, "wb") as f:
    pickle.dump(embeddings, f)

with open(IDS_FILE, "wb") as f:
    pickle.dump(ids, f)

print(f"\n✅ Student ID {student_id} embeddings saved successfully!")
print("Total samples:", len(ids))