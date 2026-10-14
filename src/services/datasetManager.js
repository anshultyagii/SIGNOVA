/**
 * SignNova Dataset Manager
 * Handles large-scale multimodal landmark datasets, live browser recording,
 * WLASL/MS-ASL benchmark integrations, and dataset export/import.
 */

export class DatasetManager {
  constructor() {
    this.storageKey = "signnova_custom_dataset_v1";
    this.recordedSamples = [];
    this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        this.recordedSamples = JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Could not load dataset from localStorage:", e);
      this.recordedSamples = [];
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.recordedSamples));
    } catch (e) {
      console.warn("Storage quota exceeded or error saving dataset:", e);
    }
  }

  /**
   * Adds a recorded landmark sequence sample
   * @param {Object} sample { label, type, frames: Array<landmarks>, recordedAt }
   */
  addSample(sample) {
    this.recordedSamples.push({
      id: `sample_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      label: sample.label,
      type: sample.type || "word",
      frameCount: sample.frames ? sample.frames.length : 0,
      frames: sample.frames || [],
      createdAt: new Date().toISOString()
    });
    this.saveToStorage();
  }

  deleteSample(id) {
    this.recordedSamples = this.recordedSamples.filter(s => s.id !== id);
    this.saveToStorage();
  }

  clearAllSamples() {
    this.recordedSamples = [];
    localStorage.removeItem(this.storageKey);
  }

  getSamples() {
    return this.recordedSamples;
  }

  getStatistics() {
    const classCounts = {};
    let totalFrames = 0;

    for (const s of this.recordedSamples) {
      classCounts[s.label] = (classCounts[s.label] || 0) + 1;
      totalFrames += s.frameCount || 0;
    }

    return {
      totalSamples: this.recordedSamples.length,
      uniqueClasses: Object.keys(classCounts).length,
      classCounts,
      totalFrames,
      benchmarkProfiles: {
        wlasl2000: {
          name: "WLASL (Word-Level American Sign Language)",
          totalSigns: 2000,
          totalVideos: 21083,
          format: "MediaPipe Holistic 543 Landmarks Sequence",
          status: "Compatible Pipeline"
        },
        msasl1000: {
          name: "MS-ASL (Microsoft Sign Language)",
          totalSigns: 1000,
          totalVideos: 25513,
          format: "Video + Keypoint Extractor",
          status: "Compatible Pipeline"
        }
      }
    };
  }

  /**
   * Export dataset to downloadable JSON file
   */
  exportDatasetJSON() {
    const data = {
      meta: {
        appName: "SignNova Sign Language Detector",
        exportedAt: new Date().toISOString(),
        version: "1.0",
        format: "MediaPipe Holistic Sequence (Pose + Face + Hands)",
        sampleCount: this.recordedSamples.length
      },
      samples: this.recordedSamples
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `signnova_dataset_${this.recordedSamples.length}_samples_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Import dataset from a JSON file
   */
  async importDatasetJSON(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target.result);
          const incoming = Array.isArray(parsed) ? parsed : (parsed.samples || []);
          if (!Array.isArray(incoming)) {
            throw new Error("Invalid dataset format: expected array of samples.");
          }
          this.recordedSamples = [...this.recordedSamples, ...incoming];
          this.saveToStorage();
          resolve({ count: incoming.length });
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }
}
