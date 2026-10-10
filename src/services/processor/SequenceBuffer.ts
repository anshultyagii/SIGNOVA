import type { ProcessedFrame, RecordedGestureSequence } from '../../types/landmarks';

export class SequenceBuffer {
  private buffer: ProcessedFrame[] = [];
  private capacity: number;

  constructor(capacity = 30) {
    this.capacity = capacity;
  }

  public setCapacity(newCapacity: number) {
    this.capacity = Math.max(5, Math.min(120, newCapacity));
    if (this.buffer.length > this.capacity) {
      this.buffer = this.buffer.slice(this.buffer.length - this.capacity);
    }
  }

  public getCapacity(): number {
    return this.capacity;
  }

  public push(frame: ProcessedFrame): void {
    this.buffer.push(frame);
    if (this.buffer.length > this.capacity) {
      this.buffer.shift();
    }
  }

  public getFrames(): ProcessedFrame[] {
    return [...this.buffer];
  }

  public getLatest(): ProcessedFrame | null {
    return this.buffer.length > 0 ? this.buffer[this.buffer.length - 1] : null;
  }

  public isFull(): boolean {
    return this.buffer.length >= this.capacity;
  }

  public size(): number {
    return this.buffer.length;
  }

  public clear(): void {
    this.buffer = [];
  }

  /**
   * Flattens the current sequence into a 1D Float32Array of size [capacity * 1662]
   * Suitable for direct loading into ONNX Runtime or TensorFlow.js tensors:
   * e.g. new ort.Tensor('float32', flattenedArray, [1, sequenceLength, 1662])
   */
  public toTensorArray(): Float32Array {
    const featureSize = 1662;
    const totalSize = this.buffer.length * featureSize;
    const tensorData = new Float32Array(totalSize);

    for (let i = 0; i < this.buffer.length; i++) {
      tensorData.set(this.buffer[i].featureVector, i * featureSize);
    }

    return tensorData;
  }

  /**
   * Serializes the current sequence into a dataset recording structure for training
   */
  public toDatasetRecording(label: string, fps = 30): RecordedGestureSequence {
    return {
      id: `seq_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      label,
      recordedAt: new Date().toISOString(),
      fps,
      frameCount: this.buffer.length,
      frames: this.buffer.map((f) => ({
        timestamp: f.timestamp,
        pose: f.pose,
        faceKeypoints: f.face.slice(0, 50), // compact keypoints for file size
        leftHand: f.leftHand,
        rightHand: f.rightHand,
        kinematics: f.kinematics,
        featureVector: Array.from(f.featureVector),
      })),
    };
  }
}
