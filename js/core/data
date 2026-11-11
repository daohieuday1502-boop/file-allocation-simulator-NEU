import { allocateContiguous } from "./allocations/contiguous.js";
import { allocateLinked } from "./allocations/linked.js";
import { allocateIndexed } from "./allocations/indexed.js";

export const TEST_FILES = [
  { id: "F01", name: "tiny.txt", sizeBytes: 1000 },
  { id: "F02", name: "notes.txt", sizeBytes: 6100 },
  { id: "F03", name: "report.docx", sizeBytes: 18500 },
  { id: "F04", name: "diagram.png", sizeBytes: 20470 },
  { id: "F05", name: "photo.jpg", sizeBytes: 52000 },
  { id: "F06", name: "data.csv", sizeBytes: 33000 },
  { id: "F07", name: "slides.pptx", sizeBytes: 88000 },
  { id: "F08", name: "database.db", sizeBytes: 32768 },
  { id: "F09", name: "video-clip.mp4", sizeBytes: 120000 }
];

export const SCENARIO_FILES = [
  { id: "S01", name: "assignment.pdf", method: "CONTIGUOUS", blocks: [0, 1, 2, 3, 4, 5, 6, 7] },
  { id: "S02", name: "project.zip", method: "LINKED", blocks: [13, 17, 14, 18, 15, 19, 16, 20] },
  { id: "S03", name: "records.csv", method: "INDEXED", indexBlock: 30, blocks: [26, 27, 28, 29, 30, 31, 32, 33, 34] },
  { id: "S04", name: "presentation.pptx", method: "CONTIGUOUS", blocks: [40, 41, 42, 43, 44, 45, 46, 47] },
  { id: "S05", name: "images.zip", method: "LINKED", blocks: [53, 57, 54, 58, 55, 59, 56, 60, 61] },
  { id: "S06", name: "source-code.zip", method: "INDEXED", indexBlock: 71, blocks: [67, 68, 69, 70, 71, 72, 73, 74] },
  { id: "S07", name: "lecture-notes.pdf", method: "CONTIGUOUS", blocks: [80, 81, 82, 83, 84, 85, 86, 87, 88] },
  { id: "S08", name: "backup.dat", method: "LINKED", blocks: [94, 97, 95, 98, 96, 99] }
];

export const METHOD_ALLOCATORS = {
  CONTIGUOUS: allocateContiguous,
  LINKED: allocateLinked,
  INDEXED: allocateIndexed
};
