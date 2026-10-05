# MEDjestic AI Model Migration Documentation

## Upstream Reference & Provenance

* **Original Repository**: [Vishnugupta2711/Real-time-medical-waste-segregation-using-transformers-and-edge-AI-solutions](https://github.com/Vishnugupta2711/Real-time-medical-waste-segregation-using-transformers-and-edge-AI-solutions.git)
* **Authors/Researchers**: Soubraylu Sivakumar, Abhay Kumar, Vishnu Gupta
* **Integration Date**: October 4, 2026
* **Original Model Architecture**: Vision Transformer (ViT-B/16) fine-tuned on Ubon Ratchathani University's "Pharmaceutical and Biomedical Waste" dataset (6,156 images across 13 raw classes).
* **Adaptation / Attribution**: Adapted and integrated by the MEDjestic Engineering Team for the MEDjestic Clinical Hospital Waste OS.

---

## Technical Audit & Discovered Inconsistencies

1. **The `.DS_Store` Dataset Artifact**:
   * In the upstream training repository, the directory scan included a macOS filesystem metadata file `.DS_Store` as Class Index 7 (`.DS_Store`).
   * `.DS_Store` is a filesystem artifact, not a clinical waste category.
   * **MEDjestic Adaptation**: Index 7 is quarantined and marked as invalid in post-processing. If the ViT output produces class index 7 or low-confidence ambiguous logits, it is flagged as `Uncertain` / `Invalid` rather than treating it as a medical waste specimen.

2. **Classification vs Object Detection Truthfulness**:
   * The upstream Vision Transformer (`vit_b_16`) is a whole-image deep classifier, **not** an object localization / bounding-box detector.
   * The legacy MEDjestic Flask microservice previously attempted to synthesize bounding boxes using CV edge heuristic patches with hardcoded coordinates, masquerading as a detector.
   * **MEDjestic Adaptation**: The new AI architecture is technically honest. It exposes a whole-image ViT classifier, returning empty bounding box arrays `[]` and rendering high-definition tactical classification badges and telemetry headers on the visual output rather than fabricating fake bounding rectangles.

3. **Real-Time Webcam Streaming**:
   * The upstream script used physical OpenCV camera device index `0` (`cv2.VideoCapture(0)`).
   * In MEDjestic, the client browser owns WebRTC camera access via `navigator.mediaDevices.getUserMedia`. Frames are captured offscreen into JPEG blobs and dispatched via asynchronous HTTPS calls to `/predict/frame` with temporal stabilization to prevent UI jitter.

4. **Background Job Video Processing**:
   * Built asynchronous job processing for MP4, MOV, and WebM video uploads.
   * Uploads are assigned a unique UUID `job_id`, sampled at ~3 FPS across duration, stabilized using a temporal rolling window, and queried via polling `/video/{job_id}/status` and `/video/{job_id}/result`.

---

## Authoritative Class Mapping (12 Valid Classes)

| Model Index | Upstream Raw Label | MEDjestic Clean Label | WHO Biohazard Stream | Default Bin |
|---|---|---|---|---|
| 0 | `(BT) Body Tissue or Organ` | Body Tissue or Organ | Biohazard Waste | Yellow Category |
| 1 | `(GE) Glass equipment-packaging 551` | Glass Equipment | Sharps Waste | Yellow Category |
| 2 | `(ME) Metal equipment -packaging` | Metal Equipment | Sharps Waste | Yellow Category |
| 3 | `(OW) Organic wastes` | Organic Waste | Biohazard Waste | Yellow Category |
| 4 | `(PE) Plastic equipment-packaging` | Plastic Equipment | Recyclable Waste | Blue Category |
| 5 | `(PP) Paper equipment-packaging` | Paper Equipment | Biohazard Waste | Yellow Category |
| 6 | `(SN) Syringe needles` | Syringe Needles | Sharps Waste | Yellow Category |
| 7 | `.DS_Store` | *Quarantined / Invalid* | *None* | *None* |
| 8 | `Gauze` | Gauze | Biohazard Waste | Yellow Category |
| 9 | `Gloves` | Gloves | Infectious Waste | Red Category |
| 10 | `Mask` | Masks | General Waste | Black Category |
| 11 | `Syringe` | Syringes | Sharps Waste | Yellow Category |
| 12 | `Tweezers` | Tweezers | Sharps Waste | Yellow Category |

---

## Service Endpoints & API Contract

* `GET /health`: Service health status, model loaded state, device (`cpu` / `cuda`), timestamp.
* `GET /model/info`: Complete model metadata, architecture description, class list, and capabilities.
* `POST /predict`: Primary image inference endpoint (`multipart/form-data`, key `image`).
* `POST /predict/frame`: Webcam frame endpoint with temporal smoothing (`multipart/form-data`, key `image`).
* `POST /video/upload`: Video file ingestion returning `{ job_id, status: "queued" }`.
* `GET /video/{job_id}/status`: Video processing progress and state (`queued`, `processing`, `completed`, `failed`).
* `GET /video/{job_id}/result`: Structured video analysis summary, sampled frames metrics, and class distribution.
