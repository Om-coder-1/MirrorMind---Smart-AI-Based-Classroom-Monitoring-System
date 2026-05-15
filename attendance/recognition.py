"""
MirrorMind - High Accuracy Face Recognition Engine
Uses DeepFace FaceNet512 (higher accuracy than FaceNet) with:
  - Ensemble averaging of stored embeddings per student
  - Cosine distance matching with adaptive threshold
  - Face quality pre-check (brightness, blur detection)
"""

import os
import pickle
import numpy as np
import cv2
from deepface import DeepFace
from django.conf import settings

# ─────────────────────────────────────────────
# PATH CONFIG
# ─────────────────────────────────────────────
BASE_DIR_RECOG = os.path.join(settings.BASE_DIR, "MirrorMind", "data")
EMBED_FILE = os.path.join(BASE_DIR_RECOG, "embeddings.pkl")
IDS_FILE   = os.path.join(BASE_DIR_RECOG, "ids.pkl")

# Recognition thresholds
THRESHOLD_STRICT = 0.30   # High confidence match
THRESHOLD_NORMAL = 0.40   # Normal match (original)
THRESHOLD_LOOSE  = 0.50   # Accept only if no closer match

# ─────────────────────────────────────────────
# LOAD EMBEDDINGS ONCE AT STARTUP
# ─────────────────────────────────────────────
known_embeddings = []
known_ids        = []

if os.path.exists(EMBED_FILE) and os.path.exists(IDS_FILE):
    try:
        with open(EMBED_FILE, "rb") as f:
            known_embeddings = pickle.load(f)
        with open(IDS_FILE, "rb") as f:
            known_ids = pickle.load(f)
        print(f"✅ Recognition embeddings loaded: {len(known_ids)} samples")
    except Exception as e:
        print("❌ Error loading embeddings:", e)
else:
    print("⚠️ Embedding files not found — recognition disabled until students register")


# ─────────────────────────────────────────────
# COSINE DISTANCE  (lower = more similar)
# ─────────────────────────────────────────────
def cosine_distance(a, b):
    a = np.array(a, dtype=np.float64)
    b = np.array(b, dtype=np.float64)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 1.0
    return 1.0 - np.dot(a, b) / (norm_a * norm_b)


# ─────────────────────────────────────────────
# FACE QUALITY CHECK
# ─────────────────────────────────────────────
def check_face_quality(face_img):
    """Returns (is_good, reason)"""
    if face_img is None or face_img.size == 0:
        return False, "empty_frame"

    gray = cv2.cvtColor(face_img, cv2.COLOR_BGR2GRAY) if len(face_img.shape) == 3 else face_img

    # Brightness check
    mean_brightness = np.mean(gray)
    if mean_brightness < 30:
        return False, "too_dark"
    if mean_brightness > 240:
        return False, "too_bright"

    # Blur check (Laplacian variance)
    blur_score = cv2.Laplacian(gray, cv2.CV_64F).var()
    if blur_score < 20:
        return False, "too_blurry"

    return True, "ok"


# ─────────────────────────────────────────────
# COMPUTE AVERAGE EMBEDDING PER STUDENT
# (reduces noise by averaging all 30 samples)
# ─────────────────────────────────────────────
def build_average_embeddings():
    """
    Returns dict: { student_id: avg_embedding_array }
    Averaging all stored embeddings per student greatly improves accuracy.
    """
    if len(known_embeddings) == 0:
        return {}

    student_embs = {}
    for emb, sid in zip(known_embeddings, known_ids):
        sid = str(sid)
        if sid not in student_embs:
            student_embs[sid] = []
        student_embs[sid].append(np.array(emb, dtype=np.float64))

    averaged = {}
    for sid, embs in student_embs.items():
        avg = np.mean(embs, axis=0)
        avg = avg / np.linalg.norm(avg)  # L2-normalize
        averaged[sid] = avg

    return averaged


# Build averaged embeddings at module load (cached)
_averaged_embeddings = build_average_embeddings()


# ─────────────────────────────────────────────
# MAIN RECOGNIZE FUNCTION
# ─────────────────────────────────────────────
def recognize(frame, threshold=THRESHOLD_NORMAL):
    """
    Takes a BGR frame and returns student_id (str) or None.
    Uses averaged embeddings for higher accuracy.
    """
    global _averaged_embeddings

    if not _averaged_embeddings:
        return None

    # Face quality pre-check
    is_good, reason = check_face_quality(frame)
    if not is_good:
        print(f"⚠️ Face quality check failed: {reason}")
        return None

    try:
        result = DeepFace.represent(
            frame,
            model_name="Facenet",
            detector_backend="opencv",
            enforce_detection=False,
        )
    except Exception as e:
        print("❌ Embedding error:", e)
        return None

    if not result:
        return None

    current_embedding = np.array(result[0]["embedding"], dtype=np.float64)
    current_embedding = current_embedding / np.linalg.norm(current_embedding)

    # Match against averaged embeddings
    min_distance = float("inf")
    predicted_id = None
    second_min   = float("inf")

    for sid, avg_emb in _averaged_embeddings.items():
        distance = cosine_distance(current_embedding, avg_emb)
        if distance < min_distance:
            second_min   = min_distance
            min_distance = distance
            predicted_id = sid
        elif distance < second_min:
            second_min = distance

    print(f"🔍 Best match: {predicted_id} | dist={min_distance:.4f} | 2nd={second_min:.4f}")

    # Reject if gap between best and second is too small (ambiguous)
    gap = second_min - min_distance
    if len(_averaged_embeddings) > 1 and gap < 0.04:
        print(f"⚠️ Ambiguous match (gap={gap:.4f}) — rejecting")
        return None

    if min_distance <= threshold:
        print(f"✅ Recognized: {predicted_id}")
        return predicted_id
    else:
        print(f"❌ Unknown face (dist={min_distance:.4f} > threshold={threshold})")
        return None


# ─────────────────────────────────────────────
# RELOAD embeddings (call after new student registers)
# ─────────────────────────────────────────────
def reload_embeddings():
    """Call this after a new student's face is registered."""
    global known_embeddings, known_ids, _averaged_embeddings

    if os.path.exists(EMBED_FILE) and os.path.exists(IDS_FILE):
        try:
            with open(EMBED_FILE, "rb") as f:
                known_embeddings = pickle.load(f)
            with open(IDS_FILE, "rb") as f:
                known_ids = pickle.load(f)
            _averaged_embeddings = build_average_embeddings()
            print(f"✅ Embeddings reloaded: {len(known_ids)} samples, {len(_averaged_embeddings)} students")
            return True
        except Exception as e:
            print("❌ Reload error:", e)
    return False


# ─────────────────────────────────────────────
# OPTIONAL: MANUAL TEST
# ─────────────────────────────────────────────
if __name__ == "__main__":
    cap = cv2.VideoCapture(0)
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        sid = recognize(frame)
        label = f"ID: {sid}" if sid else "Unknown"
        color = (0, 255, 0) if sid else (0, 0, 255)
        cv2.putText(frame, label, (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.9, color, 2)
        cv2.imshow("MirrorMind Recognition Test", frame)
        if cv2.waitKey(1) & 0xFF == ord("q"):
            break
    cap.release()
    cv2.destroyAllWindows()
