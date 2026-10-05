import numpy as np

class ObjectTracker:
    """ByteTrack-style IoU tracker with temporal EMA smoothing for webcam and video.
    
    Assigns persistent track_id across consecutive frames.
    Maintains a history of ViT classification probabilities per track
    to eliminate frame-to-frame label flickering.
    """
    def __init__(self, iou_thresh=0.25, max_lost=30, alpha=0.3):
        self.next_id = 1
        self.tracks = {}  # track_id -> dict(box, label, conf, probs, lost, age)
        self.iou_thresh = iou_thresh
        self.max_lost = max_lost
        self.alpha = alpha  # EMA smoothing factor

    def _iou(self, b1, b2):
        x1 = max(b1[0], b2[0])
        y1 = max(b1[1], b2[1])
        x2 = min(b1[2], b2[2])
        y2 = min(b1[3], b2[3])
        inter = max(0, x2 - x1) * max(0, y2 - y1)
        a1 = max(0, b1[2] - b1[0]) * max(0, b1[3] - b1[1])
        a2 = max(0, b2[2] - b2[0]) * max(0, b2[3] - b2[1])
        union = a1 + a2 - inter
        return inter / union if union > 0 else 0.0

    def update(self, detections):
        """Update tracker with new frame detections.
        
        Args:
            detections: list of dicts, each having 'box': [x1, y1, x2, y2], 'label', 'conf', 'all_probabilities'
            
        Returns:
            list of dicts with 'track_id' assigned and smoothed 'label' and 'confidence'.
        """
        unmatched_dets = list(range(len(detections)))
        matched_pairs = []

        # Greedy bipartite matching on IoU
        for tid, tdata in list(self.tracks.items()):
            best_iou = 0.0
            best_didx = -1
            for didx in unmatched_dets:
                iou = self._iou(tdata['box'], detections[didx]['box'])
                if iou > best_iou:
                    best_iou = iou
                    best_didx = didx

            if best_iou >= self.iou_thresh and best_didx != -1:
                matched_pairs.append((tid, best_didx))
                unmatched_dets.remove(best_didx)
            else:
                tdata['lost'] += 1
                if tdata['lost'] > self.max_lost:
                    del self.tracks[tid]

        # Update matched tracks with EMA smoothing
        for tid, didx in matched_pairs:
            det = detections[didx]
            tdata = self.tracks[tid]
            tdata['box'] = det['box']
            tdata['lost'] = 0
            tdata['age'] += 1

            # Smooth probability distributions
            new_probs = det.get('all_probabilities', {})
            old_probs = tdata.get('all_probabilities', {})
            smoothed_probs = {}
            for k in set(new_probs.keys()).union(old_probs.keys()):
                p_new = new_probs.get(k, 0.0)
                p_old = old_probs.get(k, p_new)
                smoothed_probs[k] = round(self.alpha * p_new + (1 - self.alpha) * p_old, 4)

            # Re-normalize
            total_p = sum(smoothed_probs.values()) or 1.0
            for k in smoothed_probs:
                smoothed_probs[k] = round(smoothed_probs[k] / total_p, 4)

            # Find smoothed top class
            top_class = max(smoothed_probs, key=smoothed_probs.get)
            top_conf = smoothed_probs[top_class]

            det['track_id'] = tid
            det['label'] = top_class
            det['confidence'] = top_conf
            det['all_probabilities'] = smoothed_probs
            tdata['all_probabilities'] = smoothed_probs
            tdata['label'] = top_class

        # Create new tracks for unmatched detections
        for didx in unmatched_dets:
            det = detections[didx]
            tid = self.next_id
            self.next_id += 1
            det['track_id'] = tid
            self.tracks[tid] = {
                'box': det['box'],
                'label': det['label'],
                'conf': det['confidence'],
                'all_probabilities': det.get('all_probabilities', {}),
                'lost': 0,
                'age': 1
            }

        return detections

    def reset(self):
        self.tracks.clear()
        self.next_id = 1
