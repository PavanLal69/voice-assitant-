"""
KREO Face Recognition System
Detects and verifies user face for system access
"""

import cv2
import face_recognition
import os
import sys
import json

# Configuration
KNOWN_FACE_FILE = "user.jpg"
TOLERANCE = 0.6
VIDEO_INDEX = 0  # Usually 0 for default webcam

def load_known_face():
    """Load the known face encoding from file"""
    if not os.path.exists(KNOWN_FACE_FILE):
        print(f"❌ {KNOWN_FACE_FILE} not found!")
        print(f"📸 Please take a photo and save it as {KNOWN_FACE_FILE}")
        return None
    
    try:
        known_image = face_recognition.load_image_file(KNOWN_FACE_FILE)
        known_encoding = face_recognition.face_encodings(known_image)
        
        if len(known_encoding) == 0:
            print(f"❌ No face detected in {KNOWN_FACE_FILE}")
            return None
        
        return known_encoding[0]
    except Exception as e:
        print(f"❌ Error loading face: {e}")
        return None

def capture_face():
    """Capture a face from webcam and save it"""
    print("📸 Capturing face... Look at the camera!")
    video = cv2.VideoCapture(VIDEO_INDEX)
    
    if not video.isOpened():
        print("❌ Could not open webcam")
        return False
    
    ret, frame = video.read()
    if not ret:
        print("❌ Could not capture frame")
        video.release()
        return False
    
    # Convert BGR to RGB (face_recognition uses RGB)
    rgb_frame = frame[:, :, ::-1]
    
    # Detect faces
    face_locations = face_recognition.face_locations(rgb_frame)
    
    if len(face_locations) == 0:
        print("❌ No face detected. Try again.")
        video.release()
        return False
    
    # Save the frame
    cv2.imwrite(KNOWN_FACE_FILE, frame)
    print(f"✅ Face saved to {KNOWN_FACE_FILE}")
    
    video.release()
    return True

def verify_face():
    """Verify if the current face matches the known face"""
    known_encoding = load_known_face()
    
    if known_encoding is None:
        return False
    
    video = cv2.VideoCapture(VIDEO_INDEX)
    
    if not video.isOpened():
        print("❌ Could not open webcam")
        return False
    
    print("🔍 Scanning for face...")
    
    frame_count = 0
    max_frames = 90  # Check for 3 seconds at 30fps
    
    while frame_count < max_frames:
        ret, frame = video.read()
        if not ret:
            break
        
        # Convert BGR to RGB
        rgb_frame = frame[:, :, ::-1]
        
        # Find faces
        face_locations = face_recognition.face_locations(rgb_frame)
        face_encodings = face_recognition.face_encodings(rgb_frame, face_locations)
        
        for face_encoding in face_encodings:
            # Compare with known face
            matches = face_recognition.compare_faces(
                [known_encoding], 
                face_encoding, 
                tolerance=TOLERANCE
            )
            
            if matches[0]:
                print("✅ AUTHORIZED - Face verified!")
                video.release()
                return True
        
        frame_count += 1
        
        # Show preview (optional)
        if frame_count % 10 == 0:
            cv2.imshow("Face Recognition", frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
    
    video.release()
    cv2.destroyAllWindows()
    print("❌ Face not recognized")
    return False

def main():
    """Main function"""
    if len(sys.argv) > 1 and sys.argv[1] == "capture":
        capture_face()
    else:
        result = verify_face()
        # Output result as JSON for frontend
        print(json.dumps({"authorized": result}))

if __name__ == "__main__":
    main()

