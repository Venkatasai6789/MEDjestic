from collections import deque
from config import CONFIDENCE_THRESHOLD

class TemporalStabilizer:
    """Rolling prediction window for temporal consistency.
    
    Prevents rapid label flickering during webcam inference by
    maintaining a short history of predictions and returning the
    most frequent recent prediction.
    """
    
    def __init__(self, window_size: int = 5, min_agreement: float = 0.6):
        self.window_size = window_size
        self.min_agreement = min_agreement
        self.history = deque(maxlen=window_size)
    
    def update(self, prediction: dict) -> dict:
        """Add a new prediction and return the stabilized result.
        
        Args:
            prediction: dict with 'predicted_class' and 'confidence'
        
        Returns:
            Stabilized prediction dict
        """
        self.history.append(prediction)
        
        if len(self.history) < 2:
            return prediction
        
        # Count class occurrences in window
        class_counts = {}
        class_confs = {}
        for p in self.history:
            cls = p.get('predicted_class')
            if cls is None:
                continue
            class_counts[cls] = class_counts.get(cls, 0) + 1
            if cls not in class_confs:
                class_confs[cls] = []
            class_confs[cls].append(p.get('confidence', 0))
        
        if not class_counts:
            return prediction
        
        # Find most frequent class
        most_common = max(class_counts, key=class_counts.get)
        agreement = class_counts[most_common] / len(self.history)
        
        if agreement >= self.min_agreement:
            # Return the most recent prediction of the dominant class
            avg_conf = sum(class_confs[most_common]) / len(class_confs[most_common])
            return {
                **prediction,
                'predicted_class': most_common,
                'confidence': round(avg_conf, 4),
                'stabilized': True,
                'agreement': round(agreement, 2)
            }
        
        # No strong agreement - return latest but mark as unstable
        return {
            **prediction,
            'stabilized': False,
            'agreement': round(agreement, 2)
        }
    
    def reset(self):
        """Clear prediction history."""
        self.history.clear()
