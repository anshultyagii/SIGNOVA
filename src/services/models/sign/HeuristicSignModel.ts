import { BaseSignModel } from './BaseSignModel';
import type { ProcessedFrame } from '../../../types/landmarks';
import type { RecognitionPrediction } from '../../../types/models';

export class HeuristicSignModel extends BaseSignModel {
  readonly id = 'heuristic_rules';
  readonly name = 'Geometric Gesture Engine (Baseline)';
  readonly description = 'Rule-based real-time gesture & sign detector leveraging 3D arm kinematics, hand topology, and facial spatial relations.';
  readonly type = 'heuristic' as const;
  readonly requiredFrames = 15;

  private lastDetectedSign: string | null = null;
  private signHoldCount = 0;

  async initialize(): Promise<void> {
    this._isReady = true;
  }

  async predict(frames: ProcessedFrame[]): Promise<RecognitionPrediction | null> {
    if (!this._isReady || frames.length === 0) return null;

    const latest = frames[frames.length - 1];
    const oldest = frames[Math.max(0, frames.length - 15)];

    const { kinematics } = latest;
    const { leftArm, rightArm, leftHand, rightHand, face } = kinematics;

    // Determine primary active arm & hand (prefer right hand, or left if active)
    const activeHand = rightHand.detected ? rightHand : leftHand;
    const activeArm = rightHand.detected ? rightArm : leftArm;
    const isRight = rightHand.detected;

    // Movement calculation over recent frames
    const oldestWrist = isRight ? oldest.kinematics.rightArm.wristPosition : oldest.kinematics.leftArm.wristPosition;
    const deltaX = activeArm.wristPosition.x - oldestWrist.x;
    const deltaY = activeArm.wristPosition.y - oldestWrist.y;

    let detected: { label: string; confidence: number; category: RecognitionPrediction['category'] } | null = null;

    // 1. "I LOVE YOU" Sign (Thumb, Index, Pinky extended)
    if (activeHand.detected && activeHand.shape === 'i_love_you' && activeArm.isRaised) {
      detected = { label: 'I LOVE YOU', confidence: 0.95, category: 'emotion' };
    }
    // 2. "CALL ME" Sign (Thumb and pinky extended to ear/face)
    else if (activeHand.detected && activeHand.shape === 'call_me' && activeArm.distanceToFace < 0.4) {
      detected = { label: 'CALL ME', confidence: 0.92, category: 'basic' };
    }
    // 3. "PEACE / V" Sign (Index & middle in V)
    else if (activeHand.detected && activeHand.shape === 'victory' && activeArm.isRaised) {
      detected = { label: 'PEACE', confidence: 0.94, category: 'basic' };
    }
    // 4. "THUMBS UP / GOOD"
    else if (activeHand.detected && activeHand.shape === 'thumbs_up' && activeArm.elbowAngle > 60 && activeArm.elbowAngle < 150) {
      detected = { label: 'GOOD / THUMBS UP', confidence: 0.93, category: 'response' };
    }
    // 5. "THANK YOU" (Open hand starting at chin/mouth and moving downward/forward)
    else if (
      activeHand.detected &&
      (activeHand.shape === 'open' || activeHand.openFingersCount >= 3) &&
      activeArm.distanceToFace < 0.38 &&
      deltaY > 0.02
    ) {
      detected = { label: 'THANK YOU', confidence: 0.90, category: 'polite' };
    }
    // 6. "HELLO" (Open hand raised near temple/forehead with slight horizontal wave or raised position)
    else if (
      activeHand.detected &&
      activeHand.shape === 'open' &&
      activeArm.wristPosition.y < (isRight ? latest.pose[12]?.y || 0.4 : latest.pose[11]?.y || 0.4) &&
      (Math.abs(deltaX) >= 0 || activeArm.distanceToFace < 0.42) &&
      activeArm.elbowAngle > 50 &&
      activeArm.elbowAngle < 150
    ) {
      detected = { label: 'HELLO', confidence: 0.91, category: 'greeting' };
    }
    // 7. "PLEASE" (Open flat hand circling or placed on chest)
    else if (
      activeHand.detected &&
      activeHand.shape === 'open' &&
      activeArm.distanceToFace >= 0.25 &&
      activeArm.distanceToFace <= 0.55 &&
      !activeArm.isRaised
    ) {
      detected = { label: 'PLEASE', confidence: 0.86, category: 'polite' };
    }
    // 8. "YES" (Fist nodding up/down with arm bent)
    else if (
      activeHand.detected &&
      activeHand.shape === 'fist' &&
      activeArm.isRaised &&
      Math.abs(deltaY) > 0.02
    ) {
      detected = { label: 'YES', confidence: 0.88, category: 'response' };
    }
    // 9. "NO" (Pinch gesture / index, middle & thumb tapping together in front)
    else if (
      activeHand.detected &&
      activeHand.shape === 'pinch' &&
      activeArm.isRaised
    ) {
      detected = { label: 'NO', confidence: 0.89, category: 'response' };
    }
    // 10. "STOP" (Arm extended forward, elbow straight, open palm)
    else if (
      activeHand.detected &&
      activeHand.shape === 'open' &&
      activeArm.elbowAngle > 140 &&
      activeArm.isRaised
    ) {
      detected = { label: 'STOP', confidence: 0.87, category: 'basic' };
    }
    // 11. Facial Emotion / Gesture (Smiling or Surprised/Mouth Open)
    else if (face.mouthOpenRatio > 0.38) {
      detected = { label: 'WOW / SURPRISED', confidence: 0.82, category: 'emotion' };
    }

    if (!detected) {
      this.signHoldCount = 0;
      this.lastDetectedSign = null;
      return null;
    }

    // Debounce / confirmation across consecutive frames
    if (detected.label === this.lastDetectedSign) {
      this.signHoldCount++;
    } else {
      this.lastDetectedSign = detected.label;
      this.signHoldCount = 1;
    }

    // Only trigger after being sustained for at least 3 frames
    if (this.signHoldCount >= 3) {
      return {
        label: detected.label,
        confidence: Math.min(0.99, detected.confidence + Math.min(0.06, this.signHoldCount * 0.01)),
        timestamp: latest.timestamp,
        category: detected.category,
      };
    }

    return null;
  }
}
