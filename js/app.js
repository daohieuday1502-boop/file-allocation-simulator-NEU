
import {
  createDisk,
  releaseFile,
  TOTAL_BLOCKS,
  BLOCK_SIZE_BYTES
} from "./core/disk.js";

import { createFile } from "./core/file.js";
import { allocateContiguous } from "./allocations/contiguous.js";
import { allocateLinked } from "./allocations/linked.js";
import { allocateIndexed } from "./allocations/indexed.js";

// 1. Danh sach file mau
const TEST_FILES = [
  { id: "F01", name: "notes.txt", sizeBytes: 6100 },
  { id: "F02", name: "report.docx", sizeBytes: 18500 },
  { id: "F03", name: "photo.jpg", sizeBytes: 52000 },
  { id: "F04", name: "data.csv", sizeBytes: 33000 },
  { id: "F05", name: "slides.pptx", sizeBytes: 88000 },
  { id: "F06", name: "archive.zip", sizeBytes: 120000 }
];

// 2. Khoi tao du lieu
let disk = createDisk(TOTAL_BLOCKS);
let allocatedFiles = [];

const $ = id => document.getElementById(id);

const fileSelect = $("file-select");
const fileInfo = $("file-info");
const message = $("message");
const diskContainer = $("disk-container");
const diskStats = $("disk-stats");
const fileList = $("file-list");
const allocationDetails = $("allocation-details");

// 3. Hien thi thong tin file dang chon
function showSelectedFileInfo() {
  const definition = TEST_FILES.find(
    f => f.id === fileSelect.value
  );

  if (!definition) return;

  const file = createFile(definition, BLOCK_SIZE_BYTES);

  fileInfo.textContent =
    `File name: ${file.name}
File size: ${file.sizeBytes} bytes
Block size: ${file.blockSizeBytes} bytes
Required data blocks: ${file.requiredDataBlocks}`;
}

// 4. Cap phat file
function allocateFile() {
  const definition = TEST_FILES.find(
    f => f.id === fileSelect.value
  );

  if (!definition) return;

  if (allocatedFiles.some(f => f.id === definition.id)) {
    message.textContent = "This file is already allocated.";
    return;
  }

  const file = createFile(definition, BLOCK_SIZE_BYTES);

  const selected = document.querySelector(
    'input[name="allocation-method"]:checked'
  );

  if (!selected) {
    message.textContent = "Please select a method.";
    return;
  }

  const method = selected.value;
  let result;

  if (method === "CONTIGUOUS") {
    result = allocateContiguous(file, disk);
  } else if (method === "LINKED") {
    result = allocateLinked(file, disk);
  } else if (method === "INDEXED") {
    result = allocateIndexed(file, disk);
  } else {
    message.textContent = "Invalid allocation method.";
    return;
  }

  message.textContent = result.message;

  if (!result.success) return;

  allocatedFiles.push(file);
  renderAll(file);
}

// 5. Xoa file va giai phong block
function deleteFile(fileId) {
  releaseFile(disk, fileId);

  allocatedFiles = allocatedFiles.filter(
    f => f.id !== fileId
  );

  message.textContent = `File ${fileId} deleted.`;
  renderAll();
}

// 6. Reset o dia
function resetSimulator() {
  disk = createDisk(TOTAL_BLOCKS);
  allocatedFiles = [];

  message.textContent = "Simulator reset.";
  renderAll();
}

// 7. Cap nhat toan bo giao dien
function renderAll(selectedFile = null) {

  // A. Hien thi 100 block
  diskContainer.innerHTML = "";

  disk.forEach(block => {
    const element = document.createElement("div");
    element.className = "disk-block";

    if (block.status === "USED") {
      element.classList.add("used");
    }

    if (block.kind === "INDEX") {
      element.classList.add("index");
    }

    const idLabel = document.createElement("span");
    idLabel.className = "block-id";
    idLabel.textContent = block.id;

    const ownerLabel = document.createElement("span");
    ownerLabel.className = "block-owner";
    ownerLabel.textContent = block.fileId ?? "FREE";

    element.append(idLabel, ownerLabel);

    // Thong tin block khi di chuot vao
    let tooltip =
      `Block ${block.id}\nStatus: ${block.status}`;

    if (block.fileId !== null) {
      tooltip +=
        `\nFile: ${block.fileId}\nType: ${block.kind}`;
    }

    if (block.nextBlock !== null) {
      tooltip += `\nNext block: ${block.nextBlock}`;
    }

    if (block.kind === "INDEX") {
      tooltip +=
        `\nPointers: ${block.indexEntries.join(", ")}`;
    }

    element.title = tooltip;
    diskContainer.appendChild(element);
  });

  // B. Thong ke o dia
  const used = disk.filter(
    b => b.status === "USED"
  ).length;

  diskStats.textContent =
    `Block size: ${BLOCK_SIZE_BYTES} bytes
Total blocks: ${TOTAL_BLOCKS}
Disk capacity: ${TOTAL_BLOCKS * BLOCK_SIZE_BYTES} bytes
Used blocks: ${used}
Free blocks: ${TOTAL_BLOCKS - used}`;

  // C. Danh sach file da cap phat
  fileList.innerHTML = "";

  if (allocatedFiles.length === 0) {
    fileList.textContent = "No files allocated yet.";
  }

  allocatedFiles.forEach(file => {
    const row = document.createElement("div");
    row.className = "file-row";

    const text = document.createElement("span");
    text.textContent =
      `${file.name} — ${file.allocationMethod}`;

    const button = document.createElement("button");
    button.className = "delete-button";
    button.textContent = "Delete";
    button.addEventListener(
      "click", () => deleteFile(file.id)
    );

    row.append(text, button);
    fileList.appendChild(row);
  });

  // D. Chi tiet cap phat
  if (!selectedFile) {
    allocationDetails.textContent = "No file selected.";
    return;
  }

  const file = selectedFile;

  let details =
    `File: ${file.name}
File size: ${file.sizeBytes} bytes
Required data blocks: ${file.requiredDataBlocks}
Method: ${file.allocationMethod}`;

  if (file.allocationMethod === "CONTIGUOUS") {
    details +=
      `\nStart block: ${file.startBlock}
Data blocks: ${file.dataBlocks.join(", ")}`;
  }

  if (file.allocationMethod === "LINKED") {
    details +=
      `\nStart block: ${file.startBlock}
End block: ${file.endBlock}
Block chain: ${file.dataBlocks.join(" → ")}`;
  }

  if (file.allocationMethod === "INDEXED") {
    details +=
      `\nIndex block: ${file.indexBlock}
Data blocks: ${file.dataBlocks.join(", ")}
Physical blocks used: ${file.requiredDataBlocks + 1}`;
  }

  allocationDetails.textContent = details;
}

// 8. Khoi dong chuong trinh
TEST_FILES.forEach(file => {
  const option = document.createElement("option");
  option.value = file.id;
  option.textContent =
    `${file.name} (${file.sizeBytes} bytes)`;

  fileSelect.appendChild(option);
});

fileSelect.addEventListener(
  "change", showSelectedFileInfo
);

$("allocate-button").addEventListener(
  "click", allocateFile
);

$("reset-button").addEventListener(
  "click", resetSimulator
);

showSelectedFileInfo();
renderAll();
