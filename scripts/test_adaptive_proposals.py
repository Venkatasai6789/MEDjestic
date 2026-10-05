import cv2
import numpy as np

img_path = r"C:\Users\HARSHA VARDHAN BALA\Downloads\images (6).jpg"
img = cv2.imread(img_path)
h, w = img.shape[:2]

gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# Multi-scale adaptive thresholding / gradient magnitude
proposals = []

# 1. Gradient magnitude (Sobel)
grad_x = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3)
grad_y = cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=3)
grad_mag = cv2.magnitude(grad_x, grad_y)
grad_mag = cv2.normalize(grad_mag, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)

# 2. Adaptive thresholding across multiple block sizes
for block_size in [15, 31, 51]:
    for C in [2, 5, 8]:
        thresh = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, block_size, C)
        # Dilate slightly to form object blobs
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (7, 7))
        dilated = cv2.dilate(thresh, kernel, iterations=1)
        contours, _ = cv2.findContours(dilated, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
        for c in contours:
            x, y, bw, bh = cv2.boundingRect(c)
            area = bw * bh
            aspect = bw / float(bh)
            # Filter object scales: smaller than 60% of image, larger than 2% of image
            if (w * h * 0.015) <= area <= (w * h * 0.40):
                if bw >= 30 and bh >= 30:
                    proposals.append([x, y, x + bw, y + bh])

print(f"Total raw proposals from adaptive thresholding: {len(proposals)}")

# Apply NMS on these proposals
def box_iou(b1, b2):
    x1 = max(b1[0], b2[0])
    y1 = max(b1[1], b2[1])
    x2 = min(b1[2], b2[2])
    y2 = min(b1[3], b2[3])
    inter = max(0, x2 - x1) * max(0, y2 - y1)
    a1 = (b1[2] - b1[0]) * (b1[3] - b1[1])
    a2 = (b2[2] - b2[0]) * (b2[3] - b2[1])
    return inter / float(a1 + a2 - inter) if (a1 + a2 - inter) > 0 else 0

clean = []
for p in proposals:
    overlap = False
    for c in clean:
        if box_iou(p, c) > 0.40:
            overlap = True
            break
    if not overlap:
        clean.append(p)

print(f"Clean non-overlapping proposals: {len(clean)}")
for i, b in enumerate(clean):
    print(f"  Box {i+1}: {b} (size {b[2]-b[0]}x{b[3]-b[1]})")
