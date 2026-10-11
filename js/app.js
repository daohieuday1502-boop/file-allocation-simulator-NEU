
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

// ===================================
// 1. DANH SACH FILE MAU
// ===================================

const TEST_FILES = [
  { id: "F01", name: "notes.txt", sizeBytes: 6100 },
  { id: "F02", name: "report.docx", sizeBytes: 18500 },
  { id: "F03", name: "photo.jpg", sizeBytes: 52000 },
  { id: "F04", name: "data.csv", sizeBytes: 33000 },
  { id: "F05", name: "slides.pptx", sizeBytes: 88000 },
  { id: "F06", name: "archive.zip", sizeBytes: 120000 }
];

// ===================================
// 2. KHOI TAO CHUONG TRINH
// ===================================

let disk = createDisk(TOTAL_BLOCKS);
let allocatedFiles = [];

const fileSelect = document.getElementById("file-select");
const fileInfo = document.getElementById("file-info");
const allocateButton = document.getElementById("allocate-button");
const resetButton = document.getElementById("reset-button");
const diskContainer = document.getElementById("disk-container");
const diskStats = document.getElementById("disk-stats");
const message = document.getElementById("message");
const allocationDetails = document.getElementById("allocation-details");
const fileList = document.getElementById("file-list");

// ===================================
// 3. HIEN THI FILE DANG CHON
// ===================================

function showSelectedFileInfo() {
  const definition = TEST_FILES.find(
    file => file.id === fileSelect.value
  );

  if (!definition) return;

  const file = createFile(definition, BLOCK_SIZE_BYTES);

  fileInfo.textContent =
    `File name: ${file.name}
File size: ${file.sizeBytes} bytes
Block size: ${file.blockSizeBytes} bytes
Required data blocks: ${file.requiredDataBlocks}`;
}

// ===================================
// 4. CAP PHAT FILE
// ===================================

function allocateFile() {
  const definition = TEST_FILES.find(
    file => file.id === fileSelect.value
  );

  if (!definition) return;

  // Kiem tra file da ton tai chua
  const alreadyExists = allocatedFiles.some(
    file => file.id === definition.id
  );

  if (alreadyExists) {
    message.textContent = "This file is already allocated.";
    return;
  }

  const file = createFile(definition, BLOCK_SIZE_BYTES);

  // Lay phuong phap cap phat
  const selected = document.querySelector(
    'input[name="allocation-method"]:checked'
  );

  if (!selected) {
    message.textContent = "Please select an allocation method.";
    return;
  }

  const method = selected.value;

  let result;

  // Goi thuat toan tuong ung
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

  // Cap nhat giao dien
  renderAll(file);
}

// ===================================
// 5. XOA FILE
// ===================================

function deleteFile(fileId) {
  releaseFile(disk, fileId);

  allocatedFiles = allocatedFiles.filter(
    file => file.id !== fileId
  );

  message.textContent = `File ${fileId} deleted.`;

  renderAll();
}

// ===================================
// 6. RESET O DIA
// ===================================

function resetSimulator() {
  disk = createDisk(TOTAL_BLOCKS);
  allocatedFiles = [];

  message.textContent = "Simulator reset.";

  renderAll();
}

// ===================================
// 7. CAP NHAT GIAO DIEN
// ===================================

