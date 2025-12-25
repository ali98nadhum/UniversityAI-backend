
const { pipeline } = require("@xenova/transformers");



let extractor = null;

async function loadModel() {
  if (!extractor) {
    console.log("⏳ Loading Semantic AI Model (Free)...");
    extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    console.log("✅ Model Loaded.");
  }
}

async function getVector(text) {
  await loadModel();
  const output = await extractor(text, { pooling: "mean", normalize: true });
  return Array.from(output.data);
}

module.exports = {
  loadModel,
  getVector
};
