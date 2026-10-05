import cv2
import numpy as np

img_path = r"C:\Users\HARSHA VARDHAN BALA\Downloads\images (6).jpg"
img = cv2.imread(img_path)
h, w = img.shape[:2]

# Method 1: Edge & Gradient based proposals
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
blurred = cv2.GaussianBlur(gray, (5, 5), 0)

# Canny edges
edges = cv2.Canny(blurred, 30, 120)

# Morphological closing to connect component edges
kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (9, 9))
closed = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel)

contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
print(f"Total edge contours: {len(contours)}")

boxes = []
for c in contours:
    x, y, bw, bh = cv2.boundingRect(c)
    area = bw * bh
    # Filter reasonable object sizes: between 0.5% and 40% of image area (NOT whole image!)
    if (w * h * 0.005) <= area <= (w * h * 0.45):
        if bw >= 20 and bh >= 20:
            boxes.append([x, y, x + bw, y + bh])

print(f"Filtered edge proposal boxes: {len(boxes)}")
for i, b in enumerate(boxes):
    print(f"  Box {i+1}: {b} (size {b[2]-b[0]}x{b[3]-b[1]})")