function renderAll(selectedFile = null) {

  // ---------------------------------
  // A. HIEN THI VIRTUAL DISK
  // ---------------------------------

  diskContainer.innerHTML = "";

  disk.forEach(block => {
    const element = document.createElement("div");

    element.className = "disk-block";

    // Lay thong tin file so huu block
    const ownerFile = allocatedFiles.find(
      file => file.id === block.fileId
    );

    // Gan mau theo allocation method
    if (block.status === "USED") {

      element.classList.add("used");

      if (ownerFile) {
        const methodClass =
          ownerFile.allocationMethod.toLowerCase();

        element.classList.add(methodClass);
      }

      // Index block co mau rieng
      if (block.kind === "INDEX") {
        element.classList.add("index");
      }
    }

    // Block ID
    const idLabel = document.createElement("span");
    idLabel.className = "block-id";
    idLabel.textContent = block.id;

    // File ID / FREE
    const ownerLabel = document.createElement("span");
    ownerLabel.className = "block-owner";
    ownerLabel.textContent = block.fileId ?? "FREE";

    element.appendChild(idLabel);
    element.appendChild(ownerLabel);

    // ---------------------------------
    // THONG TIN KHI DI CHUOT VAO BLOCK
    // ---------------------------------

    let tooltip =
      `Block ${block.id}
Status: ${block.status}`;

    if (block.fileId !== null) {
      tooltip += `\nFile: ${block.fileId}`;

      if (ownerFile) {
        tooltip +=
          `\nAllocation Method: ${ownerFile.allocationMethod}`;
      }

      tooltip += `\nType: ${block.kind}`;
    }

    // Linked Allocation
    if (block.nextBlock !== null) {
      tooltip +=
        `\nNext block: ${block.nextBlock}`;
    }

    // Indexed Allocation
    if (block.kind === "INDEX") {
      tooltip +=
        `\nPointers: ${block.indexEntries.join(", ")}`;
    }

    element.title = tooltip;

    diskContainer.appendChild(element);
  });

  // ---------------------------------
  // B. THONG KE O DIA
  // ---------------------------------

  const used = disk.filter(
    block => block.status === "USED"
  ).length;

  const free = TOTAL_BLOCKS - used;

  diskStats.textContent =
    `Block size: ${BLOCK_SIZE_BYTES} bytes
Total blocks: ${TOTAL_BLOCKS}
Disk capacity: ${TOTAL_BLOCKS * BLOCK_SIZE_BYTES} bytes
Used blocks: ${used}
Free blocks: ${free}`;

  // ---------------------------------
  // C. DANH SACH FILE
  // ---------------------------------

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

    const deleteButton = document.createElement("button");

    deleteButton.className = "delete-button";
    deleteButton.textContent = "Delete";

    deleteButton.addEventListener(
      "click",
      () => deleteFile(file.id)
    );

    row.appendChild(text);
    row.appendChild(deleteButton);

    fileList.appendChild(row);
  });

  // ---------------------------------
  // D. CHI TIET CAP PHAT
  // ---------------------------------

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

  // Contiguous
  if (file.allocationMethod === "CONTIGUOUS") {
    details +=
      `\nStart block: ${file.startBlock}`;

    details +=
      `\nData blocks: ${file.dataBlocks.join(", ")}`;
  }

  // Linked
  if (file.allocationMethod === "LINKED") {
    details +=
      `\nStart block: ${file.startBlock}`;

    details +=
      `\nEnd block: ${file.endBlock}`;

    details +=
      `\nBlock chain: ${file.dataBlocks.join(" → ")}`;
  }

  // Indexed
  if (file.allocationMethod === "INDEXED") {
    details +=
      `\nIndex block: ${file.indexBlock}`;

    details +=
      `\nData blocks: ${file.dataBlocks.join(", ")}`;

    details +=
      `\nPhysical blocks used: ${file.requiredDataBlocks + 1}`;
  }

  allocationDetails.textContent = details;
}

// ===================================
// 8. KHOI DONG CHUONG TRINH
// ===================================

// Dua file mau vao dropdown
TEST_FILES.forEach(file => {
  const option = document.createElement("option");

  option.value = file.id;

  option.textContent =
    `${file.name} (${file.sizeBytes} bytes)`;

  fileSelect.appendChild(option);
});

// Chon file
fileSelect.addEventListener(
  "change",
  showSelectedFileInfo
);

// Nhan nut Allocate
allocateButton.addEventListener(
  "click",
  allocateFile
);

// Nhan nut Reset
resetButton.addEventListener(
  "click",
  resetSimulator
);

// Hien thi ban dau
showSelectedFileInfo();
renderAll();
