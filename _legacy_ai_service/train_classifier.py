import os
import random
import time
import json
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms, models
from PIL import Image

# 11 Official Classes matching class_names.json
OFFICIAL_CLASSES = [
    'Body Tissue or Organ',   # 0
    'Glass Equipment',        # 1
    'Metal Equipment',        # 2
    'Plastic Equipment',      # 3
    'Paper Equipment',        # 4
    'Syringe Needles',        # 5
    'Gauze',                  # 6
    'Gloves',                 # 7
    'Masks',                  # 8
    'Syringes',               # 9
    'Tweezers'                # 10
]

CLASS_KEYWORDS = {
    'Body Tissue or Organ': ['body'],
    'Glass Equipment': ['glass'],
    'Metal Equipment': ['metal'],
    'Plastic Equipment': ['plastic'],
    'Paper Equipment': ['paper'],
    'Syringe Needles': ['(SN) Syringe needles', 'needles'],
    'Gauze': ['Gauze', 'gauze'],
    'Gloves': ['Gloves', 'gloves'],
    'Masks': ['Mask', 'masks'],
    'Syringes': ['Syringe', 'syringes', 'syringe'],
    'Tweezers': ['Tweezers', 'tweezers']
}

def gather_dataset(raw_dir, max_per_class=450):
    all_files = os.listdir(raw_dir)
    data = []
    
    for cls_idx, cls_name in enumerate(OFFICIAL_CLASSES):
        keywords = CLASS_KEYWORDS[cls_name]
        paths = []
        for k in keywords:
            dir_p = os.path.join(raw_dir, k)
            if os.path.isdir(dir_p):
                for r, _, fs in os.walk(dir_p):
                    for f in fs:
                        if f.lower().endswith(('.jpg', '.jpeg', '.png')):
                            paths.append(os.path.join(r, f))
            # Loose files
            for f in all_files:
                if f.lower().startswith(k.lower() + '_') and f.lower().endswith(('.jpg', '.jpeg', '.png')):
                    paths.append(os.path.join(raw_dir, f))
        
        # Deduplicate
        paths = list(set(paths))
        random.seed(42 + cls_idx)
        random.shuffle(paths)
        
        selected = paths[:max_per_class] if len(paths) > max_per_class else paths
        print(f"[DATA] Class {cls_idx:2d} ({cls_name:22s}): {len(paths):4d} available -> selected {len(selected):3d}")
        for p in selected:
            data.append((p, cls_idx))
            
    return data

class MedicalDataset(Dataset):
    def __init__(self, samples, transform=None):
        self.samples = samples
        self.transform = transform

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        path, label = self.samples[idx]
        try:
            img = Image.open(path).convert('RGB')
        except Exception:
            img = Image.new('RGB', (224, 224), (128, 128, 128))
        if self.transform:
            img = self.transform(img)
        return img, label

def main():
    raw_dir = os.path.join(os.path.dirname(__file__), 'dataset', 'raw')
    if not os.path.exists(raw_dir):
        print(f"[ERROR] {raw_dir} does not exist.")
        return

    print("==========================================================")
    print(" TRAINING HIGH-ACCURACY DEEP CLASSIFIER (MobileNetV3-Large)")
    print(" Real Biomedical Waste Vision Architecture (11 Classes)   ")
    print("==========================================================")

    data = gather_dataset(raw_dir, max_per_class=450)
    random.seed(1337)
    random.shuffle(data)

    split = int(0.85 * len(data))
    train_samples = data[:split]
    val_samples = data[split:]
    print(f"[DATA] Total: {len(data)} | Train: {len(train_samples)} | Val: {len(val_samples)}")

    train_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomVerticalFlip(p=0.2),
        transforms.RandomRotation(degrees=20),
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    val_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    train_loader = DataLoader(MedicalDataset(train_samples, train_transform), batch_size=32, shuffle=True, num_workers=0)
    val_loader = DataLoader(MedicalDataset(val_samples, val_transform), batch_size=32, shuffle=False, num_workers=0)

    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"[DEVICE] Training on {device}")

    # Load pretrained MobileNetV3-Large
    model = models.mobilenet_v3_large(weights=models.MobileNet_V3_Large_Weights.DEFAULT)
    in_features = model.classifier[3].in_features
    model.classifier[3] = nn.Sequential(
        nn.Dropout(p=0.3),
        nn.Linear(in_features, len(OFFICIAL_CLASSES))
    )
    model.to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-4)
    epochs = 6
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)

    best_acc = 0.0
    out_model_path = os.path.join(os.path.dirname(__file__), 'medical_classifier.pth')

    for epoch in range(1, epochs + 1):
        t0 = time.time()
        model.train()
        train_loss = 0.0
        train_correct = 0
        total_train = 0

        for imgs, labels in train_loader:
            imgs, labels = imgs.to(device), labels.to(device)
            optimizer.zero_grad()
            outputs = model(imgs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            train_loss += loss.item() * imgs.size(0)
            _, preds = torch.max(outputs, 1)
            train_correct += (preds == labels).sum().item()
            total_train += imgs.size(0)

        scheduler.step()
        train_acc = train_correct / total_train

        # Validation
        model.eval()
        val_loss = 0.0
        val_correct = 0
        total_val = 0
        with torch.no_grad():
            for imgs, labels in val_loader:
                imgs, labels = imgs.to(device), labels.to(device)
                outputs = model(imgs)
                loss = criterion(outputs, labels)
                val_loss += loss.item() * imgs.size(0)
                _, preds = torch.max(outputs, 1)
                val_correct += (preds == labels).sum().item()
                total_val += imgs.size(0)

        val_acc = val_correct / total_val
        duration = time.time() - t0
        print(f"Epoch {epoch}/{epochs} ({duration:.1f}s) - Train Loss: {train_loss/total_train:.4f}, Train Acc: {train_acc*100:.2f}% | Val Loss: {val_loss/total_val:.4f}, Val Acc: {val_acc*100:.2f}%")

        if val_acc > best_acc:
            best_acc = val_acc
            torch.save({
                'arch': 'mobilenet_v3_large',
                'model_state_dict': model.state_dict(),
                'classes': OFFICIAL_CLASSES,
                'val_acc': val_acc
            }, out_model_path)
            print(f"  -> Saved new best model to {out_model_path} (Val Acc: {val_acc*100:.2f}%)")

    # Save final
    if not os.path.exists(out_model_path):
        torch.save({
            'arch': 'mobilenet_v3_large',
            'model_state_dict': model.state_dict(),
            'classes': OFFICIAL_CLASSES,
            'val_acc': val_acc
        }, out_model_path)

    print("==========================================================")
    print(f"[DONE] Best Validation Accuracy: {best_acc*100:.2f}%")
    print(f"[SAVED] Weights stored at: {out_model_path}")
    print("==========================================================")

if __name__ == '__main__':
    main()
