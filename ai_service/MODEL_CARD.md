---
language:
- en
license: mit
tags:
- vision
- image-classification
- healthcare
- biomedical-waste
- vision-transformer
- vit
datasets:
- Pharmaceutical-and-Biomedical-Waste
metrics:
- accuracy
---

# MEDjestic Vision Transformer (ViT-B/16) - Medical Waste Classifier

## Model Description

**MEDjestic-ViT-B16-v1.0.0** is a Vision Transformer fine-tuned for real-time biomedical and clinical waste classification. It classifies medical waste items into 12 authoritative clinical classes mapped to the World Health Organization (WHO) biomedical waste disposal streams.

- **Model Architecture**: Vision Transformer (`vit_b_16`) with a trained 13-head linear classification layer.
- **Input Resolution**: 224x224 RGB
- **Model Size**: ~86M parameters (327.4 MB state_dict)
- **Author**: Adapted by MEDjestic Engineering Team from reference research by Sivakumar et al.

## Classes & WHO Streams

| Index | Label | WHO Biohazard Stream | Default Receptacle |
|---|---|---|---|
| 0 | Body Tissue or Organ | Biohazard Waste | Yellow Category |
| 1 | Glass Equipment | Sharps Waste | Yellow Category |
| 2 | Metal Equipment | Sharps Waste | Yellow Category |
| 3 | Organic Waste | Biohazard Waste | Yellow Category |
| 4 | Plastic Equipment | Recyclable Waste | Blue Category |
| 5 | Paper Equipment | Biohazard Waste | Yellow Category |
| 6 | Syringe Needles | Sharps Waste | Yellow Category |
| 7 | *(Quarantined: .DS_Store)* | *Invalid / Quarantined* | *None* |
| 8 | Gauze | Biohazard Waste | Yellow Category |
| 9 | Gloves | Infectious Waste | Red Category |
| 10 | Masks | General Waste | Black Category |
| 11 | Syringes | Sharps Waste | Yellow Category |
| 12 | Tweezers | Sharps Waste | Yellow Category |

## Evaluation Results

- **Validation Accuracy**: **88.33%** measured on clinical waste validation split.
- **Top Class Confidences**:
  - Masks: 99.9%
  - Syringes: 99.9%
  - Gloves: 98.6%
- **Rejection of Unknown/Noise**: Low-confidence threshold at **0.60** with a **0.20** margin safely quarantines non-medical inputs into an `Uncertain` state.

## Intended Use & Limitations

- **Intended Use**: Point-of-use clinical waste audit, hospital EMR disposal logs, smart medical bin assistance.
- **Limitations**: Whole-image classification architecture (does not produce object bounding boxes). Complex multi-item scenes classify the visually dominant specimen.
